import { resumeJsonSchema, validateParsedResume, type ParsedResume } from "./schemas/resume";
import { resumeParserPrompt } from "./prompts/resume-parser";

export type ParseResumeResult = { parsed: ParsedResume; fileId: string; responseId: string; durationMs: number };

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI API 尚未配置。");
  return key;
}

export async function parseResume(file: File, signal?: AbortSignal): Promise<ParseResumeResult> {
  const started = Date.now();
  const form = new FormData(); form.append("purpose", "user_data"); form.append("file", file, file.name);
  const upload = await fetch("https://api.openai.com/v1/files", { method: "POST", headers: { Authorization: `Bearer ${apiKey()}` }, body: form, signal });
  if (!upload.ok) throw new Error(`OpenAI 文件上传失败（${upload.status}）。`);
  const uploaded = await upload.json() as { id?: string };
  if (!uploaded.id) throw new Error("OpenAI 未返回文件 ID。");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", signal,
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_RESUME_MODEL || "gpt-5-mini",
      instructions: resumeParserPrompt,
      input: [{ role: "user", content: [
        { type: "input_file", file_id: uploaded.id },
        { type: "input_text", text: "Extract this resume into the required schema. Return only facts supported by the file." },
      ] }],
      text: { format: { type: "json_schema", name: "parsed_resume", strict: true, schema: resumeJsonSchema } },
      store: false,
    }),
  });
  const result = await response.json() as { id?: string; status?: string; error?: { message?: string }; output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }> };
  if (!response.ok) throw new Error(`OpenAI 解析失败：${result.error?.message || response.status}`);
  if (result.status === "incomplete") throw new Error("OpenAI 解析超时或输出不完整，请重试。");
  const content = result.output?.flatMap(item => item.content || []) || [];
  const refusal = content.find(item => item.type === "refusal")?.refusal;
  if (refusal) throw new Error(`OpenAI 无法解析该文件：${refusal}`);
  const outputText = content.find(item => item.type === "output_text")?.text;
  if (!outputText) throw new Error("OpenAI 未返回结构化内容。");
  let parsed: unknown;
  try { parsed = JSON.parse(outputText); } catch { throw new Error("OpenAI Structured Output 无法解析。"); }
  validateParsedResume(parsed);
  return { parsed, fileId: uploaded.id, responseId: result.id || "", durationMs: Date.now() - started };
}
