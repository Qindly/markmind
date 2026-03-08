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
