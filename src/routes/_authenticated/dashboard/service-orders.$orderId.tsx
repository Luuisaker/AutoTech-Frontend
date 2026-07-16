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
import { useLocale } from "../../../lib/locale-context";

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
  const { t } = useLocale();
  const isClient = roles.includes("CLIENT");

  const sod = (key: string, fallback?: string, params?: Record<string, string | number>) =>
    t(`serviceOrderDetail.${key}`, fallback, params);
  const statusLabel = (status: string) =>
    t(`serviceOrders.status.${status}`, SERVICE_ORDER_LABELS[status] ?? status);
  const installmentStatusLabel = (status: string) =>
    t(`serviceOrderDetail.installmentStatus.${status}`, status);
  const paymentMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      BANK_TRANSFER: t("checkout.paymentTypes.bank_transfer", "Bank transfer"),
      MOBILE_PAYMENT: t("checkout.paymentTypes.mobile_payment", "Mobile payment"),
      CASH: t("checkout.paymentTypes.cash", "Cash"),
      ZELLE: t("checkout.paymentTypes.zelle", "Zelle"),
      ZINLI: t("checkout.paymentTypes.zinli", "Zinli"),
      OTHER: t("common.other", "Other"),
    };
    return labels[type] ?? type;
  };

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
      toast.success(sod("serviceFinanced"));
      setShowFinanceModal(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorFinancing");
      toast.error(msg);
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async () => {
      if (!activeInstallment) throw new Error(sod("noInstallmentSelected"));
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
      toast.success(sod("installmentPaid"));
      setShowInstallmentModal(false);
      setInstallmentPayMethod("");
      setInstallmentReference("");
      setActiveInstallment(null);
      setInstallmentPayPending(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorPayingInstallment");
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
      if (!activeMora) throw new Error(sod("noMoraSelected"));
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
      toast.success(sod("moraPaid"));
      setShowMoraModal(false);
      setMoraPayMethod("");
      setMoraReference("");
      setActiveMora(null);
      setMoraPayPending(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorPayingMora");
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
      toast.success(sod("quoteAccepted"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorAcceptingQuote");
      toast.error(msg);
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: () => rejectServiceQuote(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success(sod("quoteRejected"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorRejectingQuote");
      toast.error(msg);
    },
  });

  const acceptRevisionMutation = useMutation({
    mutationFn: () => acceptServiceRevision(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success(sod("revisionAccepted"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorAcceptingRevision");
      toast.error(msg);
    },
  });

  const rejectRevisionMutation = useMutation({
    mutationFn: () => rejectServiceRevision(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success(sod("revisionRejected"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorRejectingRevision");
      toast.error(msg);
    },
  });

  const approveExtraMutation = useMutation({
    mutationFn: () => approveServiceExtra(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success(sod("extraApproved"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorApprovingExtra");
      toast.error(msg);
    },
  });

  const rejectExtraMutation = useMutation({
    mutationFn: () => rejectServiceExtra(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success(sod("extraRejected"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorRejectingExtra");
      toast.error(msg);
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelServiceOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success(sod("orderCancelled"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorCancellingOrder");
      toast.error(msg);
    },
  });

  const markReceivedMutation = useMutation({
    mutationFn: () => markServiceReceived(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success(sod("receptionConfirmed"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorConfirmingReception");
      toast.error(msg);
    },
  });

  const markDroppedOffMutation = useMutation({
    mutationFn: () => markServiceDroppedOff(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success(sod("vehicleMarkedDroppedOff"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorMarkingDropoff");
      toast.error(msg);
    },
  });

  const closeClientMutation = useMutation({
    mutationFn: () => closeServiceAsClient(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success(sod("orderClosed"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorClosingOrder");
      toast.error(msg);
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      rateServiceOrderWorkshop(orderId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-order", orderId] });
      toast.success(sod("workshopRated"));
      setShowRatingModal(false);
      setRatingValue(5);
      setRatingComment("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorRegisteringPayment");
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
      toast.success(sod("paymentRegistered"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? sod("errorRegisteringPayment");
      toast.error(msg);
    },
  });

  async function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payMethod) {
      toast.error(sod("selectPaymentMethod"));
      return;
    }
    const isCash = workshopPaymentMethods.find((m) => m.id === payMethod)?.type === "cash";
    if (!isCash && !payReference.trim()) {
      toast.error(sod("enterReference"));
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
        {sod("selected")}: {workshopPaymentMethods.find((m) => m.id === payMethod)?.type || payMethod}
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
          {sod("back")}
        </Link>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{sod("title")}</h1>
          {order && (
            <span
              className={`ml-badge ${SERVICE_ORDER_STYLES[order.status] || SERVICE_ORDER_STYLES.PENDING}`}
            >
              {statusLabel(order.status)}
            </span>
          )}
          {order?.is_financed && (
            <span className="ml-badge border border-purple-500/30 bg-purple-500/10 text-purple-400">
              {sod("financed")}
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
              <p className="ml-stat-label">{sod("total")}</p>
              <p className="ml-stat-value text-lg">
                $
                {(
                  (order.final_price ?? order.base_price ?? 0) +
                  (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{sod("delivery")}</p>
              <p className="ml-stat-value text-sm">
                {order.delivery_method === "SHIPPING" ? sod("deliveryShipping") : sod("deliveryPickup")}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{sod("status")}</p>
              <p className="ml-stat-value text-sm">
                {statusLabel(order.status)}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{sod("date")}</p>
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
                {sod("vehicleInfo")}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{sod("brand")}</span>
                  <span className="font-medium">{order.vehicle_brand}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{sod("model")}</span>
                  <span className="font-medium">{order.vehicle_model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{sod("plate")}</span>
                  <span className="font-medium">{order.vehicle_license_plate}</span>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2 pt-1">
                    <span className="text-muted-foreground">{sod("notes")}</span>
                    <span className="font-medium">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {order.workshop_name && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Store className="h-4 w-4" />
                  {sod("workshopInfo")}
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
                {sod("quote")}
              </h2>
              <div className="space-y-3 text-sm">
                {order.status === "QUOTED" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{sod("basePrice")}</span>
                      <span className="font-medium">${order.base_price.toFixed(2)}</span>
                    </div>
                    {order.final_price != null && order.final_price !== order.base_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{sod("finalPrice")}</span>
                        <span className="font-mono font-bold">${order.final_price.toFixed(2)}</span>
                      </div>
                    )}
                    {order.extra_charge > 0 && order.extra_charge_status === "PENDING_APPROVAL" && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {sod("extraCharges")}
                          <span className="ml-1.5 text-xs text-amber-400">{sod("pendingApproval")}</span>
                        </span>
                        <span className="font-medium text-amber-400">
                          + ${order.extra_charge.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {order.revision != null && (
                      <p className="mt-2 text-xs text-amber-400">
                        {sod("ifRejectPayRevision")}{" "}
                        <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                      </p>
                    )}
                  </>
                )}

                {order.status === "ACCEPTED" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{sod("quote")}</span>
                      <span className="font-mono font-bold text-green-400">
                        ${(order.final_price ?? order.base_price ?? 0).toFixed(2)}
                      </span>
                    </div>
                    {order.extra_charge > 0 && order.extra_charge_status === "APPROVED" && (
                      <>
                        <div className="flex items-center justify-between text-amber-400">
                          <span className="text-muted-foreground">{sod("extraCharges")}</span>
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
                      <span>{sod("total")}</span>
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
                      <span className="text-muted-foreground">{sod("costOfRevision")}</span>
                      <span className="font-mono font-bold">${order.revision.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{sod("quote")}</span>
                      <span className="font-medium text-red-400">{sod("rejected")}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
                      <span>{sod("totalToPay")}</span>
                      <span className="font-mono text-red-400">${order.revision.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {["IN_PROGRESS", "COMPLETED", "DELIVERED", "CLOSED"].includes(order.status) && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{sod("quote")}</span>
                      <span className="font-mono font-bold">
                        ${(order.final_price ?? order.base_price ?? 0).toFixed(2)}
                      </span>
                    </div>
                    {order.extra_charge > 0 && order.extra_charge_status === "APPROVED" && (
                      <>
                        <div className="flex items-center justify-between text-amber-400">
                          <span className="text-muted-foreground">{sod("extraCharges")}</span>
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
                      <span>{sod("total")}</span>
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
                    {sod("payments")}
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
                            {idx === 0 ? sod("revision") : sod("additional", undefined, { n: idx })} —{" "}
                            {payment.status === "PAID" || payment.status === "VERIFIED"
                              ? sod("paid")
                              : payment.status === "PENDING_VERIFICATION"
                              ? sod("installmentStatus.PENDING_VERIFICATION", "Pendiente de verificación")
                              : sod("rejected")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {paymentMethodLabel(payment.payment_method)}
                            {payment.reference_number && ` · ${sod("ref")} ${payment.reference_number}`}
                            {payment.paid_at &&
                              ` · ${sod("paid")} ${new Date(payment.paid_at).toLocaleDateString("es-ES")}`}
                            {payment.rate
                              ? ` · ${sod("rate")} ${Number(payment.rate).toLocaleString("es-VE")} bs/${
                                  payment.rate_date
                                    ? ` (${new Date(payment.rate_date).toLocaleDateString("es-ES")})`
                                    : ""
                                }`
                              : ""}
                            {idx === 1 && order.extra_charge_note && (
                              <span className="ml-2 text-xs text-amber-400">
                                {sod("note")} {order.extra_charge_note}
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
                  {sod("financeInstallments")}
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
                              {sod("installment", undefined, { n: idx + 1 })} —{" "}
                              {isPaid
                                ? sod("installmentStatus.PAID", "Pagada")
                                : isPendingVerif
                                  ? sod("installmentStatus.PENDING_VERIFICATION", "Pendiente de verificación")
                                  : hasOpenMora
                                    ? sod("installmentStatus.OVERDUE", "Vencida (con mora)")
                                    : sod("installmentStatus.PENDING", "Pendiente")}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {sod("dueDate")} {new Date(inst.due_date).toLocaleDateString("es-ES")}
                              {inst.payment_method && inst.payment_method !== "OTHER" &&
                                ` · ${paymentMethodLabel(inst.payment_method)}`}
                              {inst.reference_number && ` · ${sod("ref")} ${inst.reference_number}`}
                              {inst.paid_at && ` · ${sod("paid")} ${new Date(inst.paid_at).toLocaleDateString("es-ES")}`}
                            </p>
                            {hasOpenMora && mora && (
                              <p className="mt-0.5 text-[11px] font-medium text-red-400">
                                Mora: ${mora.amount.toFixed(2)}
                                {mora.status === "PENDING_VERIFICATION" && ` (${sod("inVerification")})`}
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
                              {sod("pay")}
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
                              {sod("payMora")}
                            </button>
                          )}
                          {hasOpenMora && mora?.status === "PENDING_VERIFICATION" && (
                            <span className="text-[11px] text-amber-400">{sod("moraInVerification")}</span>
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
                  {sod("deliveryInfo")}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{sod("method")}</span>
                    <span className="font-medium">
                      {order.delivery_method === "SHIPPING"
                        ? sod("nationalShipping")
                        : sod("pickupAtWorkshop")}
                    </span>
                  </div>
                  {order.delivery_method === "SHIPPING" && (
                    <>
                      {order.tracking_number && (
                        <div className="flex items-start gap-2">
                          <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{sod("trackingLabel")}</span>
                          <span className="font-medium">{order.tracking_number}</span>
                        </div>
                      )}
                      {order.shipping_notes && (
                        <div className="flex items-start gap-2">
                          <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{sod("shippingAgency")}</span>
                          <span className="font-medium">{order.shipping_notes}</span>
                        </div>
                      )}
                      {order.shipped_at && (
                        <div className="flex items-start gap-2">
                          <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{sod("shippingDate")}</span>
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
                    <p className="font-medium text-amber-400">{sod("pendingOrder")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("pendingOrderDesc")}
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
                        {sod("markDroppedOff")}
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
                        {sod("cancelService")}
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
                    <p className="font-medium text-amber-400">{sod("vehicleDroppedOff")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("vehicleDroppedOffDesc")}
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
                        {sod("cancelService")}
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
                    <p className="font-medium text-blue-400">{sod("vehicleAtWorkshop")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("vehicleAtWorkshopDesc")}
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
                    <p className="font-medium text-purple-400">{sod("revisionSent")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("revisionSentDesc")}
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
                        {sod("acceptRevision")}
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
                        {sod("rejectAndCancel")}
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
                    <p className="font-medium text-blue-400">{sod("quoteReceived")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("quoteReceivedDesc")}
                    </p>
                    {order.final_price != null && (
                      <p className="mt-3 font-mono text-2xl font-bold">
                        ${order.final_price.toFixed(2)}
                      </p>
                    )}
                    {order.revision != null && (
                      <p className="mt-2 text-sm text-amber-400">
                        {sod("ifRejectPayRevision")}{" "}
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
                        {sod("acceptQuote")}
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
                        {sod("finance")}
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
                        {sod("rejectQuote")}
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
                      {sod("extraChargePending")}
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
                        {sod("approveExtra")}
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
                        {sod("rejectExtra")}
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
                    <p className="font-medium text-green-400">{sod("quoteAcceptedStatus")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("quoteAcceptedStatus")}.{" "}
                      {order.is_paid
                        ? sod("quoteAcceptedPaid")
                        : order.payment_status === "PENDING_VERIFICATION"
                          ? sod("quoteAcceptedPendingVerif")
                          : sod("quoteAcceptedUnpaid")}
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
                        {sod("payAmount")} $
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
                        {sod("paymentPendingVerif")}
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
                      {order.status === "IN_PROGRESS" ? sod("serviceInProgress") : sod("serviceCompleted")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.status === "IN_PROGRESS"
                        ? sod("inProgressDesc")
                        : sod("completedDesc")}
                    </p>
                    {order.extra_charge_status === "APPROVED" &&
                    !order.is_paid &&
                    order.payment_status !== "PENDING_VERIFICATION" && (
                      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                        <p className="text-sm font-medium text-amber-400">
                          {sod("additionalPaymentApproved")}
                        </p>
                        {order.extra_charge_note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {sod("workshopNote")} {order.extra_charge_note}
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
                          {sod("payAdditionalBtn")}
                        </button>
                      </div>
                    )}
                    {order.payment_status === "PENDING_VERIFICATION" && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                        <Clock className="h-4 w-4" />
                        {sod("paymentPendingVerif")}
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
                    <p className="font-medium text-emerald-400">{sod("serviceCompleted")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("completedShippingDesc")}
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
                    <p className="font-medium text-emerald-400">{sod("serviceCompleted")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("completedPickupDesc")}
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
                        {sod("markPickedUp")}
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
                    <p className="font-medium text-blue-400">{sod("shipped")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("shippedDesc")}
                    </p>
                    {order.tracking_number && (
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">{sod("trackingNumber")}</span>{" "}
                        <span className="font-mono font-medium">{order.tracking_number}</span>
                      </p>
                    )}
                    {order.shipping_notes && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sod("agency")} {order.shipping_notes}
                      </p>
                    )}
                    {order.shipped_at && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sod("shippingDate")}{" "}
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
                        {sod("confirmReception")}
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
                    <p className="font-medium text-teal-400">{sod("vehicleDelivered")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("vehicleDeliveredDesc")}
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
                        {order.closed_by_client ? sod("closeConfirmed") : sod("closeOrder")}
                      </button>
                    </div>
                    {order.closed_by_client && (
                      <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {sod("clientClosed")}
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
                    <p className="font-medium text-sky-400">{sod("orderClosedTitle")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("orderClosedDesc")}
                    </p>
                    {!order.ratings?.client_rated && (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="ml-btn ml-btn-primary mt-4"
                      >
                        <Star className="h-4 w-4" />
                        {sod("rateWorkshop")}
                      </button>
                    )}
                    {order.ratings?.client_rated && (
                      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {sod("yourRating")}
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
                          {sod("workshopRating")}
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
                    <p className="font-medium text-red-400">{sod("orderCancelledTitle")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("orderCancelledDesc")}
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
                    <p className="font-medium text-red-400">{sod("quoteRejectedTitle")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sod("quoteRejectedDesc")}{" "}
                      {order.is_paid
                        ? sod("revisionPaidClosed")
                        : order.payment_status === "PENDING_VERIFICATION"
                          ? sod("revisionPendingVerif")
                          : sod("mustPayRevision")}
                    </p>
                    {!order.is_paid && order.revision != null && (
                      <p className="mt-2 font-mono text-xl font-bold text-red-400">
                        {sod("revisionLabel")} $
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
                        {sod("payRevisionBtn")} $
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
                        {sod("paymentPendingVerif")}
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
          <p className="ml-empty-state-title">{sod("orderNotFound")}</p>
          <Link to="/dashboard/service-orders" className="ml-btn ml-btn-primary">
            {sod("backToOrders")}
          </Link>
        </div>
      )}

      {showPayModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{sod("registerPayment")}</h2>
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
                    ? sod("payRevisionLabel")
                    : paidSum > 0
                      ? sod("pendingPaymentLabel")
                      : sod("payQuoteLabel");
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
                        {sod("bcvRate")} {bcvInfo.usd.toLocaleString("es-VE")} bs/${
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
                  {sod("paymentMethod")} <span className="text-destructive">*</span>
                </label>
                {paymentMethodsLoading ? (
                  <div className="ml-input w-full py-2 text-center text-sm text-muted-foreground">
                    {sod("loadingPaymentMethods")}
                  </div>
                ) : workshopPaymentMethods.length === 0 ? (
                  <div className="ml-input w-full py-2 text-center text-sm text-red-400">
                    {sod("noPaymentMethods")}
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {workshopPaymentMethods.map((method) => {
                      const isSelected = payMethod === method.id;
                      const typeLabel =
                        method.type === "bank_transfer"
                          ? sod("bankTransfer")
                          : method.type === "mobile_payment"
                            ? sod("mobilePayment")
                            : method.type === "cash"
                              ? sod("cash")
                              : method.type === "zelle"
                                ? "Zelle"
                                : method.type === "zinli"
                                  ? "Zinli"
                                  : sod("other");
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
                                {sod("tapToDeselect")}
                              </span>
                            )}
                          </button>

                          {showDetails && (
                            <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                              {method.type === "bank_transfer" && (
                                <div className="space-y-1">
                                  {method.bank_name && (
                                    <p>
                                      <span className="text-muted-foreground/70">{sod("bank")}</span>{" "}
                                      {method.bank_name}
                                    </p>
                                  )}
                                  {method.account_number && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">{sod("account")}</span>{" "}
                                      {method.account_number}
                                    </p>
                                  )}
                                  {method.account_holder && (
                                    <p>
                                      <span className="text-muted-foreground/70">{sod("holder")}</span>{" "}
                                      {method.account_holder}
                                    </p>
                                  )}
                                  {method.holder_ci && (
                                    <p>
                                      <span className="text-muted-foreground/70">{sod("ci")}</span>{" "}
                                      {method.holder_ci}
                                    </p>
                                  )}
                                </div>
                              )}
                              {method.type === "mobile_payment" && (
                                <div className="space-y-1">
                                  {method.phone_number && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">{sod("phone")}</span>{" "}
                                      {method.phone_number}
                                    </p>
                                  )}
                                  {method.holder_ci && (
                                    <p>
                                      <span className="text-muted-foreground/70">{sod("ci")}</span>{" "}
                                      {method.holder_ci}
                                    </p>
                                  )}
                                  {method.bank_name && (
                                    <p>
                                      <span className="text-muted-foreground/70">{sod("bank")}</span>{" "}
                                      {method.bank_name}
                                    </p>
                                  )}
                                </div>
                              )}
                              {method.type === "cash" && (
                                <p>
                                  {sod("cashDesc")}
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
                                      <span className="text-muted-foreground/70">{sod("holder")}</span>{" "}
                                      {method.account_holder}
                                    </p>
                                  )}
                                  <p className="text-primary/70">{sod("usdPayment")}</p>
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
                            {sod("referenceNumber")}
                          </label>
                          <input
                            type="text"
                            value={payReference}
                            onChange={(e) => setPayReference(e.target.value)}
                            placeholder={sod("referencePlaceholder")}
                            className="ml-input w-full"
                            required
                          />
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {sod("referenceHelp")}
                          </p>
                        </>
                      )}
                      {isCash && (
                        <p className="text-xs text-muted-foreground">
                          {sod("cashDesc")}
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
                  {sod("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={payPending || !payMethod}
                  className="ml-btn ml-btn-primary"
                >
                  {payPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sod("registerPayment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRatingModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{sod("rateWorkshopTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {sod("rateWorkshopDesc", undefined, { workshop: order.workshop_name ?? "" })}
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
              placeholder={sod("commentOptional")}
              rows={3}
              className="ml-input mt-4 w-full resize-none"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="ml-btn ml-btn-outline"
              >
                {sod("cancel")}
              </button>
              <button
                type="button"
                onClick={() => rateMutation.mutate({ rating: ratingValue, comment: ratingComment })}
                disabled={rateMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {rateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sod("submitRating")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinanceModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{sod("financeService")}</h2>
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
                        ? sod("loadingCredit")
                        : sod("errorLoadingCredit")}
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
                    <label className="text-sm font-medium">{sod("downPaymentLabel")} ({financeDownPct}%)</label>
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
                      <span>{sod("downPaymentLabel")}: <span className="font-semibold text-foreground">${downPayment.toFixed(2)}</span></span>
                      <span>{sod("financedLabel")}: <span className="font-semibold text-foreground">${financed.toFixed(2)}</span></span>
                    </div>
                    {minPct > 0 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {sod("minDownPayment", undefined, { pct: minPct, level: creditLine?.level ?? 1 })}
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
                        {sod("serviceCreditAvailable", undefined, { amount: serviceAvailable.toFixed(2) })}
                      </div>
                      {exceedsCredit ? (
                        <p className="mt-1">{sod("financedExceedsCredit")}</p>
                      ) : (
                        <p className="mt-1">{sod("remainingCredit", undefined, { amount: (serviceAvailable - financed).toFixed(2) })}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {sod("paymentMethod")} <span className="text-destructive">*</span>
                    </label>
                    {paymentMethodsLoading ? (
                      <div className="ml-input w-full py-2 text-center text-sm text-muted-foreground">
                        {sod("loadingPaymentMethods")}
                      </div>
                    ) : workshopPaymentMethods.length === 0 ? (
                      <div className="ml-input w-full py-2 text-center text-sm text-red-400">
                        {sod("noPaymentMethods")}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {workshopPaymentMethods.map((method) => {
                          const isSelected = financePaymentMethod === method.id;
                          const typeLabel =
                            method.type === "bank_transfer"
                              ? sod("bankTransfer")
                              : method.type === "mobile_payment"
                                ? sod("mobilePayment")
                                : method.type === "cash"
                                  ? sod("cash")
                                  : method.type === "zelle"
                                    ? "Zelle"
                                    : method.type === "zinli"
                                      ? "Zinli"
                                      : sod("other");
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
                                    {sod("tapToDeselect")}
                                  </span>
                                )}
                              </button>

                              {showDetails && (
                                <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                                  {method.type === "bank_transfer" && (
                                    <div className="space-y-1">
                                      {method.bank_name && (
                                        <p>
                                          <span className="text-muted-foreground/70">{sod("bank")}</span>{" "}
                                          {method.bank_name}
                                        </p>
                                      )}
                                      {method.account_number && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">{sod("account")}</span>{" "}
                                          {method.account_number}
                                        </p>
                                      )}
                                      {method.account_holder && (
                                        <p>
                                          <span className="text-muted-foreground/70">{sod("holder")}</span>{" "}
                                          {method.account_holder}
                                        </p>
                                      )}
                                      {method.holder_ci && (
                                        <p>
                                          <span className="text-muted-foreground/70">{sod("ci")}</span>{" "}
                                          {method.holder_ci}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {method.type === "mobile_payment" && (
                                    <div className="space-y-1">
                                      {method.phone_number && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">{sod("phone")}</span>{" "}
                                          {method.phone_number}
                                        </p>
                                      )}
                                      {method.holder_ci && (
                                        <p>
                                          <span className="text-muted-foreground/70">{sod("ci")}</span>{" "}
                                          {method.holder_ci}
                                        </p>
                                      )}
                                      {method.bank_name && (
                                        <p>
                                          <span className="text-muted-foreground/70">{sod("bank")}</span>{" "}
                                          {method.bank_name}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {method.type === "cash" && (
                                    <p>
                                      {sod("cashDesc")}
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
                                          <span className="text-muted-foreground/70">{sod("holder")}</span>{" "}
                                          {method.account_holder}
                                        </p>
                                      )}
                                      <p className="text-primary/70">{sod("usdPayment")}</p>
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
                        {sod("referenceNumber")} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={financeReference}
                        onChange={(e) => setFinanceReference(e.target.value)}
                        placeholder={sod("referencePlaceholder")}
                        className="ml-input w-full"
                        required
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {sod("referenceHelp")}
                      </p>
                    </div>
                  )}

                  {financePaymentMethod && isCash && (
                    <p className="text-xs text-muted-foreground">
                      {sod("cashDesc")}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowFinanceModal(false)}
                      className="ml-btn ml-btn-outline"
                    >
                      {sod("cancel")}
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
                      {sod("financeBtn", undefined, { amount: financed.toFixed(2) })}
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
            <h3 className="mb-4 text-lg font-semibold">{sod("payFinanceInstallment")}</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{sod("installmentAmount")}</span>
                  <span className="font-mono font-bold text-lg">
                    ${activeInstallment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{sod("dueDate")} {new Date(activeInstallment.due_date).toLocaleDateString("es-ES")}</span>
                </div>
                {bcvRate && bcvRate > 0 && !(() => {
                  const m = workshopPaymentMethods.find((m) => m.id === installmentPayMethod);
                  return m?.type === "zelle" || m?.type === "zinli";
                })() && (
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{sod("bsEquivalent")}</span>
                    <span className="font-mono">
                      {formatBcv(activeInstallment.amount, bcvRate)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {sod("paymentMethod")} <span className="text-destructive">*</span>
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
                              ? sod("bankTransfer")
                              : method.type === "mobile_payment"
                                ? sod("mobilePayment")
                                : method.type === "cash"
                                  ? sod("cash")
                                  : method.type === "zelle"
                                    ? "Zelle"
                                    : method.type === "zinli"
                                      ? "Zinli"
                                      : method.type}
                          </span>
                          {selected && (
                            <span className="text-xs text-primary">{sod("selected")}</span>
                          )}
                        </div>
                        {selected && method.type === "bank_transfer" && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {method.bank_name && (
                              <p><span className="text-muted-foreground/70">{sod("bank")}</span> {method.bank_name}</p>
                            )}
                            {method.account_number && (
                              <p className="font-mono"><span className="text-muted-foreground/70">{sod("account")}</span> {method.account_number}</p>
                            )}
                            {method.account_holder && (
                              <p><span className="text-muted-foreground/70">{sod("holder")}</span> {method.account_holder}</p>
                            )}
                            {method.holder_ci && (
                              <p><span className="text-muted-foreground/70">{sod("ci")}</span> {method.holder_ci}</p>
                            )}
                          </div>
                        )}
                        {selected && method.type === "mobile_payment" && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {method.phone_number && (
                              <p className="font-mono"><span className="text-muted-foreground/70">{sod("phone")}</span> {method.phone_number}</p>
                            )}
                            {method.holder_ci && (
                              <p><span className="text-muted-foreground/70">{sod("ci")}</span> {method.holder_ci}</p>
                            )}
                            {method.bank_name && (
                              <p><span className="text-muted-foreground/70">{sod("bank")}</span> {method.bank_name}</p>
                            )}
                          </div>
                        )}
                        {selected && isCash && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {sod("cashDesc")}
                          </p>
                        )}
                        {selected && (method.type === "zelle" || method.type === "zinli") && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {method.email && (
                              <p className="font-mono"><span className="text-muted-foreground/70">Email:</span> {method.email}</p>
                            )}
                            {method.account_holder && (
                              <p><span className="text-muted-foreground/70">{sod("holder")}</span> {method.account_holder}</p>
                            )}
                            <p className="text-primary/70">{sod("usdPayment")}</p>
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
                    {sod("referenceNumber")} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={installmentReference}
                    onChange={(e) => setInstallmentReference(e.target.value)}
                    placeholder={sod("referencePlaceholder")}
                    className="ml-input w-full"
                    required
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {sod("referenceHelp")}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {sod("paymentDate")}
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
                  {sod("bcvDateHint")}
                </p>
              </div>
              {activeInstallment && (
                <div className="rounded-lg border border-border bg-surface/50 px-4 py-3">
                  {dateBcvLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {sod("gettingBcvRate")}
                    </div>
                  ) : dateBcvRate ? (
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">{sod("amountToPay")}</span>
                      <span className="font-mono text-lg font-bold text-primary">
                        {formatBcv(activeInstallment.amount, dateBcvRate)}
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                          (${activeInstallment.amount.toFixed(2)})
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{sod("amountToPay")}</span>
                      <span className="text-lg font-semibold text-foreground">
                        ${activeInstallment.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {activeInstallment.due_date && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {sod("dueDate")} {new Date(activeInstallment.due_date).toLocaleDateString("es-ES")}
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
                  {sod("cancel")}
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
                  {sod("payAmount")} ${activeInstallment.amount.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMoraModal && activeMora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="ml-card w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">{sod("payMoraTitle")}</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{sod("moraAmount")}</span>
                  <span className="font-mono font-bold text-lg text-red-400">
                    ${activeMora.amount.toFixed(2)}
                  </span>
                </div>
                {bcvRate && bcvRate > 0 && !(() => {
                  const d = paymentDestinations?.find((d) => d.id === moraPayMethod);
                  return d?.method_type === "ZELLE" || d?.method_type === "BINANCE";
                })() && (
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{sod("bsEquivalent")}</span>
                    <span className="font-mono">{formatBcv(activeMora.amount, bcvRate)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {sod("paymentDestination")} <span className="text-destructive">*</span>
                </label>
                <div className="space-y-2">
                  {paymentDestinationsLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!paymentDestinationsLoading && (paymentDestinations?.length ?? 0) === 0 && (
                    <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                      {sod("noPaymentDestinations")}
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
                          {selected && <span className="text-xs text-primary">{sod("selected")}</span>}
                        </div>
                        {selected && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {d.bank_name && <p>{sod("bank")} <span className="text-foreground">{d.bank_name}</span></p>}
                            {d.account_number && <p>{sod("account")} <span className="text-foreground font-mono">{d.account_number}</span></p>}
                            {d.holder_name && <p>{sod("holder")} <span className="text-foreground">{d.holder_name}</span></p>}
                            {d.holder_ci && <p>{sod("ci")} <span className="text-foreground">{d.holder_ci}</span></p>}
                            {d.phone && <p>{sod("tel")} <span className="text-foreground font-mono">{d.phone}</span></p>}
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
                    {sod("referenceNumber")} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={moraReference}
                    onChange={(e) => setMoraReference(e.target.value)}
                    placeholder={sod("referencePlaceholder")}
                    className="ml-input w-full"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {sod("paymentDate")}
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
                  {sod("cancel")}
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
                  {sod("payMoraBtn", undefined, { amount: activeMora.amount.toFixed(2) })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
