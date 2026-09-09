export type Candidate = {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  wechat?: string | null;
  current_city?: string | null;
  current_company?: string | null;
  current_title?: string | null;
  years_experience?: number | null;
  education?: Array<{ school: string; degree?: string }>;
  major?: string | null;
  job_status: string;
  location_preference: string[];
  current_salary?: number | null;
  expected_salary?: number | null;
  resume_file_url?: string | null;
  summary?: string | null;
  updated_at: string;
};

export type Experience = {
  id: string; candidate_id: string; company: string; title: string;
  start_date?: string | null; end_date?: string | null; city?: string | null;
  description?: string | null; industry?: string | null; product?: string | null;
};

export type Project = {
  id: string; client_name: string; job_title: string; location?: string | null;
  salary_range?: string | null; experience_min?: number | null; experience_max?: number | null;
  must_have: string[]; nice_to_have: string[]; target_companies: string[];
  status: string; updated_at: string;
};

export type Match = {
  id: string; candidate_id: string; project_id: string; total_score?: number | null;
  technical_score?: number | null; industry_score?: number | null; location_score?: number | null;
  salary_score?: number | null; experience_score?: number | null; intent_score?: number | null;
  match_level?: string | null; strengths: string[]; gaps: string[];
  questions_to_verify: string[]; recommendation?: string | null; status: string;
};

export type PipelineEvent = {
  id: string; candidate_id: string; project_id: string; stage: string; note?: string | null;
  event_date: string; next_action?: string | null; next_followup_date?: string | null;
};
