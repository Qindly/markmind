# 01-auth

## 本次任务做了什么

本次完成了 MarkMind 的鉴权起步版本，覆盖后端登录/注册/刷新/登出/当前用户接口，以及前端登录页、注册页、登录态恢复与受保护页面占位。

## 涉及的文件清单

- `server/cmd/api/main.go`
- `server/internal/config/config.go`
- `server/internal/const/auth.go`
- `server/internal/dto/auth_dto.go`
- `server/internal/handler/auth_handler.go`
- `server/internal/handler/response.go`
- `server/internal/handler/router.go`
- `server/internal/middleware/auth_middleware.go`
- `server/internal/middleware/cors_middleware.go`
- `server/internal/model/user.go`
- `server/internal/repository/migrator.go`
- `server/internal/repository/postgres.go`
- `server/internal/repository/redis.go`
- `server/internal/repository/session_repository.go`
- `server/internal/repository/user_repository.go`
- `server/internal/service/auth_service.go`
- `server/internal/util/cookie.go`
- `server/internal/util/jwt.go`
- `server/internal/util/password.go`
- `server/internal/util/token.go`
- `server/migrations/001_create_users.sql`
- `web/src/App.tsx`
- `web/src/api/auth.ts`
- `web/src/api/client.ts`
- `web/src/components/ui/Button.tsx`
- `web/src/components/ui/Card.tsx`
- `web/src/components/ui/Input.tsx`
- `web/src/features/auth/LoginPage.tsx`
- `web/src/features/auth/RegisterPage.tsx`
- `web/src/features/auth/components/AuthLayout.tsx`
- `web/src/features/auth/components/GuestRoute.tsx`
- `web/src/features/auth/components/LoginForm.tsx`
- `web/src/features/auth/components/ProtectedRoute.tsx`
- `web/src/features/auth/components/RegisterForm.tsx`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/hooks/useAuthBootstrap.ts`
- `web/src/lib/cn.ts`
- `web/src/lib/getErrorMessage.ts`
- `web/src/stores/authStore.ts`
- `web/src/styles/globals.css`
- `web/src/types/api.ts`
- `web/src/types/auth.ts`
- `web/package.json`
- `web/vite.config.ts`
- `web/tailwind.config.ts`
- `web/eslint.config.js`
- `server/Dockerfile`
- `web/Dockerfile`
- `web/nginx.conf`
- `docker-compose.yml`
- `docs/api.md`

## 核心设计决策和原因

1. 登录字段统一为 `identifier`
   - 前端与后端都只传一个字段。
   - 仓储层 SQL 直接使用 `WHERE email = $1 OR username = $1`，符合当前任务范围，也最贴合你的要求。

2. Refresh Token 采用“双键”存储
   - 主键仍遵守 `markmind:rt:<user_id>`。
   - 额外维护 `markmind:rt_lookup:<token_hash>` 以便从 Cookie 中的 token 快速反查用户，实现刷新与登出。

3. 注册成功后跳转登录页
   - 保持流程清晰，不在本次任务里把“注册成功”和“自动登录”揉成一个步骤。

4. 首页先做占位页
   - 这次任务的目标是验证登录闭环，不提前扩展到文档列表功能，避免超出单次任务边界。

## 前端组件结构与数据流

- `App.tsx` 负责路由配置与启动时调用 `useAuthBootstrap`。
- `GuestRoute` 保护登录/注册页，避免已登录用户重复进入。
- `ProtectedRoute` 保护首页占位页。
- `LoginForm` / `RegisterForm` 只处理表单状态与调用 API。
- `authStore` 只存 AT、用户信息和引导状态，不直接写请求逻辑。
- `api/client.ts` 统一处理请求头注入与 401 自动刷新。

## 后端接口流程与数据库操作

- 注册：handler 解析参数 -> service 校验确认密码与唯一性 -> repository 写入 users 表。
- 登录：handler 接收 `identifier` 与 `password` -> service 查询用户并校验密码 -> 生成 AT/RT -> repository 将 RT 写入 Redis -> handler 写 Cookie。
- 刷新：handler 从 Cookie 读 RT -> service 通过 RT lookup 定位用户并轮换 RT -> 返回新 AT。
- 登出：handler 取 Cookie -> service 删除 Redis 中的 RT 记录 -> handler 清除 Cookie。
- 当前用户：鉴权中间件解析 Bearer Token -> handler 读取上下文 user_id -> service 查询用户信息。

## 已知 TODO / 待改进项

- 当前只实现了 users 表，后续文件夹、文档、编辑器等模块需要继续增加迁移文件。
- 当前首页仍是占位页，后续可以替换成真正的 dashboard。
- 生产环境还需要补充更完整的环境变量管理与 HTTPS 下的 Cookie 安全配置。
