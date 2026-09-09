const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function requireSupabase() {
  if (!url || !key) throw new Error("Supabase 尚未配置，请先复制 .env.example 为 .env.local。 ");
  return { url, key };
}

export async function supabaseWrite(path: string, init: RequestInit = {}) {
  const config = requireSupabase();
  return fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });
}

export async function supabaseRead<T>(path: string): Promise<T> {
  const config = requireSupabase();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase 读取失败（${response.status}）。`);
  return response.json() as Promise<T>;
}

export async function supabaseRpc<T>(name: string, body: unknown): Promise<T> {
  const response = await supabaseWrite(`rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`数据库事务失败（${response.status}）：${await response.text()}`);
  return response.json() as Promise<T>;
}

export async function uploadResume(path: string, bytes: ArrayBuffer, contentType: string) {
  const config = requireSupabase();
  return fetch(`${config.url}/storage/v1/object/resumes/${path}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: bytes,
  });
}

export async function downloadResume(path: string) {
  const config = requireSupabase();
  const response = await fetch(`${config.url}/storage/v1/object/resumes/${path}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error("无法读取原始简历。");
  return response.arrayBuffer();
}

export async function moveResume(from: string, to: string) {
  const config = requireSupabase();
  const response = await fetch(`${config.url}/storage/v1/object/move`, {
    method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ bucketId: "resumes", sourceKey: from, destinationKey: to }),
  });
  if (!response.ok) throw new Error("无法调整简历存储路径。");
}

export async function deleteResume(paths: string[]) {
  const config = requireSupabase();
  return fetch(`${config.url}/storage/v1/object/resumes`, {
    method: "DELETE", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  });
}

export async function createResumeSignedUrl(path: string, expiresIn = 300) {
  const config = requireSupabase();
  const response = await fetch(`${config.url}/storage/v1/object/sign/resumes/${path}`, {
    method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn }),
  });
  if (!response.ok) throw new Error("无法创建简历访问链接。");
  const data = await response.json() as { signedURL?: string; signedUrl?: string };
  const signed = data.signedURL || data.signedUrl;
  if (!signed) throw new Error("Supabase 未返回简历访问链接。");
  return signed.startsWith("http") ? signed : `${config.url}/storage/v1${signed}`;
}
