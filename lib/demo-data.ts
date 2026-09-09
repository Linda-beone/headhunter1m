import type { Candidate, Experience, Match, PipelineEvent, Project } from "./types";

export const candidates: Candidate[] = [
  { id: "c1", name: "林晓雯", age: 32, gender: "女", phone: "138 0210 8891", email: "xiaowen.lin@example.com", wechat: "xiaowen_pm", current_city: "上海", current_company: "字节跳动", current_title: "高级产品经理", years_experience: 8, education: [{ school: "复旦大学", degree: "硕士" }], major: "信息管理", job_status: "open", location_preference: ["上海", "杭州"], current_salary: 680000, expected_salary: 850000, summary: "8 年 B2B SaaS 与企业服务产品经验，擅长从 0 到 1 产品搭建和跨部门协作。", updated_at: "2026-09-09T08:30:00Z" },
  { id: "c2", name: "陈嘉树", age: 35, gender: "男", phone: "186 1102 6308", email: "jiashu.chen@example.com", current_city: "北京", current_company: "美团", current_title: "技术负责人", years_experience: 11, education: [{ school: "北京航空航天大学", degree: "本科" }], major: "计算机科学", job_status: "passive", location_preference: ["北京"], current_salary: 920000, expected_salary: 1100000, summary: "带领 20 人后端团队，负责高并发交易与推荐基础设施。", updated_at: "2026-09-08T05:20:00Z" },
  { id: "c3", name: "周敏", age: 29, gender: "女", phone: "139 5718 2601", email: "min.zhou@example.com", current_city: "杭州", current_company: "阿里云", current_title: "解决方案架构师", years_experience: 6, education: [{ school: "浙江大学", degree: "硕士" }], major: "软件工程", job_status: "active", location_preference: ["杭州", "上海"], current_salary: 560000, expected_salary: 700000, summary: "云计算与数据平台售前经验，熟悉制造和零售行业数字化转型。", updated_at: "2026-09-07T10:10:00Z" },
  { id: "c4", name: "王启明", age: 38, gender: "男", phone: "137 7550 4432", email: "qiming.wang@example.com", current_city: "深圳", current_company: "腾讯", current_title: "商业化总监", years_experience: 14, education: [{ school: "中山大学", degree: "本科" }], major: "市场营销", job_status: "not_looking", location_preference: ["深圳", "广州"], current_salary: 1200000, expected_salary: 1500000, summary: "互联网商业化与大客户销售管理经验，连续三年完成亿元级营收目标。", updated_at: "2026-09-05T04:00:00Z" },
];

export const experiences: Experience[] = [
  { id: "e1", candidate_id: "c1", company: "字节跳动", title: "高级产品经理", start_date: "2022-03-01", city: "上海", industry: "互联网", product: "飞书", description: "负责企业协同套件商业化产品，推动核心客户续约率提升 18%。" },
  { id: "e2", candidate_id: "c1", company: "用友网络", title: "产品经理", start_date: "2018-07-01", end_date: "2022-02-01", city: "上海", industry: "企业服务", product: "ERP 云", description: "从 0 到 1 搭建采购协同模块，服务 200+ 中型企业客户。" },
];

export const projects: Project[] = [
  { id: "p1", client_name: "澜海科技", job_title: "资深产品负责人", location: "上海", salary_range: "[700000,1000000]", experience_min: 7, experience_max: 12, must_have: ["B2B SaaS", "团队管理", "商业化"], nice_to_have: ["AI 产品", "海外经验"], target_companies: ["字节跳动", "腾讯", "阿里巴巴"], status: "active", updated_at: "2026-09-09T07:20:00Z" },
  { id: "p2", client_name: "星云智造", job_title: "技术总监", location: "北京", salary_range: "[900000,1400000]", experience_min: 10, experience_max: 16, must_have: ["分布式系统", "团队管理", "Java"], nice_to_have: ["推荐系统"], target_companies: ["美团", "京东", "百度"], status: "active", updated_at: "2026-09-08T03:00:00Z" },
  { id: "p3", client_name: "青屿零售", job_title: "数字化解决方案专家", location: "杭州", salary_range: "[550000,800000]", experience_min: 5, experience_max: 9, must_have: ["云计算", "零售行业", "售前"], nice_to_have: ["数据中台"], target_companies: ["阿里云", "华为云"], status: "paused", updated_at: "2026-09-06T09:00:00Z" },
];

export const matches: Match[] = [
  { id: "m1", candidate_id: "c1", project_id: "p1", total_score: 88, technical_score: 92, industry_score: 90, location_score: 100, salary_score: 85, experience_score: 90, intent_score: 72, match_level: "A", strengths: ["8 年 B2B SaaS 产品经验", "现就职目标公司", "上海本地，地点完全匹配"], gaps: ["AI 产品经验需要进一步确认", "期望薪资接近预算上限"], risks: ["期望薪资接近预算上限"], questions_to_verify: ["目前管理的团队规模和职能构成？", "是否主导过 AI 功能从立项到上线？", "可接受的最低薪资和到岗周期？"], recommendation: "recommend_after_call", recommendation_reason: "建议优先电话沟通，重点核实团队管理深度与 AI 产品经验。", confidence: "medium", status: "shortlisted" },
];

export const pipelineEvents: PipelineEvent[] = [
  { id: "pe1", candidate_id: "c1", project_id: "p1", stage: "screening", note: "已初步沟通，对企业服务赛道感兴趣。", event_date: "2026-09-09T02:30:00Z", next_action: "确认薪资底线并安排客户面试", next_followup_date: "2026-09-11T02:00:00Z" },
  { id: "pe2", candidate_id: "c1", project_id: "p1", stage: "sourced", note: "通过行业人脉推荐录入。", event_date: "2026-09-06T06:00:00Z" },
];

export const tags = [
  { id: "t1", candidate_id: "c1", tag: "B2B SaaS", tag_type: "skill", confidence: 0.96 },
  { id: "t2", candidate_id: "c1", tag: "产品战略", tag_type: "skill", confidence: 0.91 },
  { id: "t3", candidate_id: "c1", tag: "企业服务", tag_type: "industry", confidence: 0.94 },
  { id: "t4", candidate_id: "c1", tag: "商业化", tag_type: "function", confidence: 0.87 },
];
