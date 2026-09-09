import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, StatusPill } from "../../../components/AppShell";
import { Icon } from "../../../components/Icons";
import { getCandidateBundle } from "../../../lib/data";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getCandidateBundle(id);
  if (!bundle) notFound();
  const { candidate, experiences, tags, matches, pipeline, latestImport } = bundle;
  const parsed = latestImport?.raw_parsed_json;
  return <AppShell active="/candidates"><div className="content detail-content">
    <div className="breadcrumbs"><Link href="/candidates">候选人</Link><span>›</span><span>{candidate.name}</span></div>
    <section className="profile-hero">
      <div className="avatar hero-avatar">{candidate.name.slice(-2)}</div>
      <div className="profile-title"><div><h1>{candidate.name}</h1><StatusPill status={candidate.job_status} /></div><h2>{candidate.current_title} · {candidate.current_company}</h2>
        <div className="profile-meta"><span><Icon name="location" />{candidate.current_city}</span><span><Icon name="briefcase" />{candidate.years_experience} 年经验</span><span><Icon name="salary" />期望 {(Number(candidate.expected_salary || 0) / 10000).toFixed(0)} 万/年</span></div>
      </div>
      <div className="hero-actions">{latestImport && <a className="secondary" href={`/api/candidates/${id}/resume`} target="_blank" rel="noreferrer"><Icon name="file" />原始简历</a>}<Link className="secondary" href={`/candidates/${id}/edit`}>编辑候选人</Link><button className="primary"><Icon name="phone" />记录沟通</button></div>
    </section>
    <div className="detail-grid"><div className="detail-main">
      <section className="card"><div className="section-title"><h3>候选人概览</h3></div><p className="summary">{candidate.summary || "暂无摘要"}</p><div className="info-grid">
        <Info icon="phone" label="手机" value={candidate.phone} /><Info icon="mail" label="邮箱" value={candidate.email} /><Info icon="candidates" label="微信" value={candidate.wechat} /><Info icon="location" label="意向城市" value={candidate.location_preference?.join("、")} />
        <Info icon="salary" label="目前年薪" value={candidate.current_salary ? `${Number(candidate.current_salary) / 10000} 万` : "—"} /><Info icon="briefcase" label="求职状态" value={candidate.job_status} /><Info icon="file" label="学历 / 专业" value={`${candidate.education?.[0]?.degree || "—"} · ${candidate.major || "—"}`} /><Info icon="calendar" label="年龄" value={candidate.age ? `${candidate.age} 岁` : "—"} />
      </div></section>
      <section className="card"><div className="section-title"><h3>工作经历</h3><button className="text-button">+ 添加经历</button></div><div className="timeline">{experiences.length ? experiences.map((exp) => <div className="timeline-item" key={exp.id}><div className="timeline-dot" /><div className="timeline-head"><div><h4>{exp.title}</h4><strong>{exp.company}</strong></div><span>{exp.start_date_raw || exp.start_date?.slice(0, 7) || "时间未知"} — {exp.end_date_raw || exp.end_date?.slice(0, 7) || "至今"}</span></div><div className="experience-meta">{[exp.city, exp.industry, exp.product].filter(Boolean).join(" · ")}</div><p>{exp.description}</p></div>) : <div className="empty-small">暂无工作经历</div>}</div></section>
      <section className="card"><div className="section-title"><h3>技术与行业标签</h3><button className="text-button">管理标签</button></div><div className="tag-cloud">{tags.length ? tags.map((tag) => <span title={(tag as { evidence?: string }).evidence || ""} key={tag.id}>{tag.tag}<small>{Math.round(tag.confidence * 100)}%</small>{(tag as { evidence?: string }).evidence && <em>{(tag as { evidence?: string }).evidence}</em>}</span>) : <div className="empty-small">暂无标签</div>}</div></section>
      {parsed && <section className="card parsed-card"><div className="section-title"><h3>AI 解析结果</h3><span className="ai-label"><Icon name="spark" />{latestImport?.ai_provider === "kimi" ? "Kimi" : latestImport?.ai_provider === "openai" ? "OpenAI 备选" : "AI"} · {latestImport?.parser_version}</span></div>
        <ParsedSection title="基本信息" empty="简历未提供基本信息"><div className="parsed-info-grid"><span>姓名<strong>{parsed.candidate.name || "待确认"}</strong></span><span>当前公司<strong>{parsed.candidate.current_company || "待确认"}</strong></span><span>当前职位<strong>{parsed.candidate.current_title || "待确认"}</strong></span><span>英语水平<strong>{parsed.candidate.english_level || "待确认"}</strong></span></div></ParsedSection>
        <ParsedSection title="工作经历" empty="简历未提供工作经历">{parsed.experiences.map((item, index) => <div className="parsed-row" key={`${item.company}-${item.title}-${index}`}><strong>{item.title} · {item.company}</strong><span>{[item.start_date && `${item.start_date} — ${item.end_date || "至今"}`, item.city, ...item.responsibilities].filter(Boolean).join(" · ")}</span></div>)}</ParsedSection>
        <ParsedSection title="教育经历" empty="简历未提供教育经历">{parsed.education.map((item, index) => <div className="parsed-row" key={`${item.school}-${index}`}><strong>{item.school}</strong><span>{[item.degree, item.major, item.start_date && `${item.start_date} — ${item.end_date || ""}`].filter(Boolean).join(" · ")}</span></div>)}</ParsedSection>
        <ParsedSection title="技术标签" empty="简历未提取到技术标签">{parsed.skills.map((item, index) => <div className="parsed-row" key={`${item.name}-${index}`}><strong>{item.name} · {item.confidence}</strong><span>{item.evidence || "无可引用的简历证据"}</span></div>)}</ParsedSection>
        <ParsedSection title="证书" empty="简历未提供证书">{parsed.certificates.map((item, index) => <div className="parsed-row" key={`${item.name}-${index}`}><strong>{item.name}</strong><span>{[item.issuer, item.date].filter(Boolean).join(" · ")}</span></div>)}</ParsedSection>
        <ParsedSection title="语言" empty="简历未明确语言能力">{parsed.languages.map((item, index) => <div className="parsed-row" key={`${item.language}-${index}`}><strong>{item.language}{item.level ? ` · ${item.level}` : ""}</strong><span>{item.evidence}</span></div>)}</ParsedSection>
        <ParsedSection title="求职偏好" empty="简历未提供求职偏好"><div className="parsed-row"><strong>{parsed.job_preferences.preferred_locations.join("、") || "地点未明确"}</strong><span>{[parsed.job_preferences.target_roles.join("、"), parsed.job_preferences.job_change_reason, parsed.job_preferences.availability].filter(Boolean).join(" · ")}</span></div></ParsedSection>
        <ParsedSection title="关键业绩" empty="简历未提供可提取的关键业绩">{parsed.achievements.map((item, index) => <div className="parsed-row" key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.description}{item.metric ? ` · ${item.metric}` : ""}</span></div>)}</ParsedSection>
        <div className="uncertain-block"><h4><Icon name="question" />待确认信息</h4>{parsed.unknown_or_uncertain.length ? <ul>{parsed.unknown_or_uncertain.map((item, index) => <li key={`${item.field}-${index}`}><strong>{item.field}</strong><span>{item.reason}</span></li>)}</ul> : <p>没有记录到待确认信息。</p>}</div>
      </section>}
      <section className="card"><div className="section-title"><h3>匹配项目</h3><Link href="/projects">查看全部</Link></div>{matches.length ? matches.map((match) => <Link className="match-row" href={`/projects/${match.project_id}`} key={match.id}><div className={`score-ring score-${match.match_level}`}>{match.total_score}<small>分</small></div><div className="match-copy"><div><strong>{match.project?.job_title}</strong><StatusPill status={match.match_level || ""} /></div><span>{match.project?.client_name} · {match.project?.location}</span><p>{match.recommendation}</p></div><Icon name="chevron" /></Link>) : <div className="empty-small">尚未匹配项目</div>}</section>
    </div><aside className="detail-side">
      <section className="card"><div className="section-title"><h3>Pipeline 状态</h3></div>{pipeline.length ? <><div className="current-stage"><span>当前阶段</span><strong><StatusPill status={pipeline[0].stage} /></strong></div><div className="next-action"><small>下一步行动</small><p>{pipeline[0].next_action || "暂未安排"}</p>{pipeline[0].next_followup_date && <span><Icon name="clock" />{new Date(pipeline[0].next_followup_date).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}</div><div className="event-list">{pipeline.map((event) => <div key={event.id}><i /><span><strong>{event.stage}</strong><small>{new Date(event.event_date).toLocaleDateString("zh-CN")}</small><p>{event.note}</p></span></div>)}</div></> : <div className="empty-small">暂无流程记录</div>}</section>
      {matches[0] && <section className="card match-insight"><div className="section-title"><h3>匹配洞察</h3><span className="ai-label"><Icon name="spark" /> AI</span></div><Insight title="优势" icon="check" items={matches[0].strengths} tone="good" /><Insight title="待确认" icon="alert" items={matches[0].gaps} tone="warn" /><Insight title="电话沟通问题" icon="question" items={matches[0].questions_to_verify} tone="question" /></section>}
    </aside></div>
  </div></AppShell>;
}

function Info({ icon, label, value }: { icon: string; label: string; value?: string | number | null }) { return <div className="info-item"><Icon name={icon} /><span><small>{label}</small><strong>{value || "—"}</strong></span></div>; }
function Insight({ title, icon, items, tone }: { title: string; icon: string; items: string[]; tone: string }) { return <div className={`insight ${tone}`}><h4><Icon name={icon} />{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function ParsedSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) { const hasChildren = Array.isArray(children) ? children.length > 0 : true; return <div className="parsed-section"><h4>{title}</h4>{hasChildren ? children : <p>{empty}</p>}</div>; }
