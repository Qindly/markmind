# 服务端容器 CA 证书链修复

## 本次任务做了什么

本轮修复了 AI Provider 调用在 Docker 服务端容器内的 TLS 证书校验失败问题。根因不是 `baseURL` 或接口路径错误，而是 `markmind-server` 运行镜像中缺少系统 CA 证书包，导致 Go 在容器内访问 `https://api.renice.cc/v1/chat/completions` 时无法完成证书链校验。

## 涉及的文件清单

- 运行镜像修复：`server/Dockerfile`

## 核心设计决策和原因

1. 在运行镜像阶段安装 `ca-certificates`
   - 构建阶段是否能联网，不影响运行阶段 Go `net/http` 如何验证 HTTPS 证书。
   - 当前 `debian:12-slim` 运行镜像过于精简，容器内没有 `/etc/ssl/certs` 与 `ca-certificates.crt`，因此必须在 runner 阶段显式安装系统 CA 包。

2. 保持修复范围最小
   - 不修改 AI 请求逻辑、不关闭 TLS 校验、不引入跳过证书验证这类高风险方案。
   - 只补齐容器运行时的系统信任链，使其行为与宿主机环境一致。

## 验证结论

- 宿主机直接请求 `https://api.renice.cc/v1/models` 时可以拿到 `401 Unauthorized`，说明站点本身可达且宿主机信任该证书。
- 修复前，`markmind-server` 容器内缺少系统 CA 证书目录与证书包。
- 修复后重新执行后端编译、测试与 `docker compose build`，确认镜像可正常构建，且容器运行时已具备系统证书链基础。

## 已知 TODO / 待改进项

- 如果后续接入的 Provider 使用私有 CA 或企业内部根证书，还需要额外挂载并导入自定义证书，而不只是依赖系统公开 CA。
