"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Candidate } from "../lib/types";
import { Icon } from "./Icons";
import { StatusPill } from "./AppShell";

export function CandidateList({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => candidates.filter((c) => [c.name, c.current_company, c.current_title, c.current_city, c.email, c.phone].join(" ").toLowerCase().includes(query.toLowerCase())), [candidates, query]);
  return <>
    <div className="toolbar">
      <label className="search-box"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索姓名、公司、职位、电话或邮箱" /></label>
      <button className="filter-button">全部状态⌄</button><button className="filter-button">全部城市⌄</button>
      <span className="result-count">{visible.length} 位候选人</span>
    </div>
    <div className="table-wrap"><table><thead><tr><th>候选人</th><th>当前职位</th><th>工作年限</th><th>意向城市</th><th>求职状态</th><th>最近更新</th><th /></tr></thead>
      <tbody>{visible.map((candidate) => <tr key={candidate.id}>
        <td><Link className="person-cell" href={`/candidates/${candidate.id}`}><span className="avatar color">{candidate.name.slice(-2)}</span><span><strong>{candidate.name}</strong><small>{candidate.email}</small></span></Link></td>
        <td><strong>{candidate.current_title || "—"}</strong><small>{candidate.current_company || "—"}</small></td>
        <td>{candidate.years_experience ?? "—"} 年</td><td>{candidate.location_preference?.join(" / ") || "—"}</td>
        <td><StatusPill status={candidate.job_status} /></td><td>{new Date(candidate.updated_at).toLocaleDateString("zh-CN")}</td>
        <td><Link className="row-link" aria-label={`查看 ${candidate.name}`} href={`/candidates/${candidate.id}`}><Icon name="chevron" /></Link></td>
      </tr>)}</tbody></table>{visible.length === 0 && <div className="empty">没有找到符合条件的候选人</div>}</div>
  </>;
}
