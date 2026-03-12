# MarkMind

MarkMind 是一个面向个人知识管理场景的云端 Markdown 知识库项目。用户登录后可以在 Dashboard 中管理文件夹与文档，在编辑页使用 CodeMirror 编写 Markdown，并在右侧实时获得包含目录、图片、公式、Mermaid、ECharts 等增强能力的预览结果。

这个项目按照“可上线使用 + 可写进简历 + 方便后续手写重构理解”的目标推进，前后端、数据库、Docker 部署、性能优化和 AI 辅助链路都已经具备较完整的工程闭环。

## 核心能力

- 双 Token 鉴权：Access Token + Refresh Token，支持自动刷新、登出清理与基础限流。
- Dashboard 知识库管理：文件夹与文档的创建、重命名、移动、删除与最近更新时间展示。
- 文档搜索：支持标题/正文搜索、跨目录全局搜索、命中来源标签、结果数量提示与最近更新/标题排序切换。
- 大列表性能优化：Dashboard 文档列表支持虚拟化渲染，避免大数据量下全量 DOM 带来的卡顿。
- Markdown 编辑体验：CodeMirror 编辑器 + unified 实时预览 + TOC 自动提取与导航。
- 富文本增强：支持图片粘贴上传、安全 HTML、代码高亮、KaTeX 数学公式、Mermaid 和 ECharts 特殊代码块。
- 局部 AI 助手：选中文段后可触发“魔法笔”与“中英翻译”，支持替换、插入、复制、取消。
- AI 工程化接入：设置页支持 OpenAI Compatible Provider 配置、连通性测试、模型列表拉取、流式输出、中断请求，以及 `chat/completions` / `responses` 自动兼容。

## `.env` 书写规则

项目根目录使用 `.env` 作为统一环境变量入口。推荐直接复制 `.env.example` 为 `.env`，再按部署环境修改：

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

关键规则如下：

| 分组 | 关键变量 | 书写规则 |
|------|----------|----------|
| 运行环境 | `APP_ENV` `GIN_MODE` | 本地开发可使用 `development` / `debug`；生产环境建议使用 `production` / `release`。 |
| 数据库 | `POSTGRES_DB` `POSTGRES_USER` `POSTGRES_PASSWORD` `DATABASE_URL` | `docker compose` 默认会按这些值启动 PostgreSQL；生产环境必须显式提供真实连接串。 |
| Redis | `REDIS_ADDR` `REDIS_PASSWORD` `REDIS_DB` | Docker 默认可直接使用 `redis:6379`；如果接外部 Redis，需要同步更新地址和密码。 |
| 鉴权 | `JWT_SECRET` `ACCESS_TOKEN_TTL` `REFRESH_TOKEN_TTL` | 本地可先使用示例值；生产环境必须替换为强随机密钥。 |
| Cookie | `FRONTEND_ORIGIN` `COOKIE_SECURE` `COOKIE_HTTP_ONLY` `COOKIE_SAME_SITE` | `FRONTEND_ORIGIN` 需要与前端实际访问地址一致；生产环境必须设置 `COOKIE_SECURE=true`。 |
| 上传 | `UPLOAD_ROOT_DIR` `UPLOAD_PUBLIC_BASE_PATH` | 默认上传目录映射到容器内 `/app/data/uploads`，公开访问前缀默认是 `/uploads`。 |
| AI Provider | `AI_PROVIDER_ENCRYPTION_SECRET` `AI_REQUEST_TIMEOUT` `AI_PROVIDER_DEBUG` | 只支持 OpenAI Compatible Provider；`base_url` 在设置页填写时不需要手动带 `/v1`，服务端会自动补全。 |
| 代理/安全 | `TRUSTED_PROXIES` | 生产环境应按实际反向代理或网段填写，避免直接沿用开发示例。 |

生产环境至少需要重点检查这几个值：

- `JWT_SECRET`：必须替换为高强度随机字符串。
- `AI_PROVIDER_ENCRYPTION_SECRET`：用于加密保存用户填写的 AI API Key，必须替换。
- `COOKIE_SECURE=true`：生产环境必须开启。
- `FRONTEND_ORIGIN`：必须与实际前端域名一致，否则跨域 Cookie 会异常。
- `DATABASE_URL`、`REDIS_ADDR`：生产环境不要依赖默认开发值。

## 通过 Docker 启动

1. 复制配置文件并按需修改：

   ```bash
   cp .env.example .env
   ```

2. 在项目根目录构建镜像：

   ```bash
   docker compose build
   ```

3. 启动所有服务：

   ```bash
   docker compose up -d
   ```

4. 打开以下地址确认服务状态：

   - 前端：`http://localhost:58000`
   - 后端 API：`http://localhost:58001`
   - 健康检查：`http://localhost:58001/healthz`
   - PostgreSQL：`localhost:58002`
   - Redis：`localhost:58003`

补充说明：

- 前端容器基于 Nginx 托管静态资源，并会把 `/api`、`/uploads` 反向代理到后端服务。
- 后端容器启动时会自动执行数据库迁移，无需手动跑 migration。
- 图片上传目录默认挂载到宿主机 `./data/uploads`，便于持久化保存。

## 技术栈

### 前端

- React 18 + Vite + TypeScript
- React Router、Zustand
- shadcn/ui 风格组件基座 + Radix UI + Tailwind CSS
- CodeMirror 6 Markdown 编辑器
- unified / remark / rehype 渲染管线
- Mermaid、ECharts、KaTeX、代码高亮

### 后端

- Go 1.23 + Gin
- pgx v5 直连 PostgreSQL
- go-redis/v9
- RESTful JSON API
- OpenAI Compatible AI Provider 代理与兼容层

### 基础设施与工程化

- Docker + Docker Compose
- Nginx 反向代理静态资源、API 与上传文件
- PostgreSQL 16、Redis 7
- 数据库迁移、上传目录持久化、前后端分层架构

## 工程亮点

- 通过路由级懒加载、编辑器预览链异步化和特殊代码块按需加载，将主入口 JS 从约 1.80 MB 压到约 17.65 kB，显著降低了非编辑场景首屏成本。
- 为 Dashboard 文档列表实现手写虚拟滚动窗口，在数百到上千条文档下仍能保持稳定滚动与交互体验。
- 为搜索链路补齐 300 ms 防抖、`AbortController` 竞态取消与 PostgreSQL `pg_trgm` 索引，兼顾搜索体验与数据规模增长后的查询性能。
- 在编辑器中实现基于选区的局部 AI 助手，覆盖魔法笔、翻译、流式输出、中断请求与结果回填闭环。
- 为 OpenAI Compatible Provider 增加模型列表拉取与 `chat/completions` / `responses` 双协议自动兼容，降低不同供应商的接入摩擦。

## 简历式总结

- 独立完成一个基于 React + Go + PostgreSQL + Redis + Docker Compose 的云端 Markdown 知识库项目，覆盖鉴权、知识库管理、实时预览、图片上传、特殊代码块渲染与 AI 助手等完整业务链路。
- 围绕编辑器和 Dashboard 持续做性能优化，通过首屏拆包、按需加载、虚拟列表、搜索防抖与数据库索引加速，显著提升了大体量内容场景下的加载与交互表现。
- 设计并实现 OpenAI Compatible AI 接入方案，支持用户级 Provider 配置、模型列表拉取、协议自动兼容、流式生成和中断控制，形成了可扩展的 AI 编辑增强能力。
