export const TOKEN_KEY = "autotech.access_token";

export type Role = "CLIENT" | "WORKSHOP_OWNER" | "ADMIN" | "SUPERADMIN";

export type JwtPayload = {
  sub: string;
  roles: Role[];
  exp: number;
};

// Deterministic UUID mapping — must match backend src/modules/users/infrastructure/auth.py
// Generated with uuid5(NAMESPACE_DNS, roleName)
const ROLE_UUID_TO_NAME: Record<string, Role> = {
  "1aacff12-1384-528e-830e-7f010c74b35d": "CLIENT",
  "2ab72e2e-3444-5338-aa32-9f888db748a8": "WORKSHOP_OWNER",
  "f818d6f0-9053-50b5-8529-d7631ded9f4c": "ADMIN",
  "0d9a1bb8-16ff-5f61-9e18-4fb40f3180ac": "SUPERADMIN",
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
    // Map role UUIDs back to role names (JWT stores UUIDs for security)
    payload.roles = payload.roles.map((r) => ROLE_UUID_TO_NAME[r as string] ?? r);
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
