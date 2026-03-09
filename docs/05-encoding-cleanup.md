# 05-encoding-cleanup

## 本次任务做了什么

修复了 AI 审查在 `tmp/1.png` 中指出的 Go 源文件乱码问题，重点清理了鉴权错误常量、统一响应、配置加载、路由初始化、限流中间件以及服务入口中的中文注释与错误消息。

## 涉及文件清单

- `server/internal/const/auth.go`
- `server/internal/handler/response.go`
- `server/internal/config/config.go`
- `server/internal/handler/router.go`
- `server/internal/middleware/rate_limit_middleware.go`
- `server/cmd/api/main.go`

## 核心设计决策和原因

1. 直接重写受影响文件
   - 乱码既出现在注释中，也出现在 `errors.New(...)` 和 `fmt.Errorf(...)` 等业务错误消息中。
   - 与其逐段修补，不如直接将文件按 UTF-8 重新整理，避免残留半截乱码或不可见字符。

2. 保持业务逻辑不变，只修正文案与注释
   - 本次修复不改接口行为、不改返回结构、不改限流或鉴权流程。
   - 仅恢复中文注释、日志与错误消息的可读性，确保后续开发和调试时不会因为乱码误判含义。

3. 补齐统一的中文错误语义
   - 鉴权相关业务错误统一为可读中文，例如“用户名已存在”“无效的刷新令牌”“请求过于频繁”。
   - 服务启动阶段的配置、数据库、Redis、路由与 HTTP 服务日志也统一改为明确中文描述。

## 已知 TODO / 待改进项

- 当前 `docs/03-auth-hardening.md` 和根目录 `.env` / `.env.example` 的注释仍有历史编码痕迹，如果后续要继续整理文档，可再单独清洗一轮。
- 如果后面继续引入新的中文注释或日志，建议统一使用 UTF-8 编码保存，避免重复出现乱码问题。

## 后端流程说明

- `auth.go` 负责定义鉴权错误码与错误消息，本次修复后可直接作为统一错误映射的中文来源。
- `response.go` 负责把业务错误映射为统一 JSON 响应，本次修复后默认错误提示与注释都恢复正常。
- `config.go`、`router.go`、`rate_limit_middleware.go`、`main.go` 的中文日志与注释恢复后，服务启动和排障信息更加明确。
