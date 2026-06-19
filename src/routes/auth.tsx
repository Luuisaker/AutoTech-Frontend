import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

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
        });
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const inputBase =
    "block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong [&:autofill]:shadow-[inset_0_0_0px_1000px_rgb(255,255,255,0)]";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface/40 p-4 text-foreground">
      <div className="flex min-h-[680px] w-full max-w-xl flex-col rounded-lg border border-border-strong bg-background p-6 shadow-sm sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LogoMark />
          <h1 className="text-xl font-semibold tracking-tight">AutoTech</h1>
        </div>

        <div className="mb-8 flex rounded-md border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`cursor-pointer flex-1 rounded-sm py-1.5 text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`cursor-pointer flex-1 rounded-sm py-1.5 text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <input name="first_name" required placeholder="Nombre" className={inputBase} />
                <input name="last_name" required placeholder="Apellido" className={inputBase} />
                <input name="ci" required placeholder="Cédula (V-)" className={inputBase} />
                <input name="phone" required placeholder="Teléfono" className={inputBase} />
              </div>
            )}

            <input
              name="email"
              type="email"
              required
              placeholder="Correo electrónico"
              className={inputBase}
            />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              className={inputBase}
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
              {mode === "login" ? "Ingresar a mi cuenta" : "Comenzar ahora"}
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

function LogoMark() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-md border border-border-strong bg-surface">
      <div className="h-3.5 w-3.5 rounded-sm bg-primary" />
    </div>
  );
}
