import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Car,
  Store,
  Wrench,
  DollarSign,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  AlertTriangle,
  Package,
  User,
  MapPin,
  Send,
  Plus,
  Search,
  CreditCard,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBcvRate, formatBcv } from "@/lib/bcv";
import {
  getServiceOrder,
  markServiceAtWorkshop,
  setServiceQuote,
  setServiceRevision,
  markServiceInProgress,
  markServiceCompleted,
  markServiceDelivered,
  markServiceShipped,
  markServiceReceived,
  addServiceExtraCharge,
  closeServiceAsWorkshop,
  rateServiceOrderClient,
  confirmServicePayment,
  markServiceInstallmentPaid,
  markServiceInstallmentErroneous,
  type ServiceOrderDTO,
} from "../../../lib/api";

export const Route = createFileRoute(
  "/_authenticated/dashboard/my-workshops/$workshopId/sales/service-orders/$orderId",
)({
  component: WorkshopServiceOrderDetailPage,
});

const SERVICE_ORDER_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  REVISION_SENT: "Revisión enviada",
  AT_WORKSHOP: "En Taller",
  QUOTED: "Presupuestado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  IN_PROGRESS: "En Servicio",
  COMPLETED: "Completado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CLOSED: "Cerrada",
  DROPPED_OFF: "Entregado en el taller",
  CANCELLED: "Cancelado",
};

const SERVICE_ORDER_STYLES: Record<string, string> = {
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  REVISION_SENT: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  AT_WORKSHOP: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  QUOTED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  ACCEPTED: "border border-green-500/30 bg-green-500/10 text-green-400",
  REJECTED: "border border-red-500/30 bg-red-500/10 text-red-400",
  IN_PROGRESS: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  COMPLETED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  DELIVERED: "border border-teal-500/30 bg-teal-500/10 text-teal-400",
  CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  DROPPED_OFF: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
};

function WorkshopServiceOrderDetailPage() {
  const { workshopId, orderId } = Route.useParams();
  const queryClient = useQueryClient();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quotePrice, setQuotePrice] = useState<number | "">("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionCost, setRevisionCost] = useState<number | "">("");
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [extraChargeAmount, setExtraChargeAmount] = useState<number | "">("");
  const [extraChargeNote, setExtraChargeNote] = useState("");
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showConfirmPayModal, setShowConfirmPayModal] = useState(false);
  const [confirmPayPending, setConfirmPayPending] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidInstallmentId, setMarkPaidInstallmentId] = useState<string | null>(null);
  const [markPaidDate, setMarkPaidDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: order, isLoading } = useQuery({
    queryKey: ["workshop-service-order", workshopId, orderId],
    queryFn: () => getServiceOrder(orderId),
  });

  const { data: bcvRate } = useQuery({
    queryKey: ["bcv-rate"],
    queryFn: getBcvRate,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const markAtWorkshopMutation = useMutation({
    mutationFn: () => markServiceAtWorkshop(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Vehículo marcado como recibido en el taller");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Error al marcar vehículo en taller";
      toast.error(msg);
    },
  });

  const sendRevisionMutation = useMutation({
    mutationFn: (cost: number) => setServiceRevision(orderId, { revision_cost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Costo de revisión enviado al cliente");
      setShowRevisionForm(false);
      setRevisionCost("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al enviar costo de revisión";
      toast.error(msg);
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: ({ price, notes }: { price: number; notes?: string }) =>
      setServiceQuote(orderId, { final_price: price, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Presupuesto enviado al cliente");
      setShowQuoteForm(false);
      setQuotePrice("");
      setQuoteNotes("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al enviar presupuesto";
      toast.error(msg);
    },
  });

  const markInProgressMutation = useMutation({
    mutationFn: () => markServiceInProgress(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Servicio marcado como en progreso");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar en progreso";
      toast.error(msg);
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: () => markServiceCompleted(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Servicio marcado como completado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar como completado";
      toast.error(msg);
    },
  });

  const addExtraMutation = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      addServiceExtraCharge(orderId, { extra_charge: amount, extra_charge_note: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Cargo extra enviado al cliente para aprobación");
      setShowExtraForm(false);
      setExtraChargeAmount("");
      setExtraChargeNote("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al agregar cargo extra";
      toast.error(msg);
    },
  });

  const shipMutation = useMutation({
    mutationFn: ({
      tracking_number,
      shipping_notes,
    }: {
      tracking_number: string;
      shipping_notes?: string;
    }) => markServiceShipped(orderId, { tracking_number, shipping_notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Orden marcada como enviada");
      setShowShipModal(false);
      setTrackingNumber("");
      setShippingNotes("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar como enviada";
      toast.error(msg);
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: () => markServiceDelivered(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Recepción confirmada");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al confirmar recepción";
      toast.error(msg);
    },
  });

  const closeWorkshopMutation = useMutation({
    mutationFn: () => closeServiceAsWorkshop(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Orden cerrada");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al cerrar orden";
      toast.error(msg);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmServicePayment(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Pago confirmado");
      setShowConfirmPayModal(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al confirmar pago";
      toast.error(msg);
      setConfirmPayPending(false);
    },
  });

  const markInstallmentPaidMutation = useMutation({
    mutationFn: ({ installmentId, paidAt }: { installmentId: string; paidAt?: string }) =>
      markServiceInstallmentPaid(installmentId, paidAt ? { paid_at: paidAt } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Cuota marcada como pagada");
      setShowMarkPaidModal(false);
      setMarkPaidInstallmentId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar cuota";
      toast.error(msg);
    },
  });

  const markInstallmentErroneousMutation = useMutation({
    mutationFn: (installmentId: string) => markServiceInstallmentErroneous(installmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-service-orders", workshopId] });
      toast.success("Cuota marcada como errónea");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar cuota";
      toast.error(msg);
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      rateServiceOrderClient(orderId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-service-order", workshopId, orderId] });
      toast.success("Cliente calificado exitosamente");
      setShowRatingModal(false);
      setRatingValue(5);
      setRatingComment("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al calificar";
      toast.error(msg);
    },
  });

  function handleSendQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!quotePrice || quotePrice <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    sendQuoteMutation.mutate({ price: quotePrice, notes: quoteNotes || undefined });
  }

  function handleSendRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!revisionCost || revisionCost <= 0) {
      toast.error("Ingresa un costo de revisión válido");
      return;
    }
    sendRevisionMutation.mutate(revisionCost);
  }

  function handleAddExtra(e: React.FormEvent) {
    e.preventDefault();
    if (!extraChargeAmount || extraChargeAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    addExtraMutation.mutate({ amount: extraChargeAmount, note: extraChargeNote || undefined });
  }

  function handleConfirmPayment() {
    setConfirmPayPending(true);
    confirmPaymentMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {order && (
        <Link
          to={`/dashboard/my-workshops/${workshopId}/sales` as any}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Historial de ventas
        </Link>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Detalle de orden de servicio</h1>
          {order && (
            <span
              className={`ml-badge ${SERVICE_ORDER_STYLES[order.status] || SERVICE_ORDER_STYLES.PENDING}`}
            >
              {SERVICE_ORDER_LABELS[order.status] ?? order.status}
            </span>
          )}
          {order?.is_financed && (
            <span className="ml-badge border border-purple-500/30 bg-purple-500/10 text-purple-400">
              Financiado
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">ID: {orderId.slice(0, 8)}...</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : order ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="ml-stat-card">
              <p className="ml-stat-label">Total</p>
              <p className="ml-stat-value text-lg">
                ${(
                  (order.final_price ?? order.base_price ?? 0) +
                  (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">Servicio</p>
              <p className="ml-stat-value text-sm">{order.service_name ?? "—"}</p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">Entrega</p>
              <p className="ml-stat-value text-sm">
                {order.delivery_method === "SHIPPING" ? "Envío" : "Recoger en taller"}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">Fecha</p>
              <p className="ml-stat-value text-sm">
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="ml-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Car className="h-4 w-4" />
                Información del vehículo
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Marca:</span>
                  <span className="font-medium">{order.vehicle_brand ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-medium">{order.vehicle_model ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Placa:</span>
                  <span className="font-medium">{order.vehicle_license_plate ?? "—"}</span>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">Nota:</span>
                    <span className="font-medium">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="ml-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                Información del cliente
              </h2>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {(order.user_first_name?.[0] ?? "?").toUpperCase()}
                  {(order.user_last_name?.[0] ?? "").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {order.user_first_name
                      ? `${order.user_first_name} ${order.user_last_name}`.trim()
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.user_email ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {order.user_ci && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cédula:</span>
                    <span className="font-medium">{order.user_ci}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="ml-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Store className="h-4 w-4" />
                Información del taller
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Taller:</span>
                  <span className="font-medium">{order.workshop_name ?? "—"}</span>
                </div>
                {order.workshop_rif && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">RIF:</span>
                    <span className="font-medium">{order.workshop_rif}</span>
                  </div>
                )}
                {order.workshop_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dirección:</span>
                    <span className="font-medium">{order.workshop_address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="ml-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                Presupuesto
              </h2>
              <div className="space-y-3 text-sm">
                {order.status === "QUOTED" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Precio base</span>
                      <span className="font-medium">${order.base_price.toFixed(2)}</span>
                    </div>
                    {order.final_price != null && order.final_price !== order.base_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Precio final</span>
                        <span className="font-mono font-bold">${order.final_price.toFixed(2)}</span>
                      </div>
                    )}
                    {order.extra_charge > 0 && order.extra_charge_status === "PENDING_APPROVAL" && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Cargos extra
                          <span className="ml-1.5 text-xs text-amber-400">(pendiente)</span>
                        </span>
                        <span className="font-medium text-amber-400">+ ${order.extra_charge.toFixed(2)}</span>
                      </div>
                    )}
                    {order.revision != null && (
                      <p className="mt-2 text-xs text-amber-400">
                        Si rechazas, pagas revisión:{" "}
                        <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                      </p>
                    )}
                  </>
                )}

                {order.status === "ACCEPTED" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Presupuesto</span>
                      <span className="font-mono font-bold text-green-400">
                        ${(order.final_price ?? order.base_price ?? 0).toFixed(2)}
                      </span>
                    </div>
                    {order.extra_charge > 0 && order.extra_charge_status === "APPROVED" && (
                      <>
                        <div className="flex items-center justify-between text-amber-400">
                          <span className="text-muted-foreground">Adicionales</span>
                          <span className="font-medium">+ ${order.extra_charge.toFixed(2)}</span>
                        </div>
                        {order.extra_charge_note && (
                          <div className="ml-4 text-xs text-muted-foreground/90">
                            {order.extra_charge_note}
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                      <span>Total</span>
                      <span className="font-mono">
                        ${(
                          (order.final_price ?? order.base_price ?? 0) +
                          (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {order.status === "REJECTED" && order.revision != null && (
                  <>
                    <div className="flex items-center justify-between text-red-400">
                      <span className="text-muted-foreground">Costo de revisión</span>
                      <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Presupuesto</span>
                      <span className="font-medium text-red-400">Rechazado</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                      <span>Total a pagar</span>
                      <span className="font-mono text-red-400">${order.revision.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {["IN_PROGRESS", "COMPLETED", "DELIVERED", "CLOSED"].includes(order.status) && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Presupuesto</span>
                      <span className="font-mono font-bold">
                        ${(order.final_price ?? order.base_price ?? 0).toFixed(2)}
                      </span>
                    </div>
                    {order.extra_charge > 0 && order.extra_charge_status === "APPROVED" && (
                      <>
                        <div className="flex items-center justify-between text-amber-400">
                          <span className="text-muted-foreground">Adicionales</span>
                          <span className="font-medium">+ ${order.extra_charge.toFixed(2)}</span>
                        </div>
                        {order.extra_charge_note && (
                          <div className="ml-4 text-xs text-muted-foreground/90">
                            {order.extra_charge_note}
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                      <span>Total</span>
                      <span className="font-mono">
                        ${(
                          (order.final_price ?? order.base_price ?? 0) +
                          (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {["ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CLOSED"].includes(
              order.status,
            ) &&
              order.payments &&
              order.payments.length > 0 && (
                <div className="ml-card p-5">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <CreditCard className="h-4 w-4" />
                    Pagos
                  </h2>
                  <div className="space-y-3">
                    {order.payments.map((payment: any, idx: number) => (
                      <div
                        key={payment.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                          payment.status === "PAID" || payment.status === "VERIFIED"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : payment.status === "PENDING_VERIFICATION"
                            ? "border-amber-500/30 bg-amber-500/10"
                            : "border-red-500/30 bg-red-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {payment.status === "PAID" || payment.status === "VERIFIED" ? (
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                          ) : payment.status === "PENDING_VERIFICATION" ? (
                            <Clock className="h-4 w-4 text-amber-400" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-400" />
                          )}
                          <div>
                            <p className="text-xs font-medium">
                              {idx === 0 ? "Presupuesto" : `Pago ${idx + 1}`} —{" "}
                              {payment.status === "PAID" || payment.status === "VERIFIED"
                                ? "Pagado"
                                : payment.status === "PENDING_VERIFICATION"
                                ? "Pendiente de verificación"
                                : "Rechazado"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {payment.payment_method === "BANK_TRANSFER"
                                ? "Transferencia bancaria"
                                : payment.payment_method === "MOBILE_PAYMENT"
                                ? "Pago móvil"
                                : payment.payment_method === "CASH"
                                ? "Efectivo"
                                : payment.payment_method}
                              {payment.reference_number && ` · Ref: ${payment.reference_number}`}
                              {payment.paid_at &&
                                ` · Pagado: ${new Date(payment.paid_at).toLocaleDateString("es-ES")}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.payment_status === "PENDING_VERIFICATION" && !order.is_paid && (
                    <button
                      onClick={() => setShowConfirmPayModal(true)}
                      className="mt-3 ml-btn ml-btn-primary w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Confirmar pago
                    </button>
                  )}
                </div>
              )}

            {order.is_financed && order.installments && order.installments.length > 0 && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4" />
                  Cuotas de financiamiento
                </h2>
                <div className="space-y-3">
                  {order.installments.map((inst, idx) => {
                    const isPaid = inst.status === "PAID";
                    const isPendingVerif = inst.status === "PENDING_VERIFICATION";
                    const hasOpenMora = inst.late_fee_status === "PENDING" || inst.late_fee_status === "PENDING_VERIFICATION";
                    return (
                      <div
                        key={inst.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                          isPaid
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : isPendingVerif
                              ? "border-amber-500/30 bg-amber-500/10"
                              : hasOpenMora
                                ? "border-red-500/30 bg-red-500/10"
                                : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isPaid ? (
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                          ) : isPendingVerif ? (
                            <Clock className="h-4 w-4 text-amber-400" />
                          ) : hasOpenMora ? (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-xs font-medium">
                              Cuota {idx + 1} —{" "}
                              {isPaid
                                ? "Pagada"
                                : isPendingVerif
                                  ? "Pendiente de verificación"
                                  : hasOpenMora
                                    ? "Vencida (con mora)"
                                    : "Pendiente"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Vence: {new Date(inst.due_date).toLocaleDateString("es-ES")}
                              {inst.payment_method && inst.payment_method !== "OTHER" &&
                                ` · ${inst.payment_method === "BANK_TRANSFER" ? "Transferencia" : inst.payment_method === "MOBILE_PAYMENT" ? "Pago móvil" : inst.payment_method === "CASH" ? "Efectivo" : inst.payment_method === "ZELLE" ? "Zelle" : inst.payment_method === "ZINLI" ? "Zinli" : inst.payment_method}`}
                              {inst.reference_number && ` · Ref: ${inst.reference_number}`}
                              {inst.paid_at && ` · Pagado: ${new Date(inst.paid_at).toLocaleDateString("es-ES")}`}
                            </p>
                            {hasOpenMora && inst.late_fee_amount != null && (
                              <p className="mt-0.5 text-[11px] font-medium text-red-400">
                                Mora: ${inst.late_fee_amount.toFixed(2)}
                                {inst.late_fee_status === "PENDING_VERIFICATION" && " (en verificación)"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-mono text-xs font-bold">
                              ${inst.amount.toFixed(2)}
                            </p>
                            {!isPaid && (
                              <p className="text-[10px] text-primary/70">
                                +{inst.amount.toFixed(2)} pts
                              </p>
                            )}
                          </div>
                          {isPendingVerif && (
                            <button
                              className="ml-btn ml-btn-primary px-3 py-1.5 text-xs"
                              disabled={markInstallmentPaidMutation.isPending}
                              onClick={() => {
                                setMarkPaidInstallmentId(inst.id);
                                setMarkPaidDate(new Date().toISOString().slice(0, 10));
                                setShowMarkPaidModal(true);
                              }}
                            >
                              {markInstallmentPaidMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                              Marcar pagada
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {order.delivery_method && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4" />
                  Información de entrega
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">
                      {order.delivery_method === "SHIPPING"
                        ? "Envío nacional"
                        : "Retirar en el taller"}
                    </span>
                  </div>
                  {order.delivery_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Dirección:</span>
                      <span className="font-medium">{order.delivery_address}</span>
                    </div>
                  )}
                  {order.delivery_fee != null && order.delivery_fee > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Costo de envío:</span>
                      <span className="font-medium">${order.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="flex items-start gap-2">
                      <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tracking:</span>
                      <span className="font-medium">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.shipping_notes && (
                    <div className="flex items-start gap-2">
                      <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Agencia de envío:</span>
                      <span className="font-medium">{order.shipping_notes}</span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Fecha de envío:</span>
                      <span className="font-medium">
                        {new Date(order.shipped_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="ml-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                Información del cliente
              </h2>
              <p className="text-sm font-medium">
                {order.user_first_name
                  ? `${order.user_first_name} ${order.user_last_name}`.trim()
                  : "—"}
              </p>
              {order.user_ci && (
                <p className="mt-1 text-xs text-muted-foreground">CI: {order.user_ci}</p>
              )}
              {order.user_email && (
                <p className="mt-1 text-xs text-muted-foreground">{order.user_email}</p>
              )}
              {order.user_client_rating != null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= Math.round(order.user_client_rating ?? 0)
                            ? "text-yellow-400 fill-current"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.user_client_rating?.toFixed(1)} ({order.user_client_rating_count ?? 0})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* PENDING → Mark as AT_WORKSHOP */}
            {order.status === "PENDING" && (
              <div className="ml-card border-amber-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-400">Nueva solicitud de servicio</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El cliente ha solicitado un servicio. Confirma la recepción del vehículo en el
                      taller.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => markAtWorkshopMutation.mutate()}
                        disabled={markAtWorkshopMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {markAtWorkshopMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Truck className="h-4 w-4" />
                        Recibir vehículo en taller
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DROPPED_OFF → Confirm reception */}
            {order.status === "DROPPED_OFF" && (
              <div className="ml-card border-indigo-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 text-indigo-400" />
                  <div className="flex-1">
                    <p className="font-medium text-indigo-400">Vehículo entregado en el taller</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El cliente indicó que dejó el vehículo en el taller. Confirma la recepción
                      para comenzar el proceso de revisión y presupuesto.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => markAtWorkshopMutation.mutate()}
                        disabled={markAtWorkshopMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {markAtWorkshopMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Truck className="h-4 w-4" />
                        Confirmar recepción del vehículo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AT_WORKSHOP → Send revision or quote */}
            {order.status === "AT_WORKSHOP" && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">Vehículo en taller</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El vehículo está en el taller. Envía un presupuesto al cliente cuando termines
                      la inspección.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Si el cliente rechaza el presupuesto, deberá pagar el costo de revisión.
                    </p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          setRevisionCost(order.revision ?? "");
                          setShowRevisionForm(true);
                        }}
                        className="ml-btn border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                      >
                        <Search className="h-4 w-4" />
                        {order.revision != null ? "Editar costo de revisión" : "Enviar costo de revisión"}
                      </button>
                      <button
                        onClick={() => setShowQuoteForm(true)}
                        className="ml-btn ml-btn-primary"
                      >
                        <DollarSign className="h-4 w-4" />
                        Enviar presupuesto
                      </button>
                    </div>
                    {order.revision != null && (
                      <p className="mt-3 text-xs text-amber-400">
                        Costo de revisión actual:{" "}
                        <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REVISION_SENT → Wait for client */}
            {order.status === "REVISION_SENT" && (
              <div className="ml-card border-purple-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Search className="mt-0.5 h-5 w-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-400">Costo de revisión enviado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esperando que el cliente acepte o rechace el costo de revisión.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* QUOTED → Wait for client */}
            {order.status === "QUOTED" && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Send className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">Presupuesto enviado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esperando que el cliente acepte o rechace el presupuesto.
                    </p>
                    {order.final_price != null && (
                      <p className="mt-3 font-mono text-2xl font-bold">
                        ${order.final_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACCEPTED → Mark as IN_PROGRESS */}
            {order.status === "ACCEPTED" && (
              <div className="ml-card border-green-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
                  <div className="flex-1">
                    <p className="font-medium text-green-400">Presupuesto aceptado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.is_paid
                        ? "Pago confirmado. Inicia el servicio cuando estés listo."
                        : order.payment_status === "PENDING_VERIFICATION"
                        ? "El cliente ha registrado un pago. Confírmalo para iniciar el servicio."
                        : "El cliente ha aceptado el presupuesto. Esperando que registre el pago."}
                    </p>
                    {!order.is_paid && order.final_price != null && (
                      <p className="mt-2 font-mono text-xl font-bold text-green-400">
                        ${((order.final_price ?? 0) + (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)).toFixed(2)}
                      </p>
                    )}
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <button
                        onClick={() => markInProgressMutation.mutate()}
                        disabled={markInProgressMutation.isPending || !order.is_paid}
                        className={cn(
                          "ml-btn",
                          order.is_paid ? "ml-btn-primary" : "ml-btn-outline",
                        )}
                      >
                        {markInProgressMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Wrench className="h-4 w-4" />
                        Iniciar servicio
                      </button>
                      <button
                        onClick={() => setShowExtraForm(true)}
                        className="ml-btn border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar cargo extra
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACCEPTED/IN_PROGRESS → Add extra charge button */}
            {(order.status === "IN_PROGRESS" ||
              (order.status === "ACCEPTED" &&
                order.extra_charge_status === "PENDING_APPROVAL")) && (
              <>
                {order.status === "IN_PROGRESS" && (
                  <div className="ml-card border-blue-500/30 p-5">
                    <div className="flex items-start gap-3">
                      <Wrench className="mt-0.5 h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-400">Servicio en progreso</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          El servicio está en progreso. Cuando termines, márcalo como completado.
                        </p>
                        <div className="mt-4 flex gap-3 flex-wrap">
                          <button
                            onClick={() => markCompletedMutation.mutate()}
                            disabled={markCompletedMutation.isPending}
                            className="ml-btn ml-btn-primary"
                          >
                            {markCompletedMutation.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <CheckCircle2 className="h-4 w-4" />
                            Marcar como completado
                          </button>
                          <button
                            onClick={() => setShowExtraForm(true)}
                            className="ml-btn border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar cargo extra
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {order.extra_charge_status === "PENDING_APPROVAL" && (
                  <div className="ml-card border-amber-500/30 p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-400">
                          Cargo extra pendiente de aprobación
                        </p>
                        {order.extra_charge_note && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.extra_charge_note}
                          </p>
                        )}
                        <p className="mt-2 font-mono text-xl font-bold text-amber-400">
                          + ${order.extra_charge?.toFixed(2)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Esperando que el cliente apruebe o rechace el cargo extra.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* COMPLETED → Ship or wait for client */}
            {order.status === "COMPLETED" && order.delivery_method === "SHIPPING" && (
              <div className="ml-card border-emerald-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-400">Servicio completado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El servicio está completado. Marca la orden como enviada para que el cliente
                      reciba su vehículo/repuesto.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowShipModal(true)}
                        className="ml-btn ml-btn-primary"
                      >
                        <Package className="h-4 w-4" />
                        Marcar como enviado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "COMPLETED" && order.delivery_method !== "SHIPPING" && (
              <div className="ml-card border-emerald-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-400">Servicio completado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El servicio está completado. Esperando que el cliente retire su vehículo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SHIPPED → Wait for client to receive */}
            {order.status === "SHIPPED" && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">Orden enviada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      La orden ha sido marcada como enviada. Esperando que el cliente confirme la
                      recepción.
                    </p>
                    {order.tracking_number && (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Tracking:</span>{" "}
                        <span className="font-mono font-medium">{order.tracking_number}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DELIVERED → Close order */}
            {order.status === "DELIVERED" && !order.closed_by_workshop && (
              <div className="ml-card border-teal-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 text-teal-400" />
                  <div className="flex-1">
                    <p className="font-medium text-teal-400">Vehículo entregado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El cliente ha marcado el vehículo como retirado. Confirma la entrega para cerrar la orden.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => closeWorkshopMutation.mutate()}
                        disabled={closeWorkshopMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {closeWorkshopMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar como entregado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CLOSED → Show results + rate client */}
            {order.status === "CLOSED" && (
              <div className="ml-card border-sky-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sky-400">Orden cerrada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esta orden de servicio ha sido cerrada.
                    </p>
                    <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                      {order.closed_by_client && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Cliente cerró
                        </span>
                      )}
                      {order.closed_by_workshop && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-sky-400" /> Taller cerró
                        </span>
                      )}
                    </div>
                    {!order.ratings?.workshop_rated && (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="ml-btn ml-btn-primary mt-4"
                      >
                        <Star className="h-4 w-4" />
                        Calificar cliente
                      </button>
                    )}
                    {order.ratings?.workshop_rated && (
                      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Tu calificación al cliente:
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= (order.ratings?.workshop_rating ?? 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          {order.ratings?.workshop_rating && (
                            <span className="text-sm text-muted-foreground">
                              {order.ratings.workshop_rating}/5
                            </span>
                          )}
                        </div>
                        {order.ratings?.workshop_review && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            "{order.ratings.workshop_review}"
                          </p>
                        )}
                      </div>
                    )}
                    {order.ratings?.client_rated && (
                      <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Calificación del cliente:
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= (order.ratings?.client_rating ?? 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          {order.ratings?.client_rating && (
                            <span className="text-sm text-muted-foreground">
                              {order.ratings.client_rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CANCELLED/REJECTED */}
            {(order.status === "CANCELLED" || order.status === "REJECTED") && (
              <div className="ml-card border-red-500/30 p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-medium text-red-400">
                      {order.status === "CANCELLED" ? "Orden cancelada" : "Presupuesto rechazado"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.status === "CANCELLED"
                        ? "Esta orden ha sido cancelada."
                        : "El cliente ha rechazado el presupuesto."}
                    </p>
                    {order.status === "REJECTED" && order.revision != null && !order.is_paid && (
                      <div className="mt-3">
                        <p className="font-mono text-xl font-bold text-red-400">
                          Revisión: ${order.revision.toFixed(2)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          El cliente debe pagar la revisión para cerrar la orden.
                        </p>
                        <button
                          onClick={() => setShowConfirmPayModal(true)}
                          className="mt-3 ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Confirmar pago de revisión
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="ml-empty-state py-16">
          <Wrench className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">No se encontró la orden de servicio</p>
          <Link
            to={`/dashboard/my-workshops/${workshopId}/sales` as any}
            className="ml-btn ml-btn-primary"
          >
            Volver a ventas
          </Link>
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Enviar presupuesto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {order?.service_name ?? "Servicio"}
            </p>

            <form onSubmit={handleSendQuote} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Precio <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value ? Number(e.target.value) : "")}
                    min={order?.price_min ?? 0}
                    max={order?.price_max ?? 999999}
                    step={0.01}
                    required
                    className="ml-input pl-7"
                    placeholder="0.00"
                  />
                </div>
                {order?.price_min != null && order?.price_max != null && (
                  <p className="mt-1.5 text-xs text-amber-400">
                    Rango permitido: ${order.price_min.toFixed(2)} – ${order.price_max.toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Notas <span className="text-muted-foreground/60">(opcional)</span>
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="ml-input w-full"
                  rows={3}
                  placeholder="Describe el trabajo a realizar..."
                />
              </div>
              {order?.revision != null && (
                <p className="text-sm text-amber-400">
                  Si el cliente rechaza, paga revisión:{" "}
                  <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  disabled={sendQuoteMutation.isPending}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendQuoteMutation.isPending || !quotePrice}
                  className="ml-btn ml-btn-primary"
                >
                  {sendQuoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" />
                  Enviar presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Cost Modal */}
      {showRevisionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">
              {order?.revision != null ? "Editar costo de revisión" : "Enviar costo de revisión"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Si el cliente rechaza el presupuesto, deberá pagar este costo.
            </p>

            <form onSubmit={handleSendRevision} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Costo de revisión <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={revisionCost}
                    onChange={(e) => setRevisionCost(e.target.value ? Number(e.target.value) : "")}
                    min={0}
                    step={0.01}
                    required
                    className="ml-input pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionForm(false)}
                  disabled={sendRevisionMutation.isPending}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendRevisionMutation.isPending || !revisionCost}
                  className="ml-btn ml-btn-primary"
                >
                  {sendRevisionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" />
                  Enviar costo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Marcar como enviado</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingresa los datos de envío.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!trackingNumber.trim()) {
                  toast.error("Ingresa el número de seguimiento");
                  return;
                }
                shipMutation.mutate({
                  tracking_number: trackingNumber.trim(),
                  shipping_notes: shippingNotes.trim(),
                });
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Número de seguimiento <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="ml-input"
                  placeholder="Tracking #"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Agencia de envío <span className="text-red-400">*</span>
                </label>
                <select
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  className="ml-input w-full"
                >
                  <option value="">Seleccionar...</option>
                  <option value="MRW">MRW</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Tealca">Tealca</option>
                  <option value="Domesa">Domesa</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  disabled={shipMutation.isPending}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={shipMutation.isPending || !trackingNumber.trim() || !shippingNotes.trim()}
                  className="ml-btn ml-btn-primary"
                >
                  {shipMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Package className="h-4 w-4" />
                  Marcar como enviado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Charge Modal */}
      {showExtraForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Agregar cargo extra</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El cliente deberá aprobar este cargo adicional.
            </p>

            <form onSubmit={handleAddExtra} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Monto <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={extraChargeAmount}
                    onChange={(e) =>
                      setExtraChargeAmount(e.target.value ? Number(e.target.value) : "")
                    }
                    min={0}
                    step={0.01}
                    required
                    className="ml-input pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Descripción <span className="text-muted-foreground/60">(opcional)</span>
                </label>
                <textarea
                  value={extraChargeNote}
                  onChange={(e) => setExtraChargeNote(e.target.value)}
                  className="ml-input w-full"
                  rows={2}
                  placeholder="Motivo del cargo extra..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtraForm(false)}
                  disabled={addExtraMutation.isPending}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addExtraMutation.isPending || !extraChargeAmount}
                  className="ml-btn ml-btn-primary"
                >
                  {addExtraMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Plus className="h-4 w-4" />
                  Agregar cargo extra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmPayModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Confirmar pago</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.revision != null && order.status === "REJECTED"
                ? `Confirmar pago de revisión: $${order.revision.toFixed(2)}`
                : `Confirmar pago de presupuesto: $${((order.final_price ?? 0) + (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)).toFixed(2)}`}
              {/* Usar la tasa BCV del pago pendiente de verificación, no la tasa actual */}
              {(() => {
                const pendingPayment = order.payments?.find(
                  (p) => p.status === "PENDING_VERIFICATION"
                );
                if (pendingPayment?.rate && pendingPayment.rate > 0) {
                  return (
                    <span className="block mt-1 font-mono text-xs text-primary/70">
                      {formatBcv(
                        order.revision != null && order.status === "REJECTED"
                          ? order.revision
                          : ((order.final_price ?? 0) + (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)),
                        pendingPayment.rate
                      )}
                      {pendingPayment.rate_date && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          (Tasa {new Date(pendingPayment.rate_date).toLocaleDateString("es-ES")})
                        </span>
                      )}
                    </span>
                  );
                }
                if (bcvRate && bcvRate > 0) {
                  return (
                    <span className="block mt-1 font-mono text-xs text-primary/70">
                      {formatBcv(
                        order.revision != null && order.status === "REJECTED"
                          ? order.revision
                          : ((order.final_price ?? 0) + (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)),
                        bcvRate
                      )}
                    </span>
                  );
                }
                return null;
              })()}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmPayModal(false);
                  setConfirmPayPending(false);
                }}
                disabled={confirmPayPending}
                className="ml-btn ml-btn-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmPayPending(true);
                  confirmPaymentMutation.mutate(undefined, {
                    onSuccess: () => {
                      setShowConfirmPayModal(false);
                      setConfirmPayPending(false);
                    },
                    onError: () => setConfirmPayPending(false),
                  });
                }}
                disabled={confirmPayPending}
                className="ml-btn ml-btn-primary"
              >
                {confirmPayPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}

      {showMarkPaidModal && (() => {
        const inst = order?.installments?.find(i => i.id === markPaidInstallmentId);
        if (!inst) return null;
        const methodLabel = inst.payment_method === "BANK_TRANSFER" ? "Transferencia"
          : inst.payment_method === "MOBILE_PAYMENT" ? "Pago Móvil"
          : inst.payment_method === "ZELLE" ? "Zelle"
          : inst.payment_method === "BINANCE" ? "Binance"
          : inst.payment_method === "CASH" ? "Efectivo"
          : inst.payment_method === "ZINLI" ? "Zinli"
          : inst.payment_method ?? "—";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
              <h2 className="text-lg font-semibold tracking-tight">Información de pago</h2>

              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">Monto</p>
                {(() => {
                  const effectiveRate = (inst.rate && inst.rate > 0) ? inst.rate : 0;
                  if (effectiveRate > 0) {
                    const bsAmount = inst.amount * effectiveRate;
                    return (
                      <p className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                        {bsAmount.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}bs
                        <span className="text-sm font-normal text-muted-foreground">
                          (${inst.amount.toFixed(2)})
                        </span>
                      </p>
                    );
                  }
                  return (
                    <p className="mt-1 font-mono text-2xl font-bold text-primary">
                      ${inst.amount.toFixed(2)}
                    </p>
                  );
                })()}
                {inst.rate && inst.rate > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Tasa BCV: {inst.rate.toFixed(2)} Bs/$
                    {inst.rate_date && (
                      <span className="ml-1">
                        — {new Date(inst.rate_date).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Método de pago:</p>
                  <p className="text-sm">{methodLabel}</p>
                </div>
                {inst.reference_number && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Número de referencia:</p>
                    <p className="text-sm font-mono">{inst.reference_number}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Vencimiento:</p>
                  <p className="text-sm">{new Date(inst.due_date).toLocaleDateString("es-ES")}</p>
                </div>

                {inst.paid_at && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Fecha de pago:</p>
                    <p className="text-sm">
                      {new Date(inst.paid_at).toLocaleDateString("es-ES", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Estado:</p>
                  <p className="text-sm">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                      inst.status === "PENDING_VERIFICATION"
                        ? "bg-amber-500/10 text-amber-400"
                        : inst.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {inst.status === "PENDING_VERIFICATION" ? "Pendiente" : inst.status === "PAID" ? "Verificada" : inst.status}
                    </span>
                  </p>
                </div>
              </div>

              {inst.status === "PENDING_VERIFICATION" && (
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      markInstallmentPaidMutation.mutate({ installmentId: inst.id });
                      setShowMarkPaidModal(false);
                      setMarkPaidInstallmentId(null);
                    }}
                    disabled={markInstallmentPaidMutation.isPending}
                    className="w-full ml-btn ml-btn-primary"
                  >
                    {markInstallmentPaidMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verificar pago
                  </button>
                  <button
                    onClick={() => {
                      markInstallmentErroneousMutation.mutate(inst.id);
                      setShowMarkPaidModal(false);
                      setMarkPaidInstallmentId(null);
                    }}
                    disabled={markInstallmentErroneousMutation.isPending}
                    className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    {markInstallmentErroneousMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Rechazar cuota
                  </button>
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setShowMarkPaidModal(false);
                    setMarkPaidInstallmentId(null);
                  }}
                  className="ml-btn ml-btn-outline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showRatingModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Calificar cliente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Califica a {order.user_first_name
                ? `${order.user_first_name} ${order.user_last_name}`.trim()
                : "este cliente"} por esta orden de servicio.
            </p>

            <div className="mt-6 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRatingValue(s)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${s} estrellas`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      s <= ratingValue
                        ? "text-yellow-400 fill-current"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Comentario (opcional)"
              rows={3}
              className="ml-input mt-4 w-full resize-none"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="ml-btn ml-btn-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  rateMutation.mutate({ rating: ratingValue, comment: ratingComment })
                }
                disabled={rateMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {rateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar calificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
