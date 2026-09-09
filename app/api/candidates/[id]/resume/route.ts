import { createResumeSignedUrl, supabaseRead } from "../../../../../lib/admin";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await supabaseRead<Array<{ resume_file_url?: string | null }>>(`candidates?id=eq.${id}&select=resume_file_url`);
    if (!rows[0]?.resume_file_url) return Response.json({ error: "该候选人没有原始简历。" }, { status: 404 });
    const url = await createResumeSignedUrl(rows[0].resume_file_url, 300);
    return Response.redirect(url!, 302);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "无法打开简历。" }, { status: 500 }); }
}
