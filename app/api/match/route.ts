import { runSingleMatch } from "../../../lib/matcher/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { candidate_id?: string; project_id?: string };
    if (!body.candidate_id || !UUID.test(body.candidate_id) || !body.project_id || !UUID.test(body.project_id)) {
      return Response.json({ error: "candidate_id 和 project_id 必须是有效 UUID。" }, { status: 400 });
    }
    const result = await runSingleMatch(body.candidate_id, body.project_id);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "职位匹配失败，请重试。";
    console.error("job_match_request", { success: false, error: message });
    return Response.json({ error: message }, { status: message.startsWith("找不到") ? 404 : 500 });
  }
}
