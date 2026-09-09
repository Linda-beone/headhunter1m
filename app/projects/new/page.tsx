import { AppShell, PageHeader } from "../../../components/AppShell";
import { ProjectForm } from "../../../components/RecordForms";
import { isDemoMode } from "../../../lib/data";
export default function NewProjectPage() { return <AppShell active="/projects"><div className="content narrow"><PageHeader title="新建 Search Project" description="定义客户职位、薪酬范围与目标人才画像" /><ProjectForm demo={isDemoMode} /></div></AppShell>; }
