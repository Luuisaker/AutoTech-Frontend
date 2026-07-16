import { api } from "./axios";
import { setToken, clearToken, decodeJwt, getToken } from "./token";
import type { Role, JwtPayload } from "./token";
import type { CoreResponse } from "./api";

export type { Role, JwtPayload };
export { getToken, decodeJwt, clearToken };

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  ci: string;
  phone: string;
  photo_url: string | null;
  roles: Role[];
  credit_level: number;
  parts_credit_limit: number;
  service_credit_limit: number;
  parts_available: number;
  service_available: number;
  total_parts_debt: number;
  total_service_debt: number;
  is_2fa_enabled: number;
  language_preference?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  ci: string;
  phone: string;
  role?: "CLIENT" | "WORKSHOP_OWNER" | "ADMIN";
};

function extractToken(body: TokenResponse | CoreResponse<TokenResponse>): TokenResponse {
  if ("access_token" in body) return body;
  const wrapped = body as CoreResponse<TokenResponse>;
  if (!wrapped.content?.access_token) {
    throw new Error("Respuesta inválida: falta access_token");
  }
  return wrapped.content;
}

function getOrCreateDeviceId(): string {
  const key = "autotech.device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export async function login(email: string, password: string, totp_code?: string): Promise<UserProfile> {
  const res = await api.post<TokenResponse | CoreResponse<TokenResponse>>("/users/login", {
    email,
    password,
    totp_code,
    device_id: getOrCreateDeviceId(),
  });
  const tokenData = extractToken(res.data);
  setToken(tokenData.access_token);
  return getMe();
}

export async function register(input: RegisterInput): Promise<UserProfile> {
  await api.post<UserProfile | CoreResponse<UserProfile>>("/users/register", input);
  return login(input.email, input.password);
}

export async function getMe(): Promise<UserProfile> {
  const res = await api.get<UserProfile | CoreResponse<UserProfile>>("/users/me");
  const body = res.data;
  return "id" in body ? body : (body as CoreResponse<UserProfile>).content;
}

export type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  language_preference?: string;
};

export async function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  const res = await api.put<UserProfile | CoreResponse<UserProfile>>("/users/me", input);
  const body = res.data;
  return "id" in body ? body : (body as CoreResponse<UserProfile>).content;
}

export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.post("/users/me/change-password", input);
}

export async function uploadProfilePhoto(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append("photo", file);
  const res = await api.put<UserProfile | CoreResponse<UserProfile>>("/users/me/photo", form);
  const body = res.data;
  return "id" in body ? body : (body as CoreResponse<UserProfile>).content;
}

export async function deleteProfilePhoto(): Promise<UserProfile> {
  const res = await api.delete<UserProfile | CoreResponse<UserProfile>>("/users/me/photo");
  const body = res.data;
  return "id" in body ? body : (body as CoreResponse<UserProfile>).content;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/users/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/users/reset-password", { token, new_password: newPassword });
}

export type TwoFactorSetupResponse = {
  secret: string;
  otpauth_uri: string;
};

export async function setup2FA(): Promise<TwoFactorSetupResponse> {
  const res = await api.post<CoreResponse<TwoFactorSetupResponse>>("/users/me/2fa/setup");
  const body = res.data;
  return (body as CoreResponse<TwoFactorSetupResponse>).content;
}

export async function verify2FA(code: string): Promise<void> {
  await api.post("/users/me/2fa/verify", { code });
}

export async function disable2FA(code: string): Promise<void> {
  await api.post("/users/me/2fa/disable", { code });
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
}
