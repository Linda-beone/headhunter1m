import { processImport } from "../../../../../lib/resume/import-service";
export const maxDuration = 150;
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await processImport((await params).id);
    return Response.json(result, { status: result.status === "duplicate_found" ? 409 : 200 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "简历解析失败，请重试。" }, { status: 500 });
  }
}
