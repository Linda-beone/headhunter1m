# Headhunter Copilot

猎头人才管理工具 MVP。第二阶段已完成 Resume Parser v0.1：上传 PDF/DOCX 原始简历、OpenAI 严格结构化解析、候选人查重与人工冲突确认、原子写入 Supabase，以及 Candidate Profile 的原始简历和解析结果展示。本阶段不包含 Job Matcher。

未配置环境变量时，页面使用演示数据；简历解析按钮会提示先完成配置。

## 环境要求

- Node.js `>=22.13.0`
- Supabase 项目
- OpenAI API key

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_RESUME_MODEL=gpt-5-mini
```

`SUPABASE_SERVICE_ROLE_KEY` 和 `OPENAI_API_KEY` 只在服务端读取，禁止改成 `NEXT_PUBLIC_*`，也不要提交 `.env.local`。

## Supabase Migration

如果第一阶段数据库已经创建，只需在 Supabase SQL Editor 执行：

```text
supabase/migrations/202609090002_resume_parser_v01.sql
```

全新数据库请依次执行：

1. `supabase/migrations/202609090001_initial_schema.sql`
2. `supabase/migrations/202609090002_resume_parser_v01.sql`

第二个 migration 会：

- 创建 `resume_imports`，保存上传、解析、查重、完成或失败状态；
- 扩展候选人字段、工作经历字段，以及标签的 `evidence` / `source`；
- 建立原子入库函数 `commit_resume_import`；
- 将 `resumes` bucket 保持为 private，并限制 PDF/DOCX 与 15MB；
- 用 `manual_fields` 和 `field_sources` 保护人工修改，后续 AI 解析不会覆盖人工字段。

## 关键代码位置

- OpenAI Responses API：`lib/ai/resume-parser.ts`
- Structured Output Schema：`lib/ai/schemas/resume.ts`
- Parser Prompt：`lib/ai/prompts/resume-parser.ts`
- 上传与进度 UI：`components/UploadForm.tsx`
- 上传 API：`app/api/resume-imports/route.ts`
- 解析 API：`app/api/resume-imports/[id]/parse/route.ts`
- 重复处理 API：`app/api/resume-imports/[id]/resolve/route.ts`
- 查重与冲突逻辑：`lib/resume/dedupe.ts`
- 导入编排与原子提交：`lib/resume/import-service.ts`
- Candidate Profile：`app/candidates/[id]/page.tsx`

## 验证命令

```bash
npm run test:unit
npx tsc --noEmit
npm run lint
npm run build
```

单元测试覆盖中文简历结构、中英文术语、空字段、缺少联系方式/年龄、多段经历、手机号/邮箱重复、姓名加公司疑似重复，以及 OpenAI API 失败。

## 用真实简历验收

1. 打开 `/upload`，选择一份不超过 15MB 的 PDF 或 DOCX。
2. 确认页面依次显示“上传中 → AI 解析中 → 数据校验中 → 入库中 → 完成”。
3. 在 Supabase Storage 的 private `resumes` bucket 中确认原文件存在。
4. 在 `resume_imports` 中确认状态为 `completed`，并有 OpenAI file/response ID 和 `raw_parsed_json`。
5. 确认完成后跳转 `/candidates/[id]`，且基本信息、经历、标签 evidence、教育、证书、语言、求职偏好、业绩、待确认信息与原简历一致。
6. 点击“原始简历”，确认通过短时 signed URL 打开，而不是公共链接。
7. 再上传联系方式相同的简历，确认出现重复提示；分别验证“更新已有候选人”和冲突字段的“采用新值/保留旧值”。
8. 手工编辑候选人后再次合并简历，确认人工字段不被 AI 覆盖。
9. 上传空文件、损坏文件或超大文件，确认出现可理解的错误和“重新解析”，同时没有产生半完成 candidate。

## 当前限制

- 每次处理一个文件，解析请求同步等待，最长约 120 秒；尚未使用后台队列。
- 查重目前读取最多 5000 位候选人，适合 MVP 数据量。
- Level 4 的公司名标准化只做保守文本归一化，始终要求人工判断。
- 同一原文件 SHA-256 仍只允许形成一个已完成候选人，避免完全相同简历重复入库。
- OpenAI 输出仍需猎头人工复核，特别是扫描质量较差或版式复杂的简历。
- 未实现 Job Matcher、职位推荐、候选人评分或批量上传。

## 第二阶段验收 Checklist

- [ ] PDF 和 DOCX 均可上传，15MB 限制有效
- [ ] 原文件进入 private `resumes` bucket
- [ ] OpenAI Responses API 使用 strict `json_schema`
- [ ] 缺失事实返回 `null` / 空数组，不做推断
- [ ] 日期精度如 `2021-02` 被原样保留
- [ ] `resume_imports` 状态和错误信息正确
- [ ] candidate、experiences、tags 在一次事务中写入
- [ ] 标签展示 confidence 和 evidence
- [ ] phone / email / wechat 精确查重有效
- [ ] name + current company 只提示 possible duplicate
- [ ] 更新已有候选人会补空值并要求确认冲突
- [ ] 人工字段不会被后续 AI 合并覆盖
- [ ] Candidate Profile 可查看短时签名的原始简历
- [ ] Candidate Profile 展示全部解析分区和待确认信息
- [ ] 失败不会留下半完成 candidate，且可重新解析
- [ ] 单元测试、类型检查、Lint、生产构建全部通过
- [ ] 页面没有新增 Job Matcher 行为
