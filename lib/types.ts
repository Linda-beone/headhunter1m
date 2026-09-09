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
  birth_date?: string | null;
  highest_education?: string | null;
  english_level?: string | null;
  field_sources?: Record<string, "resume" | "ai_extracted" | "manual" | "inferred">;
  manual_fields?: string[];
  updated_at: string;
};

export type Experience = {
  id: string; candidate_id: string; company: string; title: string;
  start_date?: string | null; end_date?: string | null; city?: string | null;
  description?: string | null; industry?: string | null; product?: string | null;
  normalized_company_name?: string | null; department?: string | null;
  start_date_raw?: string | null; end_date_raw?: string | null;
  responsibilities?: string[]; achievements?: string[]; technologies?: string[];
  source?: "resume" | "ai_extracted" | "manual" | "inferred";
};

export type Project = {
  id: string; project_code?: string | null; client_name: string; job_title: string; location?: string | null;
  salary_range?: string | null; experience_min?: number | null; experience_max?: number | null;
  must_have: string[]; nice_to_have: string[]; target_companies: string[];
  must_have_criteria?: MatchCriterion[]; nice_to_have_criteria?: MatchCriterion[];
  status: string; updated_at: string;
};

export type MatchCriterion = {
  name: string;
  type: string;
  importance: "critical" | "important" | "preferred";
  evidence_keywords: string[];
  description: string;
};

export type Match = {
  id: string; candidate_id: string; project_id: string; total_score?: number | null;
  technical_score?: number | null; industry_score?: number | null; location_score?: number | null;
  salary_score?: number | null; experience_score?: number | null; intent_score?: number | null;
  match_level?: "A" | "B" | "C" | "D" | null; strengths: string[]; gaps: string[]; risks?: string[];
  must_have_results?: Array<{ criterion: string; status: "met" | "not_met" | "unknown" | "partially_met"; evidence: string; impact: string }>;
  questions_to_verify: string[];
  recommendation?: "strong_recommend" | "recommend_after_call" | "hold" | "not_recommend" | null;
  recommendation_reason?: string | null; confidence?: "high" | "medium" | "low" | null;
  matcher_version?: string; ai_provider?: "kimi" | "openai" | null; fallback_used?: boolean;
  status: string; updated_at?: string; current_pipeline?: string | null;
};

export type PipelineEvent = {
  id: string; candidate_id: string; project_id: string; stage: string; note?: string | null;
  event_date: string; next_action?: string | null; next_followup_date?: string | null;
};
