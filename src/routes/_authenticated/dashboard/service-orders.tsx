import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Wrench,
  Store,
  Calendar,
  Car,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { getServiceOrders, type ServiceOrderDTO } from "../../../lib/api";
import { useLocale } from "../../../lib/locale-context";

export const Route = createFileRoute("/_authenticated/dashboard/service-orders")({
  component: ServiceOrdersLayout,
});

function ServiceOrdersLayout() {
  const { pathname } = useLocation();
  if (pathname !== "/dashboard/service-orders") return <Outlet />;
  return <ServiceOrdersPage />;
}

const SERVICE_ORDER_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  REVISION_SENT: "Revisión enviada",
  AT_WORKSHOP: "En taller",
  QUOTED: "Presupuestado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  PENDING_VERIFICATION: "Pendiente",
  CLOSED: "Cerrado",
  DROPPED_OFF: "Entregado en el taller",
};

const SERVICE_ORDER_STYLES: Record<string, string> = {
  PENDING: "ml-badge ml-badge-warning",
  REVISION_SENT: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  AT_WORKSHOP: "ml-badge ml-badge-info",
  QUOTED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  ACCEPTED: "border border-green-500/30 bg-green-500/10 text-green-400",
  REJECTED: "ml-badge ml-badge-danger",
  IN_PROGRESS: "ml-badge ml-badge-info",
  COMPLETED: "ml-badge ml-badge-success",
  DELIVERED: "ml-badge ml-badge-success",
  CANCELLED: "ml-badge ml-badge-danger",
  PENDING_VERIFICATION: "ml-badge ml-badge-info",
  DROPPED_OFF: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
};

const OPEN_STATUSES = new Set([
  "PENDING", "REVISION_SENT", "AT_WORKSHOP", "QUOTED", "ACCEPTED",
  "REJECTED", "IN_PROGRESS", "COMPLETED", "DROPPED_OFF",
]);

function ServiceOrdersPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["service-orders"],
    queryFn: () => getServiceOrders(),
  });

  const openOrders = orders?.filter((o) => OPEN_STATUSES.has(o.status)) ?? [];
  const closedOrders = orders?.filter((o) => !OPEN_STATUSES.has(o.status)) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("serviceOrders.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("serviceOrders.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-6">
          {openOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("serviceOrders.active")}
              </h2>
              <div className="space-y-3">
                {openOrders.map((o) => (
                  <ServiceOrderRow key={o.id} order={o} />
                ))}
              </div>
            </div>
          )}
          {closedOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("serviceOrders.finished")}
              </h2>
              <div className="space-y-3">
                {closedOrders.map((o) => (
                  <ServiceOrderRow key={o.id} order={o} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="ml-empty-state py-16">
          <Wrench className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("serviceOrders.empty")}</p>
          <Link to="/dashboard/workshops" className="ml-btn ml-btn-primary">
            {t("serviceOrders.findWorkshops")}
          </Link>
        </div>
      )}
    </div>
  );
}

function ServiceOrderRow({ order }: { order: ServiceOrderDTO }) {
  const { t } = useLocale();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "AT_WORKSHOP":
        return <Wrench className="h-4 w-4" />;
      case "QUOTED":
        return <AlertCircle className="h-4 w-4" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <TrendingUp className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Link
      to="/dashboard/service-orders/$orderId"
      params={{ orderId: order.id }}
      className="group block"
    >
      <div className="ml-card p-4 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
        {/* Header con estado y precio */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-lg ${SERVICE_ORDER_STYLES[order.status] || SERVICE_ORDER_STYLES.PENDING} bg-opacity-20`}
            >
              {getStatusIcon(order.status)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {order.service_name}
              </h3>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SERVICE_ORDER_STYLES[order.status] || SERVICE_ORDER_STYLES.PENDING}`}
              >
                {t(`serviceOrders.status.${order.status}`, order.status)}
              </span>
            </div>
          </div>
          {order.final_price != null && (
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-foreground">
                ${order.final_price.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Información del taller y vehículo */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {order.workshop_name && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span>{order.workshop_name}</span>
            </div>
          )}
          {order.vehicle_brand && (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>
                {order.vehicle_brand} {order.vehicle_model}
              </span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                {order.vehicle_license_plate}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(order.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Footer con indicador de clic */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">{t("serviceOrders.clickForDetails")}</div>
          <div className="transform transition-transform duration-200 group-hover:translate-x-1">
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
