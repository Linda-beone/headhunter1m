import { supabaseRead, supabaseWrite } from "../admin";
import { matchJob } from "../ai/job-matcher";
import { JOB_MATCHER_VERSION } from "../ai/prompts/job-matcher";
import { buildCandidateFacts, buildMatcherInput } from "./facts";
import { finalizeMatchResult } from "./scoring";
import type { Candidate, Experience, Project } from "../types";

type CandidateTag = { tag: string; tag_type: string; confidence: number; evidence?: string | null; source?: string };

export async function runSingleMatch(candidateId: string, projectId: string) {
  const [candidates, experiences, tags, projects] = await Promise.all([
    supabaseRead<Candidate[]>(`candidates?id=eq.${encodeURIComponent(candidateId)}&select=*`),
    supabaseRead<Experience[]>(`candidate_experiences?candidate_id=eq.${encodeURIComponent(candidateId)}&select=*&order=start_date.desc`),
    supabaseRead<CandidateTag[]>(`candidate_tags?candidate_id=eq.${encodeURIComponent(candidateId)}&select=*&order=confidence.desc`),
    supabaseRead<Project[]>(`search_projects?id=eq.${encodeURIComponent(projectId)}&select=*`),
  ]);
  const candidate = candidates[0]; const project = projects[0];
  if (!candidate) throw new Error("找不到候选人。");
  if (!project) throw new Error("找不到 Search Project。");

  const facts = buildCandidateFacts(candidate, experiences, tags);
  const providerResult = await matchJob(buildMatcherInput(facts, project), candidateId, projectId, AbortSignal.timeout(120_000));
  const result = finalizeMatchResult(providerResult.result, facts, project.must_have_criteria || []);
  const payload = {
    candidate_id: candidateId, project_id: projectId,
    technical_score: result.scores.technical, industry_score: result.scores.industry_product,
    location_score: result.scores.location, experience_score: result.scores.experience,
    salary_score: result.scores.salary, intent_score: result.scores.intent,
    total_score: result.total_score, match_level: result.match_level,
    must_have_results: result.must_have_results, strengths: result.strengths, gaps: result.gaps, risks: result.risks,
    questions_to_verify: result.questions_to_verify, recommendation: result.recommendation,
    recommendation_reason: result.recommendation_reason, confidence: result.confidence,
    matcher_version: JOB_MATCHER_VERSION, ai_provider: providerResult.provider,
    provider_response_id: providerResult.responseId, fallback_used: providerResult.fallbackUsed,
    token_usage: providerResult.tokenUsage || {},
  };
  const saved = await supabaseWrite("candidate_project_matches?on_conflict=candidate_id,project_id", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(payload),
  });
  if (!saved.ok) throw new Error(`匹配结果保存失败（${saved.status}）：请先执行第三阶段 migration。`);
  console.info("job_match", {
    candidate_id: candidateId, project_id: projectId, ai_provider: providerResult.provider,
    fallback_used: providerResult.fallbackUsed, total_score: result.total_score,
    match_level: result.match_level, duration_ms: providerResult.durationMs, matcher_version: JOB_MATCHER_VERSION,
  });
  return { ...result, ai_provider: providerResult.provider, fallback_used: providerResult.fallbackUsed, matcher_version: JOB_MATCHER_VERSION };
}
