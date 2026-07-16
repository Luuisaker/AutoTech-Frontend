import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShoppingBag, DollarSign, Calendar } from "lucide-react";
import { getWorkshopSales, getWorkshop, type WorkshopSaleDTO } from "../../../lib/api";
import { useLocale } from "../../../lib/locale-context";

export const Route = createFileRoute("/_authenticated/dashboard/parts")({
  component: PartsLayout,
});

function PartsLayout() {
  const { pathname } = useLocation();
  if (pathname !== "/dashboard/parts") return <Outlet />;
  return <WorkshopSalesPage />;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  FINANCED: "Financiada",
  SHIPPED: "Enviado",
  RECEIVED: "Recibido",
  CLOSED: "CERRADA",
  CANCELLED: "Cancelada",
  PENDING_CONFIRMATION: "Pendiente de confirmación",
  CONFIRMED: "Confirmada",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  FINANCED: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  RECEIVED: "border border-teal-500/30 bg-teal-500/10 text-teal-400",
  CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
  PENDING_CONFIRMATION: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  CONFIRMED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
};

function WorkshopSalesPage() {
  const { t } = useLocale();
  // @ts-expect-error — route has no params, this page is only shown at exact path /dashboard/parts
  const { workshopId } = Route.useParams();

  const { data: workshop } = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: () => getWorkshop(workshopId),
    enabled: !!workshopId,
  });

  const { data: sales, isLoading } = useQuery({
    queryKey: ["workshop-sales", workshopId],
    queryFn: () => getWorkshopSales(workshopId),
    enabled: !!workshopId,
  });

  const totalRevenue = sales?.reduce((s, p) => s + p.total_amount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/dashboard/my-workshops"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("parts.backToWorkshops")}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("parts.sales")}{workshop ? ` — ${workshop.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("parts.salesDesc")}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">{t("parts.totalSales")}</p>
          <p className="mt-1 font-mono text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">{t("parts.transactions")}</p>
          <p className="mt-1 font-mono text-2xl font-bold">{sales?.length ?? 0}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sales && sales.length > 0 ? (
        <div className="space-y-3">
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t("parts.noSales")}</p>
        </div>
      )}
    </div>
  );
}

function SaleRow({ sale }: { sale: WorkshopSaleDTO }) {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-background">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[sale.status] || STATUS_STYLES.PENDING}`}
            >
              {t(`shared.orderStatus.${sale.status}`, sale.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {sale.quantity} {t("parts.units", "", { s: sale.quantity !== 1 ? "s" : "" })} · $
            {sale.total_amount.toFixed(2)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(sale.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>{sale.vehicle_id.slice(0, 8)}…</span>
            {sale.installment_count > 0 && (
              <span>
                {sale.installment_count} {t("parts.installments", "", { s: sale.installment_count > 1 ? "s" : "" })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-base font-semibold">${sale.total_amount.toFixed(2)}</p>
      </div>
    </div>
  );
}
