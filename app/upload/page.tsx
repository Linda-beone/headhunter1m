import { AppShell, PageHeader } from "../../components/AppShell";
import { UploadForm } from "../../components/UploadForm";
import { isDemoMode } from "../../lib/data";

export const metadata = { title: "上传简历" };
export default function UploadPage() { return <AppShell active="/upload"><div className="content narrow"><PageHeader eyebrow="人才入库" title="上传候选人简历" description="保留原始文件，创建可持续维护的人才档案" /><UploadForm demo={isDemoMode} /><div className="process-steps"><div><b>1</b><span><strong>上传原文件</strong><small>私有存储，支持 PDF / Word</small></span></div><i /><div><b>2</b><span><strong>创建档案</strong><small>第一阶段手动补充信息</small></span></div><i /><div className="muted"><b>3</b><span><strong>AI 解析与匹配</strong><small>下一阶段接入 OpenAI</small></span></div></div></div></AppShell>; }
