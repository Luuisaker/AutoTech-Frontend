import { createFileRoute, Link } from "@tanstack/react-router";
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
  User,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  CreditCard,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminGetServiceOrder,
  markServiceInstallmentPaid,
  markServiceInstallmentErroneous,
  type AdminServiceOrderDetailDTO,
} from "../../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/admin/service-orders/$orderId")({
  component: AdminServiceOrderDetailPage,
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

function AdminServiceOrderDetailPage() {
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidInstallmentId, setMarkPaidInstallmentId] = useState<string | null>(null);
  const [markPaidDate, setMarkPaidDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-service-order", orderId],
    queryFn: () => adminGetServiceOrder(orderId),
  });

  const markInstallmentPaidMutation = useMutation({
    mutationFn: ({ installmentId, paidAt }: { installmentId: string; paidAt?: string }) =>
      markServiceInstallmentPaid(installmentId, paidAt ? { paid_at: paidAt } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-order", orderId] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-service-order", orderId] });
      toast.success("Cuota marcada como errónea");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al marcar cuota";
      toast.error(msg);
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {order && (
        <Link
          to="/dashboard/admin"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Panel de administración
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
                    <span className="text-muted-foreground">Notas:</span>
                    <span className="font-medium">{order.notes}</span>
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
                <ShieldCheck className="h-4 w-4" />
                Propietario del taller
              </h2>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {(order.owner_first_name?.[0] ?? "?").toUpperCase()}
                  {(order.owner_last_name?.[0] ?? "").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {order.owner_first_name
                      ? `${order.owner_first_name} ${order.owner_last_name}`.trim()
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.owner_email ?? "—"}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {order.owner_ci && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cédula:</span>
                    <span className="font-medium">{order.owner_ci}</span>
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
                        <span className="font-medium text-amber-400">
                          + ${order.extra_charge.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {order.revision != null && (
                      <p className="mt-2 text-xs text-amber-400">
                        Si se rechaza, costo de revisión:{" "}
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

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Estado de pago</span>
                  <span className={order.is_paid ? "text-emerald-400" : "text-amber-400"}>
                    {order.is_paid ? "Pagado" : "Pendiente"}
                  </span>
                </div>
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
                          <p className="font-mono text-xs font-bold">
                            ${inst.amount.toFixed(2)}
                          </p>
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
                  <Package className="h-4 w-4" />
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
                  <p className="text-xs text-muted-foreground">{order.user_email ?? "—"}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {order.user_ci && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cédula:</span>
                    <span className="font-medium">{order.user_ci}</span>
                  </div>
                )}
                {order.user_client_rating != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Calificación:</span>
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
                    <span className="font-medium">
                      {order.user_client_rating?.toFixed(1)} ({order.user_client_rating_count ?? 0})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {order.ratings && (
              <div className="ml-card p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Star className="h-4 w-4" />
                  Calificaciones
                </h2>
                <div className="space-y-3 text-sm">
                  {order.ratings.client_rated && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Calificación del cliente al taller:
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
                        {order.ratings.client_rating && (
                          <span className="text-muted-foreground">
                            {order.ratings.client_rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {order.ratings.workshop_rated && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Calificación del taller al cliente:
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
                        {order.ratings.workshop_rating && (
                          <span className="text-muted-foreground">
                            {order.ratings.workshop_rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="ml-empty-state py-16">
          <Wrench className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">No se encontró la orden de servicio</p>
          <Link to="/dashboard/admin" className="ml-btn ml-btn-primary">
            Volver al panel
          </Link>
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
                    type="button"
                    disabled={markInstallmentPaidMutation.isPending}
                    onClick={() => {
                      markInstallmentPaidMutation.mutate({ installmentId: inst.id });
                      setShowMarkPaidModal(false);
                      setMarkPaidInstallmentId(null);
                    }}
                    className="w-full ml-btn ml-btn-primary"
                  >
                    {markInstallmentPaidMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verificar pago
                  </button>
                  <button
                    type="button"
                    disabled={markInstallmentErroneousMutation.isPending}
                    onClick={() => {
                      markInstallmentErroneousMutation.mutate(inst.id);
                      setShowMarkPaidModal(false);
                      setMarkPaidInstallmentId(null);
                    }}
                    className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    {markInstallmentErroneousMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Rechazar cuota
                  </button>
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
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
    </div>
  );
}
