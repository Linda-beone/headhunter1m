import { supabaseWrite } from "../../../../../lib/admin";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as { tags?: string[] };
  const tags = Array.from(new Set((body.tags || []).map(tag => tag.trim()).filter(Boolean)));
  const removed = await supabaseWrite(`candidate_tags?candidate_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!removed.ok) return Response.json({ error: "标签更新失败。" }, { status: removed.status });
  if (tags.length) {
    const inserted = await supabaseWrite("candidate_tags", { method: "POST", body: JSON.stringify(tags.map(tag => ({ candidate_id: id, tag, tag_type: "other", confidence: 1, source: "manual" }))) });
    if (!inserted.ok) return Response.json({ error: "标签保存失败。" }, { status: inserted.status });
  }
  return Response.json({ tags });
}
