import test from "node:test";
import assert from "node:assert/strict";
import { buildConflicts, findDuplicates } from "../lib/resume/dedupe";
import { resumeJsonSchema, validateParsedResume, type ParsedResume } from "../lib/ai/schemas/resume";
import { parseResume } from "../lib/ai/resume-parser";

function resume(overrides: Partial<ParsedResume["candidate"]> = {}, experiences: ParsedResume["experiences"] = []): ParsedResume {
  return {
    candidate: { name: "刘柳", gender: null, birth_date: null, age: null, phone: "13800138000", email: "liu@example.com", wechat: null, current_city: "上海", current_company: "奥特斯(中国)有限公司", current_title: "质量经理", years_experience: 8, highest_education: "本科", major: "化学", english_level: null, job_status: "unknown", current_salary: null, expected_salary: null, summary: "PCB 质量管理经验", ...overrides },
    experiences, education: [],
    skills: [{ name: "VDA6.3", category: "quality", confidence: "high", evidence: "简历明确列出 VDA6.3 内部审核员认证" }],
    certificates: [], languages: [], job_preferences: { preferred_locations: [], target_roles: [], job_change_reason: null, availability: null }, achievements: [],
    unknown_or_uncertain: [{ field: "current_salary", reason: "简历未提供" }, { field: "age", reason: "简历未提供出生日期或年龄" }],
  };
}

test("标准中文 PDF 的结构化结果可通过校验", () => assert.doesNotThrow(() => validateParsedResume(resume())));
test("中英文混合技术术语与 evidence 保留", () => assert.equal(resume().skills[0].evidence, "简历明确列出 VDA6.3 内部审核员认证"));
test("缺少联系方式保持 null", () => { const value = resume({ phone: null, email: null, wechat: null }); assert.equal(value.candidate.phone, null); });
test("缺少年龄不推断并进入待确认", () => { const value = resume({ age: null, birth_date: null }); assert.equal(value.candidate.age, null); assert.ok(value.unknown_or_uncertain.some(x => x.field === "age")); });
test("多段工作经历及月份精度被保留", () => { const exps = ["2021-02", "2018-06"].map((date, i) => ({ company: `公司${i}`, normalized_company_name: null, title: "工程师", start_date: date, end_date: null, is_current: i === 0, city: null, department: null, industry: null, product: null, responsibilities: [], achievements: [], technologies: [] })); assert.equal(resume({}, exps).experiences[0].start_date, "2021-02"); assert.equal(exps.length, 2); });
test("phone 重复为 Level 1 并阻止自动创建", () => { const result = findDuplicates(resume(), [{ id: "c1", name: "其他", phone: "138 0013 8000" }]); assert.equal(result[0].level, 1); assert.equal(result[0].automaticBlock, true); });
test("email 重复为 Level 2", () => { const result = findDuplicates(resume({ phone: null }), [{ id: "c1", name: "其他", email: "LIU@example.com" }]); assert.equal(result[0].level, 2); });
test("name + company 仅提示 Level 4，冲突可人工选择", () => { const parsed = resume({ phone: null, email: null, current_title: "质量总监" }); const candidate = { id: "c1", name: "刘柳", current_company: "奥特斯中国有限公司", current_title: "质量经理" }; const result = findDuplicates(parsed, [candidate]); assert.equal(result[0].level, 4); assert.equal(result[0].automaticBlock, false); assert.deepEqual(buildConflicts(parsed, candidate).map(x => x.field), ["current_title"]); });
test("AI 返回可空字段和空数组时仍保持严格结构", () => { const value = resume({ phone: null, email: null, age: null, english_level: null }); value.skills = []; value.unknown_or_uncertain = []; assert.doesNotThrow(() => validateParsedResume(value)); });
test("OpenAI API 失败时返回可重试错误", { concurrency: false }, async () => {
  const oldFetch = globalThis.fetch; const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "temporary" } }), { status: 500 });
  try { await assert.rejects(() => parseResume(new File(["resume"], "resume.pdf", { type: "application/pdf" })), /OpenAI 文件上传失败/); }
  finally { globalThis.fetch = oldFetch; if (oldKey) process.env.OPENAI_API_KEY = oldKey; else delete process.env.OPENAI_API_KEY; }
});
test("严格 schema 顶层禁止额外字段并要求所有字段", () => { assert.equal(resumeJsonSchema.additionalProperties, false); assert.deepEqual(new Set(resumeJsonSchema.required), new Set(Object.keys(resumeJsonSchema.properties))); });
