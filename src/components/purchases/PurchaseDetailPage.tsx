import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { AxiosError } from "axios";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  Truck,
  MapPin,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Store,
  Star,
  ShieldCheck,
  User,
  Calendar,
  ThumbsUp,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner";
import {
  getOrder,
  getOrderInstallments,
  payInstallment,
  markInstallmentPaid,
  markInstallmentErroneous,
  markOrderReceived,
  markOrderShipped,
  closeOrderAsWorkshop,
  rateOrderWorkshop,
  rateOrderClient,
  getWorkshopPaymentMethods,
  type InstallmentDTO,
  type PayInstallmentInput,
  type OrderDTO,
  type OrderRatingInfo,
  type OrderItemDTO,
  type WorkshopPaymentMethodDTO,
} from "../../lib/api";
import { getBcvRate, getBcvRateForDate, formatBcv } from "../../lib/bcv";
import { useAuth } from "../../lib/auth-context";
import { useLocale } from "../../lib/locale-context";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PAID: "Pagada",
  FINANCED: "Financiada",
  CANCELLED: "Cancelada",
  PENDING_CONFIRMATION: "Pendiente de confirmación",
  CONFIRMED: "Confirmada",
  SHIPPED: "Enviado",
  RECEIVED: "Recibido",
  CLOSED: "Cerrada",
  PENDING_VERIFICATION: "Pendiente",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  FINANCED: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
  PENDING_CONFIRMATION: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  CONFIRMED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  RECEIVED: "border border-teal-500/30 bg-teal-500/10 text-teal-400",
  CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  PENDING_VERIFICATION: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
};


const INSTALLMENT_STATUS_STYLES: Record<string, string> = {
  PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  PENDING_VERIFICATION: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  OVERDUE: "border border-red-500/30 bg-red-500/10 text-red-400",
};


export function PurchaseDetailPage() {
  const location = useLocation();
  const params = useParams({ strict: false });
  const purchaseId = params.purchaseId ?? location.pathname.split("/").pop() ?? "";
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const { t } = useLocale();

  const isClient = roles.includes("CLIENT");
  const isWorkshopOwner = roles.includes("WORKSHOP_OWNER");
  const isAdmin = roles.includes("ADMIN");
  const isWorkshopContext = location.pathname.includes("/my-workshops/");

  const pd = (key: string, fallback?: string, params?: Record<string, string | number>) =>
    t(`purchaseDetail.${key}`, fallback, params);
  const orderStatusLabel = (status: string) =>
    t(`purchases.status.${status}`, ORDER_STATUS_LABELS[status] ?? status);
  const installmentStatusLabel = (status: string) =>
    t(`purchaseDetail.installmentStatus.${status}`, status);
  const paymentMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      bank_transfer: t("checkout.paymentTypes.bank_transfer", "Bank transfer"),
      mobile_payment: t("checkout.paymentTypes.mobile_payment", "Mobile payment"),
      cash: t("checkout.paymentTypes.cash", "Cash"),
      zelle: t("checkout.paymentTypes.zelle", "Zelle"),
      zinli: t("checkout.paymentTypes.zinli", "Zinli"),
      other: t("common.notAvailable", "Other"),
    };
    return labels[type] ?? type;
  };

  const backLink = (() => {
    const match = location.pathname.match(/\/dashboard\/my-workshops\/([^/]+)/);
    if (match) return `/dashboard/my-workshops/${match[1]}/sales`;
    if (isAdmin) return "/dashboard/admin";
    return "/dashboard/purchases";
  })();

  // Early return if purchaseId is not available
  if (!purchaseId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="ml-empty-state py-16">
          <CreditCard className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{pd("invalidId")}</p>
          <Link to={backLink} className="ml-btn ml-btn-primary">
            {t("common.back", "Back")}
          </Link>
        </div>
      </div>
    );
  }

  const [payingInstallment, setPayingInstallment] = useState<InstallmentDTO | null>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateBcvRate, setDateBcvRate] = useState<number | null>(null);
  const [dateBcvLoading, setDateBcvLoading] = useState(false);
  const [markPaidInstallment, setMarkPaidInstallment] = useState<InstallmentDTO | null>(null);
  const [markPaidDate, setMarkPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] =
    useState<PayInstallmentInput["payment_method"]>("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipTracking, setShipTracking] = useState("");
  const [shipNotes, setShipNotes] = useState("");

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", purchaseId],
    queryFn: () => getOrder(purchaseId),
  });

  const {
    data: installments,
    isLoading: installmentsLoading,
    isError: installmentsError,
  } = useQuery({
    queryKey: ["order-installments", purchaseId],
    queryFn: () => getOrderInstallments(purchaseId),
  });

  const workshopId = order?.workshop_id;
  const { data: paymentMethods } = useQuery({
    queryKey: ["workshop-payment-methods", workshopId],
    queryFn: () => getWorkshopPaymentMethods(workshopId!),
    enabled: !!workshopId && (isClient || isWorkshopOwner),
  });

  const { data: bcvRate } = useQuery({
    queryKey: ["bcv-rate"],
    queryFn: getBcvRate,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!payingInstallment || !paymentDate) return;
    let cancelled = false;
    setDateBcvLoading(true);
    getBcvRateForDate(paymentDate).then((rate) => {
      if (!cancelled) {
        setDateBcvRate(rate?.usd ?? null);
        setDateBcvLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [paymentDate, payingInstallment]);

  const markReceivedMutation = useMutation({
    mutationFn: () => markOrderReceived(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(pd("orderMarkedReceived"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? pd("errorMarkingReceived");
      toast.error(msg);
    },
  });

  const closeOrderMutation = useMutation({
    mutationFn: () => closeOrderAsWorkshop(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["workshop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["workshop-sales"] });
      toast.success(pd("orderClosed"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? pd("errorClosingOrder");
      toast.error(msg);
    },
  });

  const markShippedMutation = useMutation({
    mutationFn: (input: { tracking_number: string; shipping_notes?: string }) =>
      markOrderShipped(purchaseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["workshop-orders"] });
      toast.success(pd("orderMarkedShipped"));
      setShowShipModal(false);
      setShipTracking("");
      setShipNotes("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? pd("errorMarkingShipped");
      toast.error(msg);
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({
      rating,
      comment,
      targetRole,
    }: {
      rating: number;
      comment?: string;
      targetRole: "WORKSHOP" | "CLIENT";
    }) =>
      isClient
        ? rateOrderWorkshop(purchaseId, { rating, comment })
        : rateOrderClient(purchaseId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      toast.success(
        isClient ? pd("workshopRated") : pd("clientRated"),
      );
      setShowRatingModal(false);
      setRatingValue(5);
      setRatingComment("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? pd("errorRating");
      toast.error(msg);
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ installmentId, input }: { installmentId: string; input: PayInstallmentInput }) =>
      payInstallment(installmentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["order-installments", purchaseId],
      });
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      toast.success(pd("paymentRegisteredToast"));
      setPayingInstallment(null);
      setPaymentMethod("BANK_TRANSFER");
      setReferenceNumber("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      const data = err.response?.data;
      const msg = data?.message ?? data?.detail ?? pd("errorRegisteringPayment");
      toast.error(msg);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ installmentId, ref, paidAt }: { installmentId: string; ref?: string | null; paidAt?: string }) =>
      markInstallmentPaid(installmentId, { reference_number: ref, paid_at: paidAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-installments", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["credit-line"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(pd("paymentVerified"));
      setPayingInstallment(null);
      setMarkPaidInstallment(null);
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      const data = err.response?.data;
      const msg = data?.message ?? data?.detail ?? pd("errorMarkingInstallment");
      toast.error(msg);
    },
  });

  const markErroneousMutation = useMutation({
    mutationFn: (installmentId: string) => markInstallmentErroneous(installmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-installments", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["order", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["credit-line"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(pd("installmentRejected"));
      setPayingInstallment(null);
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      const data = err.response?.data;
      const msg = data?.message ?? data?.detail ?? pd("errorMarkingInstallment");
      toast.error(msg);
    },
  });

  const installmentsList = installments ?? [];
  const total = installmentsList.reduce((s, p) => s + p.amount, 0);
  const paidCount = installmentsList.filter((p) => p.status === "PAID").length;
  const isAllPaid = installmentsList.length > 0 && paidCount === installmentsList.length;
  const isLoading = orderLoading || (installmentsLoading && !installmentsError);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInstallment) return;
    const isCash = paymentMethod === "CASH";
    if (!isCash && !referenceNumber.trim()) {
      toast.error(pd("enterReference"));
      return;
    }
    payMutation.mutate({
      installmentId: payingInstallment.id,
      input: {
        payment_method: paymentMethod,
        reference_number: isCash ? undefined : referenceNumber.trim(),
        rate: dateBcvRate ?? bcvRate ?? null,
        rate_date: paymentDate,
        paid_at: new Date(paymentDate + "T12:00:00").toISOString(),
      },
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {order && (
        <Link
          to={backLink as any}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {location.pathname.includes("/my-workshops/")
            ? pd("salesHistory")
            : isAdmin
              ? pd("adminPanel")
              : pd("myOrders")}
        </Link>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{pd("title")}</h1>
          {order && (
            <span
              className={`ml-badge ${ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.PAID}`}
            >
              {orderStatusLabel(order.status)}
            </span>
          )}
        </div>
        {!isWorkshopContext && (
          <p className="mt-1 text-sm text-muted-foreground">ID: {purchaseId.slice(0, 8)}...</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : order ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="ml-stat-card">
              <p className="ml-stat-label">{pd("total")}</p>
              <p className="ml-stat-value text-lg">${order.total_amount.toFixed(2)}</p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{pd("paid")}</p>
              <p className="ml-stat-value text-lg text-emerald-400">
                $
                {installmentsList
                  .filter((p) => p.status === "PAID")
                  .reduce((s, p) => s + p.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{pd("payments")}</p>
              <p className="ml-stat-value text-lg">
                {paidCount}/{installmentsList.length}
                {isAllPaid && <CheckCircle2 className="ml-1 inline h-5 w-5 text-emerald-400" />}
              </p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{pd("date")}</p>
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
                <Package className="h-4 w-4" />
                {pd("products")} ({order.items?.length ?? 0})
              </h2>
              <div className="divide-y divide-border">
                {order.items?.map((item: OrderItemDTO) => (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full items-center justify-between py-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {expandedItems[item.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.part_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × ${item.unit_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-sm font-bold">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </p>
                    </button>
                    {expandedItems[item.id] && (
                      <div className="ml-7 pb-3 space-y-2">
                        {installmentsList
                          .filter((inst) => inst.order_id === purchaseId)
                          .map((inst, idx) => (
                            <div
                              key={inst.id}
                              className={`flex items-center justify-between rounded-lg border p-2.5 text-sm ${
                                INSTALLMENT_STATUS_STYLES[inst.status] ||
                                INSTALLMENT_STATUS_STYLES.PENDING
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {inst.status === "PAID" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : inst.status === "OVERDUE" ? (
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-400" />
                                )}
                                <div>
                                  <p className="text-xs font-medium">
                                    {idx === 0 ? pd("downPayment") : pd("installment", undefined, { n: idx })} —{" "}
                                    {installmentStatusLabel(inst.status)}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {inst.due_date && (
                                      <>
                                        {pd("dueDate")} {new Date(inst.due_date).toLocaleDateString("es-ES")}
                                        {inst.paid_at && " · "}
                                      </>
                                    )}
                                    {inst.paid_at &&
                                      `${pd("paymentRegistered")} ${new Date(inst.paid_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-xs font-bold">
                                  ${inst.amount.toFixed(2)}
                                </p>
                                {inst.status !== "PAID" && (
                                  <p className="text-[10px] text-primary/70">
                                    {pd("ptsOnTime", "+{amount} pts", { amount: inst.amount.toFixed(2) })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {order.delivery_method && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4" />
                  {pd("deliveryInfo")}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{pd("method")}</span>
                    <span className="font-medium">
                      {order.delivery_method === "SHIPPING"
                        ? pd("nationalShipping")
                        : pd("pickupAtWorkshop")}
                    </span>
                  </div>
                  {order.delivery_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{pd("address")}</span>
                      <span className="font-medium">{order.delivery_address}</span>
                    </div>
                  )}
                  {order.delivery_fee != null && order.delivery_fee > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{pd("shippingCost")}</span>
                      <span className="font-medium">${order.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{pd("tracking")}</span>
                      <span className="font-medium">{order.tracking_number}</span>
                    </div>
                  )}
                  {order.shipping_notes && (
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{pd("shippingAgency")}</span>
                      <span className="font-medium">{order.shipping_notes}</span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{pd("shippingDate")}</span>
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

            {order.workshop_name && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Store className="h-4 w-4" />
                  {pd("workshop")}
                </h2>
                <p className="text-sm font-medium">{order.workshop_name}</p>
                {isClient && (
                  <>
                    {order.workshop_rif && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pd("rif")} {order.workshop_rif}
                      </p>
                    )}
                    {order.workshop_address && (
                      <p className="mt-1 text-xs text-muted-foreground">{order.workshop_address}</p>
                    )}
                  </>
                )}
                {!isClient && (
                  <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {pd("client")}{" "}
                      {order.user_first_name
                        ? `${order.user_first_name} ${order.user_last_name}`.trim()
                        : "—"}
                    </p>
                    {order.user_ci && <p>{pd("ci")} {order.user_ci}</p>}
                    {order.user_email && <p>{order.user_email}</p>}
                    <p className="flex items-center gap-1 pt-1">
                      <ShieldCheck className="h-3 w-3" />
                      {isAdmin ? pd("adminView") : pd("workshopView")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.status === "CLOSED" &&
              order.workshop_id &&
              isClient &&
              !isWorkshopContext &&
              !order.ratings.client_rated && (
                <div className="ml-card p-5 border-sky-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-400">
                    <Star className="h-4 w-4" />
                    {pd("rateWorkshop")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {pd("rateWorkshopQuestion", undefined, { name: order.workshop_name ?? "" })}
                  </p>
                  <button
                    onClick={() => {
                      setShowRatingModal(true);
                    }}
                    className="ml-btn ml-btn-primary"
                  >
                    <Star className="h-4 w-4" />
                    {pd("rateWorkshop")}
                  </button>
                </div>
              )}

            {order.status === "CLOSED" &&
              order.workshop_id &&
              isWorkshopOwner &&
              !order.ratings.workshop_rated && (
                <div className="ml-card p-5 border-sky-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-400">
                    <Star className="h-4 w-4" />
                    {pd("rateBuyer")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {pd("rateBuyerQuestion")}
                  </p>
                  <button
                    onClick={() => {
                      setShowRatingModal(true);
                    }}
                    className="ml-btn ml-btn-primary"
                  >
                    <Star className="h-4 w-4" />
                    {pd("rateBuyer")}
                  </button>
                </div>
              )}

            {/* Workshop: mark as shipped (only for SHIPPING, after payment confirmed) */}
            {(order.status === "PAID" || order.status === "FINANCED") &&
              isWorkshopOwner &&
              order.delivery_method === "SHIPPING" &&
              !order.tracking_number && (
                <div className="ml-card p-5 border-blue-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-400">
                    <Package className="h-4 w-4" />
                    {pd("markAsShipped")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {pd("enterTrackingAndAgency")}
                  </p>
                  <button onClick={() => setShowShipModal(true)} className="ml-btn ml-btn-primary">
                    <Package className="h-4 w-4 mr-2" />
                    {pd("markAsShipped")}
                  </button>
                </div>
              )}

            {/* Client: confirm receipt (PICKUP - no shipping) */}
            {["PAID", "FINANCED"].includes(order.status) &&
              order.delivery_method !== "SHIPPING" &&
              isClient &&
              !isWorkshopContext &&
              !order.closed_by_client && (
                <div className="ml-card p-5 border-emerald-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {pd("confirmReceipt")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {pd("confirmReceiptQuestion")}
                  </p>
                  <button
                    onClick={() => markReceivedMutation.mutate()}
                    disabled={markReceivedMutation.isPending}
                    className="ml-btn ml-btn-primary"
                  >
                    {markReceivedMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pd("confirmReceipt")}
                  </button>
                </div>
              )}

            {/* Client: confirm receipt when shipped */}
            {order.status === "SHIPPED" &&
              isClient &&
              !isWorkshopContext &&
              !order.closed_by_client && (
                <div className="ml-card p-5 border-emerald-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <Package className="h-4 w-4" />
                    {pd("productShipped")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {pd("workshopMarkedShipped")}
                  </p>
                  {order.tracking_number && (
                    <p className="mb-1 text-sm">
                      <span className="text-muted-foreground">{pd("trackingLabel")}</span>{" "}
                      <span className="font-mono font-medium">{order.tracking_number}</span>
                    </p>
                  )}
                  {order.shipping_notes && (
                    <p className="mb-1 text-sm">
                      <span className="text-muted-foreground">{pd("shippingAgency")}</span>{" "}
                      <span className="font-medium">{order.shipping_notes}</span>
                    </p>
                  )}
                  {order.shipped_at && (
                    <p className="mb-3 text-sm">
                      <span className="text-muted-foreground">{pd("shippingDate")}</span>{" "}
                      <span className="font-medium">
                        {new Date(order.shipped_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  )}
                  <button
                    onClick={() => markReceivedMutation.mutate()}
                    disabled={markReceivedMutation.isPending}
                    className="ml-btn ml-btn-primary"
                  >
                    {markReceivedMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pd("confirmReceipt")}
                  </button>
                </div>
              )}

            {/* Client: waiting for workshop to close */}
            {order.closed_by_client &&
              !order.closed_by_workshop &&
              isClient &&
              !isWorkshopContext && (
                <div className="ml-card p-5 border-sky-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {pd("receiptConfirmed")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {pd("waitingWorkshopClose")}
                  </p>
                </div>
              )}

            {/* Workshop: close order after shipped/received + all installments paid */}
            {isWorkshopOwner &&
              !order.closed_by_workshop &&
              order.status !== "CLOSED" &&
              isAllPaid &&
              ((order.delivery_method === "SHIPPING" &&
                (order.status === "SHIPPED" || order.status === "RECEIVED")) ||
                (order.delivery_method !== "SHIPPING" &&
                  order.status === "RECEIVED")) && (
                <div className="ml-card p-5 border-sky-500/30">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {pd("closeOrder")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {pd("closeOrderConfirm")}
                  </p>
                  <button
                    onClick={() => closeOrderMutation.mutate()}
                    disabled={closeOrderMutation.isPending}
                    className="ml-btn ml-btn-primary"
                  >
                    {closeOrderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pd("closeOrder")}
                  </button>
                </div>
              )}

            <div className="ml-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4" />
                {pd("payments")} ({installmentsList.length})
              </h2>
              {installmentsError && (
                <p className="mb-3 text-sm text-destructive">
                  {pd("errorLoadingInstallments")}
                </p>
              )}

<div className="space-y-3">
                {installmentsList.map((installment, index) => (
                  <div
                    key={installment.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                          installment.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : installment.status === "PENDING_VERIFICATION"
                            ? "bg-sky-500/10 text-sky-400"
                            : installment.status === "OVERDUE"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {installment.status === "PAID" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : installment.status === "PENDING_VERIFICATION" ? (
                          <Clock className="h-4 w-4" />
                        ) : installment.status === "OVERDUE" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {index === 0 ? pd("downPayment") : pd("installment", undefined, { n: index })}
                        </p>
                        <div className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                          <span>${installment.amount.toFixed(2)}</span>
                          {installment.rate && installment.rate > 0 && (
                            <span className="text-muted-foreground/80">≈</span>
                          )}
                          {installment.rate && installment.rate > 0 && (
                            <span className="text-primary">
                              {formatBcv(installment.amount, installment.rate)}
                            </span>
                          )}
                        </div>
                        {installment.status !== "PAID" && (
                          <p className="mt-0.5 text-[11px] text-primary/70">
                            {pd("ptsOnTime", "+{amount} pts", { amount: installment.amount.toFixed(2) })}
                          </p>
                        )}
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {installment.due_date && (
                            <span>
                              {pd("dueDate")} {new Date(installment.due_date).toLocaleDateString("es-ES")}
                            </span>
                          )}
                          {installment.status === "PAID" && installment.paid_at && (
                            <span>
                              {pd("paymentRegistered")}{" "}
                              {new Date(installment.paid_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        {installment.rate && installment.rate > 0 && installment.rate_date && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                            {pd("bcvRate")} {installment.rate.toLocaleString("es-VE")} bs/$ ({new Date(installment.rate_date).toLocaleDateString("es-ES")})
                          </p>
                        )}
                        {installment.payment_method &&
                        (installment.status === "PAID" ||
                          installment.status === "PENDING_VERIFICATION") && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {(() => {
                              const pm = paymentMethods?.find((m) => m.id === installment.payment_method);
                              if (pm) {
                                return pm.type === "bank_transfer"
                                  ? paymentMethodLabel("bank_transfer")
                                  : pm.type === "mobile_payment"
                                    ? paymentMethodLabel("mobile_payment")
                                    : pm.type === "cash"
                                      ? paymentMethodLabel("cash")
                                      : pm.type === "zelle"
                                        ? paymentMethodLabel("zelle")
                                        : pm.type === "zinli"
                                          ? paymentMethodLabel("zinli")
                                          : pm.type;
                              }
                              return paymentMethodLabel(installment.payment_method ?? "");
                            })()}
                            {installment.reference_number &&
                              ` · ${pd("ref")} ${installment.reference_number}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`ml-badge ${INSTALLMENT_STATUS_STYLES[installment.status] || INSTALLMENT_STATUS_STYLES.PENDING}`}
                      >
                        {installmentStatusLabel(installment.status)}
                      </span>
                      {installment.status === "PENDING" && isClient && !isWorkshopContext && (
                        <button
                          onClick={() => {
                            setPayingInstallment(installment);
                            setPaymentMethod("BANK_TRANSFER");
                            setReferenceNumber("");
                          }}
                          className="ml-btn ml-btn-primary text-xs py-1.5"
                        >
                          {pd("pay")}
                        </button>
                      )}
                      {installment.status === "PENDING_VERIFICATION" && isWorkshopOwner && (
                        <button
                          onClick={() => {
                            setPayingInstallment(installment);
                          }}
                          className="ml-btn ml-btn-primary text-xs py-1.5"
                        >
                          {pd("verify")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="ml-empty-state py-16">
          <CreditCard className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{pd("orderNotFound")}</p>
        </div>
      )}

      {showRatingModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">
              {isClient ? pd("rateWorkshop") : pd("rateBuyer")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isClient ? order.workshop_name : pd("buyer")}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                rateMutation.mutate({
                  rating: ratingValue,
                  comment: ratingComment,
                  targetRole: isClient ? "WORKSHOP" : "CLIENT",
                });
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {pd("rating")}
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className={`p-1 transition-colors ${star <= ratingValue ? "text-yellow-400" : "text-muted-foreground/30"}`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {pd("comment")} <span className="text-muted-foreground/60">{pd("optional")}</span>
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="ml-input"
                  rows={3}
                  placeholder={pd("commentPlaceholder")}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  disabled={rateMutation.isPending}
                  className="ml-btn ml-btn-outline"
                >
                  {t("common.cancel", "Cancelar")}
                </button>
                <button
                  type="submit"
                  disabled={rateMutation.isPending}
                  className="ml-btn ml-btn-primary"
                >
                  {rateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pd("sendRating")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payingInstallment && isClient && !isWorkshopContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{pd("registerPayment")}</h2>
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">{pd("amountToPay")}</p>
              {bcvRate && bcvRate > 0 && paymentMethod !== "ZELLE" && paymentMethod !== "ZINLI" && (
                <p className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                  {formatBcv(payingInstallment.amount, bcvRate)}
                  <span className="text-xl font-right text-muted-foreground">
                  ({payingInstallment.amount.toFixed(2)}$)
                  </span>
                </p>
              )}
              {(paymentMethod === "ZELLE" || paymentMethod === "ZINLI") && (
                <p className="mt-1 font-mono text-2xl font-bold text-primary">
                  ${payingInstallment.amount.toFixed(2)}
                </p>
              )}
              {payingInstallment.due_date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {pd("dueDate")} {new Date(payingInstallment.due_date).toLocaleDateString("es-ES")}
                </p>
              )}
            </div>

            <form onSubmit={handlePay} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {pd("paymentMethod")}
                </label>
                {paymentMethods && paymentMethods.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {paymentMethods.map((pm) => {
                      const pmType = (pm.type || "").toUpperCase();
                      const isSelected = paymentMethod === pmType;
                      const typeLabel =
                        pm.type === "bank_transfer"
                          ? paymentMethodLabel("bank_transfer")
                          : pm.type === "mobile_payment"
                            ? paymentMethodLabel("mobile_payment")
                            : pm.type === "cash"
                              ? paymentMethodLabel("cash")
                              : pm.type === "zelle"
                                ? paymentMethodLabel("zelle")
                                : pm.type === "zinli"
                                  ? paymentMethodLabel("zinli")
                                  : t("common.other", "Other");
                      const typeColor =
                        pm.type === "bank_transfer"
                          ? "text-blue-400"
                          : pm.type === "mobile_payment"
                            ? "text-green-400"
                            : pm.type === "cash"
                              ? "text-amber-400"
                              : pm.type === "zelle" || pm.type === "zinli"
                                ? "text-purple-400"
                                : "text-muted-foreground";
                      return (
                        <div
                          key={pm.id}
                          className={`rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary/60 bg-primary/10 shadow-sm"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentMethod(
                                isSelected
                                  ? ""
                                  : (pm.type.toUpperCase() as PayInstallmentInput["payment_method"]),
                              )
                            }
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
                                {pm.type === "bank_transfer" && pm.bank_name && (
                                  <span className="text-xs text-muted-foreground">
                                    {pm.bank_name}
                                  </span>
                                )}
                              </div>
                              {!isSelected && pm.type === "mobile_payment" && pm.phone_number && (
                                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                  {pm.phone_number}
                                </p>
                              )}
                              {!isSelected && pm.type === "bank_transfer" && pm.account_number && (
                                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                                  ****{pm.account_number.slice(-4)}
                                </p>
                              )}
                              {!isSelected && pm.type === "cash" && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {pd("payAtWorkshop")}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                {t("common.tapToDeselect", "Tap to deselect")}
                              </span>
                            )}
                          </button>
                          {isSelected && (
                            <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                              {pm.type === "bank_transfer" && (
                                <div className="space-y-1">
                                  {pm.bank_name && (
                                    <p>
                                      <span className="text-muted-foreground/70">{pd("bankColon")}</span>{" "}
                                      {pm.bank_name}
                                    </p>
                                  )}
                                  {pm.account_number && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">{pd("accountColon")}</span>{" "}
                                      {pm.account_number}
                                    </p>
                                  )}
                                  {pm.account_holder && (
                                    <p>
                                      <span className="text-muted-foreground/70">{pd("holderColon")}</span>{" "}
                                      {pm.account_holder}
                                    </p>
                                  )}
                                  {pm.holder_ci && (
                                    <p>
                                      <span className="text-muted-foreground/70">{pd("ciColon")}</span>{" "}
                                      {pm.holder_ci}
                                    </p>
                                  )}
                                </div>
                              )}
                              {pm.type === "mobile_payment" && (
                                <div className="space-y-1">
                                  {pm.phone_number && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">{pd("phoneColon")}</span>{" "}
                                      {pm.phone_number}
                                    </p>
                                  )}
                                  {pm.holder_ci && (
                                    <p>
                                      <span className="text-muted-foreground/70">{pd("ciColon")}</span>{" "}
                                      {pm.holder_ci}
                                    </p>
                                  )}
                                  {pm.bank_name && (
                                    <p>
                                      <span className="text-muted-foreground/70">{pd("bankColon")}</span>{" "}
                                      {pm.bank_name}
                                    </p>
                                  )}
                                </div>
                              )}
                              {pm.type === "cash" && (
                                <p>
                                  {t("checkout.payCashAtWorkshop", "Pay cash directly at the workshop when picking up.")}
                                </p>
                              )}
                              {(pm.type === "zelle" || pm.type === "zinli") && (
                                <div className="space-y-1">
                                  {pm.email && (
                                    <p className="font-mono">
                                      <span className="text-muted-foreground/70">{pd("emailColon")}</span>{" "}
                                      {pm.email}
                                    </p>
                                  )}
                                  {pm.account_holder && (
                                    <p>
                                      <span className="text-muted-foreground/70">{pd("holderColon")}</span>{" "}
                                      {pm.account_holder}
                                    </p>
                                  )}
                                  <p className="text-primary/70">{t("checkout.usdNoBs", "Payment in USD — no Bs equivalent")}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ml-input w-full py-2 text-center text-sm text-muted-foreground">
                    {t("checkout.noPaymentMethods", "This workshop has no payment methods configured")}
                  </div>
                )}
              </div>

              {paymentMethod !== "CASH" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {pd("referenceNumberLabel")}
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    maxLength={100}
                    placeholder={pd("referencePlaceholder")}
                    className="ml-input"
                    required
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {pd("paymentDate")}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  min={order?.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : undefined}
                  max={new Date().toISOString().slice(0, 10)}
                  className="ml-input w-full"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {pd("bcvRateNote")}
                </p>
              </div>
              {payingInstallment && (
                <div className="rounded-lg border border-border bg-surface/50 px-4 py-3">
                  {dateBcvLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {pd("fetchingBcvRate")}
                    </div>
                  ) : dateBcvRate ? (
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">{pd("amountToPay")}</span>
                      <span className="font-mono text-lg font-bold text-primary">
                        {formatBcv(payingInstallment.amount, dateBcvRate)}
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                          (${payingInstallment.amount.toFixed(2)})
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{pd("amountToPay")}</span>
                      <span className="text-lg font-semibold text-foreground">
                        ${payingInstallment.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {payingInstallment.due_date && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {pd("dueDate")} {new Date(payingInstallment.due_date).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
              )}
              {paymentMethod === "CASH" && (
                <p className="text-xs text-muted-foreground">
                  {t("checkout.payCashAtWorkshop", "Pay cash directly at the workshop when picking up.")}
                </p>
              )}

              {payMutation.error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {(payMutation.error as AxiosError<{ message?: string }>).response?.data
                    ?.message ?? pd("errorRegisteringPayment")}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInstallment(null)}
                  disabled={payMutation.isPending}
                  className="ml-btn ml-btn-outline"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="ml-btn ml-btn-primary"
                >
                  {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pd("registerPayment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payingInstallment && isWorkshopOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{pd("paymentInfo")}</h2>
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">{pd("amount")}</p>
              {(() => {
                const effectiveRate = (payingInstallment.rate && payingInstallment.rate > 0)
                  ? payingInstallment.rate
                  : (bcvRate && bcvRate > 0 ? bcvRate : 0);
                if (effectiveRate > 0) {
                  return (
                    <>
                      <p className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                        <span>{formatBcv(payingInstallment.amount, effectiveRate)}</span>
                        <span className="text-lg font-normal text-muted-foreground">
                          (${payingInstallment.amount.toFixed(2)})
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {pd("bcvRateLabel", undefined, { rate: effectiveRate.toFixed(2) })}
                        {payingInstallment.rate_date && (
                          <span className="ml-1">
                            — {new Date(payingInstallment.rate_date).toLocaleDateString("es-ES")}
                          </span>
                        )}
                      </p>
                    </>
                  );
                }
                return (
                  <p className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                    ${payingInstallment.amount.toFixed(2)}
                  </p>
                );
              })()}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{pd("paymentMethodLabel")}</p>
                <p className="text-sm">
                  {(() => {
                    const pm = paymentMethods?.find((m) => m.id === payingInstallment.payment_method);
                    if (pm) {
                      return pm.type === "bank_transfer"
                        ? paymentMethodLabel("bank_transfer")
                        : pm.type === "mobile_payment"
                          ? paymentMethodLabel("mobile_payment")
                          : pm.type === "cash"
                            ? paymentMethodLabel("cash")
                            : pm.type === "zelle"
                              ? paymentMethodLabel("zelle")
                              : pm.type === "zinli"
                                ? paymentMethodLabel("zinli")
                                : pm.type;
                    }
                    return paymentMethodLabel(payingInstallment.payment_method ?? "");
                  })()}
                </p>
              </div>

              {payingInstallment.reference_number && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{pd("referenceNumberLabel")}</p>
                  <p className="text-sm font-mono">{payingInstallment.reference_number}</p>
                </div>
              )}

              {payingInstallment.due_date && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{pd("dueDateLabel")}</p>
                  <p className="text-sm">{new Date(payingInstallment.due_date).toLocaleDateString("es-ES")}</p>
                </div>
              )}

              {payingInstallment.rate && payingInstallment.rate > 0 && (
                <div className="rounded-lg border border-border bg-surface/50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{pd("usdAmount")}</span>
                    <span className="text-lg font-semibold text-foreground">
                      ${payingInstallment.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {pd("bsEquivalent", undefined, { rate: payingInstallment.rate.toLocaleString("es-VE") })}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatBcv(payingInstallment.amount, payingInstallment.rate)}
                    </span>
                  </div>
                  {payingInstallment.rate_date && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {pd("rateDate", undefined, { date: new Date(payingInstallment.rate_date).toLocaleDateString("es-ES") })}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground">{pd("paymentDateLabel")}</p>
                <p className="text-sm">
                  {payingInstallment.paid_at
                    ? new Date(payingInstallment.paid_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : pd("noDate")}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">{pd("statusLabel")}</p>
                <span
                  className={`ml-badge ${INSTALLMENT_STATUS_STYLES[payingInstallment.status] || INSTALLMENT_STATUS_STYLES.PENDING}`}
                >
                  {installmentStatusLabel(payingInstallment.status)}
                </span>
              </div>
            </div>

            {payingInstallment.status === "PENDING_VERIFICATION" && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    markPaidMutation.mutate({ installmentId: payingInstallment.id, ref: null });
                  }}
                  disabled={markPaidMutation.isPending}
                  className="w-full ml-btn ml-btn-primary"
                >
                  {markPaidMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pd("verifyPayment")}
                </button>
                <button
                  onClick={() => {
                    markErroneousMutation.mutate(payingInstallment.id);
                  }}
                  disabled={markErroneousMutation.isPending}
                  className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {markErroneousMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pd("rejectInstallment")}
                </button>
              </div>
            )}

            <div className="mt-3">
              <button
                onClick={() => setPayingInstallment(null)}
                className="w-full ml-btn ml-btn-outline"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={showShipModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowShipModal(false);
            setShipTracking("");
            setShipNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              {pd("shippingInfo")}
            </DialogTitle>
            <DialogDescription>
              {pd("shippingInfoDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {pd("trackingNumber")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={shipTracking}
                onChange={(e) => setShipTracking(e.target.value)}
                className="ml-input"
                placeholder={t("purchaseDetail.trackingPlaceholder", "e.g. 123456789")}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {pd("shippingAgencyLabel")} <span className="text-red-400">*</span>
              </label>
              <select
                value={shipNotes}
                onChange={(e) => setShipNotes(e.target.value)}
                className="ml-input"
              >
                <option value="">{pd("selectPlaceholder")}</option>
                <option value="MRW">MRW</option>
                <option value="Zoom">Zoom</option>
                <option value="Tealca">Tealca</option>
                <option value="Domesa">Domesa</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setShowShipModal(false);
                setShipTracking("");
                setShipNotes("");
              }}
              disabled={markShippedMutation.isPending}
              className="ml-btn ml-btn-outline"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              onClick={() => {
                if (!shipTracking.trim() || !shipNotes.trim()) return;
                markShippedMutation.mutate({
                  tracking_number: shipTracking.trim(),
                  shipping_notes: shipNotes.trim(),
                });
              }}
              disabled={!shipTracking.trim() || !shipNotes.trim() || markShippedMutation.isPending}
              className="ml-btn ml-btn-primary"
            >
              {markShippedMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pd("markAsShipped")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
