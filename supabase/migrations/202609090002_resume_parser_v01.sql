-- Resume Parser v0.1

alter table public.candidates
  add column if not exists birth_date date,
  add column if not exists highest_education text,
  add column if not exists english_level text,
  add column if not exists field_sources jsonb not null default '{}'::jsonb,
  add column if not exists manual_fields text[] not null default '{}';

alter table public.candidate_experiences
  add column if not exists normalized_company_name text,
  add column if not exists department text,
  add column if not exists start_date_raw text,
  add column if not exists end_date_raw text,
  add column if not exists responsibilities jsonb not null default '[]'::jsonb,
  add column if not exists achievements jsonb not null default '[]'::jsonb,
  add column if not exists technologies text[] not null default '{}',
  add column if not exists source text not null default 'manual'
    check (source in ('resume', 'ai_extracted', 'manual'));

alter table public.candidate_tags
  add column if not exists evidence text,
  add column if not exists source text not null default 'manual'
    check (source in ('resume', 'ai_extracted', 'manual'));

alter table public.candidate_tags drop constraint if exists candidate_tags_tag_type_check;
alter table public.candidate_tags add constraint candidate_tags_tag_type_check
  check (tag_type in ('industry','product','process','quality','equipment','software','language','management','skill','function','certificate','other'));

create table if not exists public.resume_imports (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates(id) on delete set null,
  original_filename text not null,
  storage_path text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  file_sha256 text not null,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'parsing', 'parsed', 'duplicate_found', 'completed', 'failed')),
  openai_file_id text,
  openai_response_id text,
  parser_version text not null default 'resume_parser_v0.1',
  raw_parsed_json jsonb,
  duplicate_candidates jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create unique index if not exists resume_imports_file_sha256_completed_uidx
  on public.resume_imports (file_sha256)
  where status = 'completed';
create index if not exists resume_imports_status_created_idx
  on public.resume_imports (status, created_at desc);
create index if not exists resume_imports_candidate_idx
  on public.resume_imports (candidate_id, created_at desc);

drop trigger if exists resume_imports_set_updated_at on public.resume_imports;
create trigger resume_imports_set_updated_at before update on public.resume_imports
for each row execute function public.set_updated_at();

alter table public.resume_imports enable row level security;

-- Atomic write: candidate + experiences + tags + import completion succeed together.
create or replace function public.commit_resume_import(
  p_import_id uuid,
  p_candidate_id uuid,
  p_create_new boolean,
  p_conflict_choices jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  c jsonb;
  exp jsonb;
  skill jsonb;
  target_id uuid;
  sources jsonb := '{}'::jsonb;
  k text;
begin
  select raw_parsed_json into payload from public.resume_imports where id = p_import_id for update;
  if payload is null then raise exception 'Resume import has no parsed payload'; end if;
  c := payload->'candidate';
  if nullif(trim(c->>'name'), '') is null then raise exception 'Resume does not contain a candidate name'; end if;

  if p_create_new then
    target_id := coalesce(p_candidate_id, gen_random_uuid());
    foreach k in array array['name','gender','birth_date','age','phone','email','wechat','current_city','current_company','current_title','years_experience','highest_education','major','english_level','job_status','current_salary','expected_salary','summary']
    loop sources := sources || jsonb_build_object(k, 'ai_extracted'); end loop;
    insert into public.candidates (
      id, name, gender, birth_date, age, phone, email, wechat, current_city,
      current_company, current_title, years_experience, education, highest_education,
      major, english_level, job_status, location_preference, current_salary, expected_salary,
      resume_file_url, resume_sha256, summary, field_sources
    ) values (
      target_id, c->>'name', nullif(c->>'gender',''),
      case when coalesce(c->>'birth_date','') ~ '^\d{4}-\d{2}-\d{2}$' then (c->>'birth_date')::date end,
      nullif(c->>'age','')::smallint, nullif(c->>'phone',''), nullif(c->>'email',''), nullif(c->>'wechat',''),
      nullif(c->>'current_city',''), nullif(c->>'current_company',''), nullif(c->>'current_title',''),
      nullif(c->>'years_experience','')::numeric, coalesce(payload->'education','[]'::jsonb),
      nullif(c->>'highest_education',''), nullif(c->>'major',''), nullif(c->>'english_level',''), coalesce(nullif(c->>'job_status',''),'unknown'),
      coalesce(array(select jsonb_array_elements_text(payload->'job_preferences'->'preferred_locations')), '{}'),
      nullif(c->>'current_salary','')::numeric, nullif(c->>'expected_salary','')::numeric,
      (select storage_path from public.resume_imports where id=p_import_id),
      (select file_sha256 from public.resume_imports where id=p_import_id), nullif(c->>'summary',''), sources
    );
  else
    target_id := p_candidate_id;
    if target_id is null then raise exception 'candidate_id is required for merge'; end if;
    update public.candidates old set
      name = case when not ('name'=any(old.manual_fields)) and (old.name is null or p_conflict_choices->>'name'='new') then coalesce(nullif(c->>'name',''),old.name) else old.name end,
      birth_date = case when not ('birth_date'=any(old.manual_fields)) and (old.birth_date is null or p_conflict_choices->>'birth_date'='new') and coalesce(c->>'birth_date','') ~ '^\d{4}-\d{2}-\d{2}$' then (c->>'birth_date')::date else old.birth_date end,
      age = case when not ('age'=any(old.manual_fields)) and (old.age is null or p_conflict_choices->>'age'='new') then coalesce(nullif(c->>'age','')::smallint,old.age) else old.age end,
      gender = case when not ('gender'=any(old.manual_fields)) and (old.gender is null or p_conflict_choices->>'gender'='new') then coalesce(nullif(c->>'gender',''),old.gender) else old.gender end,
      phone = case when not ('phone'=any(old.manual_fields)) and (old.phone is null or p_conflict_choices->>'phone'='new') then coalesce(nullif(c->>'phone',''),old.phone) else old.phone end,
      email = case when not ('email'=any(old.manual_fields)) and (old.email is null or p_conflict_choices->>'email'='new') then coalesce(nullif(c->>'email',''),old.email) else old.email end,
      wechat = case when not ('wechat'=any(old.manual_fields)) and (old.wechat is null or p_conflict_choices->>'wechat'='new') then coalesce(nullif(c->>'wechat',''),old.wechat) else old.wechat end,
      current_city = case when not ('current_city'=any(old.manual_fields)) and (old.current_city is null or p_conflict_choices->>'current_city'='new') then coalesce(nullif(c->>'current_city',''),old.current_city) else old.current_city end,
      current_company = case when not ('current_company'=any(old.manual_fields)) and (old.current_company is null or p_conflict_choices->>'current_company'='new') then coalesce(nullif(c->>'current_company',''),old.current_company) else old.current_company end,
      current_title = case when not ('current_title'=any(old.manual_fields)) and (old.current_title is null or p_conflict_choices->>'current_title'='new') then coalesce(nullif(c->>'current_title',''),old.current_title) else old.current_title end,
      years_experience = case when not ('years_experience'=any(old.manual_fields)) and (old.years_experience is null or p_conflict_choices->>'years_experience'='new') then coalesce(nullif(c->>'years_experience','')::numeric,old.years_experience) else old.years_experience end,
      highest_education = case when not ('highest_education'=any(old.manual_fields)) and (old.highest_education is null or p_conflict_choices->>'highest_education'='new') then coalesce(nullif(c->>'highest_education',''),old.highest_education) else old.highest_education end,
      major = case when not ('major'=any(old.manual_fields)) and (old.major is null or p_conflict_choices->>'major'='new') then coalesce(nullif(c->>'major',''),old.major) else old.major end,
      english_level = case when not ('english_level'=any(old.manual_fields)) and (old.english_level is null or p_conflict_choices->>'english_level'='new') then coalesce(nullif(c->>'english_level',''),old.english_level) else old.english_level end,
      job_status = case when not ('job_status'=any(old.manual_fields)) and (old.job_status='unknown' or p_conflict_choices->>'job_status'='new') then coalesce(nullif(c->>'job_status',''),old.job_status) else old.job_status end,
      current_salary = case when not ('current_salary'=any(old.manual_fields)) and (old.current_salary is null or p_conflict_choices->>'current_salary'='new') then coalesce(nullif(c->>'current_salary','')::numeric,old.current_salary) else old.current_salary end,
      expected_salary = case when not ('expected_salary'=any(old.manual_fields)) and (old.expected_salary is null or p_conflict_choices->>'expected_salary'='new') then coalesce(nullif(c->>'expected_salary','')::numeric,old.expected_salary) else old.expected_salary end,
      summary = case when not ('summary'=any(old.manual_fields)) and (old.summary is null or p_conflict_choices->>'summary'='new') then coalesce(nullif(c->>'summary',''),old.summary) else old.summary end,
      resume_file_url = (select storage_path from public.resume_imports where id=p_import_id),
      resume_sha256 = (select file_sha256 from public.resume_imports where id=p_import_id),
      education = case when not ('education'=any(old.manual_fields)) and jsonb_array_length(coalesce(old.education,'[]'))=0 then coalesce(payload->'education','[]') else old.education end,
      location_preference = case when not ('location_preference'=any(old.manual_fields)) and cardinality(old.location_preference)=0 then coalesce(array(select jsonb_array_elements_text(payload->'job_preferences'->'preferred_locations')), '{}') else old.location_preference end
    where old.id=target_id;
    if not found then raise exception 'Candidate not found'; end if;
  end if;

  for exp in select value from jsonb_array_elements(coalesce(payload->'experiences','[]')) loop
    insert into public.candidate_experiences (
      candidate_id, company, normalized_company_name, title, start_date, end_date,
      start_date_raw, end_date_raw, city, department, description, industry, product,
      responsibilities, achievements, technologies, source
    ) values (
      target_id, exp->>'company', nullif(exp->>'normalized_company_name',''), exp->>'title',
      case when coalesce(exp->>'start_date','') ~ '^\d{4}-\d{2}-\d{2}$' then (exp->>'start_date')::date end,
      case when coalesce(exp->>'end_date','') ~ '^\d{4}-\d{2}-\d{2}$' then (exp->>'end_date')::date end,
      nullif(exp->>'start_date',''), nullif(exp->>'end_date',''), nullif(exp->>'city',''),
      nullif(exp->>'department',''), array_to_string(array(select jsonb_array_elements_text(exp->'responsibilities')), E'\n'),
      nullif(exp->>'industry',''), nullif(exp->>'product',''), coalesce(exp->'responsibilities','[]'),
      coalesce(exp->'achievements','[]'), coalesce(array(select jsonb_array_elements_text(exp->'technologies')), '{}'), 'ai_extracted'
    );
  end loop;

  for skill in select value from jsonb_array_elements(coalesce(payload->'skills','[]')) loop
    insert into public.candidate_tags (candidate_id, tag, tag_type, confidence, evidence, source)
    values (target_id, skill->>'name', coalesce(nullif(skill->>'category',''),'other'),
      case skill->>'confidence' when 'high' then 0.95 when 'medium' then 0.7 else 0.4 end,
      nullif(skill->>'evidence',''), 'ai_extracted')
    on conflict (candidate_id, tag, tag_type) do update set
      confidence=greatest(candidate_tags.confidence,excluded.confidence),
      evidence=coalesce(candidate_tags.evidence,excluded.evidence),
      updated_at=timezone('utc',now());
  end loop;

  update public.resume_imports set candidate_id=target_id, status='completed', completed_at=timezone('utc',now()), error_message=null where id=p_import_id;
  return target_id;
end;
$$;

revoke all on function public.commit_resume_import(uuid,uuid,boolean,jsonb) from public, anon, authenticated;
grant execute on function public.commit_resume_import(uuid,uuid,boolean,jsonb) to service_role;

update storage.buckets set public=false, file_size_limit=15728640,
  allowed_mime_types=array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
where id='resumes';
