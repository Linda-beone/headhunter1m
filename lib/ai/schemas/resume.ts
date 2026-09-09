export type Nullable<T> = T | null;
export type ParsedResume = {
  candidate: {
    name: Nullable<string>; gender: Nullable<string>; birth_date: Nullable<string>; age: Nullable<number>;
    phone: Nullable<string>; email: Nullable<string>; wechat: Nullable<string>; current_city: Nullable<string>;
    current_company: Nullable<string>; current_title: Nullable<string>; years_experience: Nullable<number>;
    highest_education: Nullable<string>; major: Nullable<string>; english_level: Nullable<string>;
    job_status: "active" | "open" | "passive" | "not_looking" | "unknown";
    current_salary: Nullable<number>; expected_salary: Nullable<number>; summary: Nullable<string>;
  };
  experiences: Array<{
    company: string; normalized_company_name: Nullable<string>; title: string;
    start_date: Nullable<string>; end_date: Nullable<string>; is_current: boolean; city: Nullable<string>;
    department: Nullable<string>; industry: Nullable<string>; product: Nullable<string>;
    responsibilities: string[]; achievements: string[]; technologies: string[];
  }>;
  education: Array<{ school: string; degree: Nullable<string>; major: Nullable<string>; start_date: Nullable<string>; end_date: Nullable<string> }>;
  skills: Array<{ name: string; category: "industry" | "product" | "process" | "quality" | "equipment" | "software" | "language" | "management" | "other"; confidence: "high" | "medium" | "low"; evidence: Nullable<string> }>;
  certificates: Array<{ name: string; issuer: Nullable<string>; date: Nullable<string> }>;
  languages: Array<{ language: string; level: Nullable<string>; evidence: Nullable<string> }>;
  job_preferences: { preferred_locations: string[]; target_roles: string[]; job_change_reason: Nullable<string>; availability: Nullable<string> };
  achievements: Array<{ title: string; description: string; metric: Nullable<string> }>;
  unknown_or_uncertain: Array<{ field: string; reason: string }>;
};

const nullableString = { type: ["string", "null"] } as const;
const nullableNumber = { type: ["number", "null"] } as const;
const strictObject = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: "object", properties, required, additionalProperties: false });
const stringArray = { type: "array", items: { type: "string" } };

export const resumeJsonSchema = strictObject({
  candidate: strictObject({
    name: nullableString, gender: nullableString, birth_date: nullableString, age: nullableNumber,
    phone: nullableString, email: nullableString, wechat: nullableString, current_city: nullableString,
    current_company: nullableString, current_title: nullableString, years_experience: nullableNumber,
    highest_education: nullableString, major: nullableString, english_level: nullableString,
    job_status: { type: "string", enum: ["active", "open", "passive", "not_looking", "unknown"] },
    current_salary: nullableNumber, expected_salary: nullableNumber, summary: nullableString,
  }),
  experiences: { type: "array", items: strictObject({
    company: { type: "string" }, normalized_company_name: nullableString, title: { type: "string" },
    start_date: nullableString, end_date: nullableString, is_current: { type: "boolean" }, city: nullableString,
    department: nullableString, industry: nullableString, product: nullableString,
    responsibilities: stringArray, achievements: stringArray, technologies: stringArray,
  }) },
  education: { type: "array", items: strictObject({ school: { type: "string" }, degree: nullableString, major: nullableString, start_date: nullableString, end_date: nullableString }) },
  skills: { type: "array", items: strictObject({
    name: { type: "string" }, category: { type: "string", enum: ["industry", "product", "process", "quality", "equipment", "software", "language", "management", "other"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] }, evidence: nullableString,
  }) },
  certificates: { type: "array", items: strictObject({ name: { type: "string" }, issuer: nullableString, date: nullableString }) },
  languages: { type: "array", items: strictObject({ language: { type: "string" }, level: nullableString, evidence: nullableString }) },
  job_preferences: strictObject({ preferred_locations: stringArray, target_roles: stringArray, job_change_reason: nullableString, availability: nullableString }),
  achievements: { type: "array", items: strictObject({ title: { type: "string" }, description: { type: "string" }, metric: nullableString }) },
  unknown_or_uncertain: { type: "array", items: strictObject({ field: { type: "string" }, reason: { type: "string" } }) },
});

export function validateParsedResume(value: unknown): asserts value is ParsedResume {
  if (!value || typeof value !== "object") throw new Error("AI 返回了无效的结构化结果。");
  const data = value as Partial<ParsedResume>;
  if (!data.candidate || !Array.isArray(data.experiences) || !Array.isArray(data.skills) || !Array.isArray(data.unknown_or_uncertain)) {
    throw new Error("AI 返回结果缺少必要字段。");
  }
  if (!data.candidate.name?.trim()) throw new Error("简历中未找到候选人姓名，请人工检查文件。");
}
