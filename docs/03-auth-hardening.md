# 03-auth-hardening

## 本次任务做了什么

根据 AI 审查建议，补强了鉴权相关的安全配置与前端会话恢复流程，覆盖生产环境配置校验、登录注册限流、Access Token 持久化，以及 Docker 环境变量使用方式的收敛。

## 涉及文件清单

- `server/internal/config/config.go`
- `server/internal/config/config_test.go`
- `server/internal/const/auth.go`
- `server/internal/handler/response.go`
- `server/internal/handler/router.go`
- `server/internal/middleware/rate_limit_middleware.go`
- `server/cmd/api/main.go`
- `web/src/stores/authStore.ts`
- `web/src/hooks/useAuthBootstrap.ts`
- `docker-compose.yml`
- `.env`
- `.env.example`
- `.gitignore`
- `docs/api.md`

## 核心设计决策和原因

1. 为生产环境增加显式配置校验
   - `DATABASE_URL`、`REDIS_ADDR`、`JWT_SECRET`、`FRONTEND_ORIGIN` 在生产环境必须显式提供。
   - `COOKIE_SECURE` 在生产环境必须为 `true`，避免 Refresh Token Cookie 通过不安全链路传输。
   - 开发环境保留可运行兜底，并在缺失 `JWT_SECRET` 时自动生成临时密钥。

2. 为登录与注册接口增加 Redis 限流
   - `/api/v1/auth/register` 与 `/api/v1/auth/login` 使用固定窗口限流。
   - 默认策略为同一客户端 IP 在 1 分钟内最多请求 10 次，超限返回 429。
   - 限流键按 `markmind:auth_rate_limit:<action>:<client_ip>` 组织，便于区分登录与注册场景。

3. 将 Access Token 持久化到 `sessionStorage`
   - 启动时优先使用现有 Access Token 调用 `/auth/me` 恢复用户信息。
   - 如果 Access Token 已失效，则自动调用 `/auth/refresh` 获取新会话。
   - 刷新失败时统一清空 Zustand 状态与 `sessionStorage` 中的 Access Token。

4. 调整 Docker 本地环境变量加载方式
   - 停止让 Compose 直接消费 `.env.example`，避免示例配置被误当作正式配置。
   - 在根目录提供 `.env` 作为本地开发默认配置，`.env.example` 仅保留模板职责。
   - Docker Compose 通过 `${VAR}` 方式显式注入环境变量，配置来源更加清晰。

## 前端数据流说明

- `authStore` 负责维护当前用户、Access Token、是否完成启动恢复等全局鉴权状态。
- `useAuthBootstrap` 在应用启动时决定是直接调用 `/auth/me`，还是回退到 `/auth/refresh`。
- `api/client.ts` 负责在请求头中附带 Access Token，并在 401 时自动发起刷新请求。

## 后端流程说明

- 配置加载阶段会校验生产环境关键参数是否合法。
- 登录成功后返回新的 Access Token，并通过 httpOnly Cookie 下发 Refresh Token。
- 刷新接口会校验 Redis 中保存的 Refresh Token，再生成新的 Access Token 与 Refresh Token。
- 登录与注册接口的限流依赖 `ctx.ClientIP()`，并结合受信任代理配置避免被伪造转发头绕过。

## 已知 TODO / 待改进项

- 线上部署时应根据真实反向代理网络进一步收紧 `TRUSTED_PROXIES`。
- 当前仅实现了鉴权基础闭环，文档、文件夹与编辑器等业务模块仍待后续迭代。
- 如果后续需要更强的会话安全性，可以继续评估 Access Token 失效通知或主动吊销策略。
