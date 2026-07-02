import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  logout as apiLogout,
  getToken,
  decodeJwt,
  type UserProfile,
  type RegisterInput,
} from "./auth";
import type { Role } from "./token";

type AuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roles: Role[];
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const safetyTimeout = new Promise<void>((resolve) => {
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        resolve();
      }, 5000);
    });

    const fetchUser = getMe()
      .then(setUser)
      .catch(() => {
        apiLogout();
      })
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
        setIsLoading(false);
      });

    void Promise.race([fetchUser, safetyTimeout]);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await apiLogin(email, password);
    setUser(profile);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const profile = await apiRegister(input);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    apiLogout();
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    setUser(profile);
  }, []);

  const jwt = getToken() ? decodeJwt(getToken()!) : null;
  const roles = jwt?.roles ?? user?.roles ?? [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        roles,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return ctx;
}
