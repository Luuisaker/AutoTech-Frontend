import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { AxiosError } from "axios";
import { ArrowLeft, Loader2, CreditCard, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  getOrderInstallments,
  payInstallment,
  type InstallmentDTO,
  type PayInstallmentInput,
} from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/purchases/$purchaseId")({
  component: PurchaseDetailPage,
});

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Transferencia bancaria",
  MOBILE_PAYMENT: "Pago móvil",
  CASH: "Efectivo",
  OTHER: "Otro",
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  OVERDUE: "border border-red-500/30 bg-red-500/10 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  OVERDUE: "Vencido",
};

function PurchaseDetailPage() {
  const { purchaseId } = Route.useParams();
  const queryClient = useQueryClient();

  const [payingInstallment, setPayingInstallment] = useState<InstallmentDTO | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PayInstallmentInput["payment_method"]>("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");

  const { data: installments, isLoading } = useQuery({
    queryKey: ["order-installments", purchaseId],
    queryFn: () => getOrderInstallments(purchaseId),
  });

  const payMutation = useMutation({
    mutationFn: ({ installmentId, input }: { installmentId: string; input: PayInstallmentInput }) =>
      payInstallment(installmentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["order-installments", purchaseId],
      });
      toast.success("Pago registrado exitosamente");
      setPayingInstallment(null);
      setPaymentMethod("BANK_TRANSFER");
      setReferenceNumber("");
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      const data = err.response?.data;
      const msg = data?.message ?? data?.detail ?? "Error al registrar el pago";
      toast.error(msg);
    },
  });

  const total = installments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const paidCount = installments?.filter((p) => p.status === "PAID").length ?? 0;
  const isAllPaid = installments && installments.length > 0 && paidCount === installments.length;

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInstallment) return;
    payMutation.mutate({
      installmentId: payingInstallment.id,
      input: {
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
      },
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard/purchases"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis órdenes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Detalle de orden</h1>
        <p className="mt-1 text-sm text-muted-foreground">ID: {purchaseId.slice(0, 8)}...</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : installments && installments.length > 0 ? (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-1 font-mono text-lg font-semibold">${total.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="mt-1 font-mono text-lg font-semibold text-emerald-400">
                $
                {installments
                  .filter((p) => p.status === "PAID")
                  .reduce((s, p) => s + p.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Cuotas</p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {paidCount}/{installments.length}
                {isAllPaid && <CheckCircle2 className="ml-1 inline h-4 w-4 text-emerald-400" />}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {installments.map((installment, index) => (
              <div
                key={installment.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
                      installment.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : installment.status === "OVERDUE"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {installment.status === "PAID" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : installment.status === "OVERDUE" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Cuota {index + 1} de {installments.length}
                    </p>
                    <p className="font-mono text-lg font-semibold">
                      ${installment.amount.toFixed(2)}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Vence: {new Date(installment.due_date).toLocaleDateString("es-ES")}
                      </span>
                      {installment.status === "PAID" && installment.paid_at && (
                        <span>
                          Pagado: {new Date(installment.paid_at).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </div>
                    {installment.payment_method && installment.status === "PAID" && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[installment.payment_method] ??
                          installment.payment_method}
                        {installment.reference_number && ` · Ref: ${installment.reference_number}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[installment.status] || STATUS_STYLES.PENDING}`}
                  >
                    {STATUS_LABELS[installment.status] ?? installment.status}
                  </span>
                  {installment.status === "PENDING" && (
                    <button
                      onClick={() => {
                        setPayingInstallment(installment);
                        setPaymentMethod("BANK_TRANSFER");
                        setReferenceNumber("");
                      }}
                      className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">No se encontraron cuotas</p>
        </div>
      )}

      {payingInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border-strong bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">Registrar pago</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ${payingInstallment.amount.toFixed(2)} — Vence{" "}
              {new Date(payingInstallment.due_date).toLocaleDateString("es-ES")}
            </p>

            <form onSubmit={handlePay} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Método de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PayInstallmentInput["payment_method"])
                  }
                  required
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                >
                  <option value="BANK_TRANSFER">Transferencia bancaria</option>
                  <option value="MOBILE_PAYMENT">Pago móvil</option>
                  <option value="CASH">Efectivo</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Número de referencia <span className="text-muted-foreground/60">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  maxLength={100}
                  placeholder="Nro. de transferencia"
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                />
              </div>

              {payMutation.error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {(payMutation.error as AxiosError<{ message?: string }>).response?.data
                    ?.message ?? "Error al registrar el pago"}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInstallment(null)}
                  disabled={payMutation.isPending}
                  className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
