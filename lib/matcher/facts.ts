import type { Candidate, Experience, MatchCriterion, Project } from "../types";

type CandidateTag = { tag: string; tag_type: string; confidence: number; evidence?: string | null; source?: string };
type SourcedValue = { value: unknown; source: "manual" | "resume" | "ai_extracted" };

const allowedSources = new Set(["manual", "resume", "ai_extracted"]);
const sourceRank: Record<string, number> = { manual: 0, resume: 1, ai_extracted: 2 };
const candidateFields = [
  "name", "age", "gender", "current_city", "current_company", "current_title", "years_experience",
  "education", "major", "job_status", "location_preference", "current_salary", "expected_salary",
  "summary", "highest_education", "english_level",
] as const;

export type CandidateFacts = {
  candidate_id: string;
  fields: Record<string, SourcedValue>;
  experiences: Array<Record<string, unknown>>;
  tags: Array<Record<string, unknown>>;
};

export function buildCandidateFacts(candidate: Candidate, experiences: Experience[], tags: CandidateTag[]): CandidateFacts {
  const fields: Record<string, SourcedValue> = {};
  for (const field of candidateFields) {
    const value = candidate[field];
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) continue;
    const declared = candidate.manual_fields?.includes(field) ? "manual" : candidate.field_sources?.[field] || "resume";
    if (!allowedSources.has(declared)) continue;
    fields[field] = { value, source: declared as SourcedValue["source"] };
  }
  return {
    candidate_id: candidate.id,
    fields,
    experiences: experiences.filter(item => allowedSources.has(item.source || "resume")).sort((a, b) => sourceRank[a.source || "resume"] - sourceRank[b.source || "resume"]).map(item => ({
      company: item.company, title: item.title, dates: [item.start_date_raw || item.start_date, item.end_date_raw || item.end_date],
      city: item.city, industry: item.industry, product: item.product, department: item.department,
      responsibilities: item.responsibilities || item.description, achievements: item.achievements || [], technologies: item.technologies || [],
      source: item.source || "resume",
    })),
    tags: tags.filter(item => allowedSources.has(item.source || "resume")).sort((a, b) => sourceRank[a.source || "resume"] - sourceRank[b.source || "resume"]).map(item => ({
      name: item.tag, type: item.tag_type, confidence: item.confidence, evidence: item.evidence, source: item.source || "resume",
    })),
  };
}

export function buildMatcherInput(facts: CandidateFacts, project: Project) {
  return {
    candidate_facts: facts,
    search_project: {
      id: project.id, project_code: project.project_code, client_name: project.client_name, job_title: project.job_title, location: project.location,
      salary_range: project.salary_range, experience_min: project.experience_min, experience_max: project.experience_max,
      must_have: project.must_have, nice_to_have: project.nice_to_have, target_companies: project.target_companies,
      must_have_criteria: project.must_have_criteria || [], nice_to_have_criteria: project.nice_to_have_criteria || [],
    },
  };
}

export function candidateFactText(facts: CandidateFacts) {
  return JSON.stringify(facts).toLowerCase();
}

export function criterionHasEvidence(facts: CandidateFacts, criterion: MatchCriterion) {
  const text = candidateFactText(facts);
  return criterion.evidence_keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

export function criterionHasExplicitNegative(facts: CandidateFacts, criterion: MatchCriterion) {
  const text = candidateFactText(facts);
  const negatives = ["不接受", "不考虑", "无法", "不能", "拒绝", "仅考虑", "only", "not willing", "cannot"];
  return criterion.evidence_keywords.some(keyword => {
    const at = text.indexOf(keyword.toLowerCase());
    if (at < 0) return false;
    const window = text.slice(Math.max(0, at - 36), at + keyword.length + 36);
    return negatives.some(negative => window.includes(negative));
  });
}
