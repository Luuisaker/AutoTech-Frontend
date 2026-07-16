import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import type { AxiosError } from "axios";
import { Loader2, Mail, Lock, User, Smartphone, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useLocale } from "../lib/locale-context";
import { Logo } from "../components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    const result: { mode?: "login" | "register"; type?: "client" | "workshop" } = {};
    if (search.mode === "register") {
      result.mode = "register";
    }
    if (search.type === "client" || search.type === "workshop") {
      result.type = search.type;
    }
    return result;
  },
  component: AuthPage,
});

const inputBase =
  "block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong [&:autofill]:shadow-[inset_0_0_0px_1000px_rgb(255,255,255,0)]";

function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const { t } = useLocale();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [accountType, setAccountType] = useState<"client" | "workshop">(search.type ?? "client");

  useEffect(() => {
    if (search.mode === "register") {
      setMode("register");
    }
  }, [search.mode]);

  useEffect(() => {
    if (search.type === "client" || search.type === "workshop") {
      setAccountType(search.type);
    }
  }, [search.type]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ciPrefix, setCiPrefix] = useState("V");
  const [ciNumber, setCiNumber] = useState("");
  const [ciOpen, setCiOpen] = useState(false);
  const ciRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ciOpen) return;
    const handler = (e: MouseEvent) => {
      if (ciRef.current && !ciRef.current.contains(e.target as Node)) {
        setCiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ciOpen]);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  useEffect(() => {
    setError(null);
    setFieldErrors({});
  }, [mode, accountType]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  function validateForm(formData: FormData): Record<string, string> {
    const errors: Record<string, string> = {};
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("auth.invalidEmail");
    }
    if (!password || password.length < 6) {
      errors.password = t("auth.passwordMinLength");
    }

    if (mode === "register") {
      const firstName = formData.get("first_name") as string;
      const lastName = formData.get("last_name") as string;
      const phone = formData.get("phone") as string;
      const ciDigits = formData.get("ci_number") as string;

      if (!firstName || firstName.trim().length < 2) {
        errors.first_name = t("auth.nameMinLength");
      }
      if (!lastName || lastName.trim().length < 2) {
        errors.last_name = t("auth.lastnameMinLength");
      }
      if (!ciDigits || !/^\d{6,9}$/.test(ciDigits)) {
        errors.ci = t("auth.invalidCI");
      }
      if (!phone || !/^(\+58|0)?4(12|14|16|24|26)\d{7}$/.test(phone.replace(/[\s\-\(\)]/g, ""))) {
        errors.phone = t("auth.invalidPhone");
      }
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "login") {
        await login(formData.get("email") as string, formData.get("password") as string, totpCode || undefined);
      } else {
        const ciPrefixVal = formData.get("ci_prefix") as string || "V";
        const ciNumberVal = formData.get("ci_number") as string || "";
        await register({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          first_name: formData.get("first_name") as string,
          last_name: formData.get("last_name") as string,
          ci: `${ciPrefixVal}-${ciNumberVal}`,
          phone: formData.get("phone") as string,
          role: accountType === "workshop" ? "WORKSHOP_OWNER" : "CLIENT",
        });
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: unknown; message?: string }>;
      const detail = axiosErr.response?.data?.detail;
      let msg = axiosErr.response?.data?.message ?? axiosErr.message;

      if (axiosErr.response?.status === 422 && detail) {
        if (Array.isArray(detail)) {
          const first = detail[0] as { loc?: string[]; msg?: string } | undefined;
          msg = first?.msg ?? t("auth.invalidData");
        } else if (typeof detail === "string") {
          msg = detail;
        }
      }

      if (msg?.toLowerCase().includes("dos factores") || msg?.toLowerCase().includes("two-factor")) {
        setNeeds2FA(true);
        setError(null);
      } else {
        setError(msg || t("common.unknownError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4 text-foreground">
      <div
        className={
          "flex w-full max-w-xl flex-col rounded-2xl border border-border bg-surface p-6 shadow-lg " +
          (mode === "login" ? "sm:p-8" : "sm:p-10")
        }
      >
        <div className={"flex flex-col items-center gap-3 " + (mode === "login" ? "mb-4" : "mb-6")}>
          <Logo size={40} />
          <h1 className="text-2xl font-bold tracking-tight">AutoTech</h1>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
          </p>
        </div>

        <div className="mb-6 flex rounded-xl border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`cursor-pointer flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`cursor-pointer flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("auth.register")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="space-y-4">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setAccountType("client")}
                    className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all ${
                      accountType === "client"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("auth.iAmOwner")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("workshop")}
                    className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all ${
                      accountType === "workshop"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("auth.iAmWorkshop")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    name="first_name"
                    required
                    placeholder={t("auth.firstName")}
                    icon={User}
                    autoComplete="given-name"
                    error={fieldErrors.first_name}
                  />
                  <Field
                    name="last_name"
                    required
                    placeholder={t("auth.lastName")}
                    icon={User}
                    autoComplete="family-name"
                    error={fieldErrors.last_name}
                  />
                  <div className="space-y-1">
                    <div className="relative">
                      <div className={`flex rounded-md border bg-transparent transition-colors focus-within:border-border-strong focus-within:ring-1 focus-within:ring-border-strong ${
                        fieldErrors.ci ? "border-red-500" : "border-border"
                      }`}>
                        <input type="hidden" name="ci_prefix" value={ciPrefix} />
                        <div className="relative" ref={ciRef}>
                          <button
                            type="button"
                            onClick={() => setCiOpen(!ciOpen)}
                            className="flex cursor-pointer items-center gap-1 border-r border-border bg-surface px-2.5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface/80 transition-colors"
                          >
                            {ciPrefix}
                            <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {ciOpen && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-14 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
                              <button
                                type="button"
                                onClick={() => { setCiPrefix("V"); setCiOpen(false); }}
                                className={`block w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors ${
                                  ciPrefix === "V" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface/80"
                                }`}
                              >
                                V
                              </button>
                              <button
                                type="button"
                                onClick={() => { setCiPrefix("E"); setCiOpen(false); }}
                                className={`block w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors ${
                                  ciPrefix === "E" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-surface/80"
                                }`}
                              >
                                E
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          name="ci_number"
                          required
                          placeholder="12345678"
                          autoComplete="off"
                          value={ciNumber}
                          onChange={(e) => setCiNumber(e.target.value.replace(/\D/g, ""))}
                          maxLength={9}
                          inputMode="numeric"
                          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                        />
                      </div>
                    </div>
                    {fieldErrors.ci && <p className="text-xs text-red-400">{fieldErrors.ci}</p>}
                  </div>
                  <Field
                    name="phone"
                    required
                    placeholder={t("auth.phone")}
                    icon={Smartphone}
                    autoComplete="tel"
                    type="tel"
                    error={fieldErrors.phone}
                  />
                </div>

                {accountType === "workshop" && (
                  <p className="rounded-md border border-border bg-surface/40 p-3 text-xs text-muted-foreground">
                    {t("auth.workshopRegisterNote")}
                  </p>
                )}
              </>
            )}

            <Field
              name="email"
              type="email"
              required
              placeholder={t("auth.email")}
              icon={Mail}
              autoComplete="email"
              error={fieldErrors.email}
            />
            <Field
              name="password"
              type="password"
              required
              minLength={6}
              placeholder={t("auth.password")}
              icon={Lock}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              error={fieldErrors.password}
            />
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            )}
            {mode === "login" && needs2FA && (
              <div className="space-y-1">
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t("auth.totpCode")}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputBase} pl-10 tracking-[0.3em] text-center font-mono`}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("auth.totpHelp")}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className={"space-y-4 " + (mode === "login" ? "pt-4" : "pt-6")}>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer ml-btn ml-btn-primary h-11 w-full text-sm"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login"
                ? t("auth.loginButton")
                : accountType === "workshop"
                  ? t("auth.registerWorkshopButton")
                  : t("auth.registerOwnerButton")}
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("auth.backToHome")}
              </Link>
            </div>
          </div>
        </form>
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{t("auth.forgotModalTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.forgotModalDesc")}
            </p>

            {forgotSent ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  {t("auth.forgotSent")}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotSent(false);
                  }}
                  className="ml-btn ml-btn-outline w-full"
                >
                  {t("auth.forgotBack")}
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotSubmitting(true);
                  setForgotError(null);
                  try {
                    const { forgotPassword } = await import("../lib/auth");
                    await forgotPassword(forgotEmail);
                    setForgotSent(true);
                  } catch (err: any) {
                    setForgotError(
                      err?.response?.data?.message ?? err.message ?? "Error al enviar el correo",
                    );
                  } finally {
                    setForgotSubmitting(false);
                  }
                }}
                className="mt-6 space-y-4"
              >
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("auth.forgotEmailLabel")}
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder={t("auth.forgotEmailPlaceholder")}
                      className="ml-input"
                    />
                </div>

                {forgotError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {forgotError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    disabled={forgotSubmitting}
                    className="ml-btn ml-btn-outline"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="ml-btn ml-btn-primary"
                  >
                    {forgotSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("auth.forgotSendLink")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  icon: Icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          {...props}
          className={`${inputBase} pl-10 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

