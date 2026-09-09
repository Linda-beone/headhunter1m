import type { ParsedResume } from "../ai/schemas/resume";

export type ExistingCandidate = { id: string; name: string; phone?: string | null; email?: string | null; wechat?: string | null; current_company?: string | null; current_title?: string | null; current_city?: string | null; age?: number | null; current_salary?: number | null; expected_salary?: number | null };
export type DuplicateMatch = { level: 1 | 2 | 3 | 4; reason: string; automaticBlock: boolean; candidate: ExistingCandidate };

export const normalizePhone = (value?: string | null) => value?.replace(/\D/g, "") || "";
export const normalizeIdentity = (value?: string | null) => value?.trim().toLocaleLowerCase().replace(/\s/g, "") || "";
export const normalizeCompany = (value?: string | null) => normalizeIdentity(value)
  .replace(/[()（）·.,，。]/g, "")
  .replace(/(股份)?有限公司$|有限责任公司$|公司$/g, "");

export function findDuplicates(parsed: ParsedResume, candidates: ExistingCandidate[]): DuplicateMatch[] {
  const p = parsed.candidate;
  const results: DuplicateMatch[] = [];
  for (const candidate of candidates) {
    let match: DuplicateMatch | undefined;
    if (p.phone && normalizePhone(p.phone) === normalizePhone(candidate.phone)) match = { level: 1, reason: "手机号完全一致", automaticBlock: true, candidate };
    else if (p.email && p.email.trim().toLowerCase() === candidate.email?.trim().toLowerCase()) match = { level: 2, reason: "邮箱完全一致", automaticBlock: true, candidate };
    else if (p.wechat && normalizeIdentity(p.wechat) === normalizeIdentity(candidate.wechat)) match = { level: 3, reason: "微信号完全一致", automaticBlock: true, candidate };
    else if (normalizeIdentity(p.name) && normalizeIdentity(p.name) === normalizeIdentity(candidate.name) && normalizeCompany(p.current_company) && normalizeCompany(p.current_company) === normalizeCompany(candidate.current_company)) match = { level: 4, reason: "姓名和当前公司高度一致", automaticBlock: false, candidate };
    if (match) results.push(match);
  }
  return results.sort((a, b) => a.level - b.level);
}

export function buildConflicts(parsed: ParsedResume, existing: ExistingCandidate) {
  const keys = ["name", "age", "phone", "email", "wechat", "current_city", "current_company", "current_title", "current_salary", "expected_salary"] as const;
  return keys.flatMap(field => {
    const oldValue = existing[field]; const newValue = parsed.candidate[field];
    const equal = field === "current_company"
      ? normalizeCompany(String(oldValue ?? "")) === normalizeCompany(String(newValue ?? ""))
      : String(oldValue ?? "").trim() === String(newValue ?? "").trim();
    return oldValue != null && newValue != null && !equal ? [{ field, oldValue, newValue }] : [];
  });
}
