-- Headhunter Copilot — Phase 1 schema
-- Run in Supabase SQL Editor, or with: supabase db push

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age smallint check (age between 16 and 100),
  gender text,
  phone text,
  email text,
  wechat text,
  current_city text,
  current_company text,
  current_title text,
  years_experience numeric(4,1) check (years_experience >= 0),
  education jsonb not null default '[]'::jsonb,
  major text,
  job_status text not null default 'unknown'
    check (job_status in ('active', 'open', 'passive', 'not_looking', 'unknown')),
  location_preference text[] not null default '{}',
  current_salary numeric(14,2) check (current_salary >= 0),
  expected_salary numeric(14,2) check (expected_salary >= 0),
  resume_file_url text,
  resume_sha256 text,
  dedupe_key text,
  summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on column public.candidates.resume_sha256 is 'SHA-256 of the original upload; used for exact resume deduplication.';
comment on column public.candidates.dedupe_key is 'Application-generated normalized identity key, e.g. SHA-256(name|phone|email), for person-level deduplication.';

create unique index candidates_resume_sha256_uidx
  on public.candidates (resume_sha256) where resume_sha256 is not null;
create unique index candidates_dedupe_key_uidx
  on public.candidates (dedupe_key) where dedupe_key is not null;
create index candidates_phone_idx on public.candidates (phone);
create index candidates_phone_normalized_idx
  on public.candidates ((regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')));
create index candidates_email_idx on public.candidates ((lower(email)));
create index candidates_name_idx on public.candidates ((lower(name)));

create table public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  company text not null,
  title text not null,
  start_date date,
  end_date date,
  city text,
  description text,
  industry text,
  product text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index candidate_experiences_candidate_idx
  on public.candidate_experiences (candidate_id, start_date desc);

create table public.candidate_tags (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  tag text not null,
  tag_type text not null default 'skill'
    check (tag_type in ('skill', 'industry', 'function', 'product', 'language', 'certificate', 'other')),
  confidence numeric(4,3) not null default 1
    check (confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (candidate_id, tag, tag_type)
);

create index candidate_tags_candidate_idx on public.candidate_tags (candidate_id);
create index candidate_tags_tag_idx on public.candidate_tags ((lower(tag)));

create table public.search_projects (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  job_title text not null,
  location text,
  salary_range numrange,
  experience_min numeric(4,1) check (experience_min >= 0),
  experience_max numeric(4,1) check (experience_max >= 0),
  must_have text[] not null default '{}',
  nice_to_have text[] not null default '{}',
  target_companies text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (experience_max is null or experience_min is null or experience_max >= experience_min)
);

create index search_projects_status_idx on public.search_projects (status, updated_at desc);

create table public.candidate_project_matches (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  project_id uuid not null references public.search_projects(id) on delete cascade,
  technical_score numeric(5,2) check (technical_score between 0 and 100),
  industry_score numeric(5,2) check (industry_score between 0 and 100),
  location_score numeric(5,2) check (location_score between 0 and 100),
  salary_score numeric(5,2) check (salary_score between 0 and 100),
  experience_score numeric(5,2) check (experience_score between 0 and 100),
  intent_score numeric(5,2) check (intent_score between 0 and 100),
  total_score numeric(5,2) check (total_score between 0 and 100),
  match_level text check (match_level in ('strong', 'good', 'possible', 'weak')),
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  questions_to_verify jsonb not null default '[]'::jsonb,
  recommendation text,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'shortlisted', 'rejected', 'contacted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (candidate_id, project_id)
);

create index candidate_project_matches_candidate_idx
  on public.candidate_project_matches (candidate_id, total_score desc);
create index candidate_project_matches_project_idx
  on public.candidate_project_matches (project_id, total_score desc);

create table public.pipeline_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  project_id uuid not null references public.search_projects(id) on delete cascade,
  stage text not null check (stage in ('sourced', 'screening', 'submitted', 'interview', 'offer', 'placed', 'rejected', 'on_hold')),
  note text,
  event_date timestamptz not null default timezone('utc', now()),
  next_action text,
  next_followup_date timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index pipeline_events_candidate_project_idx
  on public.pipeline_events (candidate_id, project_id, event_date desc);
create index pipeline_events_followup_idx
  on public.pipeline_events (next_followup_date)
  where next_followup_date is not null;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'candidates', 'candidate_experiences', 'candidate_tags',
    'search_projects', 'candidate_project_matches', 'pipeline_events'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end $$;

-- Private bucket for original PDF/DOC/DOCX resumes. Access files through signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.candidates enable row level security;
alter table public.candidate_experiences enable row level security;
alter table public.candidate_tags enable row level security;
alter table public.search_projects enable row level security;
alter table public.candidate_project_matches enable row level security;
alter table public.pipeline_events enable row level security;

-- No public policies are intentionally created in Phase 1.
-- The app's server-side API uses SUPABASE_SERVICE_ROLE_KEY; never expose it to the browser.
