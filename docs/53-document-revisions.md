# 基于文本存储的历史版本管理与 diff 对比

本轮为编辑器补齐了基于文本快照的历史版本能力，目标是把“保存正文”从单次覆盖写入升级为可追溯、可对比、可回滚的版本流。

## 设计原则

- 以 `documents` 为当前真值，`document_revisions` 为可追溯快照历史。
- 历史版本作为 `Document` 聚合的一部分，由仓储层在事务内统一维护。
- 版本存储优先使用全量文本快照，先保证实现简单、读取直接、回滚稳定。
- diff 能力放在 `util` 层，避免污染仓储职责。
- 回滚不覆盖本地未保存草稿，前端在 `dirty` / `saving` 状态下只允许查看历史，不允许执行回滚。

## 数据模型

新增迁移：`server/migrations/005_create_document_revisions.sql`

新增表：`document_revisions`

- `id`: 主键
- `document_id`: 关联文档 ID
- `revision_number`: 文档内递增版本号
- `snapshot_content`: 全量文本快照
- `content_size`: 快照字符数
- `operation`: 版本来源，支持 `create` / `update` / `rollback` / `seed`
- `source_revision_id`: 回滚来源版本 ID，可为空
- `created_at`: 快照创建时间

索引策略：

- 唯一索引 `document_id + revision_number`，保证版本号单调且不重复
- 倒序索引 `document_id + revision_number DESC + id DESC`，优化历史列表查询

历史补种策略：

- 迁移会为旧 `documents` 数据补一条 `seed` 快照
- 避免老文档上线后“当前有内容但没有历史版本”的不一致状态

## 后端实现

核心文件：

- `server/internal/repository/document_repository.go`
- `server/internal/service/document_service.go`
- `server/internal/handler/document_handler.go`
- `server/internal/util/text_diff.go`
- `server/internal/util/document_revision_preview.go`

事务边界：

- 创建文档时，同时写入 `documents` 和首条 `create` 快照
- 自动保存正文时，只更新 `documents` 当前内容，不写入历史版本
- 手动保存正文时，先锁定文档、更新正文，再按需写入 `update` 快照
- 回滚正文时，先锁定文档、读取目标版本、更新正文，再写入 `rollback` 快照

这样可以保证：

- 自动保存继续承担“防丢内容”的职责
- 历史版本只保留创建、手动保存、导入和回滚这些明确节点
- 用户可以在自动保存后继续手动保存，把当前内容提升为可追溯版本

## 文本 diff 策略

实现文件：`server/internal/util/text_diff.go`

规则：

- 基于“按行 diff”输出结果
- 正常场景使用 LCS 计算，保证对比结果稳定
- 超大文本场景增加 prefix/suffix fallback，避免 LCS 矩阵过大带来的内存和耗时问题

输出结构：

- `equal`: 未变化行
- `insert`: 新增行
- `delete`: 删除行
- `old_line_number` / `new_line_number`: 行号定位
- `stats`: 新增、删除、未变更行统计

## 对外接口

新增接口：

- `GET /api/v1/documents/:id/revisions`
- `GET /api/v1/documents/:id/revisions/diff?from_revision_id=...&to_revision_id=...`
- `POST /api/v1/documents/:id/revisions/:revision_id/rollback`

接口语义：

- 历史列表返回最近版本的摘要、来源、时间和预览文案
- 历史列表额外返回 `has_unversioned_content`，用于告知“当前内容是否只做过自动保存、尚未进入历史”
- diff 接口返回两个历史版本之间的逐行差异
- 回滚接口返回最新文档内容、生成的回滚版本以及是否真的发生回滚

错误处理：

- 新增 `ErrDocumentRevisionNotFound`
- 统一映射到业务错误码 `40010`

## 前端交互

核心文件：

- `web/src/features/editor/useDocumentRevisionHistory.ts`
- `web/src/features/editor/components/EditorRevisionHistoryDialog.tsx`
- `web/src/features/editor/components/EditorWorkspace.tsx`
- `web/src/features/editor/EditorPage.tsx`

交互策略：

- 编辑页顶部增加“历史版本”入口
- 弹窗左侧展示版本列表，右侧展示 diff
- 默认对比“选中历史版本 vs 当前最新已保存版本”
- 如果选中的是当前最新版本，则降级为“上一版本 vs 当前最新版本”

回滚约束：

- 当前存在未保存改动或正在保存时，允许查看但禁用回滚
- 当前内容如果只做过自动保存、尚未进入历史，也会禁用回滚，避免用户丢失这部分内容
- 回滚成功后，更新编辑器中的当前文档内容并关闭弹窗

## 验证结果

- `server`: 使用仓库内本地 `GOCACHE` / `GOMODCACHE` 后，`go test ./...` 通过
- `web`: `pnpm build` 通过

## 后续可演进方向

- 为超长文档引入“快照 + 增量 patch”的冷热分层存储
- 支持同屏双栏版本对比与关键块导航
- 增加版本保留策略，例如按数量或时间窗口归档
