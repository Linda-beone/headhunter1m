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
