import { supabaseRead, supabaseWrite } from "../../../../lib/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const allowed = new Set(["name", "birth_date", "age", "gender", "phone", "email", "wechat", "current_city", "current_company", "current_title", "years_experience", "education", "highest_education", "major", "english_level", "job_status", "location_preference", "current_salary", "expected_salary", "summary"]);
  const [existing] = await supabaseRead<Array<Record<string, unknown> & { manual_fields?: string[]; field_sources?: Record<string, string> }>>(`candidates?id=eq.${encodeURIComponent(id)}&select=*`);
  if (!existing) return Response.json({ error: "找不到该候选人。" }, { status: 404 });
  const patch = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.has(key)));
  const changed = Object.keys(patch).filter(key => JSON.stringify(existing[key] ?? null) !== JSON.stringify(patch[key] ?? null));
  if (!changed.length) return Response.json([existing]);
  const manualFields = Array.from(new Set([...(existing.manual_fields || []), ...changed]));
  const sources = { ...(existing.field_sources || {}), ...Object.fromEntries(changed.map(key => [key, "manual"])) };
  const response = await supabaseWrite(`candidates?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ ...patch, manual_fields: manualFields, field_sources: sources }) });
  return new Response(response.body, { status: response.status, headers: { "content-type": "application/json" } });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await supabaseWrite(`candidates?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return new Response(response.body, { status: response.status, headers: { "content-type": "application/json" } });
}
