import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Loader2, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getCart, removeCartItem, clearCart } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/cart")({
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Producto eliminado del carrito");
    },
    onError: () => toast.error("Error al eliminar el producto"),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Carrito vaciado");
    },
    onError: () => toast.error("Error al vaciar el carrito"),
  });

  const items = cart?.items ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/dashboard/marketplace"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Seguir comprando
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Carrito de compras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} producto{items.length !== 1 ? "s" : ""} · $
            {cart?.total.toFixed(2) ?? "0.00"}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            {clearMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Vaciar carrito
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-background">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <Link
                      to="/dashboard/parts/$id"
                      params={{ id: item.part_id }}
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      {item.part_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.workshop_name}</p>
                    <p className="mt-1 text-sm">
                      {item.quantity} × ${item.part_price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-base font-semibold">${item.subtotal.toFixed(2)}</p>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Total</span>
              <span className="font-mono text-2xl font-bold">${cart!.total.toFixed(2)}</span>
            </div>
            <Link
              to="/dashboard/checkout"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Proceder al pago
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">Tu carrito está vacío</p>
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
