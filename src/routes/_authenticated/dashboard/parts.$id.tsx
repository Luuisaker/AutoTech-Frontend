import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { toast } from "sonner";
import { getPart, getWorkshop, addToCart, getCart } from "../../../lib/api";

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

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const cartItem = cart?.items?.find((i) => i.part_id === id);
  const isInCart = !!cartItem;

  const addMutation = useMutation({
    mutationFn: () => addToCart(id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Agregado al carrito");
    },
    onError: () => {
      toast.error("Error al agregar al carrito");
    },
  });

  const isOwnProduct = part?.workshop_id === workshop?.id && part?.workshop_id != null;

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
    <div className="mx-auto max-w-4xl">
      <Link
        to="/dashboard/marketplace"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
            <div className="relative flex h-full w-full items-center justify-center p-10">
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              <Wrench className="h-32 w-32 text-border-500 opacity-40" />
              {part.category && (
                <span className="absolute left-4 top-4 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
                  {CATEGORY_LABELS[part.category] ?? part.category}
                </span>
              )}
              <span className="absolute right-4 top-4 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
                {CONDITION_LABELS[part.condition] ?? part.condition}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight">{part.name}</h1>
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
            <div className="mt-6 rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Taller
              </p>
              <p className="mt-1 font-medium">{workshop.name}</p>
              <p className="text-xs text-muted-foreground">{workshop.address}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8 rounded-xl border border-border bg-surface p-6">
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
              {part.allows_installments ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mínimo inicial</span>
                  <span className="font-medium">{part.installment_min_percentage}%</span>
                </div>
              ) : null}
            </div>

            {isInCart ? (
              <Link
                to="/dashboard/cart"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500"
              >
                <Check className="h-4 w-4" />
                En el carrito — Ir al carrito
              </Link>
            ) : (
              <button
                onClick={() => addMutation.mutate()}
                disabled={!part.is_active || part.stock === 0 || addMutation.isPending}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {part.stock === 0
                  ? "Sin stock"
                  : addMutation.isPending
                    ? "Agregando..."
                    : "Agregar al carrito"}
              </button>
            )}

            {isOwnProduct && (
              <p className="mt-2 text-center text-xs text-muted-foreground">Este es tu producto</p>
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
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
