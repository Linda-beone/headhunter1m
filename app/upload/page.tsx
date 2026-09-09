import { AppShell, PageHeader } from "../../components/AppShell";
import { UploadForm } from "../../components/UploadForm";
import { isDemoMode } from "../../lib/data";

export const metadata = { title: "上传简历" };
export default function UploadPage() { return <AppShell active="/upload"><div className="content narrow"><PageHeader eyebrow="Resume Parser v0.1" title="上传并解析候选人简历" description="原始文件私有保存，AI 忠实提取，确认后写入人才库" /><UploadForm demo={isDemoMode || !process.env.OPENAI_API_KEY} /></div></AppShell>; }
