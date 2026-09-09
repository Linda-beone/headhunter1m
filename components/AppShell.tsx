import Link from "next/link";
import { Icon } from "./Icons";

export function AppShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const nav = [
    { href: "/candidates", label: "候选人", icon: "candidates" },
    { href: "/projects", label: "Search Projects", icon: "projects" },
    { href: "/upload", label: "上传简历", icon: "upload" },
  ];
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/candidates"><span className="brand-mark">H</span><span><b>Headhunter</b><small>Copilot</small></span></Link>
      <nav>{nav.map((item) => <Link key={item.href} className={active === item.href ? "active" : ""} href={item.href}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-foot"><div className="avatar">LT</div><div><strong>Linda Tian</strong><small>Administrator</small></div><Icon name="more" /></div>
    </aside>
    <main className="main">{children}</main>
  </div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="header-actions">{actions}</div>}</header>;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { active: "积极看机会", open: "开放机会", passive: "被动看机会", not_looking: "暂不考虑", unknown: "状态未知", draft: "草稿", paused: "已暂停", closed: "已关闭", screening: "电话沟通", sourced: "已入库", strong: "强匹配", good: "较匹配" };
  return <span className={`status status-${status}`}>{map[status] ?? status}</span>;
}
