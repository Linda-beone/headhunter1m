"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, Project } from "../lib/types";

export function CandidateForm({ candidate, tags = [], demo }: { candidate: Candidate; tags?: string[]; demo: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: candidate.name, age: candidate.age?.toString() || "", phone: candidate.phone || "", email: candidate.email || "", current_city: candidate.current_city || "", current_company: candidate.current_company || "", current_title: candidate.current_title || "", years_experience: candidate.years_experience?.toString() || "", current_salary: candidate.current_salary?.toString() || "", expected_salary: candidate.expected_salary?.toString() || "", location_preference: candidate.location_preference.join("、"), tags: tags.join("、"), job_status: candidate.job_status, summary: candidate.summary || "" });
  const [message, setMessage] = useState("");
  const set = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));
  async function save() {
    if (demo) return setMessage("演示模式不会写入数据；连接 Supabase 后即可保存。 ");
    const { tags: tagsText, ...fields } = form;
    const body = { ...fields, age: Number(form.age) || null, years_experience: Number(form.years_experience) || null, current_salary: Number(form.current_salary) || null, expected_salary: Number(form.expected_salary) || null, location_preference: form.location_preference.split(/[、,，]/).map(s => s.trim()).filter(Boolean) };
    const response = await fetch(`/api/candidates/${candidate.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) return setMessage("保存失败，请检查字段后重试。");
    if (tagsText !== tags.join("、")) {
      const tagResponse = await fetch(`/api/candidates/${candidate.id}/tags`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ tags: tagsText.split(/[、,，]/).map(s => s.trim()).filter(Boolean) }) });
      if (!tagResponse.ok) return setMessage("基本信息已保存，但标签保存失败。");
    }
    router.push(`/candidates/${candidate.id}`); router.refresh();
  }
  async function remove() {
    if (demo) return setMessage("演示模式不会删除数据。 ");
    if (!window.confirm(`确认删除候选人 ${candidate.name}？相关经历、匹配和 Pipeline 记录也会删除。`)) return;
    const response = await fetch(`/api/candidates/${candidate.id}`, { method: "DELETE" });
    if (response.ok) router.push("/candidates"); else setMessage("删除失败，请重试。");
  }
  return <div className="card form-card"><div className="form-grid">
    <Field label="姓名 *" value={form.name} onChange={v => set("name", v)} /><Field label="年龄" value={form.age} type="number" onChange={v => set("age", v)} /><Field label="手机" value={form.phone} onChange={v => set("phone", v)} /><Field label="邮箱" value={form.email} onChange={v => set("email", v)} /><Field label="当前城市" value={form.current_city} onChange={v => set("current_city", v)} />
    <Field label="当前公司" value={form.current_company} onChange={v => set("current_company", v)} /><Field label="当前职位" value={form.current_title} onChange={v => set("current_title", v)} /><Field label="工作年限" value={form.years_experience} type="number" onChange={v => set("years_experience", v)} /><Field label="当前年薪（元）" value={form.current_salary} type="number" onChange={v => set("current_salary", v)} /><Field label="期望年薪（元）" value={form.expected_salary} type="number" onChange={v => set("expected_salary", v)} />
    <Field label="意向城市（顿号分隔）" value={form.location_preference} onChange={v => set("location_preference", v)} /><label className="field"><span>求职状态</span><select value={form.job_status} onChange={e => set("job_status", e.target.value)}><option value="active">积极看机会</option><option value="open">开放机会</option><option value="passive">被动看机会</option><option value="not_looking">暂不考虑</option><option value="unknown">未知</option></select></label><label className="field full"><span>标签（顿号分隔）</span><input value={form.tags} onChange={e => set("tags", e.target.value)} /></label><label className="field full"><span>候选人摘要</span><textarea value={form.summary} onChange={e => set("summary", e.target.value)} rows={5} /></label>
    </div>{message && <p className="form-message">{message}</p>}<div className="form-actions"><button className="danger" onClick={remove}>删除候选人</button><button className="secondary" onClick={() => router.back()}>取消</button><button className="primary" onClick={save}>保存修改</button></div></div>;
}

export function ProjectForm({ project, demo }: { project?: Project; demo: boolean }) {
  const router = useRouter(); const [message, setMessage] = useState("");
  const [form, setForm] = useState({ project_code: project?.project_code || "", client_name: project?.client_name || "", job_title: project?.job_title || "", location: project?.location || "", salary_min: rangeValue(project?.salary_range, 0), salary_max: rangeValue(project?.salary_range, 1), experience_min: project?.experience_min?.toString() || "", experience_max: project?.experience_max?.toString() || "", must_have: project?.must_have.join("、") || "", nice_to_have: project?.nice_to_have.join("、") || "", target_companies: project?.target_companies.join("、") || "", must_have_criteria: criteriaText(project?.must_have_criteria), nice_to_have_criteria: criteriaText(project?.nice_to_have_criteria), status: project?.status || "draft" });
  const set = (key: string, value: string) => setForm(old => ({ ...old, [key]: value }));
  async function save() {
    if (demo) return setMessage("演示模式不会写入数据；连接 Supabase 后即可保存。 ");
    const list = (value: string) => value.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
    const body = { project_code: form.project_code || null, client_name: form.client_name, job_title: form.job_title, location: form.location, salary_range: form.salary_min && form.salary_max ? `[${form.salary_min},${form.salary_max}]` : null, experience_min: Number(form.experience_min) || null, experience_max: Number(form.experience_max) || null, must_have: list(form.must_have), nice_to_have: list(form.nice_to_have), target_companies: list(form.target_companies), must_have_criteria: parseCriteria(form.must_have_criteria), nice_to_have_criteria: parseCriteria(form.nice_to_have_criteria), status: form.status };
    const response = await fetch(project ? `/api/projects/${project.id}` : "/api/projects", { method: project ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) return setMessage("保存失败，请检查字段后重试。");
    const rows = await response.json() as Array<{ id: string }>; router.push(`/projects/${project?.id || rows[0]?.id}`); router.refresh();
  }
  async function remove() { if (!project) return; if (demo) return setMessage("演示模式不会删除数据。 "); if (!window.confirm(`确认删除项目 ${project.job_title}？`)) return; const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" }); if (response.ok) router.push("/projects"); }
  return <div className="card form-card"><div className="form-grid"><Field label="客户名称 *" value={form.client_name} onChange={v => set("client_name", v)} /><Field label="职位名称 *" value={form.job_title} onChange={v => set("job_title", v)} /><Field label="工作地点" value={form.location} onChange={v => set("location", v)} /><label className="field"><span>项目状态</span><select value={form.status} onChange={e => set("status", e.target.value)}><option value="draft">草稿</option><option value="active">进行中</option><option value="paused">暂停</option><option value="closed">关闭</option></select></label><Field label="最低年薪（元）" type="number" value={form.salary_min} onChange={v => set("salary_min", v)} /><Field label="最高年薪（元）" type="number" value={form.salary_max} onChange={v => set("salary_max", v)} /><Field label="最低经验年限" type="number" value={form.experience_min} onChange={v => set("experience_min", v)} /><Field label="最高经验年限" type="number" value={form.experience_max} onChange={v => set("experience_max", v)} /><Field label="Must have（顿号分隔）" value={form.must_have} onChange={v => set("must_have", v)} /><Field label="Nice to have（顿号分隔）" value={form.nice_to_have} onChange={v => set("nice_to_have", v)} /><label className="field full"><span>Must-have 结构化标准</span><textarea rows={6} value={form.must_have_criteria} onChange={e => set("must_have_criteria", e.target.value)} placeholder="每行：名称 | 类型 | critical/important | 关键词（/分隔） | 判断说明" /></label><label className="field full"><span>Nice-to-have 结构化标准</span><textarea rows={4} value={form.nice_to_have_criteria} onChange={e => set("nice_to_have_criteria", e.target.value)} placeholder="每行：名称 | 类型 | preferred | 关键词（/分隔） | 判断说明" /></label><label className="field full"><span>目标公司（顿号分隔）</span><input value={form.target_companies} onChange={e => set("target_companies", e.target.value)} /></label></div>{message && <p className="form-message">{message}</p>}<div className="form-actions">{project && <button className="danger" onClick={remove}>删除项目</button>}<button className="secondary" onClick={() => router.back()}>取消</button><button className="primary" onClick={save}>保存项目</button></div></div>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="field"><span>{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} /></label>; }
function rangeValue(range: string | null | undefined, index: number) { return range?.match(/\d+/g)?.[index] || ""; }
function criteriaText(criteria: Project["must_have_criteria"] = []) { return (criteria || []).map(item => [item.name, item.type, item.importance, item.evidence_keywords.join("/"), item.description].join(" | ")).join("\n"); }
function parseCriteria(value: string): NonNullable<Project["must_have_criteria"]> { return value.split("\n").map(line => line.split("|").map(item => item.trim())).filter(parts => parts[0]).map(parts => ({ name: parts[0], type: parts[1] || "technical", importance: (["critical", "important", "preferred"].includes(parts[2]) ? parts[2] : "important") as "critical" | "important" | "preferred", evidence_keywords: (parts[3] || parts[0]).split("/").map(item => item.trim()).filter(Boolean), description: parts[4] || parts[0] })); }
