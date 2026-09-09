import { resolveImport } from "../../../../../lib/resume/import-service";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json() as { action?: "create" | "update"; candidateId?: string; choices?: Record<string, "new" | "old"> };
    if (!body.action || !["create", "update"].includes(body.action)) return Response.json({ error: "无效的处理方式。" }, { status: 400 });
    return Response.json(await resolveImport((await params).id, body.action, body.candidateId, body.choices));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "重复候选人处理失败。" }, { status: 500 }); }
}
