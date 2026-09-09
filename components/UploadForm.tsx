"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

export function UploadForm({ demo }: { demo: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit() {
    if (!file || !name) return setMessage("请选择简历并填写候选人姓名。");
    if (demo) return setMessage("当前为演示模式。配置 Supabase 后即可保存原文件并创建候选人。");
    setBusy(true); setMessage("");
    const form = new FormData(); form.append("file", file); form.append("name", name);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json() as { id?: string; error?: string }; setBusy(false);
    if (!response.ok) return setMessage(data.error || "上传失败，请重试。");
    router.push(`/candidates/${data.id}`);
  }
  return <div className="upload-panel">
    <div role="button" tabIndex={0} aria-label="选择或拖放简历文件" className={`dropzone ${file ? "has-file" : ""}`} onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") input.current?.click(); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0] || null); }}>
      <input ref={input} hidden type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div className="upload-icon"><Icon name={file ? "check" : "upload"} size={28} /></div>
      <h2>{file ? file.name : "拖放简历到这里"}</h2><p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "或点击选择 PDF、DOC、DOCX 文件，单个文件不超过 10MB"}</p>
    </div>
    <label className="field"><span>候选人姓名 *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入候选人姓名" /></label>
    <div className="info-callout"><Icon name="spark" /><div><strong>第一阶段上传说明</strong><p>当前仅保存原始简历并创建候选人档案；OpenAI 自动解析与项目匹配将在下一阶段接入。</p></div></div>
    {message && <p className="form-message">{message}</p>}
    <button className="primary wide" onClick={submit} disabled={busy}>{busy ? "正在保存…" : "保存简历并创建候选人"}</button>
  </div>;
}
