import { getImport } from "../../../../lib/resume/import-service";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return Response.json(await getImport((await params).id)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "查询失败。" }, { status: 404 }); }
}
