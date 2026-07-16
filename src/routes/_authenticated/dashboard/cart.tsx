import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ShoppingCart, Loader2, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import { getCart, removeCartItem, updateCartItem, clearCart } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/cart")({
  component: CartPage,
});

function CartPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => toast.error(t("cart.quantityError")),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("cart.removed"));
    },
    onError: () => toast.error(t("cart.removeError")),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("cart.cartCleared"));
    },
    onError: () => toast.error(t("cart.clearError")),
  });

  const items = cart?.items ?? [];

  const workshopIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      ids.add(item.workshop_id);
    }
    return [...ids];
  }, [items]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        to="/dashboard/marketplace"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("cart.continueShopping")}
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("cart.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("cart.productCount", "", { count: items.length, s: items.length !== 1 ? "s" : "" })} · $
            {cart?.total.toFixed(2) ?? "0.00"}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="ml-btn ml-btn-outline text-xs"
          >
            {clearMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            {t("cart.clearCart")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="ml-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-background">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <Link
                      to="/dashboard/parts/$id"
                      params={{ id: item.part_id }}
                      className="text-sm font-semibold transition-colors hover:text-primary"
                    >
                      {item.part_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.workshop_name}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">${item.part_price.toFixed(2)}</span> {t("cart.each")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => {
                        if (item.quantity > 1)
                          updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 });
                      }}
                      disabled={item.quantity <= 1 || updateMutation.isPending}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        updateMutation.mutate({ itemId: item.id, quantity: val });
                      }}
                      className="flex h-8 w-14 items-center justify-center border-x border-border bg-transparent text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() =>
                        updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                      }
                      disabled={updateMutation.isPending}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-mono text-lg font-bold">${item.subtotal.toFixed(2)}</p>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 ml-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">{t("cart.total")}</span>
              <span className="font-mono text-3xl font-bold">${cart!.total.toFixed(2)}</span>
            </div>
            <Link
              to="/dashboard/checkout"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {t("cart.checkout")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      ) : (
        <div className="ml-empty-state py-16">
          <ShoppingCart className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("cart.empty")}</p>
          <Link to="/dashboard/marketplace" className="ml-btn ml-btn-primary">
            {t("cart.goToMarketplace")}
          </Link>
        </div>
      )}
    </div>
  );
}
