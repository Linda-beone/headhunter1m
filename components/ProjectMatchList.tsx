"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Candidate, Match } from "../lib/types";
import { Icon } from "./Icons";

type ProjectMatch = Match & { candidate?: Candidate };
const recommendationLabel: Record<string, string> = { strong_recommend: "强烈建议推荐", recommend_after_call: "电话确认后推荐", hold: "暂缓", not_recommend: "不建议推荐" };

export function ProjectMatchList({ matches }: { matches: ProjectMatch[] }) {
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("score");
  const visible = useMemo(() => matches.filter(match => level === "all" || match.match_level === level).sort((a, b) => {
    if (sort === "level") return (a.match_level || "Z").localeCompare(b.match_level || "Z") || Number(b.total_score || 0) - Number(a.total_score || 0);
    if (sort === "updated") return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    return Number(b.total_score || 0) - Number(a.total_score || 0);
  }), [matches, level, sort]);

  return <><div className="match-toolbar"><div className="level-filters">{["all", "A", "B", "C", "D"].map(item => <button className={level === item ? "active" : ""} key={item} onClick={() => setLevel(item)}>{item === "all" ? "全部" : item}</button>)}</div><label>排序 <select value={sort} onChange={event => setSort(event.target.value)}><option value="score">Score</option><option value="level">等级</option><option value="updated">更新时间</option></select></label></div>
    {visible.length ? <div className="rank-list">{visible.map((match, index) => <Link href={`/candidates/${match.candidate_id}`} className="rank-row enhanced" key={match.id}><span className="rank">{index + 1}</span><span className="avatar color">{match.candidate?.name?.slice(-2)}</span><div className="rank-person"><strong>{match.candidate?.name}</strong><span>{match.candidate?.current_title || "职位未知"} · {match.candidate?.current_company || "公司未知"}</span><small>{match.candidate?.current_city || "地点未知"} · Pipeline：{match.current_pipeline || "未开始"}</small></div><div className="match-recommendation"><strong>{recommendationLabel[match.recommendation || ""] || "待判断"}</strong><small>{match.recommendation_reason || "暂无推荐理由"}</small></div><div className={`score-ring score-${match.match_level}`}>{match.total_score}<small>{match.match_level || "—"}</small></div><Icon name="chevron" /></Link>)}</div> : <div className="empty"><Icon name="candidates" size={28} /><strong>没有符合当前筛选的候选人</strong><span>请在候选人档案中选择本职位运行单对单匹配。</span></div>}</>;
}
