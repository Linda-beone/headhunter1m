import { createHash } from "node:crypto";
import { deleteResume, supabaseWrite, uploadResume } from "../../../lib/admin";
import { RESUME_PARSER_VERSION } from "../../../lib/ai/prompts/resume-parser";
import { newImportId } from "../../../lib/resume/import-service";

const ALLOWED = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  let storagePath: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "请选择 PDF 或 DOCX 简历。" }, { status: 400 });
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED.has(file.type) || !["pdf", "docx"].includes(extension || "")) return Response.json({ error: "仅支持 PDF 和 DOCX 文件。" }, { status: 415 });
    if (!file.size) return Response.json({ error: "文件为空，请选择有效简历。" }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "文件超过 15MB，请压缩后重试。" }, { status: 413 });
    const bytes = await file.arrayBuffer();
    const id = newImportId();
    const safeName = file.name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-120);
    storagePath = `${id}/${Date.now()}_${safeName}`;
    const uploaded = await uploadResume(storagePath, bytes, file.type);
    if (!uploaded.ok) throw new Error("Supabase Storage 保存失败，请重试。");
    const created = await supabaseWrite("resume_imports", { method: "POST", body: JSON.stringify({
      id, original_filename: file.name, storage_path: storagePath, mime_type: file.type,
      file_size: file.size, file_sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
      status: "uploaded", parser_version: RESUME_PARSER_VERSION,
    }) });
    if (!created.ok) throw new Error(`导入记录创建失败（${created.status}）。请先执行第二阶段 migration。`);
    return Response.json({ importId: id, status: "uploaded" }, { status: 201 });
  } catch (error) {
    if (storagePath) await deleteResume([storagePath]).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : "上传失败。" }, { status: 500 });
  }
}
