import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ArrowLeft, TrendingUp, Wallet, Clock, Loader2, Send, AlertTriangle, Building2, Smartphone, Mail, DollarSign, X } from "lucide-react";
import { useState } from "react";
import {
  getMyCreditLine,
  getCreditLineDetail,
  requestLimitReview,
  getMyLimitRequests,
  getMyLateFees,
  getPaymentDestinations,
  payLateFee,
  type MyCreditLine,
  type CreditLineDetail,
  type PendingRelease,
  type LimitReview,
  type LateFeeDTO,
  type PaymentDestination,
} from "../../../lib/api";
import { getBcvRate, formatBcv } from "../../../lib/bcv";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";

export const Route = createFileRoute(
  "/_authenticated/dashboard/credit-line",
)({
  component: CreditLinePage,
});

function CreditLinePage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"parts" | "service">("parts");
  const [payingFee, setPayingFee] = useState<LateFeeDTO | null>(null);

  const { data: creditLine } = useQuery<MyCreditLine>({
    queryKey: ["credit-line"],
    queryFn: getMyCreditLine,
  });

  const { data: lineDetail } = useQuery<CreditLineDetail>({
    queryKey: ["credit-line-detail", activeTab],
    queryFn: () => getCreditLineDetail(activeTab),
  });

  const { data: myRequests } = useQuery<LimitReview[]>({
    queryKey: ["my-limit-requests"],
    queryFn: getMyLimitRequests,
    enabled: creditLine?.level === 4,
  });

  const { data: lateFeesData } = useQuery<{ late_fees: LateFeeDTO[] }>({
    queryKey: ["my-late-fees"],
    queryFn: getMyLateFees,
  });

  const lateFees = lateFeesData?.late_fees ?? [];

  const queryClient = useQueryClient();
  const requestMutation = useMutation({
    mutationFn: requestLimitReview,
    onSuccess: () => {
      toast.success(t("creditLine.reviewSent"));
      queryClient.invalidateQueries({ queryKey: ["my-limit-requests"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? t("creditLine.reviewError");
      toast.error(msg);
    },
  });

  const levelLabel = (level: number) => {
    return t(`creditLine.level${level}`, `Level ${level}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("creditLine.dashboard")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t("creditLine.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {creditLine ? levelLabel(creditLine.level) : t("creditLine.loading")}
          </p>
        </div>
      </div>


      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Parts line */}
        <button
          onClick={() => setActiveTab("parts")}
          className={`rounded-xl border p-5 text-left transition-all hover:border-primary/50 ${
            activeTab === "parts"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t("creditLine.parts")}</span>
            </div>
          </div>
          {creditLine && (
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${creditLine.parts_available < 0 ? "text-red-400" : "text-primary"}`}>
                  ${Math.max(0, creditLine.parts_available).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / ${creditLine.parts_limit.toFixed(2)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${creditLine.parts_limit > 0 ? Math.max(0, Math.min(100, (creditLine.parts_available / creditLine.parts_limit) * 100)) : 0}%`,
                  }}
                />
              </div>
              {creditLine.parts_debt > 0 && (
                <p className={`mt-2 text-xs ${creditLine.parts_available < 0 ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                  {t("creditLine.currentDebt")}: ${creditLine.parts_debt.toFixed(2)}
                  {creditLine.parts_available < 0 && ` — ${t("creditLine.exceeded")}`}
                </p>
              )}
            </div>
          )}
        </button>

        {/* Service line */}
        <button
          onClick={() => setActiveTab("service")}
          className={`rounded-xl border p-5 text-left transition-all hover:border-primary/50 ${
            activeTab === "service"
              ? "border-primary bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t("creditLine.services")}</span>
            </div>
          </div>
          {creditLine && (
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${creditLine.service_available < 0 ? "text-red-400" : "text-primary"}`}>
                  ${Math.max(0, creditLine.service_available).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / ${creditLine.service_limit.toFixed(2)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${creditLine.service_limit > 0 ? Math.max(0, Math.min(100, (creditLine.service_available / creditLine.service_limit) * 100)) : 0}%`,
                  }}
                />
              </div>
              {creditLine.service_debt > 0 && (
                <p className={`mt-2 text-xs ${creditLine.service_available < 0 ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                  {t("creditLine.currentDebt")}: ${creditLine.service_debt.toFixed(2)}
                  {creditLine.service_available < 0 && ` — ${t("creditLine.exceeded")}`}
                </p>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Detail section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {t("creditLine.pendingReleases")} — {activeTab === "parts" ? t("creditLine.parts") : t("creditLine.services")}
          </h2>
        </div>

        {lineDetail && lineDetail.pending_releases.length > 0 ? (
          <div className="space-y-3">
            {lineDetail.pending_releases.map((release: PendingRelease) => {
              const isService = release.description.includes("servicio");
              return (
                <Link
                  key={release.order_id}
                  to={isService ? "/dashboard/service-orders/$orderId" : "/dashboard/purchases/$purchaseId"}
                  params={isService ? { orderId: release.order_id } : { purchaseId: release.order_id }}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3 transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  <div>
                    <p className="text-sm font-medium">{release.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("creditLine.due")}: {new Date(release.due_date).toLocaleDateString(undefined)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-primary">
                      ${release.amount.toFixed(2)}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        release.status === "PENDING_VERIFICATION"
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border border-sky-500/30 bg-sky-500/10 text-sky-400"
                      }`}
                    >
                      {release.status === "PENDING_VERIFICATION"
                        ? t("creditLine.verificationPending")
                        : t("creditLine.pending")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("creditLine.noPendingReleases")}
          </p>
        )}
      </div>

      {/* Moras section */}
      {lateFees.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">{t("creditLine.lateFees")}</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("creditLine.lateFeesDesc")}
          </p>
          <div className="space-y-3">
            {lateFees.map((fee) => (
              <div
                key={fee.id}
                className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {fee.installment_type === "PARTS" ? t("creditLine.parts") : t("creditLine.services")} — {t("creditLine.lateFee")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fee.status === "PENDING_VERIFICATION"
                      ? t("creditLine.verificationPending")
                      : fee.status === "PAID"
                        ? `${t("creditLine.paid")}: ${fee.paid_at ? new Date(fee.paid_at).toLocaleDateString(undefined) : ""}`
                        : t("creditLine.pendingPayment")}
                    {fee.payment_method && fee.payment_method !== "OTHER" && ` · ${fee.payment_method}`}
                    {fee.reference_number && ` · ${t("creditLine.ref")}: ${fee.reference_number}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="font-mono font-semibold text-red-400">
                    ${fee.amount.toFixed(2)}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      fee.status === "PAID"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : fee.status === "PENDING_VERIFICATION"
                          ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border border-red-500/30 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {fee.status === "PAID"
                      ? t("creditLine.paid")
                      : fee.status === "PENDING_VERIFICATION"
                        ? t("creditLine.inVerification")
                        : ""}
                  </span>
                  {(fee.status === "PENDING" || fee.status === "OVERDUE") && (
                    <button
                      onClick={() => setPayingFee(fee)}
                      className="ml-btn ml-btn-primary text-xs shrink-0 w-full sm:w-auto"
                    >
                      {t("creditLine.pay")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payingFee && (
        <MoraPaymentModal
          fee={payingFee}
          onClose={() => setPayingFee(null)}
          onPaid={() => {
            setPayingFee(null);
            queryClient.invalidateQueries({ queryKey: ["my-late-fees"] });
          }}
        />
      )}

      {/* Credit points summary */}
      {creditLine && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("creditLine.creditPoints")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">{t("creditLine.consolidatedPoints")}</p>
              <p className="text-2xl font-bold text-primary">{creditLine.credit_points.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">{t("creditLine.pendingPoints")}</p>
              <p className="text-2xl font-bold text-amber-400">{creditLine.pending_points.toFixed(2)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("creditLine.pendingPointsDesc")}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">{t("creditLine.toNextLevel")}</p>
              {creditLine.points_to_next_level !== null ? (
                <>
                  <p className="text-2xl font-bold text-emerald-500">{creditLine.points_to_next_level.toFixed(2)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("creditLine.ptsRemaining")}</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-emerald-500">{t("creditLine.max")}</p>
              )}
            </div>
          </div>
          {creditLine.points_to_next_level !== null && creditLine.pending_points > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("creditLine.ifPayOnTime", "", { points: creditLine.pending_points.toFixed(2) })}{" "}
              {creditLine.pending_points >= creditLine.points_to_next_level
                ? ` — ${t("creditLine.enoughToLevelUp")}!`
                : ` — ${t("creditLine.ptsShort", "", { remaining: (creditLine.points_to_next_level - creditLine.pending_points).toFixed(2) })}`}
            </p>
          )}
        </div>
      )}

      {/* Limit review request — level 4 only */}
      {creditLine?.level === 4 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">{t("creditLine.limitReview")}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("creditLine.limitReviewDesc")}
              </p>
            </div>
            <button
              onClick={() => requestMutation.mutate()}
              disabled={requestMutation.isPending}
              className="ml-btn ml-btn-primary"
            >
              {requestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("creditLine.requestReview")}
            </button>
          </div>

          {myRequests && myRequests.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">{t("creditLine.yourRequests")}</p>
              {myRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(undefined)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.status === "APPROVED"
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : r.status === "REJECTED"
                            ? "border border-red-500/30 bg-red-500/10 text-red-400"
                            : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {r.status === "APPROVED"
                        ? t("creditLine.approved")
                        : r.status === "REJECTED"
                          ? t("creditLine.rejected")
                          : t("creditLine.pending")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MoraPaymentModal({
  fee,
  onClose,
  onPaid,
}: {
  fee: LateFeeDTO;
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
    return t(`creditLine.paymentTypes.${type}`, type);
  };

  const dest = destinations?.find((d) => d.id === selectedMethod);
  const isForeign = dest?.method_type === "ZELLE" || dest?.method_type === "BINANCE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error(t("creditLine.selectPaymentMethod"));
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
      await payLateFee(fee.id, {
        payment_method: dest.method_type,
        reference_number: isForeign ? undefined : reference.trim() || undefined,
        rate,
        rate_date: rateDate,
      });
      toast.success(t("creditLine.paymentRegistered"));
      onPaid();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? t("creditLine.paymentError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("creditLine.payLateFee")}</h3>
            <p className="text-sm text-muted-foreground">
              {fee.installment_type === "PARTS" ? t("creditLine.parts") : t("creditLine.services")} — ${fee.amount.toFixed(2)}
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
            {t("creditLine.noPaymentMethods")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {bcvRate && bcvRate > 0 && !isForeign && (
              <div className="rounded-lg border border-border bg-background/50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("creditLine.bsEquivalent")}</span>
                  <span className="font-mono font-medium">{formatBcv(fee.amount, bcvRate)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                {t("creditLine.selectPaymentDestination")}
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
                          {d.bank_name && <p>{t("creditLine.bank")}: <span className="text-foreground">{d.bank_name}</span></p>}
                          {d.account_number && <p>{t("creditLine.account")}: <span className="text-foreground font-mono">{d.account_number}</span></p>}
                          {d.holder_name && <p>{t("creditLine.holder")}: <span className="text-foreground">{d.holder_name}</span></p>}
                          {d.holder_ci && <p>{t("creditLine.ci")}: <span className="text-foreground">{d.holder_ci}</span></p>}
                          {d.phone && <p>{t("creditLine.phone")}: <span className="text-foreground font-mono">{d.phone}</span></p>}
                          {d.email && <p>{t("creditLine.email")}: <span className="text-foreground">{d.email}</span></p>}
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
                  {t("creditLine.referenceNumber")}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t("creditLine.referencePlaceholder")}
                  className="ml-input"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("creditLine.paymentDate")}
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
                {t("creditLine.cancel")}
              </button>
              <button
                type="submit"
                disabled={!selectedMethod || submitting}
                className="ml-btn ml-btn-primary flex-1"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("creditLine.registerPayment")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
