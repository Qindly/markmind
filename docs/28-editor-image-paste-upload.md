# 28. 编辑器图片粘贴上传

## 本次任务做了什么
本次任务为编辑页补齐了图片粘贴上传能力，完成了从剪贴板到 Markdown 自动插入的完整链路：
- 前端在 CodeMirror 中识别粘贴的图片文件，并在上传前进行压缩处理
- 后端新增图片上传接口，校验格式与体积后持久化到容器内固定目录
- Docker 使用根目录 `data/uploads` 作为宿主机挂载点，上传后的图片可通过 `/uploads/...` 公开访问

## 涉及的文件清单
- 后端上传模块：`server/internal/handler/upload_handler.go`
- 后端上传服务：`server/internal/service/upload_service.go`
- 后端上传工具与常量：`server/internal/util/upload.go`、`server/internal/const/upload.go`
- 路由与配置：`server/internal/handler/router.go`、`server/internal/config/config.go`、`server/cmd/api/main.go`
- 前端上传 API：`web/src/api/upload.ts`
- 前端压缩工具：`web/src/lib/imageCompress.ts`
- 前端编辑器粘贴处理：`web/src/features/editor/useDocumentImageUpload.ts`
- 编辑器接线：`web/src/features/editor/components/CodeMirrorEditor.tsx`、`web/src/features/editor/components/EditorWorkspace.tsx`、`web/src/features/editor/EditorPage.tsx`
- Docker 与代理：`docker-compose.yml`、`web/nginx.conf`、`web/vite.config.ts`
- 文档与环境配置：`.env.example`、`.gitignore`、`docs/api.md`

## 核心设计决策和原因
- 上传接口独立为 `POST /api/v1/uploads/images`，不与文档保存接口耦合，后续更容易扩展到拖拽上传或图片管理
- 前端对位图图片统一压缩为 `webp`，保留 `gif` 直传，以兼顾截图体积与动图效果
- 编辑器内先插入唯一占位符，再在上传完成后替换成 Markdown 图片语法，避免用户继续输入时图片插入位置漂移
- 图片存储路径按 `年/月/随机文件名` 组织，避免命名冲突，同时控制目录下单文件数量
- Docker 通过 `./data/uploads` 挂载到容器内固定目录，满足开发阶段可直观看到上传文件的需求

## 前端组件结构和数据流
- `CodeMirrorEditor` 通过 CodeMirror 粘贴扩展捕获剪贴板中的 `image/*` 文件
- `useDocumentImageUpload` 负责创建占位符、调用压缩工具、触发上传接口、替换占位符并展示失败 toast
- 上传成功后自动向编辑器插入 `![图片](/uploads/...)`，再由既有的 unified 预览管线实时渲染

## 后端接口流程和文件操作
- `UploadHandler` 从 `multipart/form-data` 中读取字段 `image`，完成基础鉴权与错误响应映射
- `UploadService` 校验单图大小不超过 10MB，并通过文件头检测真实 MIME 类型
- 服务端将文件保存到 `UPLOAD_ROOT_DIR/<year>/<month>/` 下，并返回 `UPLOAD_PUBLIC_BASE_PATH` 对应的相对访问地址
- Gin 路由通过静态文件映射公开 `/uploads/...`，Nginx 与 Vite 代理保持相同访问路径

## 已知 TODO / 待改进项
- 当前仅支持“粘贴上传”，尚未扩展到拖拽上传、选择文件上传
- 当前图片为公开静态访问，后续如需私有文档图片鉴权，可改为受保护下载接口
- 当前上传成功后默认使用固定 alt 文案“图片”，后续可以补充图片重命名或标题编辑能力
