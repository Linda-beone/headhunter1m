import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, StatusPill } from "../../../components/AppShell";
import { Icon } from "../../../components/Icons";
import { getProject, getProjectMatches } from "../../../lib/data";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const matches = await getProjectMatches(id);
  return <AppShell active="/projects"><div className="content detail-content">
    <div className="breadcrumbs"><Link href="/projects">Search Projects</Link><span>›</span><span>{project.job_title}</span></div>
    <section className="project-hero"><div><div className="eyebrow">{project.client_name}</div><h1>{project.job_title}</h1><div className="profile-meta"><span><Icon name="location" />{project.location}</span><span><Icon name="briefcase" />{project.experience_min}–{project.experience_max} 年</span><span><Icon name="salary" />{formatRange(project.salary_range)}</span><StatusPill status={project.status} /></div></div><div className="hero-actions"><Link className="secondary" href={`/projects/${id}/edit`}>编辑项目</Link><button className="primary"><Icon name="spark" />运行匹配</button></div></section>
    <div className="project-detail-grid"><div>
      <section className="card"><div className="section-title"><h3>人才画像</h3></div><Requirement title="Must have" items={project.must_have} className="must" /><Requirement title="Nice to have" items={project.nice_to_have} className="nice" /><Requirement title="目标公司" items={project.target_companies} className="target" /></section>
      <section className="card"><div className="section-title"><h3>匹配候选人</h3><span>{matches.length} 人</span></div>{matches.length ? <div className="rank-list">{matches.map((match, index) => <Link href={`/candidates/${match.candidate_id}`} className="rank-row" key={match.id}><span className="rank">{index + 1}</span><span className="avatar color">{match.candidate?.name?.slice(-2)}</span><div className="rank-person"><strong>{match.candidate?.name}</strong><span>{match.candidate?.current_title} · {match.candidate?.current_company}</span></div><div className="mini-bars"><small>技术 {match.technical_score}</small><small>行业 {match.industry_score}</small><small>意向 {match.intent_score}</small></div><div className={`score-ring score-${match.match_level}`}>{match.total_score}<small>分</small></div><Icon name="chevron" /></Link>)}</div> : <div className="empty"><Icon name="candidates" size={28} /><strong>还没有匹配候选人</strong><span>下一阶段接入自动匹配后，结果会显示在这里。</span></div>}</section>
    </div><aside><section className="card"><div className="section-title"><h3>项目概览</h3></div><div className="project-stats"><div><strong>{matches.length}</strong><span>匹配候选人</span></div><div><strong>{matches.filter(m => (m.total_score || 0) >= 85).length}</strong><span>强匹配</span></div></div><div className="info-stack"><Info label="客户" value={project.client_name} /><Info label="项目状态" value={project.status} /><Info label="最近更新" value={new Date(project.updated_at).toLocaleDateString("zh-CN")} /></div></section></aside></div>
  </div></AppShell>;
}
function formatRange(range?: string | null) { if (!range) return "薪资面议"; const nums = range.match(/\d+/g); return nums ? `${Number(nums[0]) / 10000}–${Number(nums[1]) / 10000} 万/年` : range; }
function Requirement({ title, items, className }: { title: string; items: string[]; className: string }) { return <div className={`requirement-group ${className}`}><h4>{title}</h4><div>{items.map(item => <span key={item}>{item}</span>)}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
