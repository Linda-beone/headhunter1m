import type { JobMatchResult, MatchLevel, MatchRecommendation } from "../ai/schemas/job-match";
import type { CandidateFacts } from "./facts";
import { criterionHasEvidence, criterionHasExplicitNegative } from "./facts";
import type { MatchCriterion } from "../types";

const weights = { technical: 40, industry_product: 20, location: 15, experience: 10, salary: 10, intent: 5 } as const;
const recommendationRank: MatchRecommendation[] = ["strong_recommend", "recommend_after_call", "hold", "not_recommend"];

export function knownScoreTotal(scores: JobMatchResult["scores"]) {
  let weighted = 0; let knownWeight = 0;
  for (const [key, weight] of Object.entries(weights) as Array<[keyof typeof weights, number]>) {
    const value = scores[key];
    if (value === null) continue;
    weighted += Math.max(0, Math.min(100, value)) * weight;
    knownWeight += weight;
  }
  return knownWeight ? Math.round((weighted / knownWeight) * 10) / 10 : 0;
}

export function scoreLevel(score: number): MatchLevel {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function moreConservative(current: MatchRecommendation, minimum: MatchRecommendation) {
  return recommendationRank[Math.max(recommendationRank.indexOf(current), recommendationRank.indexOf(minimum))];
}

export function finalizeMatchResult(raw: JobMatchResult, facts: CandidateFacts, criteria: MatchCriterion[]): JobMatchResult {
  const criterionMap = new Map(criteria.map(item => [item.name, item]));
  const rawResultMap = new Map(raw.must_have_results.map(item => [item.criterion, item]));
  const suppliedResults = criteria.length ? criteria.map(criterion => rawResultMap.get(criterion.name) || {
    criterion: criterion.name, status: "unknown" as const, evidence: "", impact: "Matcher 未返回该项判断，需要电话确认。",
  }) : raw.must_have_results;
  const mustHaveResults = suppliedResults.map(result => {
    const criterion = criterionMap.get(result.criterion);
    if (!criterion) return result;
    if ((result.status === "met" || result.status === "partially_met") && !criterionHasEvidence(facts, criterion)) {
      return { ...result, status: "unknown" as const, evidence: "", impact: "候选人事实中没有找到可核验的明确证据，需要电话确认。" };
    }
    if (result.status === "not_met" && !criterionHasExplicitNegative(facts, criterion)) {
      return { ...result, status: "unknown" as const, evidence: "", impact: "资料不足，不能将未提及判断为明确不符合。" };
    }
    return result;
  });
  const totalScore = knownScoreTotal(raw.scores);
  const critical = new Set(criteria.filter(item => item.importance === "critical").map(item => item.name));
  const hasCriticalNotMet = mustHaveResults.some(item => critical.has(item.criterion) && item.status === "not_met");
  const hasCriticalUnverified = mustHaveResults.some(item => critical.has(item.criterion) && ["unknown", "partially_met"].includes(item.status));
  let matchLevel = scoreLevel(totalScore);
  const cap = process.env.MATCH_CRITICAL_CAP === "B" ? "B" : "C";
  if (hasCriticalNotMet && ["A", "B"].includes(matchLevel)) matchLevel = cap;

  let recommendation = raw.recommendation;
  if (raw.scores.location === 0 || matchLevel === "D") recommendation = "not_recommend";
  else if (hasCriticalNotMet || matchLevel === "C") recommendation = moreConservative(recommendation, "hold");
  else if (hasCriticalUnverified || matchLevel === "B") recommendation = moreConservative(recommendation, "recommend_after_call");

  const confidence = hasCriticalUnverified && raw.confidence === "high" ? "medium" : raw.confidence;
  return { ...raw, total_score: totalScore, match_level: matchLevel, must_have_results: mustHaveResults, recommendation, confidence };
}
