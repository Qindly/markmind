# MarkMind API 文档

## 鉴权模块

### 用户注册

- **请求方式**：POST
- **路由**：`/api/v1/auth/register`
- **是否需要鉴权**：否

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| username | body(json) | string | 是 | 用户名，长度 3~32 |
| email | body(json) | string | 是 | 注册邮箱 |
| password | body(json) | string | 是 | 密码，长度至少 8 位 |
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

### 用户登录

- **请求方式**：POST
- **路由**：`/api/v1/auth/login`
- **是否需要鉴权**：否

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| identifier | body(json) | string | 是 | 邮箱或用户名 |
| password | body(json) | string | 是 | 登录密码 |

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

### 刷新访问令牌

- **请求方式**：POST
- **路由**：`/api/v1/auth/refresh`
- **是否需要鉴权**：否（依赖 httpOnly Cookie）

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| markmind_refresh_token | cookie | string | 是 | Refresh Token Cookie |

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
  "message": "刷新令牌无效或已过期"
}
```

### 用户登出

- **请求方式**：POST
- **路由**：`/api/v1/auth/logout`
- **是否需要鉴权**：否（依赖 httpOnly Cookie）

#### 请求参数

| 参数名 | 位置 | 类型 | 必须 | 说明 |
|--------|------|------|------|------|
| markmind_refresh_token | cookie | string | 否 | 当前 Refresh Token Cookie |

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

### 获取当前用户信息

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
  "message": "未登录或登录状态已失效"
}
```
