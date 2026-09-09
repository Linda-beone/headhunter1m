import { getCandidates } from "../../../../lib/data";
export async function GET() {
  const rows = await getCandidates();
  const headers = ["姓名", "手机", "邮箱", "当前城市", "当前公司", "当前职位", "工作年限", "求职状态", "意向城市", "当前年薪", "期望年薪", "摘要"];
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const body = [headers, ...rows.map(c => [c.name, c.phone, c.email, c.current_city, c.current_company, c.current_title, c.years_experience, c.job_status, c.location_preference.join("、"), c.current_salary, c.expected_salary, c.summary])].map(row => row.map(quote).join(",")).join("\r\n");
  return new Response(`\uFEFF${body}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="candidates-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
