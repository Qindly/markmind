# 04-ai-review-fixes

## 本次任务做了什么

修复 `tmp/1.png`、`tmp/2.png`、`tmp/3.png` 中指出的 3 个高优先级问题，分别是 Gin 受信任代理配置、Docker Compose 环境文件使用方式，以及前端 Docker 镜像依赖安装的可复现性。

## 涉及文件清单

- `server/internal/config/config.go`
- `server/internal/config/config_test.go`
- `server/internal/handler/router.go`
- `server/cmd/api/main.go`
- `docker-compose.yml`
- `.env.example`
- `.env`
- `web/Dockerfile`

## 核心设计决策和原因

1. 为 Gin 增加显式受信任代理配置
   - 新增 `TRUSTED_PROXIES` 环境变量，使用逗号分隔多个代理 IP 或 CIDR。
   - 路由初始化时调用 `router.SetTrustedProxies`，避免继续使用 Gin 默认的“信任所有代理”行为。
   - 本地 Docker 默认信任 `127.0.0.1`、`::1` 和 `172.16.0.0/12`，兼顾本机开发与容器内 Nginx 反代场景。

2. 调整 Docker Compose 的环境变量注入方式
   - 删除 `env_file: ./.env.example`，避免服务直接使用示例文件中的敏感配置。
   - 在根目录提供 `.env`，由 Docker Compose 自动读取，并通过 `${VAR}` 方式注入容器环境。
   - `.env` 已被 Git 忽略，仓库继续保留 `.env.example` 作为模板。

3. 锁定前端镜像依赖版本
   - `web/Dockerfile` 构建阶段改为复制 `pnpm-lock.yaml`。
   - 安装命令改为 `pnpm install --frozen-lockfile`，确保每次镜像构建都严格使用锁文件版本。

## 已知 TODO / 待改进项

- 线上部署时应根据真实反向代理网络，进一步收紧 `TRUSTED_PROXIES` 的取值，避免信任范围过宽。
- 如果后续不需要直接暴露后端调试端口，可以考虑移除 `server` 的宿主机端口映射，只保留 `web` 对外访问入口。

## 后端流程说明

- 服务启动时先加载 `TRUSTED_PROXIES` 配置，再在 Gin 路由初始化阶段设置受信任代理。
- 登录与注册接口的限流依然基于 `ctx.ClientIP()`，但现在只会在受信任代理链内解析转发头，避免被伪造请求头绕过。

## Docker 说明

- 根目录 `.env` 负责提供 Compose 所需变量。
- `postgres`、`server` 服务通过 `environment` + `${VAR}` 显式注入配置，避免示例文件被误当作生产配置直接使用。
