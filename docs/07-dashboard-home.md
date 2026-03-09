# 07-dashboard-home

## 本次任务做了什么

实现了登录后的首页业务闭环第一版：用户进入首页后可以看到自己的文件夹列表与文档列表，并支持新建文件夹、在根目录或指定文件夹下新建空文档。

## 涉及文件清单

- `server/migrations/002_create_folders_and_documents.sql`
- `server/internal/model/folder.go`
- `server/internal/model/document.go`
- `server/internal/dto/dashboard_dto.go`
- `server/internal/repository/folder_repository.go`
- `server/internal/repository/document_repository.go`
- `server/internal/service/dashboard_service.go`
- `server/internal/handler/dashboard_handler.go`
- `server/internal/handler/router.go`
- `server/internal/const/auth.go`
- `web/src/api/dashboard.ts`
- `web/src/types/dashboard.ts`
- `web/src/features/dashboard/DashboardPage.tsx`
- `web/src/features/dashboard/useDashboardHome.ts`
- `web/src/features/dashboard/components/`
- `docs/api.md`

## 核心设计决策和原因

1. 首页数据使用“文件夹 + 文档总列表”结构
   - `GET /api/v1/dashboard` 一次返回当前用户全部文件夹与全部文档。
   - 前端根据 `folder_id` 在本地过滤当前选中目录下的文档，避免首页第一版就拆成多次请求。

2. 文件夹使用单层结构
   - 本轮不实现树形文件夹，不引入 `parent_id`。
   - 文档通过可空的 `folder_id` 表示是否位于根目录。

3. 数据库层绝不使用物理外键
   - `documents.folder_id` 只是普通字段，不使用数据库 `FOREIGN KEY` 约束。
   - 文件夹归属校验完全在后端 service / repository 中通过逻辑外键方式完成。

4. 新建空文档后停留在首页
   - 当前还未接入编辑器页面，因此新建文档后只更新列表并自动选中新文档。
   - 这样能先完成首页业务闭环，不把范围扩到编辑器初始化流程。

## 前端结构与数据流

- 左侧展示根目录入口、文件夹列表、当前用户信息与退出登录按钮。
- 右侧展示当前目录下文档列表，并提供“新建文档”按钮。
- 页面初次进入时调用首页接口加载数据，之后在本地更新新增的文件夹或文档。
- 当前选中的目录与文档只保存在页面局部状态，不额外引入全局 store。

## 后端流程说明

- 新建文件夹时，服务端会先裁剪名称，再校验非空后写入数据库。
- 新建文档时，如果传入 `folder_id`，服务端会先验证该文件夹属于当前用户，再创建空文档。
- 文档默认标题由服务端兜底为“未命名文档”，保证首页列表始终可展示。

## 已知 TODO / 待改进项

- 当前首页只支持创建，不支持重命名、删除、移动归类。
- 当前首页右侧仅展示文档列表，尚未接入点击后进入编辑器页面。
- 若后续文档数量增大，可将首页从一次性全量返回演进为分页或虚拟列表方案。
