-- Job Matcher v0.1: structured criteria, explainable single-pair matching and seed projects.

alter table public.search_projects
  add column if not exists project_code text,
  add column if not exists must_have_criteria jsonb not null default '[]'::jsonb,
  add column if not exists nice_to_have_criteria jsonb not null default '[]'::jsonb;

create unique index if not exists search_projects_project_code_uidx
  on public.search_projects (project_code) where project_code is not null;

alter table public.search_projects drop constraint if exists search_projects_must_have_criteria_array_check;
alter table public.search_projects add constraint search_projects_must_have_criteria_array_check
  check (jsonb_typeof(must_have_criteria) = 'array' and jsonb_typeof(nice_to_have_criteria) = 'array');

alter table public.candidate_project_matches
  add column if not exists must_have_results jsonb not null default '[]'::jsonb,
  add column if not exists risks jsonb not null default '[]'::jsonb,
  add column if not exists recommendation_reason text,
  add column if not exists confidence text,
  add column if not exists matcher_version text not null default 'job_matcher_v0.1',
  add column if not exists ai_provider text,
  add column if not exists provider_response_id text,
  add column if not exists fallback_used boolean not null default false,
  add column if not exists token_usage jsonb not null default '{}'::jsonb;

alter table public.candidate_project_matches drop constraint if exists candidate_project_matches_match_level_check;
update public.candidate_project_matches set match_level = case match_level
  when 'strong' then 'A' when 'good' then 'B' when 'possible' then 'C' when 'weak' then 'D'
  else match_level end;
alter table public.candidate_project_matches add constraint candidate_project_matches_match_level_check
  check (match_level in ('A', 'B', 'C', 'D'));

-- Preserve earlier free-text recommendations as reasons before making recommendation an enum.
update public.candidate_project_matches
set recommendation_reason = coalesce(recommendation_reason, recommendation), recommendation = null
where recommendation is not null
  and recommendation not in ('strong_recommend', 'recommend_after_call', 'hold', 'not_recommend');

alter table public.candidate_project_matches drop constraint if exists candidate_project_matches_recommendation_check;
alter table public.candidate_project_matches add constraint candidate_project_matches_recommendation_check
  check (recommendation is null or recommendation in ('strong_recommend', 'recommend_after_call', 'hold', 'not_recommend'));
alter table public.candidate_project_matches drop constraint if exists candidate_project_matches_confidence_check;
alter table public.candidate_project_matches add constraint candidate_project_matches_confidence_check
  check (confidence is null or confidence in ('high', 'medium', 'low'));
alter table public.candidate_project_matches drop constraint if exists candidate_project_matches_ai_provider_check;
alter table public.candidate_project_matches add constraint candidate_project_matches_ai_provider_check
  check (ai_provider is null or ai_provider in ('kimi', 'openai'));

create index if not exists candidate_project_matches_level_score_idx
  on public.candidate_project_matches (project_id, match_level, total_score desc, updated_at desc);

insert into public.search_projects (
  id, project_code, client_name, job_title, location, experience_min, experience_max,
  must_have, nice_to_have, target_companies, must_have_criteria, nice_to_have_criteria, status
) values
(
  '00000000-0000-4000-8000-000000000001', 'P001', '旭创科技', '高速光模块测试/研发测试', '苏州', 3, 8,
  array['高速光模块背景','400G/800G相关经验','研发测试或Debug能力','模块调试与Failure Analysis','DSP/TIA/Driver/Laser','BERT/Oscilloscope/OSA','BER/Eye Diagram/TDECQ','QSFP-DD/OSFP','MSA/CMIS','测试方案/Test Architecture/Test Case','客户系统应用问题定位'],
  array['1.6T','LPO','CMIS','英语','海外支持'],
  array['新易盛','光迅','华工正源','剑桥科技','Source Photonics','Coherent','长芯博创','联特科技','德科立'],
  '[
    {"name":"高速光模块背景","type":"industry_product","importance":"critical","evidence_keywords":["光模块","optical module"],"description":"具有高速光模块直接工作经历"},
    {"name":"400G/800G相关经验","type":"technical","importance":"critical","evidence_keywords":["400G","800G"],"description":"明确参与400G或800G高速光模块工作"},
    {"name":"研发测试或Debug能力","type":"technical","importance":"critical","evidence_keywords":["研发测试","Debug","调试","Failure Analysis","FA","Prototype","EVT"],"description":"具备研发测试、新产品验证、模块调试或失效分析能力"},
    {"name":"高速测试方法与设备","type":"technical","importance":"important","evidence_keywords":["BERT","Oscilloscope","示波器","OSA","BER","Eye Diagram","TDECQ"],"description":"使用高速测试设备或关键指标开展测试"},
    {"name":"测试方案与客户问题定位","type":"technical","importance":"important","evidence_keywords":["Test Architecture","Test Case","测试方案","测试架构","客户","送样"],"description":"能设计测试方案并定位客户系统应用问题"}
  ]'::jsonb,
  '[
    {"name":"1.6T/LPO","type":"technical","importance":"preferred","evidence_keywords":["1.6T","LPO"],"description":"具备1.6T或LPO测试经验"},
    {"name":"CMIS/MSA","type":"technical","importance":"preferred","evidence_keywords":["CMIS","MSA"],"description":"熟悉CMIS或MSA"},
    {"name":"英语与海外支持","type":"language","importance":"preferred","evidence_keywords":["英语","English","海外支持"],"description":"英语沟通或海外客户支持能力"}
  ]'::jsonb,
  'active'
),
(
  '00000000-0000-4000-8000-000000000002', 'P002', '旭创科技', 'SQE（PCB/载板）', '苏州', null, null,
  array['PCB厂背景','载板或MSAP经验至少一项','懂PCB工艺','SQE/Supplier Quality相关经验','可接受长期供应商驻场','可接受2–3城市轮转'],
  array['英语','供应商稽核','VDA6.3','IATF16949','8D','FA','质量工具'],
  array['深南电路','鹏鼎','欣兴','UMT','奥特斯','美维','快捷','高德','胜宏'],
  '[
    {"name":"PCB背景","type":"industry_product","importance":"critical","evidence_keywords":["PCB","印制电路板","电路板"],"description":"具备PCB厂或PCB产业链直接经历"},
    {"name":"载板或MSAP至少一项","type":"technical","importance":"critical","evidence_keywords":["载板","MSAP"],"description":"至少明确具备载板或MSAP经验之一"},
    {"name":"可接受长期驻场","type":"intent","importance":"critical","evidence_keywords":["驻场","长期出差"],"description":"可接受长期供应商驻场及可能的城市轮转"},
    {"name":"SQE/Supplier Quality经验","type":"quality","importance":"important","evidence_keywords":["SQE","Supplier Quality","供应商质量","供应商稽核","供应商审核"],"description":"具备供应商质量管理或供应商稽核经验"},
    {"name":"PCB工艺理解","type":"technical","importance":"important","evidence_keywords":["工艺","表面处理","蚀刻","电镀","压合"],"description":"了解PCB相关制造工艺"}
  ]'::jsonb,
  '[
    {"name":"质量工具与体系","type":"quality","importance":"preferred","evidence_keywords":["VDA6.3","IATF16949","8D","FA"],"description":"具备质量体系、8D或失效分析能力"},
    {"name":"英语","type":"language","importance":"preferred","evidence_keywords":["英语","English","CET"],"description":"具备英语工作能力"}
  ]'::jsonb,
  'active'
)
on conflict (id) do update set
  project_code = excluded.project_code,
  client_name = excluded.client_name,
  job_title = excluded.job_title,
  location = excluded.location,
  experience_min = excluded.experience_min,
  experience_max = excluded.experience_max,
  must_have = excluded.must_have,
  nice_to_have = excluded.nice_to_have,
  target_companies = excluded.target_companies,
  must_have_criteria = excluded.must_have_criteria,
  nice_to_have_criteria = excluded.nice_to_have_criteria,
  updated_at = timezone('utc', now());
