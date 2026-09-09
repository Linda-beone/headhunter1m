import { randomUUID } from "node:crypto";
import { downloadResume, moveResume, supabaseRead, supabaseRpc, supabaseWrite } from "../admin";
import { parseResume } from "../ai/resume-parser";
import { RESUME_PARSER_VERSION } from "../ai/prompts/resume-parser";
import { buildConflicts, findDuplicates, type ExistingCandidate } from "./dedupe";
import type { ParsedResume } from "../ai/schemas/resume";

export type ResumeImport = { id: string; candidate_id?: string | null; original_filename: string; storage_path: string; mime_type: string; file_size: number; file_sha256: string; status: string; raw_parsed_json?: ParsedResume | null; duplicate_candidates?: unknown[]; error_message?: string | null };

async function patchImport(id: string, patch: Record<string, unknown>) {
  const response = await supabaseWrite(`resume_imports?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  if (!response.ok) throw new Error(`导入状态保存失败（${response.status}）。`);
}

export async function getImport(id: string) {
  const rows = await supabaseRead<ResumeImport[]>(`resume_imports?id=eq.${encodeURIComponent(id)}&select=*`);
  if (!rows[0]) throw new Error("找不到该简历导入记录。");
  return rows[0];
}

export async function processImport(id: string) {
  const item = await getImport(id);
  if (!["uploaded", "failed"].includes(item.status)) throw new Error("该简历当前不能重新解析。");
  const started = Date.now();
  await patchImport(id, { status: "parsing", error_message: null });
  try {
    const bytes = await downloadResume(item.storage_path);
    if (!bytes.byteLength) throw new Error("简历文件为空。");
    const file = new File([bytes], item.original_filename, { type: item.mime_type });
    const result = await parseResume(file, AbortSignal.timeout(120_000));
    await patchImport(id, {
      status: "parsed",
      raw_parsed_json: result.parsed,
      ai_provider: result.provider,
      provider_file_id: result.fileId,
      provider_response_id: result.responseId,
      fallback_used: result.fallbackUsed,
      token_usage: result.tokenUsage || {},
      ...(result.provider === "openai" ? { openai_file_id: result.fileId, openai_response_id: result.responseId } : {}),
    });
    const existing = await supabaseRead<ExistingCandidate[]>("candidates?select=id,name,phone,email,wechat,current_company,current_title,current_city,age,current_salary,expected_salary&limit=5000");
    const duplicates = findDuplicates(result.parsed, existing);
    console.info("resume_import", {
      resume_import_id: id, ai_provider: result.provider, provider_response_id: result.responseId,
      fallback_used: result.fallbackUsed, duration_ms: result.durationMs,
      parser_version: RESUME_PARSER_VERSION, success: true,
    });
    if (duplicates.length) {
      const payload = duplicates.map(match => ({ ...match, conflicts: buildConflicts(result.parsed, match.candidate) }));
      await patchImport(id, { status: "duplicate_found", duplicate_candidates: payload });
      return { status: "duplicate_found", importId: id, parsed: result.parsed, duplicates: payload };
    }
    const candidateId = await supabaseRpc<string>("commit_resume_import", { p_import_id: id, p_candidate_id: id, p_create_new: true, p_conflict_choices: {} });
    return { status: "completed", importId: id, candidateId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败。";
    await patchImport(id, { status: "failed", error_message: message }).catch(() => undefined);
    console.error("resume_import", { resume_import_id: id, duration_ms: Date.now() - started, parser_version: RESUME_PARSER_VERSION, success: false, error: message });
    throw error;
  }
}

export async function resolveImport(id: string, action: "create" | "update", candidateId?: string, choices: Record<string, "new" | "old"> = {}) {
  const item = await getImport(id);
  if (item.status !== "duplicate_found" || !item.raw_parsed_json) throw new Error("该导入记录没有待处理的重复候选人。");
  const targetId = action === "create" ? id : candidateId;
  if (!targetId) throw new Error("请选择要更新的候选人。");
  if (action === "update") {
    const allowedIds = (item.duplicate_candidates || [])
      .map(entry => (entry as { candidate?: { id?: string } })?.candidate?.id)
      .filter(Boolean);
    if (!allowedIds.includes(targetId)) throw new Error("所选候选人不在本次查重结果中。");
    const filename = item.storage_path.split("/").pop() || `${Date.now()}_${item.original_filename}`;
    const targetPath = `${targetId}/${filename}`;
    if (item.storage_path !== targetPath) {
      await moveResume(item.storage_path, targetPath);
      await patchImport(id, { storage_path: targetPath });
    }
  }
  const committedId = await supabaseRpc<string>("commit_resume_import", { p_import_id: id, p_candidate_id: targetId, p_create_new: action === "create", p_conflict_choices: choices });
  return { status: "completed", candidateId: committedId };
}

export const newImportId = () => randomUUID();
