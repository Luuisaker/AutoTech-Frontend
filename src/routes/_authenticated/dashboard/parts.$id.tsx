import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wrench,
  ShoppingCart,
  Check,
  Store,
  MapPin,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPart,
  getWorkshop,
  addToCart,
  getCart,
  getPhotoUrl,
  getMyWorkshops,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/parts/$id")({
  component: PartDetailPage,
});

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  USED: "Usado",
};

const CATEGORY_LABELS: Record<string, string> = {
  ENGINE: "Motor",
  ELECTRICAL: "Eléctrico",
  BODY: "Carrocería",
  SUSPENSION: "Suspensión",
  BRAKES: "Frenos",
  TRANSMISSION: "Transmisión",
  EXHAUST: "Escape",
  COOLING: "Refrigeración",
  INTERIOR: "Interior",
  CONSUMABLE: "Consumible",
  OTHER: "Otro",
};

function PartDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const {
    data: part,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["part", id],
    queryFn: () => getPart(id),
  });

  const { data: workshop } = useQuery({
    queryKey: ["workshop", part?.workshop_id],
    queryFn: () => getWorkshop(part!.workshop_id),
    enabled: !!part,
  });

  const { data: myWorkshops } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: getMyWorkshops,
    enabled: !!roles?.includes("WORKSHOP_OWNER"),
  });
  const myWorkshopIds = useMemo(() => new Set(myWorkshops?.map((w) => w.id) ?? []), [myWorkshops]);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const cartItem = cart?.items?.find((i) => i.part_id === id);
  const isInCart = !!cartItem;

  const addMutation = useMutation({
    mutationFn: (qty: number) => addToCart(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Agregado al carrito");
    },
    onError: () => {
      toast.error("Error al agregar al carrito");
    },
  });

  const isOwnProduct = part ? myWorkshopIds.has(part.workshop_id) : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm font-medium">Producto no encontrado</p>
        <Link
          to="/dashboard/marketplace"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver al marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        to="/dashboard/marketplace"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className="relative flex h-full w-full items-center justify-center p-10">
              {part.photo_url ? (
                <img
                  src={getPhotoUrl(part.photo_url)}
                  alt={part.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Wrench className="h-32 w-32 text-border opacity-40" />
              )}
              {part.category && (
                <span className="absolute left-4 top-4 ml-badge ml-badge-success">
                  {CATEGORY_LABELS[part.category] ?? part.category}
                </span>
              )}
              <span className="absolute right-4 top-4 ml-badge border border-border bg-surface text-muted-foreground">
                {CONDITION_LABELS[part.condition] ?? part.condition}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-bold tracking-tight">{part.name}</h1>
            {part.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {part.description}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoChip icon={Package} label="Stock" value={String(part.stock)} />
            <InfoChip
              icon={ShieldCheck}
              label="Certificado"
              value={workshop?.is_certified ? "Sí" : "No"}
            />
            <InfoChip
              icon={CreditCard}
              label="Cuotas"
              value={part.allows_installments ? "Disponible" : "No disponible"}
            />
            <InfoChip
              icon={part.is_active ? CheckCircle2 : XCircle}
              label="Estado"
              value={part.is_active ? "Activo" : "Inactivo"}
            />
          </div>

          {workshop && (
            <div className="mt-6 ml-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Store className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Taller
                </p>
              </div>
              <p className="font-medium">{workshop.name}</p>
              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{workshop.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{workshop.average_rating.toFixed(1)} / 5</span>
                </div>
                {workshop.rif && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono">RIF: {workshop.rif}</span>
                  </div>
                )}
              </div>
              {workshop.photo_url && (
                <div className="mt-3 overflow-hidden rounded-lg border border-border">
                  <img
                    src={getPhotoUrl(workshop.photo_url)}
                    alt={workshop.name}
                    className="h-32 w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8 ml-card p-6">
            <p className="text-xs text-muted-foreground">Precio unitario</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-tight">
              ${part.price.toFixed(2)}
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Condición</span>
                <span className="font-medium">
                  {CONDITION_LABELS[part.condition] ?? part.condition}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock disponible</span>
                <span className="font-medium">{part.stock}</span>
              </div>
              {part.allows_installments
                ? (() => {
                    const downPct = part.installment_min_percentage;
                    const downAmt = (part.price * downPct) / 100;
                    const financed = part.price - downAmt;
                    const installmentAmt = financed / 3;
                    const today = new Date();
                    const fmt = (d: Date) =>
                      d.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    const dates = [1, 2, 3].map((i) => {
                      const d = new Date(today);
                      d.setDate(d.getDate() + 15 * i);
                      return d;
                    });
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pago inicial</span>
                          <span className="font-medium">
                            {downPct}% — ${downAmt.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-border pt-3 mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            3 cuotas cada 15 días:
                          </p>
                          {dates.map((d, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Cuota {i + 1} — {fmt(d)}
                              </span>
                              <span className="font-medium">${installmentAmt.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()
                : null}
            </div>

            {isInCart ? (
              <Link
                to="/dashboard/cart"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                En el carrito — Ir al carrito
              </Link>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">Cantidad:</span>
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={part.stock}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.min(part.stock, Math.max(1, Number(e.target.value) || 1)))
                      }
                      className="h-9 w-14 border-x border-border bg-transparent text-center text-sm font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(part.stock, quantity + 1))}
                      disabled={quantity >= part.stock}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => addMutation.mutate(quantity)}
                  disabled={
                    !part.is_active || part.stock === 0 || addMutation.isPending || isOwnProduct
                  }
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  {isOwnProduct
                    ? "No puedes comprar tu producto"
                    : part.stock === 0
                      ? "Sin stock"
                      : addMutation.isPending
                        ? "Agregando..."
                        : "Agregar al carrito"}
                </button>
              </div>
            )}

            {isOwnProduct && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Producto publicado por tu taller
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="ml-card p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
