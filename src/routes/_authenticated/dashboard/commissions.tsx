import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Percent, Clock, CheckCircle2, TrendingUp, Building2, Smartphone, Mail, DollarSign, CreditCard, X } from "lucide-react";
import { toast } from "sonner";
import {
  getMyCommissions,
  registerAllWorkshopsCommissionsPayment,
  getPaymentDestinations,
  type MyCommissions,
  type PaymentDestination,
} from "../../../lib/api";
import { useLocale } from "../../../lib/locale-context";
import { formatBcv, getBcvRate } from "../../../lib/bcv";

export const Route = createFileRoute("/_authenticated/dashboard/commissions")({
  component: CommissionsPage,
});

function CommissionsPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [showPayModal, setShowPayModal] = useState(false);
  const { data, isLoading } = useQuery<MyCommissions>({
    queryKey: ["my-commissions"],
    queryFn: getMyCommissions,
  });

  const commissions = data?.commissions ?? [];
  const totalPending = data?.total_pending ?? 0;
  const totalPaid = data?.total_paid ?? 0;
  const pendingCount = commissions.filter((c) => c.status === "PENDING").length;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthCommissions = commissions.filter(
    (c) => c.period_month === currentMonth && c.period_year === currentYear,
  );
  const currentMonthFinanced = currentMonthCommissions.reduce(
    (sum, c) => sum + c.financed_amount,
    0,
  );
  const currentMonthCommission = currentMonthCommissions.reduce(
    (sum, c) => sum + c.commission_amount,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("commissions.dashboard")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Percent className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t("commissions.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("commissions.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="ml-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">{t("commissions.financedThisMonth")}</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">
            ${currentMonthFinanced.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("commissions.commission")}: ${currentMonthCommission.toFixed(2)}
          </p>
        </div>
        <div className="ml-card p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-medium text-muted-foreground">{t("commissions.pendingPayment")}</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">
            ${totalPending.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("commissions.payByMonthEnd")}
          </p>
        </div>
        <div className="ml-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-medium text-muted-foreground">{t("commissions.paid")}</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            ${totalPaid.toFixed(2)}
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <button
          onClick={() => setShowPayModal(true)}
          className="ml-btn ml-btn-primary w-full"
        >
          {t("commissions.payAll", "", { count: pendingCount, amount: totalPending.toFixed(2) })}
        </button>
      )}

      <div className="ml-card p-5">
        <h3 className="mb-4 text-sm font-semibold">{t("commissions.monthlySummary")}</h3>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : commissions.length === 0 ? (
          <div className="py-12 text-center">
            <Percent className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">{t("commissions.noCommissions")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("commissions.noCommissionsDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(
              commissions.reduce(
                (acc, c) => {
                  const key = `${c.period_year}-${c.period_month}`;
                  if (!acc[key])
                    acc[key] = {
                      period_month: c.period_month,
                      period_year: c.period_year,
                      count: 0,
                      total: 0,
                      pending: 0,
                      pendingCount: 0,
                      paid: 0,
                      verification: 0,
                    };
                  acc[key].count++;
                  acc[key].total += c.commission_amount;
                  if (c.status === "PAID") acc[key].paid += c.commission_amount;
                  else if (c.status === "PENDING") {
                    acc[key].pending += c.commission_amount;
                    acc[key].pendingCount++;
                  } else if (c.status === "PENDING_VERIFICATION") {
                    acc[key].verification += c.commission_amount;
                  }
                  return acc;
                },
                {} as Record<string, {
                  period_month: number;
                  period_year: number;
                  count: number;
                  total: number;
                  pending: number;
                  pendingCount: number;
                  paid: number;
                  verification: number;
                }>,
              ),
            )
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([key, group]) => {
                const monthName = new Date(group.period_year, group.period_month - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
                return (
                  <div key={key} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold capitalize">{monthName}</p>
                        <p className="text-xs text-muted-foreground">{t("commissions.transactions", "", { count: group.count })}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{t("commissions.pending")}</p>
                          <p className="font-semibold text-amber-400">${group.pending.toFixed(2)}</p>
                          {group.verification > 0 && (
                            <p className="text-[10px] text-blue-400">+${group.verification.toFixed(2)} {t("commissions.inVerification")}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{t("commissions.paid")}</p>
                          <p className="font-semibold text-emerald-400">${group.paid.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{t("commissions.total")}</p>
                          <p className="font-semibold">${group.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      {showPayModal && (
        <CommissionPaymentModal
          totalAmount={totalPending}
          onClose={() => setShowPayModal(false)}
          onPaid={() => {
            setShowPayModal(false);
            queryClient.invalidateQueries({ queryKey: ["my-commissions"] });
          }}
        />
      )}
    </div>
  );
}

function CommissionPaymentModal({
  totalAmount,
  onClose,
  onPaid,
}: {
  totalAmount: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { t } = useLocale();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [reference, setReference] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const { data: destinations, isLoading } = useQuery<PaymentDestination[]>({
    queryKey: ["payment-destinations"],
    queryFn: getPaymentDestinations,
  });

  const { data: bcvRate } = useQuery({
    queryKey: ["bcv-rate"],
    queryFn: getBcvRate,
    staleTime: 5 * 60 * 1000,
  });

  const methodIcon = (type: string) => {
    if (type === "BANK_TRANSFER") return <Building2 className="h-4 w-4" />;
    if (type === "MOBILE_PAYMENT") return <Smartphone className="h-4 w-4" />;
    if (type === "ZELLE") return <Mail className="h-4 w-4" />;
    if (type === "BINANCE") return <DollarSign className="h-4 w-4" />;
    return <CreditCard className="h-4 w-4" />;
  };

  const methodLabel = (type: string) => {
    return t(`workshopSales.commissions.paymentMethods.${type}`, type);
  };

  const dest = destinations?.find((d) => d.id === selectedMethod);
  const isForeign = dest?.method_type === "ZELLE" || dest?.method_type === "BINANCE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error(t("workshopSales.commissions.selectMethod"));
      return;
    }
    if (!dest) return;

    setSubmitting(true);
    try {
      let rate: number | undefined;
      let rateDate: string | undefined;
      if (!isForeign && bcvRate && bcvRate > 0) {
        rate = bcvRate;
        rateDate = payDate;
      }
      await registerAllWorkshopsCommissionsPayment(
        dest.method_type,
        isForeign ? undefined : reference.trim() || undefined,
        rate,
        rateDate,
      );
      toast.success(t("workshopSales.commissions.paymentRegistered"));
      onPaid();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("workshopSales.commissions.paymentError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("workshopSales.commissions.payAllCommissions")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("workshopSales.commissions.totalPending", "", { amount: totalAmount.toFixed(2) })}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !destinations || destinations.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            {t("workshopSales.commissions.noPaymentMethods")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {bcvRate && bcvRate > 0 && !isForeign && (
              <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("workshopSales.commissions.bsEquivalent")}</span>
                  <span className="font-mono font-medium">{formatBcv(totalAmount, bcvRate)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                {t("workshopSales.commissions.selectPaymentDestination")}
              </label>
              <div className="space-y-2">
                {destinations.map((d) => {
                  const isSelected = selectedMethod === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedMethod(d.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                          {methodIcon(d.method_type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{d.label}</p>
                          <p className="text-xs text-muted-foreground">{methodLabel(d.method_type)}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-2 space-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                          {d.bank_name && <p>{t("workshopSales.commissions.bank")}: <span className="text-foreground">{d.bank_name}</span></p>}
                          {d.account_number && <p>{t("workshopSales.commissions.account")}: <span className="text-foreground font-mono">{d.account_number}</span></p>}
                          {d.holder_name && <p>{t("workshopSales.commissions.holder")}: <span className="text-foreground">{d.holder_name}</span></p>}
                          {d.holder_ci && <p>{t("workshopSales.commissions.ci")}: <span className="text-foreground">{d.holder_ci}</span></p>}
                          {d.phone && <p>{t("workshopSales.commissions.phone")}: <span className="text-foreground font-mono">{d.phone}</span></p>}
                          {d.email && <p>{t("workshopSales.commissions.email")}: <span className="text-foreground">{d.email}</span></p>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMethod && !isForeign && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("workshopSales.commissions.referenceNumber")}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t("workshopSales.commissions.referencePlaceholder")}
                  className="ml-input"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("workshopSales.commissions.paymentDate")}
              </label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="ml-input"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="ml-btn ml-btn-outline flex-1">
                {t("workshopSales.commissions.cancel")}
              </button>
              <button
                type="submit"
                disabled={!selectedMethod || submitting}
                className="ml-btn ml-btn-primary flex-1"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("workshopSales.commissions.registerPaymentBtn")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
