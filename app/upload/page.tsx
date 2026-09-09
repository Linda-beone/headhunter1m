import { AppShell, PageHeader } from "../../components/AppShell";
import { UploadForm } from "../../components/UploadForm";
import { isDemoMode } from "../../lib/data";

export const metadata = { title: "上传简历" };
export default function UploadPage() { return <AppShell active="/upload"><div className="content narrow"><PageHeader eyebrow="Resume Parser v0.2" title="上传并解析候选人简历" description="Kimi 优先解析，OpenAI 自动备选；确认后写入人才库" /><UploadForm demo={isDemoMode || (!process.env.MOONSHOT_API_KEY && !process.env.OPENAI_API_KEY)} /></div></AppShell>; }
