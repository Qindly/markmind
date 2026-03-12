# MarkMind API 文档

## 统一响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 失败响应

```json
{
  "code": 40001,
  "message": "具体错误信息"
}
```

## 鉴权接口

### 用户注册

- **请求方式**：POST
- **路由**：`/api/v1/auth/register`
- **是否需要鉴权**：否
- **限流说明**：同一客户端 IP 在 1 分钟内最多请求 10 次，超限返回 429

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| username | body(json) | string | 是 | 用户名，长度 3~32 |
| email | body(json) | string | 是 | 邮箱 |
| password | body(json) | string | 是 | 密码，长度 8~72 |
| confirm_password | body(json) | string | 是 | 确认密码 |

#### 返回样例

**成功（201）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "ice",
      "email": "ice@example.com",
      "created_at": "2026-03-08T12:00:00Z"
    }
  }
}
```

**失败（400）**：
```json
{
  "code": 40003,
  "message": "邮箱已存在"
}
```

**失败（429）**：
```json
{
  "code": 42901,
  "message": "请求过于频繁"
}
```

### 用户登录

- **请求方式**：POST
- **路由**：`/api/v1/auth/login`
- **是否需要鉴权**：否
- **限流说明**：同一客户端 IP 在 1 分钟内最多请求 10 次，超限返回 429
- **Cookie 说明**：成功后会通过 httpOnly Cookie 写入 Refresh Token

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| identifier | body(json) | string | 是 | 邮箱或用户名 |
| password | body(json) | string | 是 | 密码 |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "<jwt>",
    "user": {
      "id": 1,
      "username": "ice",
      "email": "ice@example.com",
      "created_at": "2026-03-08T12:00:00Z"
    }
  }
}
```

**失败（401）**：
```json
{
  "code": 40102,
  "message": "账号或密码错误"
}
```

**失败（429）**：
```json
{
  "code": 42901,
  "message": "请求过于频繁"
}
```

### 刷新会话

- **请求方式**：POST
- **路由**：`/api/v1/auth/refresh`
- **是否需要鉴权**：否
- **Cookie 说明**：依赖请求自动携带的 Refresh Token Cookie；刷新成功后会轮换新的 Refresh Token Cookie

#### 请求参数

无请求体。

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "<jwt>",
    "user": {
      "id": 1,
      "username": "ice",
      "email": "ice@example.com",
      "created_at": "2026-03-08T12:00:00Z"
    }
  }
}
```

**失败（401）**：
```json
{
  "code": 40103,
  "message": "无效的刷新令牌"
}
```

### 用户登出

- **请求方式**：POST
- **路由**：`/api/v1/auth/logout`
- **是否需要鉴权**：否
- **Cookie 说明**：如果存在 Refresh Token Cookie，会一并清除；即使 Cookie 缺失也返回成功

#### 请求参数

无请求体。

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "logged_out": true
  }
}
```

### 获取当前用户

- **请求方式**：GET
- **路由**：`/api/v1/auth/me`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "ice",
      "email": "ice@example.com",
      "created_at": "2026-03-08T12:00:00Z"
    }
  }
}
```

**失败（401）**：
```json
{
  "code": 40101,
  "message": "未授权或身份无效"
}
```

## 首页与知识库入口接口

### 获取首页数据

- **请求方式**：GET
- **路由**：`/api/v1/dashboard`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "folders": [
      {
        "id": 1,
        "name": "前端实习",
        "created_at": "2026-03-08T12:00:00Z",
        "updated_at": "2026-03-08T12:00:00Z"
      }
    ],
    "documents": [
      {
        "id": 11,
        "folder_id": null,
        "title": "未命名文档",
        "created_at": "2026-03-08T12:10:00Z",
        "updated_at": "2026-03-08T12:10:00Z"
      },
      {
        "id": 12,
        "folder_id": 1,
        "title": "React Router 学习笔记",
        "created_at": "2026-03-08T12:15:00Z",
        "updated_at": "2026-03-08T12:15:00Z"
      }
    ]
  }
}
```

**失败（401）**：
```json
{
  "code": 40101,
  "message": "未授权或身份无效"
}
```

### 新建文件夹

- **请求方式**：POST
- **路由**：`/api/v1/folders`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| name | body(json) | string | 是 | 文件夹名称，长度 1~64 |

#### 返回样例

**成功（201）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "folder": {
      "id": 1,
      "name": "前端实习",
      "created_at": "2026-03-08T12:00:00Z",
      "updated_at": "2026-03-08T12:00:00Z"
    }
  }
}
```

**失败（400）**：
```json
{
  "code": 40005,
  "message": "文件夹名称不能为空"
}
```

### 新建空文档

- **请求方式**：POST
- **路由**：`/api/v1/documents`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| folder_id | body(json) | number \| null | 否 | 所属文件夹 ID，不传或为 `null` 表示根目录 |
| title | body(json) | string | 否 | 文档标题；为空时由服务端自动生成默认标题 |

#### 返回样例

**成功（201）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "document": {
      "id": 11,
      "folder_id": null,
      "title": "未命名文档",
      "created_at": "2026-03-08T12:10:00Z",
      "updated_at": "2026-03-08T12:10:00Z"
    }
  }
}
```

**失败（404）**：
```json
{
  "code": 40006,
  "message": "文件夹不存在"
}
```

### 修改文件夹
- **请求方式**：PUT
- **路由**：`/api/v1/folders/:id`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| id | params | number | 是 | 文件夹 ID |
| name | body(json) | string | 是 | 新的文件夹名称，长度 1~64 |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "folder": {
      "id": 1,
      "name": "新的文件夹名称",
      "created_at": "2026-03-08T12:00:00Z",
      "updated_at": "2026-03-08T13:00:00Z"
    }
  }
}
```

**失败（404）**：
```json
{
  "code": 40006,
  "message": "文件夹不存在"
}
```

### 删除文件夹
- **请求方式**：DELETE
- **路由**：`/api/v1/folders/:id`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| id | params | number | 是 | 文件夹 ID |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deleted_id": 1
  }
}
```

**失败（400）**：
```json
{
  "code": 40009,
  "message": "文件夹下仍有文档，无法删除"
}
```

### 修改文档信息
- **请求方式**：PUT
- **路由**：`/api/v1/documents/:id`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| id | params | number | 是 | 文档 ID |
| title | body(json) | string | 否 | 新的文档标题，长度 1~120 |
| folder_id | body(json) | number \| null | 否 | 目标文件夹 ID；传 `null` 表示移回根目录 |

- **补充说明**：`title` 与 `folder_id` 至少需要提供一项。

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "document": {
      "id": 11,
      "folder_id": 3,
      "title": "React Hooks 速记",
      "created_at": "2026-03-08T12:10:00Z",
      "updated_at": "2026-03-08T13:10:00Z"
    }
  }
}
```

**失败（404）**：
```json
{
  "code": 40008,
  "message": "文档不存在"
}
```

## 设置与编辑器 AI 接口

### 获取当前用户 AI 设置

- **请求方式**：GET
- **路由**：`/api/v1/settings/ai`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "settings": {
      "base_url": "https://api.openai.com/v1",
      "model": "gpt-4.1-mini",
      "has_api_key": true,
      "masked_api_key": "sk-t************7890"
    }
  }
}
```

### 更新当前用户 AI 设置

- **请求方式**：PUT
- **路由**：`/api/v1/settings/ai`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| base_url | body(json) | string | 是 | OpenAI Compatible Provider 的根地址，不需要手动补 `/v1` |
| api_key | body(json) | string | 否 | 新的 Provider API Key；留空表示沿用已保存的密钥 |
| model | body(json) | string | 是 | 用于 chat completions 的模型名 |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "settings": {
      "base_url": "https://api.openai.com/v1",
      "model": "gpt-4.1-mini",
      "has_api_key": true,
      "masked_api_key": "sk-t************7890"
    }
  }
}
```

**失败（400）**：
```json
{
  "code": 40014,
  "message": "AI Provider API Key 不能为空"
}
```

### 测试当前用户 AI Provider 设置

- **请求方式**：POST
- **路由**：`/api/v1/settings/ai/test`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| base_url | body(json) | string | 是 | OpenAI Compatible Provider 的根地址，不需要手动补 `/v1` |
| api_key | body(json) | string | 否 | 新的 Provider API Key；留空时会优先沿用已保存的密钥做测试 |
| model | body(json) | string | 是 | 准备用于 chat completions 的模型名 |

- **返回说明**：
  - 服务端会对 `base_url` 自动补全 `/v1` 后再发起轻量 `chat/completions` 请求。
  - `provider_reachable=true` 表示 Provider 至少已成功响应；`model_available=true` 表示当前模型已通过实际调用校验。
  - `using_saved_api_key=true` 表示本次测试未提交新密钥，而是沿用了当前用户已经保存的 API Key。
  - 当服务端环境变量 `AI_PROVIDER_DEBUG=true` 时，响应中会额外返回 `debug` 对象，包含本次上游请求 URL、脱敏后的请求头、请求体、响应状态码、响应头与响应体，便于排查兼容性问题。

#### 返回样例

**成功（200，测试通过）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "result": {
      "base_url": "https://api.openai.com/v1",
      "model": "gpt-4.1-mini",
      "provider_reachable": true,
      "model_available": true,
      "using_saved_api_key": false,
      "message": "Provider 已连通，当前模型可用",
      "debug": {
        "request_url": "https://api.renice.cc/v1/chat/completions",
        "request_method": "POST",
        "request_headers": {
          "Authorization": "Bearer sk-d************7890",
          "Content-Type": "application/json"
        },
        "request_body": "{\n  \"model\": \"gpt-4.1-mini\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"你是一个 OpenAI Compatible Provider 连通性测试助手。\\n你只能返回大写字符串 OK，不要输出解释、标点或其它内容。\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"Return OK only.\"\n    }\n  ],\n  \"temperature\": 0,\n  \"max_tokens\": 8\n}",
        "response_status_code": 200,
        "response_headers": {
          "Content-Type": "application/json"
        },
        "response_body": "{\n  \"choices\": [\n    {\n      \"message\": {\n        \"content\": \"OK\"\n      }\n    }\n  ]\n}"
      }
    }
  }
}
```

**成功（200，模型不可用）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "result": {
      "base_url": "https://api.openai.com/v1",
      "model": "gpt-4.1-mini",
      "provider_reachable": true,
      "model_available": false,
      "using_saved_api_key": true,
      "message": "Provider 已连通，但当前模型不可用：The model \"gpt-4.1-mini\" does not exist"
    }
  }
}
```

**失败（400）**：
```json
{
  "code": 40015,
  "message": "AI 模型名称不能为空"
}
```

### 魔法笔局部改写

- **请求方式**：POST
- **路由**：`/api/v1/ai/magic-edit`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| document_id | body(json) | number | 是 | 当前文档 ID |
| selected_text | body(json) | string | 是 | 当前选中的 Markdown 文段 |
| instruction | body(json) | string | 是 | 用户输入的魔法笔指令 |
| context_before | body(json) | string | 否 | 选区前方的少量上下文 |
| context_after | body(json) | string | 否 | 选区后方的少量上下文 |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "result": "## React Hooks 速记\n\n- `useEffect` 用于同步副作用\n- `useMemo` 用于缓存昂贵计算结果"
  }
}
```

**失败（400）**：
```json
{
  "code": 40016,
  "message": "请先在设置页完成 AI Provider 配置"
}
```

### 局部翻译

- **请求方式**：POST
- **路由**：`/api/v1/ai/translate`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| document_id | body(json) | number | 是 | 当前文档 ID |
| selected_text | body(json) | string | 是 | 当前选中的 Markdown 文段 |
| source_language | body(json) | string | 否 | 原语言名称；传 `auto` 表示自动检测 |
| target_language | body(json) | string | 是 | 目标语言名称，默认可传 `中文` |
| context_before | body(json) | string | 否 | 选区前方的少量上下文 |
| context_after | body(json) | string | 否 | 选区后方的少量上下文 |

- **返回说明**：
  - 服务端只返回目标语言译文，不再拼接双语 Markdown。
  - 如果前端需要保留原文，可直接继续使用编辑器当前选区内容。

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "translated_text": "你好，世界！",
    "target_language": "中文"
  }
}
```

**失败（502）**：
```json
{
  "code": 50002,
  "message": "AI 服务调用失败，请稍后重试"
}
```

### 魔法笔局部改写（流式）

- **请求方式**：POST
- **路由**：`/api/v1/ai/magic-edit/stream`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| document_id | body(json) | number | 是 | 当前文档 ID |
| selected_text | body(json) | string | 是 | 当前选中的 Markdown 文段 |
| instruction | body(json) | string | 是 | 用户输入的魔法笔指令 |
| context_before | body(json) | string | 否 | 选区前方的少量上下文 |
| context_after | body(json) | string | 否 | 选区后方的少量上下文 |

- **响应格式**：`text/event-stream`
- **事件说明**：
  - `event: chunk`：返回本次增量内容，`data` 结构为 `{"delta":"..."}`。
  - `event: done`：返回最终完整结果，`data` 结构为 `{"result":"..."}`。
  - `event: error`：返回流式处理中的错误，`data` 结构为 `{"message":"..."}`。
  - 当前端中断请求或关闭页面时，服务端会同步取消上游 Provider 请求。

#### 返回样例

**成功（200，SSE）**：
```text
event: chunk
data: {"delta":"## React Hooks 速记\n\n"}

event: chunk
data: {"delta":"- useEffect 用于同步副作用"}

event: done
data: {"result":"## React Hooks 速记\n\n- useEffect 用于同步副作用"}
```

### 局部翻译（流式）

- **请求方式**：POST
- **路由**：`/api/v1/ai/translate/stream`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| document_id | body(json) | number | 是 | 当前文档 ID |
| selected_text | body(json) | string | 是 | 当前选中的 Markdown 文段 |
| source_language | body(json) | string | 否 | 原语言名称；传 `auto` 表示自动检测 |
| target_language | body(json) | string | 是 | 目标语言名称，默认可传 `中文` |
| context_before | body(json) | string | 否 | 选区前方的少量上下文 |
| context_after | body(json) | string | 否 | 选区后方的少量上下文 |

- **响应格式**：`text/event-stream`
- **事件说明**：
  - `event: chunk`：返回本次译文增量，`data` 结构为 `{"delta":"..."}`。
  - `event: done`：返回最终完整译文，`data` 结构为 `{"translated_text":"...","target_language":"中文"}`。
  - `event: error`：返回流式处理中的错误，`data` 结构为 `{"message":"..."}`。
  - 当前端中断请求或关闭页面时，服务端会同步取消上游 Provider 请求。

#### 返回样例

**成功（200，SSE）**：
```text
event: chunk
data: {"delta":"你好，"}

event: chunk
data: {"delta":"世界！"}

event: done
data: {"translated_text":"你好，世界！","target_language":"中文"}
```

### 搜索文档
- **请求方式**：GET
- **路由**：`/api/v1/documents/search`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| keyword | query | string | 是 | 搜索关键字，会同时匹配文档标题和正文内容 |
| scope | query | string | 否 | 搜索范围，支持 `current_folder` 和 `global`；默认 `current_folder` |
| folder_id | query | number | 否 | 当前目录 ID；仅当 `scope=current_folder` 时生效，不传表示搜索根目录 |

- **返回说明**：
  - `scope=current_folder` 时只搜索当前目录；`scope=global` 时搜索当前用户全部文档。
  - `snippet` 为服务端生成的正文纯文本摘要；正文命中时优先返回命中附近片段，只有标题命中时回退到正文开头摘要。
  - `match_sources` 为命中来源标签列表，只会返回 `title`、`content` 两种值；如果标题和正文都命中，会按 `["title", "content"]` 顺序同时返回。
  - `folder_name` 为结果所属目录名称；根目录统一返回 `根目录`。

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "documents": [
        {
          "id": 11,
          "folder_id": 3,
          "folder_name": "前端实习",
          "title": "React Hooks 速记",
          "snippet": "...React Router 的嵌套路由需要和 Outlet 配合使用，才能让页面结构更清晰。",
          "match_sources": ["title", "content"],
          "created_at": "2026-03-09T10:00:00Z",
          "updated_at": "2026-03-09T11:00:00Z"
        }
      ]
    }
}
```

**失败（400）**：
```json
{
  "code": 40001,
  "message": "无效的请求参数"
}
```

**失败（404）**：
```json
{
  "code": 40006,
  "message": "文件夹不存在"
}
```

### 上传编辑器图片
- **请求方式**：POST
- **路由**：`/api/v1/uploads/images`
- **是否需要鉴权**：是
- **说明**：用于处理编辑器内截图或剪贴板图片上传，成功后返回可直接写入 Markdown 的相对访问地址

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| image | body(form-data) | file | 是 | 单张图片文件，支持 `png`、`jpg`、`jpeg`、`webp`、`gif`，最大 10MB |

#### 返回样例

**成功（201）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "image": {
      "url": "/uploads/2026/03/7a9fe2f0f50c1ab9c8f1dfc2f08f2d74.webp"
    }
  }
}
```

**失败（400）**：
```json
{
  "code": 40011,
  "message": "图片大小不能超过 10MB"
}
```

**失败（400）**：
```json
{
  "code": 40012,
  "message": "仅支持 png、jpg、jpeg、webp、gif 格式的图片"
}
```

### 删除文档
- **请求方式**：DELETE
- **路由**：`/api/v1/documents/:id`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| id | params | number | 是 | 文档 ID |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deleted_id": 11
  }
}
```

**失败（404）**：
```json
{
  "code": 40008,
  "message": "文档不存在"
}
```

### 获取文档详情
- **请求方式**：GET
- **路由**：`/api/v1/documents/:id`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| id | params | number | 是 | 文档 ID |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "document": {
      "id": 11,
      "folder_id": 3,
      "title": "React Hooks 速记",
      "content": "# React Hooks\n\n这里是文档正文。",
      "created_at": "2026-03-09T10:00:00Z",
      "updated_at": "2026-03-09T10:30:00Z"
    }
  }
}
```

**失败（404）**：
```json
{
  "code": 40008,
  "message": "文档不存在"
}
```

### 更新文档正文
- **请求方式**：PUT
- **路由**：`/api/v1/documents/:id/content`
- **是否需要鉴权**：是

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| Authorization | header | string | 是 | `Bearer <access_token>` |
| id | params | number | 是 | 文档 ID |
| content | body(json) | string | 是 | 文档正文内容，允许为空字符串 |

#### 返回样例

**成功（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "document": {
      "id": 11,
      "folder_id": 3,
      "title": "React Hooks 速记",
      "content": "# React Hooks\n\n已更新的正文内容。",
      "created_at": "2026-03-09T10:00:00Z",
      "updated_at": "2026-03-09T11:00:00Z"
    }
  }
}
```

**失败（404）**：
```json
{
  "code": 40008,
  "message": "文档不存在"
}
```
