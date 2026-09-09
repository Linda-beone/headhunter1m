import { supabaseWrite } from "../../../lib/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await supabaseWrite("candidates", { method: "POST", body: JSON.stringify(body) });
  return new Response(response.body, { status: response.status, headers: { "content-type": "application/json" } });
}
