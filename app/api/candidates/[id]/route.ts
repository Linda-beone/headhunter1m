import { supabaseWrite } from "../../../../lib/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await supabaseWrite(`candidates?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(await request.json()) });
  return new Response(response.body, { status: response.status, headers: { "content-type": "application/json" } });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await supabaseWrite(`candidates?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return new Response(response.body, { status: response.status, headers: { "content-type": "application/json" } });
}
