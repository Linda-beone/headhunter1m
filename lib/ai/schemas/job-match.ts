export type MustHaveStatus = "met" | "not_met" | "unknown" | "partially_met";
export type MatchRecommendation = "strong_recommend" | "recommend_after_call" | "hold" | "not_recommend";
export type MatchLevel = "A" | "B" | "C" | "D";

export type JobMatchResult = {
  candidate_id: string;
  project_id: string;
  scores: {
    technical: number;
    industry_product: number;
    location: number;
    experience: number;
    salary: number | null;
    intent: number | null;
  };
  total_score: number;
  match_level: MatchLevel;
  must_have_results: Array<{ criterion: string; status: MustHaveStatus; evidence: string; impact: string }>;
  strengths: string[];
  gaps: string[];
  risks: string[];
  questions_to_verify: string[];
  recommendation: MatchRecommendation;
  recommendation_reason: string;
  confidence: "high" | "medium" | "low";
};

const score = { type: "number", minimum: 0, maximum: 100 } as const;
const nullableScore = { type: ["number", "null"], minimum: 0, maximum: 100 } as const;
const strings = { type: "array", items: { type: "string" } } as const;
const strictObject = (properties: Record<string, unknown>) => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});

export const jobMatchJsonSchema = strictObject({
  candidate_id: { type: "string" },
  project_id: { type: "string" },
  scores: strictObject({
    technical: score,
    industry_product: score,
    location: score,
    experience: score,
    salary: nullableScore,
    intent: nullableScore,
  }),
  total_score: score,
  match_level: { type: "string", enum: ["A", "B", "C", "D"] },
  must_have_results: {
    type: "array",
    items: strictObject({
      criterion: { type: "string" },
      status: { type: "string", enum: ["met", "not_met", "unknown", "partially_met"] },
      evidence: { type: "string" },
      impact: { type: "string" },
    }),
  },
  strengths: strings,
  gaps: strings,
  risks: strings,
  questions_to_verify: { type: "array", minItems: 3, maxItems: 7, items: { type: "string" } },
  recommendation: { type: "string", enum: ["strong_recommend", "recommend_after_call", "hold", "not_recommend"] },
  recommendation_reason: { type: "string" },
  confidence: { type: "string", enum: ["high", "medium", "low"] },
});

export function validateJobMatchResult(value: unknown, candidateId: string, projectId: string): asserts value is JobMatchResult {
  if (!value || typeof value !== "object") throw new Error("Matcher 返回了无效结果。");
  const result = value as Partial<JobMatchResult>;
  if (result.candidate_id !== candidateId || result.project_id !== projectId) throw new Error("Matcher 返回的候选人或项目 ID 不一致。");
  if (!result.scores || !Array.isArray(result.must_have_results) || !Array.isArray(result.questions_to_verify)) throw new Error("Matcher 返回结果缺少必要字段。");
  if (result.questions_to_verify.length < 3 || result.questions_to_verify.length > 7) throw new Error("Matcher 电话确认问题必须为 3–7 个。");
  for (const value of Object.values(result.scores)) {
    if (value !== null && (typeof value !== "number" || value < 0 || value > 100)) throw new Error("Matcher 评分超出 0–100 范围。");
  }
}
