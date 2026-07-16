import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { es } from "./locales/es";
import { en } from "./locales/en";
import type { Locale, Translations } from "./locales/types";

const STORAGE_KEY = "autotech.language";

type LocaleState = {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  t: (path: string, fallback?: string, params?: Record<string, string | number>) => string;
};

const translations: Record<Locale, Translations> = { es, en };

function resolvePath(obj: Translations | string, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function getInitialLocale(): Locale {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang;
    if (lang === "en" || lang === "es") return lang;
  }
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  }
  return "es";
}

const LocaleContext = createContext<LocaleState | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((lang: Locale) => {
    setLocaleState(lang);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (path: string, fallback?: string, params?: Record<string, string | number>): string => {
      const result = resolvePath(translations[locale], path);
      let str = result ?? fallback ?? path;
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
        }
      }
      return str;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleState {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
