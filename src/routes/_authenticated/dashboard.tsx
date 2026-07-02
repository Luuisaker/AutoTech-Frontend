import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Car, Store, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { getVehicles, getMyWorkshops, getMyOrders } from "../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { pathname } = useLocation();
  const isChildActive = pathname !== "/dashboard";

  if (isChildActive) return <Outlet />;

  return (
    <>
      <DashboardPage />
      <Outlet />
    </>
  );
}

function DashboardPage() {
  const { user, roles } = useAuth();

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const { data: workshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: getMyWorkshops,
    enabled: roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN"),
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: getMyOrders,
  });

  const isWorkshopOwner = roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN");

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido, {user?.first_name ?? "Usuario"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isWorkshopOwner
            ? "Gestiona tus talleres, productos y órdenes desde un solo lugar."
            : "Administra tus vehículos y accede a la red de talleres certificados."}
        </p>
      </div>

      <div className={`grid gap-3 ${isWorkshopOwner ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {!isWorkshopOwner && (
          <SummaryCard
            icon={Car}
            label="Vehículos"
            count={vehicles?.length ?? 0}
            loading={vehiclesLoading}
            to="/dashboard/vehicles"
          />
        )}
        {isWorkshopOwner && (
          <SummaryCard
            icon={Store}
            label="Talleres"
            count={workshops?.length ?? 0}
            loading={workshopsLoading}
            to="/dashboard/my-workshops"
          />
        )}
        <SummaryCard
          icon={ShoppingBag}
          label="Órdenes"
          count={orders?.length ?? 0}
          loading={false}
          to="/dashboard/purchases"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {!isWorkshopOwner && (
          <section className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Mis Vehículos</h2>
              <Link
                to="/dashboard/vehicles"
                className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {vehiclesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : vehicles && vehicles.length > 0 ? (
              <ul className="space-y-2">
                {vehicles.slice(0, 3).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {v.brand} {v.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.license_plate} · {v.year}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {v.vehicle_type === "CAR" ? "Auto" : "Moto"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Car className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aún no has registrado vehículos</p>
                <Link
                  to="/dashboard/vehicles"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Registrar vehículo
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Órdenes Recientes</h2>
            <Link
              to="/dashboard/purchases"
              className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {orders && orders.length > 0 ? (
            <ul className="space-y-2">
              {orders.slice(0, 3).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">Orden #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <OrderBadge status={o.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No tienes órdenes activas</p>
              <Link
                to="/dashboard/marketplace"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ir al marketplace
              </Link>
            </div>
          )}
        </section>
      </div>

      {isWorkshopOwner && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Mis Talleres</h2>
            <Link
              to="/dashboard/my-workshops"
              className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Gestionar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {workshopsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : workshops && workshops.length > 0 ? (
            <ul className="space-y-2">
              {workshops.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.address}</p>
                  </div>
                  <CertificationBadge isCertified={w.is_certified} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Store className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aún no has registrado talleres</p>
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Registrar taller
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  count,
  loading,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  loading: boolean;
  to: string;
}) {
  return (
    <Link
      to={to as any}
      className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-5 transition-all hover:border-border-strong"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 transition-transform ease-out group-hover:scale-[1.03]">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : count}
        </p>
      </div>
      <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function OrderBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    PAID: "Pagada",
    FINANCED: "Financiada",
    CANCELLED: "Cancelada",
  };
  const styles: Record<string, string> = {
    PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    FINANCED: "border border-primary/30 bg-primary/10 text-primary",
    CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[status] || styles.FINANCED}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function CertificationBadge({ isCertified }: { isCertified: boolean | number }) {
  const certified = isCertified === true || isCertified === 1;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        certified
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
      }`}
    >
      {certified ? "Certificado" : "Pendiente"}
    </span>
  );
}
