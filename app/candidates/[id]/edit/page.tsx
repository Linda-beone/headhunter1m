import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "../../../../components/AppShell";
import { CandidateForm } from "../../../../components/RecordForms";
import { getCandidateBundle, isDemoMode } from "../../../../lib/data";
export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const bundle = await getCandidateBundle(id); if (!bundle) notFound(); return <AppShell active="/candidates"><div className="content narrow"><div className="breadcrumbs"><Link href={`/candidates/${id}`}>{bundle.candidate.name}</Link><span>›</span><span>编辑</span></div><PageHeader title="编辑候选人" description="人工修改会被标记为 manual，后续 AI 解析不会自动覆盖" /><CandidateForm candidate={bundle.candidate} tags={bundle.tags.map(tag => tag.tag)} demo={isDemoMode} /></div></AppShell>; }
