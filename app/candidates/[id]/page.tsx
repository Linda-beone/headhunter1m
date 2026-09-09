import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, StatusPill } from "../../../components/AppShell";
import { Icon } from "../../../components/Icons";
import { getCandidateBundle } from "../../../lib/data";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getCandidateBundle(id);
  if (!bundle) notFound();
  const { candidate, experiences, tags, matches, pipeline } = bundle;
  return <AppShell active="/candidates"><div className="content detail-content">
    <div className="breadcrumbs"><Link href="/candidates">候选人</Link><span>›</span><span>{candidate.name}</span></div>
    <section className="profile-hero">
      <div className="avatar hero-avatar">{candidate.name.slice(-2)}</div>
      <div className="profile-title"><div><h1>{candidate.name}</h1><StatusPill status={candidate.job_status} /></div><h2>{candidate.current_title} · {candidate.current_company}</h2>
        <div className="profile-meta"><span><Icon name="location" />{candidate.current_city}</span><span><Icon name="briefcase" />{candidate.years_experience} 年经验</span><span><Icon name="salary" />期望 {(Number(candidate.expected_salary || 0) / 10000).toFixed(0)} 万/年</span></div>
      </div>
      <div className="hero-actions"><Link className="secondary" href={`/candidates/${id}/edit`}>编辑档案</Link><button className="primary"><Icon name="phone" />记录沟通</button></div>
    </section>
    <div className="detail-grid"><div className="detail-main">
      <section className="card"><div className="section-title"><h3>候选人概览</h3></div><p className="summary">{candidate.summary || "暂无摘要"}</p><div className="info-grid">
        <Info icon="phone" label="手机" value={candidate.phone} /><Info icon="mail" label="邮箱" value={candidate.email} /><Info icon="candidates" label="微信" value={candidate.wechat} /><Info icon="location" label="意向城市" value={candidate.location_preference?.join("、")} />
        <Info icon="salary" label="目前年薪" value={candidate.current_salary ? `${Number(candidate.current_salary) / 10000} 万` : "—"} /><Info icon="briefcase" label="求职状态" value={candidate.job_status} /><Info icon="file" label="学历 / 专业" value={`${candidate.education?.[0]?.degree || "—"} · ${candidate.major || "—"}`} /><Info icon="calendar" label="年龄" value={candidate.age ? `${candidate.age} 岁` : "—"} />
      </div></section>
      <section className="card"><div className="section-title"><h3>工作经历</h3><button className="text-button">+ 添加经历</button></div><div className="timeline">{experiences.length ? experiences.map((exp) => <div className="timeline-item" key={exp.id}><div className="timeline-dot" /><div className="timeline-head"><div><h4>{exp.title}</h4><strong>{exp.company}</strong></div><span>{exp.start_date?.slice(0, 7)} — {exp.end_date?.slice(0, 7) || "至今"}</span></div><div className="experience-meta">{[exp.city, exp.industry, exp.product].filter(Boolean).join(" · ")}</div><p>{exp.description}</p></div>) : <div className="empty-small">暂无工作经历</div>}</div></section>
      <section className="card"><div className="section-title"><h3>技术与行业标签</h3><button className="text-button">管理标签</button></div><div className="tag-cloud">{tags.length ? tags.map((tag) => <span key={tag.id}>{tag.tag}<small>{Math.round(tag.confidence * 100)}%</small></span>) : <div className="empty-small">暂无标签</div>}</div></section>
      <section className="card"><div className="section-title"><h3>匹配项目</h3><Link href="/projects">查看全部</Link></div>{matches.length ? matches.map((match) => <Link className="match-row" href={`/projects/${match.project_id}`} key={match.id}><div className={`score-ring score-${match.match_level}`}>{match.total_score}<small>分</small></div><div className="match-copy"><div><strong>{match.project?.job_title}</strong><StatusPill status={match.match_level || ""} /></div><span>{match.project?.client_name} · {match.project?.location}</span><p>{match.recommendation}</p></div><Icon name="chevron" /></Link>) : <div className="empty-small">尚未匹配项目</div>}</section>
    </div><aside className="detail-side">
      <section className="card"><div className="section-title"><h3>Pipeline 状态</h3></div>{pipeline.length ? <><div className="current-stage"><span>当前阶段</span><strong><StatusPill status={pipeline[0].stage} /></strong></div><div className="next-action"><small>下一步行动</small><p>{pipeline[0].next_action || "暂未安排"}</p>{pipeline[0].next_followup_date && <span><Icon name="clock" />{new Date(pipeline[0].next_followup_date).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}</div><div className="event-list">{pipeline.map((event) => <div key={event.id}><i /><span><strong>{event.stage}</strong><small>{new Date(event.event_date).toLocaleDateString("zh-CN")}</small><p>{event.note}</p></span></div>)}</div></> : <div className="empty-small">暂无流程记录</div>}</section>
      {matches[0] && <section className="card match-insight"><div className="section-title"><h3>匹配洞察</h3><span className="ai-label"><Icon name="spark" /> AI</span></div><Insight title="优势" icon="check" items={matches[0].strengths} tone="good" /><Insight title="待确认" icon="alert" items={matches[0].gaps} tone="warn" /><Insight title="电话沟通问题" icon="question" items={matches[0].questions_to_verify} tone="question" /></section>}
    </aside></div>
  </div></AppShell>;
}

function Info({ icon, label, value }: { icon: string; label: string; value?: string | number | null }) { return <div className="info-item"><Icon name={icon} /><span><small>{label}</small><strong>{value || "—"}</strong></span></div>; }
function Insight({ title, icon, items, tone }: { title: string; icon: string; items: string[]; tone: string }) { return <div className={`insight ${tone}`}><h4><Icon name={icon} />{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
