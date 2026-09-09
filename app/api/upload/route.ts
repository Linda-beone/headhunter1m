import { createHash, randomUUID } from "node:crypto";
import { supabaseWrite, uploadResume } from "../../../lib/admin";

const ALLOWED = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const name = String(form.get("name") || "").trim();
    if (!(file instanceof File) || !name) return Response.json({ error: "缺少简历文件或候选人姓名。" }, { status: 400 });
    if (!ALLOWED.has(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ error: "仅支持 10MB 以内的 PDF、DOC、DOCX。" }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
    const duplicate = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/candidates?resume_sha256=eq.${sha256}&select=id`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } });
    const duplicateRows = await duplicate.json() as Array<{ id: string }>;
    if (duplicateRows[0]) return Response.json({ error: "这份简历已经上传过。", id: duplicateRows[0].id }, { status: 409 });
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const objectPath = `${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
    const upload = await uploadResume(objectPath, bytes, file.type);
    if (!upload.ok) return Response.json({ error: "原文件保存失败。" }, { status: 502 });
    const created = await supabaseWrite("candidates", { method: "POST", body: JSON.stringify({ name, resume_file_url: objectPath, resume_sha256: sha256, job_status: "unknown" }) });
    if (!created.ok) return Response.json({ error: "候选人档案创建失败。" }, { status: 502 });
    const [candidate] = await created.json() as Array<{ id: string }>;
    return Response.json(candidate, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传失败。" }, { status: 500 });
  }
}
