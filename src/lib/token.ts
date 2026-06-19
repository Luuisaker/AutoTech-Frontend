export const TOKEN_KEY = "autotech.access_token";

export type Role = "CLIENT" | "WORKSHOP_OWNER" | "ADMIN";

export type JwtPayload = {
  sub: string;
  roles: Role[];
  exp: number;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
    const payload = JSON.parse(json) as JwtPayload & { role?: Role };
    if (!payload.roles) {
      payload.roles = payload.role ? [payload.role] : [];
    }
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
