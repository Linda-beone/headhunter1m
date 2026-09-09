import Link from "next/link";
import { AppShell, PageHeader, StatusPill } from "../../components/AppShell";
import { Icon } from "../../components/Icons";
import { getProjects } from "../../lib/data";

export const metadata = { title: "Search Projects" };
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <AppShell active="/projects"><div className="content"><PageHeader title="Search Projects" description="管理客户职位、人才画像和候选人匹配" actions={<Link className="primary" href="/projects/new"><Icon name="plus" />新建项目</Link>} />
    <div className="project-filters"><button className="tab active">全部 <b>{projects.length}</b></button><button className="tab">进行中 <b>{projects.filter(p => p.status === "active").length}</b></button><button className="tab">草稿</button><button className="tab">已关闭</button></div>
    <div className="project-grid">{projects.map((project, index) => <Link href={`/projects/${project.id}`} className="project-card" key={project.id}>
      <div className="project-card-top"><div className={`client-logo logo-${index}`}>{project.client_name.slice(0, 1)}</div><div><span>{project.client_name}</span><h2>{project.job_title}</h2></div><StatusPill status={project.status} /></div>
      <div className="project-meta"><span><Icon name="location" />{project.location || "地点不限"}</span><span><Icon name="salary" />{formatRange(project.salary_range)}</span><span><Icon name="briefcase" />{project.experience_min}–{project.experience_max} 年</span></div>
      <div className="requirements"><small>核心要求</small><div>{project.must_have.map((item) => <span key={item}>{item}</span>)}</div></div>
      <div className="project-card-foot"><span><b>{[8, 5, 3][index] || 0}</b> 位匹配候选人</span><span>最高匹配 <b className="green">{[88, 84, 91][index] || "—"}</b></span><Icon name="chevron" /></div>
    </Link>)}</div>
  </div></AppShell>;
}

function formatRange(range?: string | null) { if (!range) return "薪资面议"; const nums = range.match(/\d+/g); return nums ? `${Number(nums[0]) / 10000}–${Number(nums[1]) / 10000} 万` : range; }
