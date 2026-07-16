import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Percent, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { getMyCommissions, type MyCommissions } from "../../../lib/api";
import { useLocale } from "../../../lib/locale-context";

export const Route = createFileRoute("/_authenticated/dashboard/commissions")({
  component: CommissionsPage,
});

function CommissionsPage() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery<MyCommissions>({
    queryKey: ["my-commissions"],
    queryFn: getMyCommissions,
  });

  const commissions = data?.commissions ?? [];
  const totalPending = data?.total_pending ?? 0;
  const totalPaid = data?.total_paid ?? 0;

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
                        <p className="text-xs text-muted-foreground">{group.count} {t("commissions.transactions")}</p>
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
    </div>
  );
}
