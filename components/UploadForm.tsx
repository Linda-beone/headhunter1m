"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

type Conflict = { field: string; oldValue: unknown; newValue: unknown };
type Duplicate = { level: number; reason: string; automaticBlock: boolean; candidate: { id: string; name: string; current_company?: string | null; current_title?: string | null }; conflicts: Conflict[] };
type ParseResult = { status?: string; importId?: string; candidateId?: string; duplicates?: Duplicate[]; error?: string };
const steps = ["上传中", "AI 解析中", "数据校验中", "入库中", "完成"];

export function UploadForm({ demo }: { demo: boolean }) {
  const input = useRef<HTMLInputElement>(null); const router = useRouter();
  const [file, setFile] = useState<File | null>(null); const [step, setStep] = useState(-1);
  const [message, setMessage] = useState(""); const [importId, setImportId] = useState<string>();
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]); const [selected, setSelected] = useState<Duplicate>();
  const [choices, setChoices] = useState<Record<string, "new" | "old">>({});

  async function parse(id: string) {
    setStep(1);
    const progress = window.setTimeout(() => setStep(2), 1800);
    const response = await fetch(`/api/resume-imports/${id}/parse`, { method: "POST" });
    window.clearTimeout(progress);
    const data = await response.json() as ParseResult;
    if (response.status === 409 && data.duplicates) { setStep(2); setDuplicates(data.duplicates); return; }
    if (!response.ok) { setStep(-1); setMessage(data.error || "解析失败，请重试。"); return; }
    setStep(3); setTimeout(() => { setStep(4); router.push(`/candidates/${data.candidateId}`); }, 450);
  }

  async function submit() {
    if (!file) return setMessage("请选择 PDF 或 DOCX 简历。");
    if (demo) return setMessage("请先配置 Supabase 和 OPENAI_API_KEY 后再解析简历。");
    if (file.size > 15 * 1024 * 1024) return setMessage("文件超过 15MB，请压缩后重试。");
    setMessage(""); setDuplicates([]); setSelected(undefined); setStep(0);
    const form = new FormData(); form.append("file", file);
    const response = await fetch("/api/resume-imports", { method: "POST", body: form });
    const data = await response.json() as ParseResult;
    if (!response.ok || !data.importId) { setStep(-1); setMessage(data.error || "上传失败，请重试。"); return; }
    setImportId(data.importId); await parse(data.importId);
  }

  async function resolve(action: "create" | "update") {
    if (!importId) return;
    if (action === "update" && !selected) { setMessage("请选择要更新的已有候选人。"); return; }
    setStep(3); setMessage("");
    const response = await fetch(`/api/resume-imports/${importId}/resolve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, candidateId: selected?.candidate.id, choices }) });
    const data = await response.json() as ParseResult;
    if (!response.ok) { setStep(2); setMessage(data.error || "入库失败，请重试。"); return; }
    setStep(4); router.push(`/candidates/${data.candidateId}`);
  }

  return <div className="upload-panel">
    {step >= 0 && <div className="import-progress">{steps.map((label, index) => <div className={index < step ? "done" : index === step ? "active" : ""} key={label}><b>{index < step ? "✓" : index + 1}</b><span>{label}</span></div>)}</div>}
    {!duplicates.length && <><div role="button" tabIndex={0} aria-label="选择或拖放简历文件" className={`dropzone ${file ? "has-file" : ""}`} onClick={() => step < 0 && input.current?.click()} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && step < 0) input.current?.click(); }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (step < 0) setFile(e.dataTransfer.files[0] || null); }}>
      <input ref={input} hidden type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div className="upload-icon"><Icon name={file ? "check" : "upload"} size={28} /></div><h2>{file ? file.name : "拖放简历到这里"}</h2><p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "支持 PDF、DOCX，单个文件不超过 15MB"}</p>
    </div><div className="info-callout"><Icon name="spark" /><div><strong>Resume Parser v0.1</strong><p>AI 只提取简历明确支持的信息，不推断、不匹配职位；缺失或不确定内容会进入“待确认信息”。</p></div></div></>}

    {!!duplicates.length && <div className="duplicate-panel"><div className="duplicate-title"><Icon name="alert" size={24} /><div><h2>发现可能已有候选人</h2><p>系统不会自动覆盖任何旧数据，请选择处理方式。</p></div></div>
      <div className="duplicate-list">{duplicates.map(item => <button className={selected?.candidate.id === item.candidate.id ? "selected" : ""} key={item.candidate.id} onClick={() => { setSelected(item); setChoices(Object.fromEntries(item.conflicts.map(c => [c.field, "old"]))); }}><span className="avatar color">{item.candidate.name.slice(-2)}</span><span><strong>{item.candidate.name}</strong><small>{item.candidate.current_title || "—"} · {item.candidate.current_company || "—"}</small></span><em>Level {item.level} · {item.reason}</em></button>)}</div>
      {selected && <div className="conflict-box"><h3>发现信息变化</h3>{selected.conflicts.length ? selected.conflicts.map(conflict => <div className="conflict-row" key={conflict.field}><strong>{fieldLabel(conflict.field)}</strong><span>旧：{String(conflict.oldValue)}</span><span>新：{String(conflict.newValue)}</span><label><input type="radio" checked={choices[conflict.field] === "old"} onChange={() => setChoices(v => ({ ...v, [conflict.field]: "old" }))} /> 保留旧值</label><label><input type="radio" checked={choices[conflict.field] === "new"} onChange={() => setChoices(v => ({ ...v, [conflict.field]: "new" }))} /> 采用新值</label></div>) : <p>没有字段冲突；新简历只会自动补充原来为空的字段。</p>}</div>}
      <div className="duplicate-actions"><button className="secondary" onClick={() => resolve("create")}>仍然创建新候选人</button><button className="primary" disabled={!selected} onClick={() => resolve("update")}>更新已有候选人</button></div>
    </div>}
    {message && <p className="form-message">{message}</p>}
    {!duplicates.length && <button className="primary wide" onClick={step === -1 && importId ? () => parse(importId) : submit} disabled={step >= 0 && step < 4}>{step === -1 && importId ? "重新解析" : step >= 0 && step < 4 ? steps[step] : "上传并解析简历"}</button>}
  </div>;
}

const fieldLabel = (field: string) => ({ current_company: "当前公司", current_title: "当前职位", current_city: "当前城市", current_salary: "当前薪资", expected_salary: "期望薪资", phone: "手机", email: "邮箱", wechat: "微信", age: "年龄", name: "姓名" }[field] || field);
