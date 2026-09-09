# Headhunter Copilot

猎头人才管理工具 MVP（第一阶段）：Supabase 数据库、候选人/项目 CRUD、私有简历上传、候选人 Profile、匹配展示、Pipeline 展示和 Excel 兼容 CSV 导出。

未配置环境变量时自动使用演示数据，适合先验收 UI。

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## 连接 Supabase

1. 在 Supabase 创建项目。
2. 在 SQL Editor 执行 `supabase/migrations/202609090001_initial_schema.sql`。
3. 复制 `.env.example` 为 `.env.local`，填写 Project URL 与 `service_role` key。
4. 重启开发服务。Service role 仅在服务端使用，严禁公开或提交到 Git。

## Schema 摘要

- `candidates`：候选人主档。`resume_sha256` 防相同文件重复上传，`dedupe_key` 支持人员身份去重。
- `candidate_experiences` / `candidate_tags`：工作经历和带置信度标签。
- `search_projects`：职位画像；数组存储 Must-have、Nice-to-have、目标公司。
- `candidate_project_matches`：候选人与项目的多对多关联；洞察字段使用 JSONB。
- `pipeline_events`：候选人在具体项目中的状态时间线和下次跟进。
- 六张表均为 UUID 主键并自动维护时间戳；手机号、标准化手机号和小写邮箱均有索引。
- `resumes` 是私有 Storage bucket，限制 PDF / DOC / DOCX 与 10MB。
- RLS 已开启且不提供公共策略；当前 MVP 的写操作全部通过服务端 API。

## 第一阶段验收

1. 不配置环境变量启动，验收五个核心页面、搜索、详情跳转与响应式布局。
2. 执行 migration，确认六张表和私有 `resumes` bucket。
3. 配置 `.env.local` 后新建/编辑/删除项目与候选人，确认数据和 `updated_at` 正确变化。
4. 上传一份 PDF/Word，确认 Storage 原文件和候选人记录；重复上传同一文件应被拦截。
5. 导出候选人 CSV，用 Excel 打开并确认中文不乱码。
6. 手工插入 match 和 pipeline event，确认 Profile 展示评分、Strengths、Gaps、电话问题和 Pipeline。
7. 执行 `npm run build`，构建应成功。

本阶段暂不接 OpenAI、自动匹配、微信或账号权限。页面内“运行匹配/记录沟通”保留为下一阶段入口。

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
