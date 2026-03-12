# AI Provider 调试模式

## 本次任务做了什么

本轮为 AI 设置页测试接口补上了临时 Provider 调试模式：当服务端开启 `AI_PROVIDER_DEBUG=true` 时，设置页点击“测试连接”除了返回连通性与模型可用性结果外，还会额外返回本次上游请求的最终 URL、脱敏后的请求头、请求体、响应状态码、响应头和响应体，方便直接定位 OpenAI Compatible 兼容性问题。

## 涉及的文件清单

- 后端配置与调试结构：`server/internal/config/config.go`、`server/internal/config/config_test.go`、`.env`、`.env.example`、`docker-compose.yml`、`server/internal/dto/settings_dto.go`
- 后端 Provider 请求调试：`server/internal/service/ai_provider_client.go`、`server/internal/service/ai_provider_client_test.go`、`server/internal/service/settings_service.go`、`server/cmd/api/main.go`
- 前端展示：`web/src/types/settings.ts`、`web/src/features/settings/components/AISettingsCard.tsx`、`web/src/features/settings/components/AISettingsDebugPanel.tsx`
- 文档：`docs/api.md`

## 核心设计决策和原因

1. 调试模式只挂在设置页测试接口上
   - 普通编辑器 AI 调用链路不需要把上游请求细节暴露给前端。
   - 把调试信息收敛到“测试连接”入口，既能满足排障，也不会污染正常使用路径。

2. 调试信息默认关闭，必须显式开启
   - 只有当服务端设置 `AI_PROVIDER_DEBUG=true` 时，才会返回调试字段。
   - 这样可以避免日常环境默认暴露上游请求细节。

3. Authorization 头脱敏返回
   - 排障时需要确认 Header 是否正确带上 `Bearer`，但没有必要把明文 API Key 再回传给浏览器。
   - 因此本轮调试信息中会保留 Authorization 结构，但会对密钥内容做脱敏处理。

## 调试链路说明

- 设置页点击“测试连接”后，后端仍然照常发起真实 `chat/completions` 探活请求
- 如果 `AI_PROVIDER_DEBUG=true`：
  - 返回最终请求地址，例如 `https://api.renice.cc/v1/chat/completions`
  - 返回脱敏后的请求头和请求体
  - 返回上游响应状态码、响应头和响应体
  - 如果是网络错误或超时，则返回 `network_error`
- 如果 `AI_PROVIDER_DEBUG=false`：
  - 前端只收到原有的结构化测试结果，不会展示调试面板

## 已知 TODO / 待改进项

- 当前调试信息主要面向设置页的单次探活，没有做历史记录或导出。
- 如果后续需要更深层的排查，可以再补“复制完整调试信息”按钮或服务端结构化日志落盘。
