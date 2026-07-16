import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  Search,
  CreditCard,
  UserCheck,
  UserX,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../lib/auth-context";
import {
  getServiceOrder,
  acceptServiceQuote,
  rejectServiceQuote,
  approveServiceExtra,
  rejectServiceExtra,
  markServiceReceived,
  markServiceDroppedOff,
  closeServiceAsClient,
  rateServiceOrderWorkshop,
  cancelServiceOrder,
  payServiceOrder,
  acceptServiceRevision,
  rejectServiceRevision,
  getWorkshopPaymentMethods,
  financeServiceOrder,
  payServiceInstallment,
  getMyCreditLine,
  getMyLateFees,
  payLateFee,
  getPaymentDestinations,
  type ServiceOrderDTO,
  type ServiceOrderInstallmentDTO,
  type WorkshopPaymentMethodDTO,
  type MyCreditLine,
  type LateFeeDTO,
  type PayLateFeeInput,
  type PaymentDestination,
} from "../../../lib/api";
import { getBcvRate, getBcvRateInfo, getBcvRateForDate, formatBcv } from "../../../lib/bcv";

export const Route = createFileRoute("/_authenticated/dashboard/service-orders/$orderId")({
  component: ServiceOrderDetailPage,
});

const SERVICE_ORDER_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  DROPPED_OFF: "Entregado en Taller",
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
  CANCELLED: "Cancelado",
  PENDING_VERIFICATION: "Pendiente",
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
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
  PENDING_VERIFICATION: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
};

function ServiceOrderDetailPage() {
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { roles } = useAuth();
  const isClient = roles.includes("CLIENT");

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<string>("");
  const [payReference, setPayReference] = useState("");
  const [payPending, setPayPending] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["service-order", orderId],
    queryFn: () => getServiceOrder(orderId),
  });

  const { data: workshopPaymentMethodsData, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ["workshop-payment-methods", order?.workshop_id],
    queryFn: () => getWorkshopPaymentMethods(order!.workshop_id),
    enabled: !!order?.workshop_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: bcvRate } = useQuery({
    queryKey: ["bcv-rate"],
    queryFn: getBcvRate,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: bcvInfo } = useQuery({
    queryKey: ["bcv-rate-info"],
    queryFn: getBcvRateInfo,
    staleTime: 5 * 60 * 1000,
  });

  const { data: creditLine, isLoading: isCreditLineLoading } = useQuery<MyCreditLine>({
    queryKey: ["credit-line"],
    queryFn: getMyCreditLine,
    staleTime: 60 * 1000,
  });

  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeDownPct, setFinanceDownPct] = useState(50);

  useEffect(() => {
    const minPct = creditLine?.min_down_payment_pct ?? 0;
    if (minPct > 0 && financeDownPct < minPct) {
      setFinanceDownPct(minPct);
    }
  }, [creditLine?.min_down_payment_pct]);
  const [financePaymentMethod, setFinancePaymentMethod] = useState("");
  const [financeReference, setFinanceReference] = useState("");

  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState<ServiceOrderInstallmentDTO | null>(null);
  const [installmentPayMethod, setInstallmentPayMethod] = useState("");
  const [installmentReference, setInstallmentReference] = useState("");
  const [installmentPayPending, setInstallmentPayPending] = useState(false);
  const [installmentPayDate, setInstallmentPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateBcvRate, setDateBcvRate] = useState<number | null>(null);
  const [dateBcvLoading, setDateBcvLoading] = useState(false);

  useEffect(() => {
    if (!showInstallmentModal || !installmentPayDate) return;
    let cancelled = false;
    setDateBcvLoading(true);
    getBcvRateForDate(installmentPayDate).then((rate) => {
      if (!cancelled) {
        setDateBcvRate(rate?.usd ?? null);
        setDateBcvLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [installmentPayDate, showInstallmentModal]);

  // Mora payment state
  const { data: paymentDestinations, isLoading: paymentDestinationsLoading } = useQuery<PaymentDestination[]>({
    queryKey: ["payment-destinations"],
    queryFn: getPaymentDestinations,
  });

  const [showMoraModal, setShowMoraModal] = useState(false);
  const [activeMora, setActiveMora] = useState<LateFeeDTO | null>(null);
  const [moraPayMethod, setMoraPayMethod] = useState("");
  const [moraReference, setMoraReference] = useState("");
  const [moraPayDate, setMoraPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [moraPayPending, setMoraPayPending] = useState(false);

  const financeMutation = useMutation({
    mutationFn: () => {
      const selectedMethod = workshopPaymentMethods.find((m) => m.id === financePaymentMethod);
      const paymentMethodType = (selectedMethod?.type ?? "").toUpperCase();
      const isCash = selectedMethod?.type === "cash";
      return financeServiceOrder(orderId, {
        down_payment_pct: financeDownPct,
        payment_method: paymentMethodType,
        reference_number: isCash ? undefined : financeReference.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["credit-line"] });
      toast.success("Servicio financiado exitosamente");
      setShowFinanceModal(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al financiar";
      toast.error(msg);
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async () => {
      if (!activeInstallment) throw new Error("No hay cuota seleccionada");
      const selectedMethod = workshopPaymentMethods.find((m) => m.id === installmentPayMethod);
      const paymentMethodType = (selectedMethod?.type ?? "").toUpperCase();
      const isCash = selectedMethod?.type === "cash";
      return payServiceInstallment(activeInstallment.id, {
        payment_method: paymentMethodType,
        reference_number: isCash ? undefined : installmentReference.trim() || undefined,
        rate: dateBcvRate ?? null,
        rate_date: installmentPayDate,
        paid_at: new Date(installmentPayDate + "T12:00:00").toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["credit-line"] });
      toast.success("Pago de cuota registrado, pendiente de verificación");
      setShowInstallmentModal(false);
      setInstallmentPayMethod("");
      setInstallmentReference("");
      setActiveInstallment(null);
      setInstallmentPayPending(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al pagar cuota";
      toast.error(msg);
      setInstallmentPayPending(false);
    },
  });

  // Late fees query — find mora matching service installments
  const { data: lateFeesData } = useQuery({
    queryKey: ["my-late-fees"],
    queryFn: getMyLateFees,
    enabled: isClient && !!order?.is_financed,
    staleTime: 30 * 1000,
  });
  const lateFees = lateFeesData?.late_fees ?? [];
  const moraByInstallment = new Map(lateFees.map(f => [f.installment_id, f]));

  const payMoraMutation = useMutation({
    mutationFn: async () => {
      if (!activeMora) throw new Error("No hay mora seleccionada");
      const dest = paymentDestinations?.find((d) => d.id === moraPayMethod);
      const paymentMethodType = dest?.method_type ?? "OTHER";
      const isForeign = dest?.method_type === "ZELLE" || dest?.method_type === "BINANCE";
      const info = await getBcvRateInfo();
      return payLateFee(activeMora.id, {
        payment_method: paymentMethodType,
        reference_number: isForeign ? undefined : moraReference.trim() || undefined,
        rate: info.usd,
        rate_date: moraPayDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-late-fees"] });
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["credit-line"] });
      toast.success("Pago de mora registrado, pendiente de verificación");
      setShowMoraModal(false);
      setMoraPayMethod("");
      setMoraReference("");
      setActiveMora(null);
      setMoraPayPending(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al pagar mora";
      toast.error(msg);
      setMoraPayPending(false);
    },
  });

  const workshopPaymentMethods = (workshopPaymentMethodsData ?? []).filter(
    (m) => m.is_active === 1,
  );

  const backLink = (() => {
    const match = location.pathname.match(/\/dashboard\/my-workshops\/([^/]+)/);
    if (match) return `/dashboard/my-workshops/${match[1]}/sales`;
    return "/dashboard/service-orders";
  })();

  const acceptQuoteMutation = useMutation({
    mutationFn: () => acceptServiceQuote(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success("Presupuesto aceptado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al aceptar presupuesto";
      toast.error(msg);
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: () => rejectServiceQuote(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success("Presupuesto rechazado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al rechazar presupuesto";
      toast.error(msg);
    },
  });

  const acceptRevisionMutation = useMutation({
    mutationFn: () => acceptServiceRevision(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success("Costo de revisión aceptado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al aceptar revisión";
      toast.error(msg);
    },
  });

  const rejectRevisionMutation = useMutation({
    mutationFn: () => rejectServiceRevision(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success("Revisión rechazada, orden cancelada");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al rechazar revisión";
      toast.error(msg);
    },
  });

  const approveExtraMutation = useMutation({
    mutationFn: () => approveServiceExtra(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Cargo extra aprobado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al aprobar cargo extra";
      toast.error(msg);
    },
  });

  const rejectExtraMutation = useMutation({
    mutationFn: () => rejectServiceExtra(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Cargo extra rechazado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al rechazar cargo extra";
      toast.error(msg);
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelServiceOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success("Orden de servicio cancelada");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al cancelar orden";
      toast.error(msg);
    },
  });

  const markReceivedMutation = useMutation({
    mutationFn: () => markServiceReceived(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Recepción confirmada");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al confirmar recepción";
      toast.error(msg);
    },
  });

  const markDroppedOffMutation = useMutation({
    mutationFn: () => markServiceDroppedOff(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Vehículo marcado como entregado en el taller");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar entrega";
      toast.error(msg);
    },
  });

  const closeClientMutation = useMutation({
    mutationFn: () => closeServiceAsClient(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Orden cerrada");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al cerrar orden";
      toast.error(msg);
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      rateServiceOrderWorkshop(orderId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Taller calificado exitosamente");
      setShowRatingModal(false);
      setRatingValue(5);
      setRatingComment("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al registrar pago";
      toast.error(msg);
    },
  });

  const payServiceOrderMutation = useMutation({
    mutationFn: ({
      payment_method,
      reference_number,
      rate,
      rate_date,
    }: {
      payment_method: string;
      reference_number?: string;
      rate?: number | null;
      rate_date?: string | null;
    }) => payServiceOrder(orderId, { payment_method, reference_number, rate, rate_date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success("Pago registrado, esperando confirmación del taller");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al registrar pago";
      toast.error(msg);
    },
  });

  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }
    const isCash = workshopPaymentMethods.find((m) => m.id === payMethod)?.type === "cash";
    if (!isCash && !payReference.trim()) {
      toast.error("Ingresa el número de referencia");
      return;
    }
    const selectedMethod = workshopPaymentMethods.find((m) => m.id === payMethod);
    const paymentMethodType = (selectedMethod?.type ?? "").toUpperCase();
    const info = await getBcvRateInfo();
    setPayPending(true);
    payServiceOrderMutation.mutate(
      {
        payment_method: paymentMethodType,
        reference_number: isCash ? undefined : payReference.trim() || undefined,
        rate: info.usd,
        rate_date: info.date,
      },
      {
        onSuccess: () => {
          setShowPayModal(false);
          setPayMethod("");
          setPayReference("");
          setPayPending(false);
        },
        onError: () => setPayPending(false),
      },
    );
  }

  const selectedPaymentInfo = payMethod
    ? workshopPaymentMethods.find((m) => m.id === payMethod)?.type || payMethod
    : null;

  const selectedPaymentInfoDisplay = selectedPaymentInfo ? (
    <div className="mt-2 pt-2 border-t border-border">
      <p className="mt-2 text-xs text-muted-foreground">
        Seleccionado: {workshopPaymentMethods.find((m) => m.id === payMethod)?.type || payMethod}
      </p>
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {order && (
        <Link
          to={backLink as any}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
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
                $
                {(
                  (order.final_price ?? order.base_price ?? 0) +
                  (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">Entrega</p>
              <p className="ml-stat-value text-sm">
                {order.delivery_method === "SHIPPING" ? "Envío" : "Recoger en taller"}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">Estado</p>
              <p className="ml-stat-value text-sm">
                {SERVICE_ORDER_LABELS[order.status] ?? order.status}
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
                  <span className="font-medium">{order.vehicle_brand}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-medium">{order.vehicle_model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Placa:</span>
                  <span className="font-medium">{order.vehicle_license_plate}</span>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2 pt-1">
                    <span className="text-muted-foreground">Nota:</span>
                    <span className="font-medium">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {order.workshop_name && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Store className="h-4 w-4" />
                  Información del taller
                </h2>
                <p className="text-sm font-medium">{order.workshop_name}</p>
                {order.workshop_rif && (
                  <p className="mt-1 text-xs text-muted-foreground">RIF: {order.workshop_rif}</p>
                )}
                {order.workshop_address && (
                  <p className="mt-1 text-xs text-muted-foreground">{order.workshop_address}</p>
                )}
              </div>
            )}

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
                        <span className="font-medium text-amber-400">
                          + ${order.extra_charge.toFixed(2)}
                        </span>
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
                        $
                        {(
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
                        $
                        {(
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
                            {idx === 0 ? "Revisión" : `Adicional ${idx}`} —{" "}
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
                            {payment.rate
                              ? ` · Tasa: ${Number(payment.rate).toLocaleString("es-VE")} bs/${
                                  payment.rate_date
                                    ? ` (${new Date(payment.rate_date).toLocaleDateString("es-ES")})`
                                    : ""
                                }`
                              : ""}
                            {idx === 1 && order.extra_charge_note && (
                              <span className="ml-2 text-xs text-amber-400">
                                Nota: {order.extra_charge_note}
                              </span>
                            )}
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
                    const isPending = inst.status === "PENDING" || inst.status === "OVERDUE";
                    const mora = moraByInstallment.get(inst.id);
                    const hasOpenMora = !!mora && (mora.status === "PENDING" || mora.status === "PENDING_VERIFICATION");
                    const canPay = isPending && isClient && !hasOpenMora;
                    const canPayMora = hasOpenMora && mora!.status === "PENDING" && isClient;
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
                                ` · ${inst.payment_method === "BANK_TRANSFER" ? "Transferencia" : inst.payment_method === "MOBILE_PAYMENT" ? "Pago móvil" : inst.payment_method === "CASH" ? "Efectivo" : inst.payment_method}`}
                              {inst.reference_number && ` · Ref: ${inst.reference_number}`}
                              {inst.paid_at && ` · Pagado: ${new Date(inst.paid_at).toLocaleDateString("es-ES")}`}
                            </p>
                            {hasOpenMora && mora && (
                              <p className="mt-0.5 text-[11px] font-medium text-red-400">
                                Mora: ${mora.amount.toFixed(2)}
                                {mora.status === "PENDING_VERIFICATION" && " (en verificación)"}
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
                          {canPay && (
                            <button
                              className="ml-btn ml-btn-primary px-3 py-1.5 text-xs"
                              onClick={() => {
                                setActiveInstallment(inst);
                                setInstallmentPayMethod("");
                                setInstallmentReference("");
                                setInstallmentPayDate(new Date().toISOString().slice(0, 10));
                                setShowInstallmentModal(true);
                              }}
                            >
                              Pagar
                            </button>
                          )}
                          {canPayMora && (
                            <button
                              className="ml-btn ml-btn-primary px-3 py-1.5 text-xs"
                              style={{ backgroundColor: "oklch(0.65 0.2 25)" }}
                              onClick={() => {
                                setActiveMora(mora!);
                                setMoraPayMethod("");
                                setMoraReference("");
                                setMoraPayDate(new Date().toISOString().slice(0, 10));
                                setShowMoraModal(true);
                              }}
                            >
                              Pagar mora
                            </button>
                          )}
                          {hasOpenMora && mora?.status === "PENDING_VERIFICATION" && (
                            <span className="text-[11px] text-amber-400">Mora en verificación</span>
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
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">
                      {order.delivery_method === "SHIPPING"
                        ? "Envío nacional"
                        : "Retirar en el taller"}
                    </span>
                  </div>
                  {order.delivery_method === "SHIPPING" && (
                    <>
                      {order.tracking_number && (
                        <div className="flex items-start gap-2">
                          <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Seguimiento:</span>
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
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {order.status === "PENDING" && (
              <div className="ml-card border-amber-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-400">Orden pendiente</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Cuando entregues el vehículo en el taller, márcalo como entregado para
                      que el taller confirme la recepción.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => markDroppedOffMutation.mutate()}
                        disabled={markDroppedOffMutation.isPending}
                        className="ml-btn bg-primary text-white"
                      >
                        {markDroppedOffMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Truck className="h-4 w-4" />
                        Marcar como entregado en el taller
                      </button>
                      <button
                        onClick={() => cancelOrderMutation.mutate()}
                        disabled={cancelOrderMutation.isPending}
                        className="ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        {cancelOrderMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <XCircle className="h-4 w-4" />
                        Cancelar servicio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "DROPPED_OFF" && (
              <div className="ml-card border-amber-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-400">Vehículo entregado en el taller</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esperando que el taller confirme la recepción del vehículo.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => cancelOrderMutation.mutate()}
                        disabled={cancelOrderMutation.isPending}
                        className="ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        {cancelOrderMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <XCircle className="h-4 w-4" />
                        Cancelar servicio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "AT_WORKSHOP" && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">Vehículo en taller</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El vehículo está en el taller, esperando presupuesto.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {order.status === "REVISION_SENT" && (
              <div className="ml-card border-purple-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Search className="mt-0.5 h-5 w-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-400">Revisión enviada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El taller ha enviado un costo de revisión. Si rechazas el presupuesto después,
                      deberás pagar este costo.
                    </p>
                    {order.revision != null && (
                      <p className="mt-3 font-mono text-2xl font-bold">
                        ${order.revision.toFixed(2)}
                      </p>
                    )}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => acceptRevisionMutation.mutate()}
                        disabled={acceptRevisionMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {acceptRevisionMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <CheckCircle2 className="h-4 w-4" />
                        Aceptar revisión
                      </button>
                      <button
                        onClick={() => rejectRevisionMutation.mutate()}
                        disabled={rejectRevisionMutation.isPending}
                        className="ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        {rejectRevisionMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <XCircle className="h-4 w-4" />
                        Rechazar y cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "QUOTED" && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">Presupuesto recibido</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El taller ha enviado un presupuesto. Revísalo y decide si lo aceptas o
                      rechazas.
                    </p>
                    {order.final_price != null && (
                      <p className="mt-3 font-mono text-2xl font-bold">
                        ${order.final_price.toFixed(2)}
                      </p>
                    )}
                    {order.revision != null && (
                      <p className="mt-2 text-sm text-amber-400">
                        Si rechazas, pagas revisión:{" "}
                        <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => acceptQuoteMutation.mutate()}
                        disabled={acceptQuoteMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {acceptQuoteMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <CheckCircle2 className="h-4 w-4" />
                        Aceptar presupuesto
                      </button>
                      <button
                        onClick={() => {
                          setFinancePaymentMethod("");
                          setFinanceReference("");
                          setShowFinanceModal(true);
                        }}
                        className="ml-btn border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <Wallet className="h-4 w-4" />
                        Financiar
                      </button>
                      <button
                        onClick={() => rejectQuoteMutation.mutate()}
                        disabled={rejectQuoteMutation.isPending}
                        className="ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        {rejectQuoteMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <XCircle className="h-4 w-4" />
                        Rechazar presupuesto
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
                      + ${order.extra_charge.toFixed(2)}
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => approveExtraMutation.mutate()}
                        disabled={approveExtraMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {approveExtraMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <CheckCircle2 className="h-4 w-4" />
                        Aprobar cargo extra
                      </button>
                      <button
                        onClick={() => rejectExtraMutation.mutate()}
                        disabled={rejectExtraMutation.isPending}
                        className="ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        {rejectExtraMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <XCircle className="h-4 w-4" />
                        Rechazar cargo extra
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "ACCEPTED" && (
              <div className="ml-card border-green-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
                  <div className="flex-1">
                    <p className="font-medium text-green-400">Presupuesto aceptado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Presupuesto aceptado.{" "}
                      {order.is_paid
                        ? "Pago confirmado. Esperando que el taller inicie el servicio."
                        : order.payment_status === "PENDING_VERIFICATION"
                          ? "Pago registrado. Esperando confirmación del taller."
                          : "Paga el presupuesto para que el taller inicie el servicio."}
                    </p>
                    {!order.is_paid && order.final_price != null && (
                      <p className="mt-2 font-mono text-xl font-bold text-green-400">
                        $
                        {(() => {
                          const totalOwed =
                            (order.final_price ?? 0) +
                            (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0);
                          const paidSum = (order.payments ?? [])
                            .filter((p) => p.status === "PAID")
                            .reduce((sum, p) => sum + p.amount, 0);
                          return Math.max(0, totalOwed - paidSum).toFixed(2);
                        })()}
                      </p>
                    )}
                    {!order.is_paid && order.payment_status !== "PENDING_VERIFICATION" && (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="mt-4 ml-btn ml-btn-primary"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar $
                        {(() => {
                          const totalOwed =
                            (order.final_price ?? 0) +
                            (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0);
                          const paidSum = (order.payments ?? [])
                            .filter((p) => p.status === "PAID")
                            .reduce((sum, p) => sum + p.amount, 0);
                          return Math.max(0, totalOwed - paidSum).toFixed(2);
                        })()}
                      </button>
                    )}
                    {order.payment_status === "PENDING_VERIFICATION" && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                        <Clock className="h-4 w-4" />
                        Pago pendiente de verificación
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

{["IN_PROGRESS", "COMPLETED"].includes(order.status) && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">
                      {order.status === "IN_PROGRESS" ? "Servicio en progreso" : "Servicio completado"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.status === "IN_PROGRESS"
                        ? "El servicio está en progreso. El taller notificará cuando esté completado."
                        : "El servicio ha sido completado por el taller."}
                    </p>
                    {order.extra_charge_status === "APPROVED" &&
                    !order.is_paid &&
                    order.payment_status !== "PENDING_VERIFICATION" && (
                      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                        <p className="text-sm font-medium text-amber-400">
                          Pago adicional aprobado
                        </p>
                        {order.extra_charge_note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Nota del taller: {order.extra_charge_note}
                          </p>
                        )}
                        <p className="mt-2 font-mono text-lg font-bold text-amber-400">
                          +${order.extra_charge.toFixed(2)}
                        </p>
                        <button
                          onClick={() => setShowPayModal(true)}
                          className="mt-3 ml-btn border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pagar adicional
                        </button>
                      </div>
                    )}
                    {order.payment_status === "PENDING_VERIFICATION" && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                        <Clock className="h-4 w-4" />
                        Pago pendiente de verificación
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {order.status === "COMPLETED" && order.delivery_method === "SHIPPING" && (
              <div className="ml-card border-emerald-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-400">Servicio completado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esperando que el taller marque la orden como enviada.
                    </p>
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
                      El servicio ha sido completado. Confirma la recepción del vehículo.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => markReceivedMutation.mutate()}
                        disabled={markReceivedMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {markReceivedMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Truck className="h-4 w-4" />
                        Marcar como retirado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "SHIPPED" && (
              <div className="ml-card border-blue-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-400">Producto enviado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El taller ha marcado la orden como enviada.
                    </p>
                    {order.tracking_number && (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Número de seguimiento:</span>{" "}
                        <span className="font-mono font-medium">{order.tracking_number}</span>
                      </p>
                    )}
                    {order.shipping_notes && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Agencia: {order.shipping_notes}
                      </p>
                    )}
                    {order.shipped_at && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fecha de envío:{" "}
                        {new Date(order.shipped_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <div className="mt-4">
                      <button
                        onClick={() => markReceivedMutation.mutate()}
                        disabled={markReceivedMutation.isPending}
                        className="ml-btn ml-btn-primary"
                      >
                        {markReceivedMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Confirmar recepción
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "DELIVERED" && (
              <div className="ml-card border-teal-500/30 p-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 text-teal-400" />
                  <div className="flex-1">
                    <p className="font-medium text-teal-400">Vehículo entregado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vehículo entregado. Confirma el cierre de la orden.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => closeClientMutation.mutate()}
                        disabled={closeClientMutation.isPending || order.closed_by_client}
                        className={`ml-btn ${order.closed_by_client ? "ml-btn-outline" : "ml-btn-primary"}`}
                      >
                        {closeClientMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {order.closed_by_client ? "Cierre confirmado" : "Cerrar orden"}
                      </button>
                    </div>
                    {order.closed_by_client && (
                      <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Cliente cerró
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {order.status === "CLOSED" && (
              <div className="ml-card border-sky-500/30 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sky-400">Orden cerrada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esta orden de servicio ha sido cerrada.
                    </p>
                    {!order.ratings?.client_rated && (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="ml-btn ml-btn-primary mt-4"
                      >
                        <Star className="h-4 w-4" />
                        Calificar taller
                      </button>
                    )}
                    {order.ratings?.client_rated && (
                      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Tu calificación al taller:
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
                        {order.ratings?.client_review && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            "{order.ratings.client_review}"
                          </p>
                        )}
                      </div>
                    )}
                    {order.ratings?.workshop_rated && (
                      <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Calificación del taller:
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {order.status === "CANCELLED" && (
              <div className="ml-card border-red-500/30 p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-medium text-red-400">Orden cancelada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esta orden ha sido cancelada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {order.status === "REJECTED" && (
              <div className="ml-card border-red-500/30 p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-medium text-red-400">Presupuesto rechazado</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El presupuesto fue rechazado.{" "}
                      {order.is_paid
                        ? "Pago de revisión confirmado. Orden cerrada."
                        : order.payment_status === "PENDING_VERIFICATION"
                          ? "Pago de revisión registrado. Esperando confirmación del taller."
                          : "Debes pagar la revisión para cerrar la orden."}
                    </p>
                    {!order.is_paid && order.revision != null && (
                      <p className="mt-2 font-mono text-xl font-bold text-red-400">
                        Revisión: $
                        {(() => {
                          const paidSum = (order.payments ?? [])
                            .filter((p) => p.status === "PAID")
                            .reduce((sum, p) => sum + p.amount, 0);
                          return Math.max(0, (order.revision ?? 0) - paidSum).toFixed(2);
                        })()}
                      </p>
                    )}
                    {!order.is_paid && order.payment_status !== "PENDING_VERIFICATION" && (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="mt-4 ml-btn border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar revisión $
                        {(() => {
                          const paidSum = (order.payments ?? [])
                            .filter((p) => p.status === "PAID")
                            .reduce((sum, p) => sum + p.amount, 0);
                          return Math.max(0, (order.revision ?? 0) - paidSum).toFixed(2);
                        })()}
                      </button>
                    )}
                    {order.payment_status === "PENDING_VERIFICATION" && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                        <Clock className="h-4 w-4" />
                        Pago pendiente de verificación
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
          <Link to="/dashboard/service-orders" className="ml-btn ml-btn-primary">
            Volver a órdenes
          </Link>
        </div>
      )}

      {showPayModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Registrar pago</h2>
            <div className="mt-1">
              {(() => {
                const totalOwed =
                  order.status === "REJECTED"
                    ? (order.revision ?? 0)
                    : (order.final_price ?? 0) +
                      (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0);
                const paidSum = (order.payments ?? [])
                  .filter((p) => p.status === "PAID")
                  .reduce((sum, p) => sum + p.amount, 0);
                const remaining = Math.max(0, totalOwed - paidSum);
                const label =
                  order.status === "REJECTED"
                    ? "Pagar revisión"
                    : paidSum > 0
                      ? "Pago pendiente"
                      : "Pagar presupuesto";
                const hasBcv = bcvRate && bcvRate > 0 && !(() => {
                  const m = workshopPaymentMethods.find((m) => m.id === payMethod);
                  return m?.type === "zelle" || m?.type === "zinli";
                })();
                return (
                  <>
                    <p className="text-sm font-medium">{label}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      {hasBcv && (
                        <span className="text-2xl font-bold font-mono text-foreground">
                          {formatBcv(remaining, bcvRate)}
                        </span>
                      )}
                      <span
                        className={
                          hasBcv
                            ? "text-sm font-mono text-muted-foreground"
                            : "text-2xl font-bold font-mono text-foreground"
                        }
                      >
                        (${remaining.toFixed(2)})
                      </span>
                    </div>
                    {bcvInfo && bcvInfo.usd > 0 && hasBcv && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tasa BCV: {bcvInfo.usd.toLocaleString("es-VE")} bs/${
                          bcvInfo.date ? ` · ${bcvInfo.date}` : ""
                        }
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <form onSubmit={handlePaySubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Método de pago <span className="text-destructive">*</span>
                </label>
                {paymentMethodsLoading ? (
                  <div className="ml-input w-full py-2 text-center text-sm text-muted-foreground">
                    Cargando métodos de pago...
                  </div>
                ) : workshopPaymentMethods.length === 0 ? (
                  <div className="ml-input w-full py-2 text-center text-sm text-red-400">
                    Este taller no tiene métodos de pago configurados
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {workshopPaymentMethods.map((method) => {
                      const isSelected = payMethod === method.id;
                      const typeLabel =
                        method.type === "bank_transfer"
                          ? "Transferencia bancaria"
                          : method.type === "mobile_payment"
                            ? "Pago móvil"
                            : method.type === "cash"
                              ? "Efectivo"
                              : method.type === "zelle"
                                ? "Zelle"
                                : method.type === "zinli"
                                  ? "Zinli"
                                  : "Otro";
                      const typeColor =
                        method.type === "bank_transfer"
                          ? "text-blue-400"
                          : method.type === "mobile_payment"
                            ? "text-green-400"
                            : method.type === "cash"
                              ? "text-amber-400"
                              : method.type === "zelle" || method.type === "zinli"
                                ? "text-purple-400"
                                : "text-muted-foreground";
                      const showDetails = isSelected;
                      return (
                        <div
                          key={method.id}
                          className={`rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary/60 bg-primary/10 shadow-sm"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setPayMethod(isSelected ? "" : method.id)}
                            className="flex w-full items-center gap-3 p-3 text-left cursor-pointer"
                          >
                            <div
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                                isSelected ? "border-primary bg-primary" : "border-border"
                              }`}
                            >
                              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold capitalize ${typeColor}`}>
                                  {typeLabel}
                                </span>
                                {method.type === "bank_transfer" && method.bank_name && (
                                  <span className="text-xs text-muted-foreground">
                                    {method.bank_name}
                                  </span>
                                )}
                              </div>
                              {!showDetails &&
                                method.type === "mobile_payment" &&
                                method.phone_number && (
                                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                    {method.phone_number}
                                  </p>
                                )}
                              {!showDetails &&
                                method.type === "bank_transfer" &&
                                method.account_number && (
                                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                    ****{method.account_number.slice(-4)}
                                  </p>
                                )}
                              {!showDetails && method.type === "cash" && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Pago en el taller
                                </p>
                              )}
                              {!showDetails && (method.type === "zelle" || method.type === "zinli") && method.email && (
                                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                  {method.email}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                Toca para deseleccionar
                              </span>
                            )}
                          </button>

                          {showDetails && (
                            <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                              {method.type === "bank_transfer" && (
                                <div className="space-y-1">
                                  {method.bank_name && (
                                    <p>
                                      <span className="text-muted-foreground/70">Banco:</span>{" "}
                                      {method.bank_name}
                                    </p>
                                  )}
                                  {method.account_number && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">Cuenta:</span>{" "}
                                      {method.account_number}
                                    </p>
                                  )}
                                  {method.account_holder && (
                                    <p>
                                      <span className="text-muted-foreground/70">Titular:</span>{" "}
                                      {method.account_holder}
                                    </p>
                                  )}
                                  {method.holder_ci && (
                                    <p>
                                      <span className="text-muted-foreground/70">CI:</span>{" "}
                                      {method.holder_ci}
                                    </p>
                                  )}
                                </div>
                              )}
                              {method.type === "mobile_payment" && (
                                <div className="space-y-1">
                                  {method.phone_number && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">Teléfono:</span>{" "}
                                      {method.phone_number}
                                    </p>
                                  )}
                                  {method.holder_ci && (
                                    <p>
                                      <span className="text-muted-foreground/70">CI:</span>{" "}
                                      {method.holder_ci}
                                    </p>
                                  )}
                                  {method.bank_name && (
                                    <p>
                                      <span className="text-muted-foreground/70">Banco:</span>{" "}
                                      {method.bank_name}
                                    </p>
                                  )}
                                </div>
                              )}
                              {method.type === "cash" && (
                                <p>
                                  Paga en efectivo directamente en el taller al recoger el vehículo.
                                </p>
                              )}
                              {(method.type === "zelle" || method.type === "zinli") && (
                                <div className="space-y-1">
                                  {method.email && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">Email:</span>{" "}
                                      {method.email}
                                    </p>
                                  )}
                                  {method.account_holder && (
                                    <p>
                                      <span className="text-muted-foreground/70">Titular:</span>{" "}
                                      {method.account_holder}
                                    </p>
                                  )}
                                  <p className="text-primary/70">Pago en USD — sin equivalente en Bs</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {payMethod &&
                (() => {
                  const isCash =
                    workshopPaymentMethods.find((m) => m.id === payMethod)?.type === "cash";
                  return (
                    <div>
                      {!isCash && (
                        <>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Número de referencia
                          </label>
                          <input
                            type="text"
                            value={payReference}
                            onChange={(e) => setPayReference(e.target.value)}
                            placeholder="Ej. 0123456789"
                            className="ml-input w-full"
                            required
                          />
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Ingresa el número de transferencia o pago móvil realizado.
                          </p>
                        </>
                      )}
                      {isCash && (
                        <p className="text-xs text-muted-foreground">
                          Paga en efectivo directamente en el taller al recoger el vehículo.
                        </p>
                      )}
                    </div>
                  );
                })()}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payPending || !payMethod}
                  className="ml-btn ml-btn-primary"
                >
                  {payPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRatingModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Calificar taller</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Califica tu experiencia con {order.workshop_name ?? "este taller"}.
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
                    className={`h-8 w-8 ${s <= ratingValue ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`}
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
                onClick={() => rateMutation.mutate({ rating: ratingValue, comment: ratingComment })}
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

      {showFinanceModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Financiar servicio</h2>
              <button onClick={() => setShowFinanceModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              if (!creditLine) {
                return (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isCreditLineLoading
                        ? "Cargando información de crédito…"
                        : "No se pudo cargar la información de crédito"}
                    </p>
                  </div>
                );
              }

              const totalPrice = order.final_price ?? order.base_price;
              const totalCents = Math.round(totalPrice * 100);
              const downCents = Math.round(totalCents * financeDownPct / 100);
              const financedCents = totalCents - downCents;
              const downPayment = downCents / 100;
              const financed = financedCents / 100;
              const serviceAvailable = creditLine?.service_available ?? 0;
              const exceedsCredit = financed > serviceAvailable;
              const minPct = creditLine?.min_down_payment_pct ?? 0;
              const selectedMethod = workshopPaymentMethods.find((m) => m.id === financePaymentMethod);
              const isCash = selectedMethod?.type === "cash";

              return (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Pago inicial ({financeDownPct}%)</label>
                    <input
                      type="range"
                      min={minPct}
                      max={100}
                      step={5}
                      value={financeDownPct}
                      onChange={(e) => setFinanceDownPct(parseInt(e.target.value))}
                      className="mt-2 w-full accent-primary"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>Pago inicial: <span className="font-semibold text-foreground">${downPayment.toFixed(2)}</span></span>
                      <span>Financiado: <span className="font-semibold text-foreground">${financed.toFixed(2)}</span></span>
                    </div>
                    {minPct > 0 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Mínimo {minPct}% de pago inicial para tu nivel de crédito (nivel {creditLine?.level})
                      </p>
                    )}
                  </div>

                  {creditLine && (
                    <div className={`rounded-lg border p-3 text-xs ${
                      exceedsCredit
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    }`}>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Wallet className="h-3.5 w-3.5" />
                        Crédito de servicio disponible: ${serviceAvailable.toFixed(2)}
                      </div>
                      {exceedsCredit ? (
                        <p className="mt-1">El monto financiado excede tu crédito. Aumenta el pago inicial.</p>
                      ) : (
                        <p className="mt-1">Te quedarán ${(serviceAvailable - financed).toFixed(2)} disponibles.</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Método de pago <span className="text-destructive">*</span>
                    </label>
                    {paymentMethodsLoading ? (
                      <div className="ml-input w-full py-2 text-center text-sm text-muted-foreground">
                        Cargando métodos de pago...
                      </div>
                    ) : workshopPaymentMethods.length === 0 ? (
                      <div className="ml-input w-full py-2 text-center text-sm text-red-400">
                        Este taller no tiene métodos de pago configurados
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {workshopPaymentMethods.map((method) => {
                          const isSelected = financePaymentMethod === method.id;
                          const typeLabel =
                            method.type === "bank_transfer"
                              ? "Transferencia bancaria"
                              : method.type === "mobile_payment"
                                ? "Pago móvil"
                                : method.type === "cash"
                                  ? "Efectivo"
                                  : method.type === "zelle"
                                    ? "Zelle"
                                    : method.type === "zinli"
                                      ? "Zinli"
                                      : "Otro";
                          const typeColor =
                            method.type === "bank_transfer"
                              ? "text-blue-400"
                              : method.type === "mobile_payment"
                                ? "text-green-400"
                                : method.type === "cash"
                                  ? "text-amber-400"
                                  : method.type === "zelle" || method.type === "zinli"
                                    ? "text-purple-400"
                                    : "text-muted-foreground";
                          const showDetails = isSelected;
                          return (
                            <div
                              key={method.id}
                              className={`rounded-xl border transition-all ${
                                isSelected
                                  ? "border-primary/60 bg-primary/10 shadow-sm"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setFinancePaymentMethod(isSelected ? "" : method.id)}
                                className="flex w-full items-center gap-3 p-3 text-left cursor-pointer"
                              >
                                <div
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                                    isSelected ? "border-primary bg-primary" : "border-border"
                                  }`}
                                >
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold capitalize ${typeColor}`}>
                                      {typeLabel}
                                    </span>
                                    {method.type === "bank_transfer" && method.bank_name && (
                                      <span className="text-xs text-muted-foreground">
                                        {method.bank_name}
                                      </span>
                                    )}
                                  </div>
                                  {!showDetails &&
                                    method.type === "mobile_payment" &&
                                    method.phone_number && (
                                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                        {method.phone_number}
                                      </p>
                                    )}
                                  {!showDetails &&
                                    method.type === "bank_transfer" &&
                                    method.account_number && (
                                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                        ****{method.account_number.slice(-4)}
                                      </p>
                                    )}
                                  {!showDetails && method.type === "cash" && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      Pago en el taller
                                    </p>
                                  )}
                                  {!showDetails && (method.type === "zelle" || method.type === "zinli") && method.email && (
                                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                      {method.email}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                    Toca para deseleccionar
                                  </span>
                                )}
                              </button>

                              {showDetails && (
                                <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                                  {method.type === "bank_transfer" && (
                                    <div className="space-y-1">
                                      {method.bank_name && (
                                        <p>
                                          <span className="text-muted-foreground/70">Banco:</span>{" "}
                                          {method.bank_name}
                                        </p>
                                      )}
                                      {method.account_number && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">Cuenta:</span>{" "}
                                          {method.account_number}
                                        </p>
                                      )}
                                      {method.account_holder && (
                                        <p>
                                          <span className="text-muted-foreground/70">Titular:</span>{" "}
                                          {method.account_holder}
                                        </p>
                                      )}
                                      {method.holder_ci && (
                                        <p>
                                          <span className="text-muted-foreground/70">CI:</span>{" "}
                                          {method.holder_ci}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {method.type === "mobile_payment" && (
                                    <div className="space-y-1">
                                      {method.phone_number && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">Teléfono:</span>{" "}
                                          {method.phone_number}
                                        </p>
                                      )}
                                      {method.holder_ci && (
                                        <p>
                                          <span className="text-muted-foreground/70">CI:</span>{" "}
                                          {method.holder_ci}
                                        </p>
                                      )}
                                      {method.bank_name && (
                                        <p>
                                          <span className="text-muted-foreground/70">Banco:</span>{" "}
                                          {method.bank_name}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {method.type === "cash" && (
                                    <p>
                                      Paga en efectivo directamente en el taller al recoger el
                                      vehículo.
                                    </p>
                                  )}
                                  {(method.type === "zelle" || method.type === "zinli") && (
                                    <div className="space-y-1">
                                      {method.email && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">Email:</span>{" "}
                                          {method.email}
                                        </p>
                                      )}
                                      {method.account_holder && (
                                        <p>
                                          <span className="text-muted-foreground/70">Titular:</span>{" "}
                                          {method.account_holder}
                                        </p>
                                      )}
                                      <p className="text-primary/70">Pago en USD — sin equivalente en Bs</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {financePaymentMethod && !isCash && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        Número de referencia <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={financeReference}
                        onChange={(e) => setFinanceReference(e.target.value)}
                        placeholder="Ej. 0123456789"
                        className="ml-input w-full"
                        required
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Ingresa el número de transferencia o pago móvil realizado.
                      </p>
                    </div>
                  )}

                  {financePaymentMethod && isCash && (
                    <p className="text-xs text-muted-foreground">
                      Paga en efectivo directamente en el taller al recoger el vehículo.
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowFinanceModal(false)}
                      className="ml-btn ml-btn-outline"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => financeMutation.mutate()}
                      disabled={
                        financeMutation.isPending ||
                        !financePaymentMethod ||
                        exceedsCredit ||
                        (!isCash && !financeReference.trim())
                      }
                      className="ml-btn ml-btn-primary"
                    >
                      {financeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Wallet className="h-4 w-4" />
                      Financiar ${financed.toFixed(2)}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showInstallmentModal && activeInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ml-card w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">Pagar cuota de financiamiento</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto de la cuota</span>
                  <span className="font-mono font-bold text-lg">
                    ${activeInstallment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Vence: {new Date(activeInstallment.due_date).toLocaleDateString("es-ES")}</span>
                </div>
                {bcvRate && bcvRate > 0 && !(() => {
                  const m = workshopPaymentMethods.find((m) => m.id === installmentPayMethod);
                  return m?.type === "zelle" || m?.type === "zinli";
                })() && (
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Equivalente Bs</span>
                    <span className="font-mono">
                      {formatBcv(activeInstallment.amount, bcvRate)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Método de pago <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  {workshopPaymentMethods.map((method) => {
                    const selected = installmentPayMethod === method.id;
                    const isCash = method.type === "cash";
                    return (
                      <div
                        key={method.id}
                        onClick={() => setInstallmentPayMethod(method.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {method.type === "bank_transfer"
                              ? "Transferencia bancaria"
                              : method.type === "mobile_payment"
                                ? "Pago móvil"
                                : method.type === "cash"
                                  ? "Efectivo"
                                  : method.type === "zelle"
                                    ? "Zelle"
                                    : method.type === "zinli"
                                      ? "Zinli"
                                      : method.type}
                          </span>
                          {selected && (
                            <span className="text-xs text-primary">Seleccionado</span>
                          )}
                        </div>
                        {selected && method.type === "bank_transfer" && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {method.bank_name && (
                              <p><span className="text-muted-foreground/70">Banco:</span> {method.bank_name}</p>
                            )}
                            {method.account_number && (
                              <p className="font-mono"><span className="text-muted-foreground/70">Cuenta:</span> {method.account_number}</p>
                            )}
                            {method.account_holder && (
                              <p><span className="text-muted-foreground/70">Titular:</span> {method.account_holder}</p>
                            )}
                            {method.holder_ci && (
                              <p><span className="text-muted-foreground/70">CI:</span> {method.holder_ci}</p>
                            )}
                          </div>
                        )}
                        {selected && method.type === "mobile_payment" && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {method.phone_number && (
                              <p className="font-mono"><span className="text-muted-foreground/70">Teléfono:</span> {method.phone_number}</p>
                            )}
                            {method.holder_ci && (
                              <p><span className="text-muted-foreground/70">CI:</span> {method.holder_ci}</p>
                            )}
                            {method.bank_name && (
                              <p><span className="text-muted-foreground/70">Banco:</span> {method.bank_name}</p>
                            )}
                          </div>
                        )}
                        {selected && isCash && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Paga en efectivo directamente en el taller.
                          </p>
                        )}
                        {selected && (method.type === "zelle" || method.type === "zinli") && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {method.email && (
                              <p className="font-mono"><span className="text-muted-foreground/70">Email:</span> {method.email}</p>
                            )}
                            {method.account_holder && (
                              <p><span className="text-muted-foreground/70">Titular:</span> {method.account_holder}</p>
                            )}
                            <p className="text-primary/70">Pago en USD — sin equivalente en Bs</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {installmentPayMethod && (() => {
                const selectedMethod = workshopPaymentMethods.find((m) => m.id === installmentPayMethod);
                const isCash = selectedMethod?.type === "cash";
                return !isCash;
              })() && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Número de referencia <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={installmentReference}
                    onChange={(e) => setInstallmentReference(e.target.value)}
                    placeholder="Ej. 0123456789"
                    className="ml-input w-full"
                    required
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Ingresa el número de transferencia o pago móvil realizado.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Fecha de pago
                </label>
                <input
                  type="date"
                  value={installmentPayDate}
                  onChange={(e) => setInstallmentPayDate(e.target.value)}
                  min={order?.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : undefined}
                  max={new Date().toISOString().slice(0, 10)}
                  className="ml-input w-full"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Se usará la tasa BCV de esta fecha para el cálculo en Bs
                </p>
              </div>
              {activeInstallment && (
                <div className="rounded-lg border border-border bg-surface/50 px-4 py-3">
                  {dateBcvLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Obteniendo tasa BCV...
                    </div>
                  ) : dateBcvRate ? (
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Monto a pagar</span>
                      <span className="font-mono text-lg font-bold text-primary">
                        {formatBcv(activeInstallment.amount, dateBcvRate)}
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                          (${activeInstallment.amount.toFixed(2)})
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monto a pagar</span>
                      <span className="text-lg font-semibold text-foreground">
                        ${activeInstallment.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {activeInstallment.due_date && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Vence: {new Date(activeInstallment.due_date).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowInstallmentModal(false);
                    setActiveInstallment(null);
                    setInstallmentPayMethod("");
                    setInstallmentReference("");
                  }}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setInstallmentPayPending(true);
                    payInstallmentMutation.mutate();
                  }}
                  disabled={
                    installmentPayPending ||
                    !installmentPayMethod ||
                    !(() => {
                      const selectedMethod = workshopPaymentMethods.find((m) => m.id === installmentPayMethod);
                      const isCash = selectedMethod?.type === "cash";
                      return isCash || installmentReference.trim().length > 0;
                    })()
                  }
                  className="ml-btn ml-btn-primary"
                >
                  {installmentPayPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <CreditCard className="h-4 w-4" />
                  Pagar ${activeInstallment.amount.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMoraModal && activeMora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ml-card w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">Pagar mora</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto de la mora</span>
                  <span className="font-mono font-bold text-lg text-red-400">
                    ${activeMora.amount.toFixed(2)}
                  </span>
                </div>
                {bcvRate && bcvRate > 0 && !(() => {
                  const d = paymentDestinations?.find((d) => d.id === moraPayMethod);
                  return d?.method_type === "ZELLE" || d?.method_type === "BINANCE";
                })() && (
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Equivalente Bs</span>
                    <span className="font-mono">{formatBcv(activeMora.amount, bcvRate)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Destino del pago <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  {paymentDestinationsLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!paymentDestinationsLoading && (paymentDestinations?.length ?? 0) === 0 && (
                    <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                      No hay métodos de pago disponibles. Contacta al administrador.
                    </div>
                  )}
                  {paymentDestinations?.map((d) => {
                    const selected = moraPayMethod === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setMoraPayMethod(d.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{d.label}</span>
                          {selected && <span className="text-xs text-primary">Seleccionado</span>}
                        </div>
                        {selected && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {d.bank_name && <p>Banco: <span className="text-foreground">{d.bank_name}</span></p>}
                            {d.account_number && <p>Cuenta: <span className="text-foreground font-mono">{d.account_number}</span></p>}
                            {d.holder_name && <p>Titular: <span className="text-foreground">{d.holder_name}</span></p>}
                            {d.holder_ci && <p>CI: <span className="text-foreground">{d.holder_ci}</span></p>}
                            {d.phone && <p>Tel: <span className="text-foreground font-mono">{d.phone}</span></p>}
                            {d.email && <p>Email: <span className="text-foreground">{d.email}</span></p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {moraPayMethod && (() => {
                const dest = paymentDestinations?.find((d) => d.id === moraPayMethod);
                const isForeign = dest?.method_type === "ZELLE" || dest?.method_type === "BINANCE";
                return !isForeign;
              })() && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Número de referencia <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={moraReference}
                    onChange={(e) => setMoraReference(e.target.value)}
                    placeholder="Ej. 0123456789"
                    className="ml-input w-full"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Fecha de pago
                </label>
                <input
                  type="date"
                  value={moraPayDate}
                  onChange={(e) => setMoraPayDate(e.target.value)}
                  min={order?.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : undefined}
                  max={new Date().toISOString().slice(0, 10)}
                  className="ml-input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowMoraModal(false);
                    setActiveMora(null);
                    setMoraPayMethod("");
                    setMoraReference("");
                  }}
                  className="ml-btn ml-btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setMoraPayPending(true);
                    payMoraMutation.mutate();
                  }}
                  disabled={
                    moraPayPending ||
                    !moraPayMethod ||
                    !(() => {
                      const dest = paymentDestinations?.find((d) => d.id === moraPayMethod);
                      const isForeign = dest?.method_type === "ZELLE" || dest?.method_type === "BINANCE";
                      return isForeign || moraReference.trim().length > 0;
                    })()
                  }
                  className="ml-btn ml-btn-primary"
                  style={{ backgroundColor: "oklch(0.65 0.2 25)" }}
                >
                  {moraPayPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <AlertTriangle className="h-4 w-4" />
                  Pagar mora ${activeMora.amount.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
