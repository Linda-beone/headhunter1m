"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "../lib/types";
import { Icon } from "./Icons";

export function MatchRunner({ candidateId, projects, projectId, demo = false }: { candidateId: string; projects?: Project[]; projectId?: string; demo?: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState(projectId || projects?.[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    if (demo) return setMessage("演示模式不会调用 AI；连接 Supabase 与 Kimi 后即可匹配。");
    if (!selected) return setMessage("请先选择一个 Search Project。");
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/match", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, project_id: selected }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) return setMessage(result.error || "职位匹配失败，请重试。");
      setMessage("匹配已更新。"); router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试。");
    } finally { setLoading(false); }
  }

  if (projectId) return <span className="match-runner compact"><button className="secondary" onClick={run} disabled={loading}><Icon name="spark" />{loading ? "匹配中…" : "重新匹配"}</button>{message && <small>{message}</small>}</span>;
  return <div className="match-runner"><select aria-label="选择 Search Project" value={selected} onChange={event => setSelected(event.target.value)}><option value="">选择职位</option>{projects?.map(project => <option key={project.id} value={project.id}>{project.client_name} · {project.job_title}</option>)}</select><button className="primary" onClick={run} disabled={loading || !selected}><Icon name="spark" />{loading ? "匹配中…" : "运行单对单匹配"}</button>{message && <small>{message}</small>}</div>;
}
