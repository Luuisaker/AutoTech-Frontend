import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, Plus, Loader2, ShieldAlert, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { getMyWorkshops } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/my-workshops")({
  component: MyWorkshopsPage,
});

function MyWorkshopsPage() {
  const { roles } = useAuth();
  
  // Barrera de seguridad de rol
  const isAuthorized = roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN");

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Acceso Denegado</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          No tienes los permisos necesarios para acceder a esta área. Debes ser dueño de un taller certificado o administrador.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return <AuthorizedWorkshopsView />;
}

function AuthorizedWorkshopsView() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: () => getMyWorkshops(),
  });

  const list = data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Talleres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra la información, el catálogo y las métricas de tus talleres.
          </p>
        </div>
        <Link
          to="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Taller
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-border bg-surface py-20">
          <Store className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">Aún no tienes talleres registrados</p>
          <p className="text-xs text-muted-foreground">
            Ve a la configuración de tu cuenta para registrar tu primer taller.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((w: any) => (
            <div key={w.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border border-border bg-surface p-5 transition-colors hover:border-border-strong">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-background">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{w.name}</h3>
                    {w.is_certified === 1 ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" /> Certificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                        <XCircle className="h-3 w-3" /> En Revisión
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{w.address}</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs font-mono text-muted-foreground">
                    <span>RIF: {w.rif}</span>
                    <span>⭐ {w.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex w-full sm:w-auto shrink-0 gap-2">
                <button className="flex-1 sm:flex-none rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-border/50">
                  Editar
                </button>
                <button className="flex-1 sm:flex-none rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
                  Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}