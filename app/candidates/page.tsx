import Link from "next/link";
import { AppShell, PageHeader } from "../../components/AppShell";
import { CandidateList } from "../../components/CandidateList";
import { Icon } from "../../components/Icons";
import { getCandidates, isDemoMode } from "../../lib/data";

export const metadata = { title: "候选人" };

export default async function CandidatesPage() {
  const candidates = await getCandidates();
  return <AppShell active="/candidates"><div className="content">
    {isDemoMode && <div className="demo-banner"><span>演示数据</span>连接 Supabase 后，这里将显示你的真实人才库。</div>}
    <PageHeader title="候选人" description="集中管理候选人档案、经历与项目进展" actions={<><a className="secondary" href="/api/export/candidates">导出 Excel CSV</a><Link className="primary" href="/upload"><Icon name="plus" />添加候选人</Link></>} />
    <section className="metric-grid">
      <div className="metric"><span>人才库总数</span><strong>{candidates.length}</strong><small className="positive">本周新增 3</small></div>
      <div className="metric"><span>开放看机会</span><strong>{candidates.filter(c => ["active", "open"].includes(c.job_status)).length}</strong><small>可优先触达</small></div>
      <div className="metric"><span>本周待跟进</span><strong>6</strong><small className="warning">2 项即将逾期</small></div>
      <div className="metric"><span>强匹配候选人</span><strong>12</strong><small className="positive">覆盖 5 个项目</small></div>
    </section>
    <CandidateList candidates={candidates} />
  </div></AppShell>;
}
