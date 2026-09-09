import { supabaseWrite } from "../../../lib/admin";
export async function POST(request: Request) {
  const response = await supabaseWrite("search_projects", { method: "POST", body: JSON.stringify(await request.json()) });
  return new Response(response.body, { status: response.status, headers: { "content-type": "application/json" } });
}
