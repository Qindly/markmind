// auth.ts - 定义鉴权模块前端类型
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResponseData {
  user: AuthUser;
}

export interface AuthSessionData {
  access_token: string;
  user: AuthUser;
}

export interface CurrentUserResponseData {
  user: AuthUser;
}

export interface LogoutResponseData {
  logged_out: boolean;
}
