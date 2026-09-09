import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, StatusPill } from "../../../components/AppShell";
import { Icon } from "../../../components/Icons";
import { ProjectMatchList } from "../../../components/ProjectMatchList";
import { getProject, getProjectMatches } from "../../../lib/data";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const matches = await getProjectMatches(id);
  return <AppShell active="/projects"><div className="content detail-content">
    <div className="breadcrumbs"><Link href="/projects">Search Projects</Link><span>›</span><span>{project.job_title}</span></div>
    <section className="project-hero"><div><div className="eyebrow">{project.client_name}</div><h1>{project.job_title}</h1><div className="profile-meta"><span><Icon name="location" />{project.location}</span><span><Icon name="briefcase" />{project.experience_min ?? "—"}–{project.experience_max ?? "—"} 年</span><span><Icon name="salary" />{formatRange(project.salary_range)}</span><StatusPill status={project.status} /></div></div><div className="hero-actions"><Link className="secondary" href={`/projects/${id}/edit`}>编辑项目</Link><Link className="primary" href="/candidates"><Icon name="candidates" />选择候选人</Link></div></section>
    <div className="project-detail-grid"><div>
      <section className="card"><div className="section-title"><h3>人才画像</h3></div>{project.must_have_criteria?.length ? <CriteriaRequirement title="Must have" items={project.must_have_criteria} className="must" /> : <Requirement title="Must have" items={project.must_have} className="must" />}{project.nice_to_have_criteria?.length ? <CriteriaRequirement title="Nice to have" items={project.nice_to_have_criteria} className="nice" /> : <Requirement title="Nice to have" items={project.nice_to_have} className="nice" />}<Requirement title="目标公司" items={project.target_companies} className="target" /></section>
      <section className="card"><div className="section-title"><h3>匹配候选人</h3><span>{matches.length} 人</span></div><ProjectMatchList matches={matches} /></section>
    </div><aside><section className="card"><div className="section-title"><h3>项目概览</h3></div><div className="project-stats"><div><strong>{matches.length}</strong><span>匹配候选人</span></div><div><strong>{matches.filter(m => (m.total_score || 0) >= 85).length}</strong><span>强匹配</span></div></div><div className="info-stack"><Info label="客户" value={project.client_name} /><Info label="项目状态" value={project.status} /><Info label="最近更新" value={new Date(project.updated_at).toLocaleDateString("zh-CN")} /></div></section></aside></div>
  </div></AppShell>;
}
function formatRange(range?: string | null) { if (!range) return "薪资面议"; const nums = range.match(/\d+/g); return nums ? `${Number(nums[0]) / 10000}–${Number(nums[1]) / 10000} 万/年` : range; }
function Requirement({ title, items, className }: { title: string; items: string[]; className: string }) { return <div className={`requirement-group ${className}`}><h4>{title}</h4><div>{items.map(item => <span key={item}>{item}</span>)}</div></div>; }
function CriteriaRequirement({ title, items, className }: { title: string; items: NonNullable<import("../../../lib/types").Project["must_have_criteria"]>; className: string }) { return <div className={`requirement-group criteria ${className}`}><h4>{title}</h4><div>{items.map(item => <div className="criterion-definition" key={item.name}><strong>{item.name}<small>{item.importance}</small></strong><span>{item.description}</span><em>证据：{item.evidence_keywords.join(" / ")}</em></div>)}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
