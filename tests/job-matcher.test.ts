import test from "node:test";
import assert from "node:assert/strict";
import { jobMatchJsonSchema, type JobMatchResult } from "../lib/ai/schemas/job-match";
import { matchJobWithProviders } from "../lib/ai/job-matcher";
import { buildCandidateFacts } from "../lib/matcher/facts";
import { finalizeMatchResult, knownScoreTotal } from "../lib/matcher/scoring";
import type { Candidate, MatchCriterion } from "../lib/types";

const candidateId = "11111111-1111-4111-8111-111111111111";
const projectId = "00000000-0000-4000-8000-000000000002";

function raw(overrides: Partial<JobMatchResult> = {}): JobMatchResult {
  return {
    candidate_id: candidateId, project_id: projectId,
    scores: { technical: 68, industry_product: 95, location: 100, experience: 90, salary: null, intent: null },
    total_score: 0, match_level: "D",
    must_have_results: [], strengths: [], gaps: [], risks: [],
    questions_to_verify: ["是否具备载板或MSAP项目经验？", "能否接受长期供应商驻场？", "期望薪资和到岗时间是什么？"],
    recommendation: "strong_recommend", recommendation_reason: "待核实关键要求。", confidence: "high", ...overrides,
  };
}

const p002Criteria: MatchCriterion[] = [
  { name: "PCB背景", type: "industry_product", importance: "critical", evidence_keywords: ["PCB", "电路板"], description: "PCB背景" },
  { name: "载板或MSAP至少一项", type: "technical", importance: "critical", evidence_keywords: ["载板", "MSAP"], description: "至少一项" },
  { name: "可接受长期驻场", type: "intent", importance: "critical", evidence_keywords: ["驻场"], description: "长期驻场" },
];

function liuFacts(summary = "11年PCB经验，表面处理、客诉、FA、8D、VDA6.3、IATF16949、供应商稽核；只考虑苏州/昆山") {
  const candidate: Candidate = { id: candidateId, name: "刘柳", age: 34, current_city: "苏州", current_company: "南亚电路板", current_title: "质量经理", years_experience: 11, job_status: "open", location_preference: ["苏州", "昆山"], summary, updated_at: "2026-09-10" };
  return buildCandidateFacts(candidate, [
    { id: "e1", candidate_id: candidateId, company: "沪士电子 / 奥特斯 / 南亚电路板", title: "质量/SQE", industry: "PCB", description: "负责表面处理、客诉、FA、8D和供应商稽核" },
  ], [{ tag: "VDA6.3", tag_type: "quality", confidence: .95, source: "resume" }]);
}

test("known score normalization 不因 salary / intent 未知扣分", () => {
  assert.equal(knownScoreTotal({ technical: 80, industry_product: 80, location: 80, experience: 80, salary: null, intent: null }), 80);
});

test("Golden 1 刘柳：PCB met，但未出现载板/MSAP时强制保持 unknown", () => {
  const result = finalizeMatchResult(raw({
    must_have_results: [
      { criterion: "PCB背景", status: "met", evidence: "11年PCB经验", impact: "直接相关" },
      { criterion: "载板或MSAP至少一项", status: "met", evidence: "PCB/表面处理", impact: "核心技术" },
      { criterion: "可接受长期驻场", status: "unknown", evidence: "", impact: "需电话确认" },
    ],
    strengths: ["11年PCB及供应商稽核经验", "明确考虑苏州/昆山"],
    gaps: ["载板/MSAP资料不足"], risks: ["长期驻场和城市轮转意愿未知"],
  }), liuFacts(), p002Criteria);
  assert.equal(result.must_have_results[0].status, "met");
  assert.equal(result.must_have_results[1].status, "unknown");
  assert.equal(result.must_have_results[2].status, "unknown");
  assert.equal(result.total_score, 82.6);
  assert.equal(result.match_level, "B");
  assert.equal(result.recommendation, "recommend_after_call");
  assert.equal(result.confidence, "medium");
});

test("critical not_met 必须有明确负面事实，且默认最高降为 C", () => {
  const result = finalizeMatchResult(raw({
    scores: { technical: 95, industry_product: 95, location: 100, experience: 95, salary: null, intent: 95 },
    must_have_results: [{ criterion: "可接受长期驻场", status: "not_met", evidence: "明确不接受驻场", impact: "无法满足工作方式" }],
  }), liuFacts("11年PCB经验，明确不接受驻场"), p002Criteria);
  assert.equal(result.match_level, "C");
  assert.equal(result.recommendation, "hold");
});

test("Golden 2 光迅候选人：明确高速光模块事实保留，CMIS/MSA/Laser不被补写", () => {
  const opticalCriteria: MatchCriterion[] = [
    { name: "高速光模块背景", type: "industry", importance: "critical", evidence_keywords: ["光模块"], description: "高速光模块" },
    { name: "400G/800G相关经验", type: "technical", importance: "critical", evidence_keywords: ["400G", "800G"], description: "400G/800G" },
    { name: "研发测试或Debug能力", type: "technical", importance: "critical", evidence_keywords: ["测试架构", "DSP", "TIA", "Driver"], description: "研发测试" },
  ];
  const optical = buildCandidateFacts({ id: candidateId, name: "光迅候选人", age: 28, current_city: "武汉", current_company: "武汉光迅科技", current_title: "Hardware Test Engineer", years_experience: 6, job_status: "unknown", location_preference: [], updated_at: "2026-09-10" }, [
    { id: "e2", candidate_id: candidateId, company: "武汉光迅科技", title: "Hardware Test Engineer", product: "高速光模块", description: "负责1.6T/LPO测试架构、400G/800G、Cisco/Arista/Huawei送样、DSP/Driver/TIA验证、TP1–TP4、Test Case和设备导入" },
  ], []);
  const result = finalizeMatchResult(raw({
    scores: { technical: 96, industry_product: 95, location: 60, experience: 100, salary: null, intent: null },
    must_have_results: opticalCriteria.map(item => ({ criterion: item.name, status: "met" as const, evidence: item.evidence_keywords[0], impact: "直接证据" })),
    strengths: ["1.6T/LPO测试架构", "400G/800G", "DSP/Driver/TIA验证", "Test Case"],
    gaps: ["CMIS/MSA未提及", "Laser未提及", "英语未提及"], risks: ["苏州地点意愿未知"],
    recommendation: "recommend_after_call", confidence: "high",
  }), optical, opticalCriteria);
  const liuForOptical = finalizeMatchResult(raw({
    scores: { technical: 20, industry_product: 30, location: 100, experience: 20, salary: null, intent: null },
    must_have_results: opticalCriteria.map(item => ({ criterion: item.name, status: "unknown" as const, evidence: "", impact: "没有高速光模块事实" })),
    strengths: ["明确考虑苏州"], gaps: ["没有高速光模块直接经验"], risks: ["技术方向不匹配"],
    recommendation: "not_recommend", confidence: "high",
  }), liuFacts(), opticalCriteria);
  assert.equal(result.match_level, "A");
  assert.equal(result.total_score, 89.9);
  assert.ok(result.must_have_results.every(item => item.status === "met"));
  assert.ok(result.gaps.includes("CMIS/MSA未提及"));
  assert.ok(!result.strengths.some(item => /CMIS|MSA|Laser/.test(item)));
  assert.equal(liuForOptical.total_score, 36.5);
  assert.equal(liuForOptical.match_level, "D");
  assert.ok(result.total_score - liuForOptical.total_score > 50);
});

test("Matcher strict schema 禁止额外字段并要求全部顶层字段", () => {
  assert.equal(jobMatchJsonSchema.additionalProperties, false);
  assert.deepEqual(new Set(jobMatchJsonSchema.required), new Set(Object.keys(jobMatchJsonSchema.properties)));
});

test("Job Matcher 优先 Kimi，Kimi 失败后才调用 OpenAI", async () => {
  let openAICalls = 0;
  const expected = raw();
  const result = await matchJobWithProviders({}, candidateId, projectId, undefined, [
    { name: "kimi", configured: true, match: async () => { throw new Error("Kimi temporary failure"); } },
    { name: "openai", configured: true, match: async () => { openAICalls += 1; return { result: expected, provider: "openai", responseId: "response-1", durationMs: 1 }; } },
  ]);
  assert.equal(result.provider, "openai");
  assert.equal(result.fallbackUsed, true);
  assert.equal(openAICalls, 1);
});
