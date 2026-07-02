import { api } from "./axios";
import { setToken, clearToken, decodeJwt, getToken } from "./token";
import type { Role, JwtPayload } from "./token";

export type { Role, JwtPayload };
export { getToken, decodeJwt, clearToken };

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type CoreResponse<T> = {
  success: boolean;
  status_code: number;
  message: string;
  content: T;
};

export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  ci: string;
  phone: string;
  roles: Role[];
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

export async function login(email: string, password: string): Promise<UserProfile> {
  const res = await api.post<TokenResponse | CoreResponse<TokenResponse>>("/users/login", {
    email,
    password,
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

export function logout() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
}
