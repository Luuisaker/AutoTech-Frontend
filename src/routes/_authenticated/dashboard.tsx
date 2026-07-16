import { createFileRoute, Link, Outlet, useLocation, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Car, Store, ShoppingBag, ArrowRight, Loader2, Shield } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { useLocale } from "../../lib/locale-context";
import { getVehicles, getMyWorkshops, getMyOrders } from "../../lib/api";
import { getToken, decodeJwt } from "../../lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/dashboard") {
      const token = getToken();
      if (token) {
        const payload = decodeJwt(token);
        if (payload?.roles?.includes("ADMIN") || payload?.roles?.includes("SUPERADMIN")) {
          throw redirect({ to: "/dashboard/admin" });
        }
      }
    }
  },
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
  const { t, locale } = useLocale();

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const { data: workshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: getMyWorkshops,
    enabled: roles.includes("WORKSHOP_OWNER"),
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: getMyOrders,
  });

  const isWorkshopOwner = roles.includes("WORKSHOP_OWNER");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome")}, {user?.first_name ?? t("dashboard.user")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isWorkshopOwner
            ? t("dashboard.workshopOwnerDesc")
            : t("dashboard.clientDesc")}
        </p>
      </div>

      <div className="grid gap-4 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {!isWorkshopOwner && (
          <SummaryCard
            icon={Car}
            label={t("dashboard.vehicles")}
            count={vehicles?.length ?? 0}
            loading={vehiclesLoading}
            to="/dashboard/vehicles"
          />
        )}
        {isWorkshopOwner && (
          <SummaryCard
            icon={Store}
            label={t("dashboard.workshops")}
            count={workshops?.length ?? 0}
            loading={workshopsLoading}
            to="/dashboard/my-workshops"
          />
        )}
        <SummaryCard
          icon={ShoppingBag}
          label={t("dashboard.orders")}
          count={orders?.length ?? 0}
          loading={false}
          to="/dashboard/purchases"
        />
        {roles.includes("ADMIN") || roles.includes("SUPERADMIN") ? (
          <Link to="/dashboard/admin" className="group ml-card flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 transition-transform ease-out group-hover:scale-105">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.admin")}</p>
              <p className="text-2xl font-bold tracking-tight">{t("dashboard.panel")}</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {!isWorkshopOwner && (
          <section className="ml-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t("dashboard.myVehicles")}</h2>
              <Link
                to="/dashboard/vehicles"
                className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
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
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {v.brand} {v.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.license_plate} · {v.year}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {v.vehicle_type === "CAR" ? t("dashboard.vehicleTypeCar") : t("dashboard.vehicleTypeMoto")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Car className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noVehicles")}</p>
                <Link to="/dashboard/vehicles" className="ml-btn ml-btn-primary text-xs">
                  {t("dashboard.registerVehicle")}
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="ml-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("dashboard.recentOrders")}</h2>
            <Link
              to="/dashboard/purchases"
              className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {orders && orders.length > 0 ? (
            <ul className="space-y-2">
              {orders.slice(0, 3).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{t("dashboard.orderId")} #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString(locale === "en" ? "en-US" : "es-ES")}</p>
                  </div>
                  <OrderBadge status={o.status} t={t} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t("dashboard.noOrders")}</p>
              <Link to="/dashboard/marketplace" className="ml-btn ml-btn-primary text-xs">
                {t("dashboard.goToMarketplace")}
              </Link>
            </div>
          )}
        </section>
      </div>

      {isWorkshopOwner && (
        <section className="ml-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("dashboard.myWorkshops")}</h2>
            <Link
              to="/dashboard/my-workshops"
              className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("common.manage")} <ArrowRight className="h-3 w-3" />
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
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.address}</p>
                  </div>
                  <CertificationBadge isCertified={w.is_certified} t={t} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Store className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t("dashboard.noWorkshops")}</p>
              <Link to="/dashboard/settings" className="ml-btn ml-btn-primary text-xs">
                {t("dashboard.registerWorkshop")}
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
    <Link to={to as any} className="group ml-card flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 transition-transform ease-out group-hover:scale-105">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : count}
        </p>
      </div>
      <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
    </Link>
  );
}

function OrderBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const key = `dashboard.orderStatus.${status}` as const;
  const styles: Record<string, string> = {
    PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    FINANCED: "border border-primary/30 bg-primary/10 text-primary",
    CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
    PENDING_CONFIRMATION: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
    CONFIRMED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
    SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
    RECEIVED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
    PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
    PENDING_VERIFICATION: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[status] || styles.FINANCED}`}
    >
      {t(key) || status}
    </span>
  );
}

function CertificationBadge({ isCertified, t }: { isCertified: boolean | number; t: (key: string) => string }) {
  const certified = isCertified === true || isCertified === 1;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        certified
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
      }`}
    >
      {certified ? t("dashboard.certified") : t("dashboard.pending")}
    </span>
  );
}
