import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { AxiosError } from "axios";
import { ArrowLeft, Loader2, ShoppingCart, Car, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getCart, getVehicles, checkout, type Vehicle } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vehicleId, setVehicleId] = useState("");
  const [mileage, setMileage] = useState(0);
  const [installmentCount, setInstallmentCount] = useState(0);

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const allAllowInstallments = cart?.items?.every((i) => i.workshop_id != null);

  const checkoutMutation = useMutation({
    mutationFn: () =>
      checkout({
        vehicle_id: vehicleId,
        mileage,
        installment_count: installmentCount,
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Compra realizada exitosamente");
      navigate({
        to: "/dashboard/purchases/$purchaseId",
        params: { purchaseId: order.id },
      });
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      const data = err.response?.data;
      const msg = data?.message ?? data?.detail ?? "Error al procesar la compra";
      toast.error(msg);
    },
  });

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link
          to="/dashboard/cart"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">Tu carrito está vacío</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/dashboard/cart"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al carrito
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Finalizar compra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} producto{items.length !== 1 ? "s" : ""} en tu carrito
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Car className="h-4 w-4" />
              Vehículo
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Seleccionar vehículo
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                >
                  <option value="">Seleccionar vehículo</option>
                  {vehicles?.map((v: Vehicle) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} {v.year} — {v.license_plate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Kilometraje actual
                </label>
                <input
                  type="number"
                  min={0}
                  value={mileage}
                  onChange={(e) => setMileage(Math.max(0, Number(e.target.value)))}
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Cuotas (0 = pago completo)
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={installmentCount}
                  onChange={(e) =>
                    setInstallmentCount(Math.min(Math.max(0, Number(e.target.value)), 24))
                  }
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-4">
            <div className="rounded-lg border border-border bg-surface p-6">
              <h2 className="mb-4 text-sm font-semibold">Resumen</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.part_name} × {item.quantity}
                    </span>
                    <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="font-medium">Total</span>
                <span className="font-mono text-lg font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            {checkoutMutation.error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {(
                  checkoutMutation.error as AxiosError<{
                    message?: string;
                  }>
                ).response?.data?.message ?? "Error al procesar la compra"}
              </div>
            )}

            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending || !vehicleId || items.length === 0}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {!vehicleId
                ? "Selecciona un vehículo"
                : checkoutMutation.isPending
                  ? "Procesando..."
                  : "Confirmar compra"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
