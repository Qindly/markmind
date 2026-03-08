# 02-docker-ports

## 本次任务做了什么

本次将 Docker 对外暴露的端口统一调整到 `58000-58099` 区间，避免与常见本地开发端口冲突。

## 涉及的文件清单

- `docker-compose.yml`

## 核心设计决策和原因

1. 仅调整宿主机映射端口
   - `web` 改为 `58000:80`
   - `server` 改为 `58001:8080`
   - `postgres` 改为 `58002:5432`
   - `redis` 改为 `58003:6379`
   - 这样不会影响容器间通过服务名访问，也不需要额外修改镜像内部默认监听配置。

2. 同步更新前端来源地址
   - 将 `FRONTEND_ORIGIN` 调整为 `http://localhost:58000`。
   - 这样后端 CORS 配置仍能正确放行 Docker 运行时的前端请求。

## 当前端口分配

- 前端：`http://localhost:58000`
- 后端 API：`http://localhost:58001`
- PostgreSQL：`localhost:58002`
- Redis：`localhost:58003`

## 已知 TODO / 待改进项

- 如果后续需要区分开发、测试、演示环境，可以继续把端口号抽到 `.env` 或 compose override 文件中统一管理。
