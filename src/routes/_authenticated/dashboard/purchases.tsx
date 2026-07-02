import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { getMyOrders, type OrderDTO } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  component: PurchasesPage,
});

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pagada",
  FINANCED: "Financiada",
  CANCELLED: "Cancelada",
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  FINANCED: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
};

function PurchasesPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => getMyOrders(),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Mis Órdenes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de compras y estado de pagos.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">Aún no has realizado compras</p>
          <Link
            to="/dashboard/marketplace"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al marketplace
          </Link>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: OrderDTO }) {
  const itemCount = order.items?.length ?? 0;
  return (
    <Link
      to="/dashboard/purchases/$purchaseId"
      params={{ purchaseId: order.id }}
      className="flex items-center justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-background">
          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[order.status] || STATUS_STYLES.FINANCED}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {itemCount} producto{itemCount !== 1 ? "s" : ""} · ${order.total_amount.toFixed(2)}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>
              {new Date(order.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {order.installment_count > 0 && (
              <span>
                {order.installment_count} cuota{order.installment_count > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
