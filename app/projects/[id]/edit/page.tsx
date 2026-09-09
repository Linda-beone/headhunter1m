import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "../../../../components/AppShell";
import { ProjectForm } from "../../../../components/RecordForms";
import { getProject, isDemoMode } from "../../../../lib/data";
export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const project = await getProject(id); if (!project) notFound(); return <AppShell active="/projects"><div className="content narrow"><PageHeader title="编辑项目" description={`${project.client_name} · ${project.job_title}`} /><ProjectForm project={project} demo={isDemoMode} /></div></AppShell>; }
