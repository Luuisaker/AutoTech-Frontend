import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Loader2, ArrowRight, Truck, MapPin, Store, CreditCard } from "lucide-react";
import { getMyOrders, type OrderDTO } from "../../../lib/api";
import { useLocale } from "../../../lib/locale-context";

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  component: PurchasesLayout,
});

function PurchasesLayout() {
  const { pathname } = useLocation();
  if (pathname !== "/dashboard/purchases") return <Outlet />;
  return <PurchasesPage />;
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  FINANCED: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  RECEIVED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
  PENDING_CONFIRMATION: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  CONFIRMED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  PENDING_VERIFICATION: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
};

const CLOSED_STATUSES = ["RECEIVED", "CANCELLED", "CLOSED"];

function PurchasesPage() {
  const { t } = useLocale();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => getMyOrders(),
  });

  const activeOrders = orders?.filter((o) => !CLOSED_STATUSES.includes(o.status)) ?? [];
  const closedOrders = orders?.filter((o) => CLOSED_STATUSES.includes(o.status)) ?? [];
  const hasAny = (orders?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("purchases.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("purchases.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : hasAny ? (
        <div className="space-y-10">
          {activeOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">{t("purchases.active")}</h2>
              <div className="space-y-3">
                {activeOrders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            </section>
          )}
          {closedOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">{t("purchases.closed")}</h2>
              <div className="space-y-3">
                {closedOrders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="ml-empty-state py-16">
          <ShoppingBag className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("purchases.empty")}</p>
          <Link to="/dashboard/marketplace" className="ml-btn ml-btn-primary">
            {t("purchases.goToMarketplace")}
          </Link>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: OrderDTO }) {
  const { t } = useLocale();
  const itemCount = order.items?.length ?? 0;
  return (
    <Link
      to="/dashboard/purchases/$purchaseId"
      params={{ purchaseId: order.id }}
      className="ml-card block p-4 sm:p-5"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl border border-border bg-background">
          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium truncate min-w-0">
              <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{order.workshop_name ?? t("purchases.unknownWorkshop")}</span>
            </span>
            <span className={`ml-badge shrink-0 ${STATUS_STYLES[order.status] || STATUS_STYLES.FINANCED}`}>
              {t(`purchases.status.${order.status}`, order.status)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground truncate">
              {t("purchases.products", "", { count: itemCount, s: itemCount !== 1 ? "s" : "" })} · ${order.total_amount.toFixed(2)}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(order.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {order.installment_count > 0 && (
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {t("purchases.installments", "", { count: order.installment_count, s: order.installment_count > 1 ? "s" : "" })}
              </span>
            )}
            {order.delivery_method && (
              <span className="flex items-center gap-1">
                {order.delivery_method === "SHIPPING" ? (
                  <>
                    <Truck className="h-3 w-3" />
                    {t("purchases.shipping")}
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3" />
                    {t("purchases.pickup")}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
      </div>
    </Link>
  );
}
