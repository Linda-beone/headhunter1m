-- Resume Parser v0.2: Kimi primary, OpenAI fallback.

alter table public.resume_imports
  add column if not exists ai_provider text
    check (ai_provider in ('kimi', 'openai')),
  add column if not exists provider_file_id text,
  add column if not exists provider_response_id text,
  add column if not exists fallback_used boolean not null default false,
  add column if not exists token_usage jsonb not null default '{}'::jsonb;

-- Preserve provider metadata for imports created before v0.2.
update public.resume_imports
set ai_provider = 'openai',
    provider_file_id = coalesce(provider_file_id, openai_file_id),
    provider_response_id = coalesce(provider_response_id, openai_response_id)
where ai_provider is null
  and (openai_file_id is not null or openai_response_id is not null);

create index if not exists resume_imports_ai_provider_created_idx
  on public.resume_imports (ai_provider, created_at desc);

comment on column public.resume_imports.ai_provider is 'Provider that produced raw_parsed_json: kimi or openai.';
comment on column public.resume_imports.fallback_used is 'True when the preferred Kimi path was unavailable or failed.';
comment on column public.resume_imports.token_usage is 'Normalized provider token usage; never contains resume text.';
