import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { Loader2, Mail, Lock, User, CreditCard, Smartphone } from "lucide-react";
import { useAuth } from "../lib/auth-context";

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
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [accountType, setAccountType] = useState<"client" | "workshop">(
    search.type ?? "client"
  );

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
      errors.email = "Ingresa un correo electrónico válido.";
    }
    if (!password || password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (mode === "register") {
      const firstName = formData.get("first_name") as string;
      const lastName = formData.get("last_name") as string;
      const ci = formData.get("ci") as string;
      const phone = formData.get("phone") as string;

      if (!firstName || firstName.trim().length < 2) {
        errors.first_name = "El nombre debe tener al menos 2 caracteres.";
      }
      if (!lastName || lastName.trim().length < 2) {
        errors.last_name = "El apellido debe tener al menos 2 caracteres.";
      }
      if (!ci || !/^[VVEEPJGC]-?\d{6,14}$/i.test(ci)) {
        errors.ci = "Cédula inválida. Usa formato V12345678.";
      }
      if (!phone || !/^(0)?4(12|14|16|24|26)\d{7}$/.test(phone.replace(/\D/g, ""))) {
        errors.phone = "Teléfono inválido. Usa formato 04141234567.";
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
        await login(formData.get("email") as string, formData.get("password") as string);
      } else {
        await register({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          first_name: formData.get("first_name") as string,
          last_name: formData.get("last_name") as string,
          ci: formData.get("ci") as string,
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
          msg = first?.msg ?? "Datos inválidos. Revisa los campos.";
        } else if (typeof detail === "string") {
          msg = detail;
        }
      }

      setError(msg || "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="relative">
          <div className="grid h-24 w-24 place-items-center rounded-2xl border border-border-strong bg-surface shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-14 w-14 animate-bounce text-primary"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="4" width="16" height="12" rx="2" />
              <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
              <path d="M8 14h8" />
              <path d="M6 16v3" />
              <path d="M18 16v3" />
              <path d="M12 16v4" />
              <path d="M10 20h4" />
            </svg>
          </div>
          <div className="absolute -bottom-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/20" />
        </div>
        <div>
          <p className="text-base font-medium">Iniciando sistemas...</p>
          <p className="mt-1 text-sm text-muted-foreground">El robot de AutoTech está preparando tu garaje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface/40 p-4 text-foreground">
      <div className="flex w-full max-w-xl flex-col rounded-lg border border-border-strong bg-background p-6 sm:min-h-[680px] sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-3">
          <LogoMark />
          <h1 className="text-xl font-semibold tracking-tight">AutoTech</h1>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Ingresa para gestionar tu vehículo y tus compras" : "Crea tu cuenta y accede al ecosistema automotriz"}
          </p>
        </div>

        <div className="mb-8 flex rounded-md border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`cursor-pointer flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`cursor-pointer flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="space-y-4">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setAccountType("client")}
                    className={`cursor-pointer rounded-sm py-1.5 text-xs font-medium transition-colors ${
                      accountType === "client"
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Soy propietario
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("workshop")}
                    className={`cursor-pointer rounded-sm py-1.5 text-xs font-medium transition-colors ${
                      accountType === "workshop"
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Soy taller
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    name="first_name"
                    required
                    placeholder="Nombre"
                    icon={User}
                    autoComplete="given-name"
                    error={fieldErrors.first_name}
                  />
                  <Field
                    name="last_name"
                    required
                    placeholder="Apellido"
                    icon={User}
                    autoComplete="family-name"
                    error={fieldErrors.last_name}
                  />
                  <Field
                    name="ci"
                    required
                    placeholder="Cédula (V-)"
                    icon={CreditCard}
                    autoComplete="off"
                    error={fieldErrors.ci}
                  />
                  <Field
                    name="phone"
                    required
                    placeholder="Teléfono"
                    icon={Smartphone}
                    autoComplete="tel"
                    type="tel"
                    error={fieldErrors.phone}
                  />
                </div>

                {accountType === "workshop" && (
                  <p className="rounded-md border border-border bg-surface/40 p-3 text-xs text-muted-foreground">
                    Después de registrarte podrás registrar tus talleres desde la sección "Mis Talleres".
                  </p>
                )}
              </>
            )}

            <Field
              name="email"
              type="email"
              required
              placeholder="Correo electrónico"
              icon={Mail}
              autoComplete="email"
              error={fieldErrors.email}
            />
            <Field
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              icon={Lock}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              error={fieldErrors.password}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-auto space-y-5 pt-8">
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login"
                ? "Ingresar a mi cuenta"
                : accountType === "workshop"
                  ? "Crear cuenta de dueño de taller"
                  : "Crear cuenta de propietario"}
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </form>
      </div>
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

function LogoMark() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-md border border-border-strong bg-surface">
      <div className="h-3.5 w-3.5 rounded-sm bg-primary" />
    </div>
  );
}
