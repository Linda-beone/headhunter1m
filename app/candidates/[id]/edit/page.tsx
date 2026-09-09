import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "../../../../components/AppShell";
import { CandidateForm } from "../../../../components/RecordForms";
import { getCandidate, isDemoMode } from "../../../../lib/data";
export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const candidate = await getCandidate(id); if (!candidate) notFound(); return <AppShell active="/candidates"><div className="content narrow"><div className="breadcrumbs"><Link href={`/candidates/${id}`}>{candidate.name}</Link><span>›</span><span>编辑</span></div><PageHeader title="编辑候选人" description="更新联系信息、职业状态与求职意向" /><CandidateForm candidate={candidate} demo={isDemoMode} /></div></AppShell>; }
