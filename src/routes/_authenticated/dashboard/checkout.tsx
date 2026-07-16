import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Loader2, ShoppingCart, CreditCard, Store, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import {
  getCart,
  getVehicles,
  checkout,
  getWorkshopPaymentMethods,
  getMyCreditLine,
  type CartItemDTO,
  type WorkshopPaymentMethodDTO,
  type MyCreditLine,
} from "../../../lib/api";
import { getBcvRate, formatBcv } from "../../../lib/bcv";

export const Route = createFileRoute("/_authenticated/dashboard/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [workshopConfigs, setWorkshopConfigs] = useState<
    Record<
      string,
      {
        deliveryMethod: "PICKUP" | "SHIPPING";
        deliveryAddress: string;
        referenceNumber: string;
        paymentMethodId: string;
      }
    >
  >({});
  const [downPayments, setDownPayments] = useState<Record<string, number>>({});
  const [paymentMethodsMap, setPaymentMethodsMap] = useState<
    Record<string, WorkshopPaymentMethodDTO[]>
  >({});
  const [payContado, setPayContado] = useState<Record<string, boolean>>({});

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const { data: bcvRate } = useQuery({
    queryKey: ["bcv-rate"],
    queryFn: getBcvRate,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: creditLine } = useQuery<MyCreditLine>({
    queryKey: ["credit-line"],
    queryFn: getMyCreditLine,
    staleTime: 60 * 1000,
  });

  const items = cart?.items ?? [];
  const firstVehicleId = vehicles?.[0]?.id;

  const workshopGroups = useMemo(() => {
    const groups: Record<string, { workshop_name: string; items: CartItemDTO[] }> = {};
    for (const item of items) {
      if (!groups[item.workshop_id]) {
        groups[item.workshop_id] = { workshop_name: item.workshop_name, items: [] };
      }
      groups[item.workshop_id].items.push(item);
    }
    return groups;
  }, [items]);

  const workshopIds = useMemo(() => Object.keys(workshopGroups), [workshopGroups]);

  useEffect(() => {
    workshopIds.forEach(async (wid) => {
      try {
        const methods = await getWorkshopPaymentMethods(wid);
        setPaymentMethodsMap((prev) => ({ ...prev, [wid]: methods }));
      } catch {
        /* ignore */
      }
    });
  }, [workshopIds]);

  const getConfig = (wid: string) =>
    workshopConfigs[wid] ?? {
      deliveryMethod: "PICKUP",
      deliveryAddress: "",
      referenceNumber: "",
      paymentMethodId: "",
    };

  const isCashPayment = (wid: string, pmId?: string) => {
    const id = pmId ?? getConfig(wid).paymentMethodId;
    if (!id) return false;
    const methods = paymentMethodsMap[wid] ?? [];
    return methods.find((m) => m.id === id)?.type === "cash";
  };

  const isForeignPayment = (wid: string, pmId?: string) => {
    const id = pmId ?? getConfig(wid).paymentMethodId;
    if (!id) return false;
    const methods = paymentMethodsMap[wid] ?? [];
    const t = methods.find((m) => m.id === id)?.type;
    return t === "zelle" || t === "zinli";
  };

  const allForeignPayments = workshopIds.every((wid) => isForeignPayment(wid));

  const setConfig = (
    wid: string,
    updater: (prev: {
      deliveryMethod: "PICKUP" | "SHIPPING";
      deliveryAddress: string;
      referenceNumber: string;
      paymentMethodId: string;
    }) => {
      deliveryMethod: "PICKUP" | "SHIPPING";
      deliveryAddress: string;
      referenceNumber: string;
      paymentMethodId: string;
    },
  ) => {
    const config = getConfig(wid);
    const updated = updater(config);
    if (updated.paymentMethodId && isCashPayment(wid, updated.paymentMethodId)) {
      updated.deliveryMethod = "PICKUP";
      updated.deliveryAddress = "";
    }
    setWorkshopConfigs((prev) => ({ ...prev, [wid]: updated }));
  };

  const totals = useMemo(() => {
    let itemsTotal = 0;
    let downPaymentTotal = 0;
    let hasInstallmentItems = false;
    let allFullDownPayment = true;
    let financedDownPayment = 0; // down payment for financed items only (earns points)
    let financedAmount = 0; // total financed amount (earns points)
    for (const g of Object.values(workshopGroups)) {
      for (const item of g.items) {
        itemsTotal += item.subtotal;
        if (item.allows_installments) {
          hasInstallmentItems = true;
          const isContadoItem =
            payContado[item.id] ||
            (downPayments[item.id] ?? item.installment_min_percentage ?? 20) === 100;
          const pct = isContadoItem
            ? 100
            : (downPayments[item.id] ?? item.installment_min_percentage ?? 20);
          downPaymentTotal += (item.subtotal * pct) / 100;
          if (pct < 100) {
            allFullDownPayment = false;
            financedDownPayment += (item.subtotal * pct) / 100;
            financedAmount += item.subtotal - (item.subtotal * pct) / 100;
          }
        } else {
          allFullDownPayment = false;
        }
      }
    }
    const isContado = !hasInstallmentItems || allFullDownPayment;
    const totalPoints = financedDownPayment + financedAmount; // only financed items earn points
    return {
      itemsTotal,
      downPaymentTotal,
      financedTotal: itemsTotal - downPaymentTotal,
      grandTotal: itemsTotal,
      isContado,
      hasInstallmentItems,
      financedDownPayment,
      financedAmount,
      totalPoints,
    };
  }, [workshopGroups, downPayments, payContado]);

  const checkoutMutation = useMutation({
    mutationFn: () =>
      checkout({
        vehicle_id: firstVehicleId || undefined,
        workshops: Object.entries(workshopGroups).map(([wid, group]) => {
          const cfg = getConfig(wid);
          return {
            workshop_id: wid,
            delivery_method: cfg.deliveryMethod,
            delivery_address: cfg.deliveryMethod === "SHIPPING" ? cfg.deliveryAddress : null,
            reference_number: cfg.referenceNumber,
            payment_method_id: cfg.paymentMethodId || undefined,
            items: group.items.map((item) => {
              const isContado = !item.allows_installments || payContado[item.id] || (downPayments[item.id] ?? 0) === 100;
              return {
                cart_item_id: item.id,
                down_payment_percentage: isContado ? 100 : (downPayments[item.id] ?? item.installment_min_percentage ?? 20),
              };
            }),
          };
        }),
      }),
    onSuccess: (orders) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(t("checkout.success"));
      if (orders.length === 1 && orders[0]?.id) {
        navigate({
          to: "/dashboard/purchases/$purchaseId",
          params: { purchaseId: orders[0].id },
        });
      } else {
        navigate({ to: "/dashboard/purchases" });
      }
    },
    onError: (err: any) => {
      if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
        toast.error(t("checkout.networkError"));
      } else {
        const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? err?.message ?? t("checkout.error");
        toast.error(msg);
      }
    },
  });

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link
          to="/dashboard/cart"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("checkout.backToCart")}
        </Link>
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t("checkout.emptyCart")}</p>
        </div>
      </div>
    );
  }

  const isFormValid = () => {
    for (const [wid, group] of Object.entries(workshopGroups)) {
      const cfg = getConfig(wid);
      if (cfg.deliveryMethod === "SHIPPING" && !cfg.deliveryAddress.trim()) return false;
      const methods = paymentMethodsMap[wid] ?? [];
      if (methods.length === 0) return false;
      if (!cfg.paymentMethodId) return false;
      if (!isCashPayment(wid) && !cfg.referenceNumber.trim()) return false;
    }
    return items.length > 0;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        to="/dashboard/cart"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("checkout.backToCart")}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("checkout.productCount", "", { count: items.length, s: items.length !== 1 ? "s" : "" })}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {Object.entries(workshopGroups).map(([workshopId, group]) => {
            const cfg = getConfig(workshopId);
            const paymentMethods = paymentMethodsMap[workshopId] ?? [];
            return (
              <div key={workshopId} className="ml-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">{group.workshop_name}</h2>
                </div>

                <div className="divide-y divide-border">
                  {group.items.map((item) => {
                    const minPct = item.installment_min_percentage ?? 20;
                    const dp = downPayments[item.id] ?? minPct;
                    const downAmt = (item.subtotal * dp) / 100;
                    const financed = item.subtotal - downAmt;
                    const installmentAmt = financed / 3;
                    const presets = [20, 30, 50, 100].filter((p) => p >= minPct);

                    return (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <Link
                              to="/dashboard/parts/$id"
                              params={{ id: item.part_id }}
                              className="text-sm font-semibold hover:text-primary transition-colors"
                            >
                              {item.part_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ${item.part_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-mono text-lg font-bold">${item.subtotal.toFixed(2)}</p>
                        </div>

                        {item.allows_installments ? (
                          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <label className="flex items-center gap-2 mb-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={payContado[item.id] || dp === 100}
                                onChange={() => {
                                  const wasContado = payContado[item.id] || dp === 100;
                                  setPayContado((prev) => ({ ...prev, [item.id]: !wasContado }));
                                  if (!wasContado) {
                                    setDownPayments((prev) => ({ ...prev, [item.id]: 100 }));
                                  } else {
                                    setDownPayments((prev) => ({
                                      ...prev,
                                      [item.id]: item.installment_min_percentage ?? 20,
                                    }));
                                  }
                                }}
                                className="accent-primary"
                              />
                              <span className="text-xs font-medium">{t("checkout.payCash")}</span>
                            </label>
                            {payContado[item.id] || dp === 100 ? (
                              <p className="text-sm text-emerald-400 font-medium flex items-center gap-1.5">
                                <CreditCard className="h-4 w-4" />
                                {t("checkout.cashPayment")} — ${item.subtotal.toFixed(2)}
                              </p>
                            ) : (
                              <>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  {t("checkout.downPaymentPct")}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {presets.map((pct) => {
                                    const pctAmt = (item.subtotal * pct) / 100;
                                    const isSelected = dp === pct;
                                    return (
                                      <button
                                        key={pct}
                                        type="button"
                                        onClick={() =>
                                          setDownPayments((prev) => ({ ...prev, [item.id]: pct }))
                                        }
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-primary text-primary-foreground shadow-sm scale-105"
                                            : "bg-background border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                        }`}
                                      >
                                        {pct}%
                                      </button>
                                    );
                                  })}
                                  <input
                                    type="number"
                                    min={item.installment_min_percentage}
                                    max={100}
                                    value={dp}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === "") {
                                        setDownPayments((prev) => ({ ...prev, [item.id]: item.installment_min_percentage ?? 20 }));
                                        return;
                                      }
                                      const num = Number(raw);
                                      if (isNaN(num)) return;
                                      const v = Math.min(100, num);
                                      setDownPayments((prev) => ({ ...prev, [item.id]: v }));
                                      setPayContado((prev) => ({ ...prev, [item.id]: v === 100 }));
                                    }}
                                    onBlur={() => {
                                      const v = Math.min(100, Math.max(item.installment_min_percentage ?? 20, dp));
                                      setDownPayments((prev) => ({ ...prev, [item.id]: v }));
                                      setPayContado((prev) => ({ ...prev, [item.id]: v === 100 }));
                                    }}
                                    className="ml-input w-20 text-center text-sm font-bold"
                                    placeholder="%"
                                  />
                                </div>
                                <p className="text-lg font-bold text-primary mb-1">
                                  {dp}% = ${downAmt.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {t("checkout.remainingInstallments", "", { amount: installmentAmt.toFixed(2) })}
                                </p>
                                {dp < item.installment_min_percentage && (
                                  <p className="mt-1 text-xs text-destructive">
                                    {t("checkout.minimum", "", { pct: item.installment_min_percentage })}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3" />
                            {t("checkout.fullPayment")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-border pt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("checkout.deliveryMethod")}
                    </p>
                    <div className="space-y-2">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                          cfg.deliveryMethod === "PICKUP"
                            ? "border-primary/40 bg-primary/10"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`delivery-${workshopId}`}
                          value="PICKUP"
                          checked={cfg.deliveryMethod === "PICKUP"}
                          onChange={() =>
                            setConfig(workshopId, (prev: any) => ({
                              ...prev,
                              deliveryMethod: "PICKUP",
                            }))
                          }
                          className="accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium">{t("checkout.pickup")}</p>
                          <p className="text-xs text-muted-foreground">{t("checkout.pickupDesc")}</p>
                        </div>
                      </label>

                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                          isCashPayment(workshopId)
                            ? "pointer-events-none opacity-40"
                            : cfg.deliveryMethod === "SHIPPING"
                              ? "border-primary/40 bg-primary/10"
                              : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`delivery-${workshopId}`}
                          value="SHIPPING"
                          checked={cfg.deliveryMethod === "SHIPPING"}
                          onChange={() =>
                            setConfig(workshopId, (prev: any) => ({
                              ...prev,
                              deliveryMethod: "SHIPPING",
                            }))
                          }
                          className="accent-primary mt-0.5"
                          disabled={isCashPayment(workshopId)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t("checkout.shipping")}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("checkout.shippingDesc")}
                          </p>
                          {isCashPayment(workshopId) && (
                            <p className="mt-1.5 text-xs font-medium text-amber-600">
                              {t("checkout.cashPickupOnly")}
                            </p>
                          )}
                          {cfg.deliveryMethod === "SHIPPING" && (
                            <input
                              type="text"
                              value={cfg.deliveryAddress}
                              onChange={(e) =>
                                setConfig(workshopId, (prev: any) => ({
                                  ...prev,
                                  deliveryAddress: e.target.value,
                                }))
                              }
                              placeholder={t("checkout.shippingAddress")}
                              className="ml-input mt-2"
                              required
                            />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("checkout.workshopPaymentMethods")}
                    </p>
                    {paymentMethods.length === 0 ? (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                        <p className="text-xs font-medium text-destructive">
                          {t("checkout.noPaymentMethods")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("checkout.noPaymentMethodsDesc")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map((m) => {
                          const isSelected = cfg.paymentMethodId === m.id;
                          const isCash = m.type === "cash";
                          const typeLabel = t(`checkout.paymentTypes.${m.type}`, m.type);
                          const typeColor =
                            m.type === "bank_transfer"
                              ? "text-blue-400"
                              : m.type === "mobile_payment"
                                ? "text-green-400"
                                : m.type === "cash"
                                  ? "text-amber-400"
                                  : m.type === "zelle" || m.type === "zinli"
                                    ? "text-purple-400"
                                    : "text-muted-foreground";
                          return (
                            <div
                              key={m.id}
                              className={`rounded-xl border transition-all ${
                                isSelected
                                  ? "border-primary/60 bg-primary/10 shadow-sm"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setConfig(workshopId, (prev: any) => ({
                                    ...prev,
                                    paymentMethodId: isSelected ? "" : m.id,
                                  }))
                                }
                                className="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
                              >
                                <div
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                                    isSelected ? "border-primary bg-primary" : "border-border"
                                  }`}
                                >
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold capitalize ${typeColor}`}>
                                      {typeLabel}
                                    </span>
                                    {m.type === "bank_transfer" && m.bank_name && (
                                      <span className="text-xs text-muted-foreground">
                                        {m.bank_name}
                                      </span>
                                    )}
                                  </div>
                                  {!isSelected && m.type === "mobile_payment" && m.phone_number && (
                                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                      {m.phone_number}
                                    </p>
                                  )}
                                  {!isSelected &&
                                    m.type === "bank_transfer" &&
                                    m.account_number && (
                                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                        ****{String(m.account_number).slice(-4)}
                                      </p>
                                    )}
                                  {!isSelected && isCash && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {t("checkout.paymentAtWorkshop")}
                                    </p>
                                  )}
                                  {!isSelected && (m.type === "zelle" || m.type === "zinli") && m.email && (
                                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                      {m.email}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                    {t("checkout.tapToDeselect")}
                                  </span>
                                )}
                              </button>
                              {isSelected && isCash && (
                                <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                                  {t("checkout.cashAtPickup")}
                                </div>
                              )}
                              {isSelected && !isCash && (
                                <div className="space-y-1 border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                                  {m.type === "bank_transfer" && (
                                    <>
                                      {m.bank_name && (
                                        <p>
                                          <span className="text-muted-foreground/70">{t("checkout.bank")}:</span>{" "}
                                          {m.bank_name}
                                        </p>
                                      )}
                                      {m.account_number && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">{t("checkout.account")}:</span>{" "}
                                          {m.account_number}
                                        </p>
                                      )}
                                      {m.account_holder && (
                                        <p>
                                          <span className="text-muted-foreground/70">{t("checkout.holder")}:</span>{" "}
                                          {m.account_holder}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {m.type === "mobile_payment" && (
                                    <>
                                      {m.phone_number && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">
                                            {t("checkout.phone")}:
                                          </span>{" "}
                                          {m.phone_number}
                                        </p>
                                      )}
                                      {m.holder_ci && (
                                        <p>
                                          <span className="text-muted-foreground/70">{t("checkout.ci")}:</span>{" "}
                                          {m.holder_ci}
                                        </p>
                                      )}
                                      {m.bank_name && (
                                        <p>
                                          <span className="text-muted-foreground/70">{t("checkout.bank")}:</span>{" "}
                                          {m.bank_name}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {(m.type === "zelle" || m.type === "zinli") && (
                                    <>
                                      {m.email && (
                                        <p className="font-mono">
                                          <span className="text-muted-foreground/70">{t("checkout.email")}:</span>{" "}
                                          {m.email}
                                        </p>
                                      )}
                                      {m.account_holder && (
                                        <p>
                                          <span className="text-muted-foreground/70">{t("checkout.holder")}:</span>{" "}
                                          {m.account_holder}
                                        </p>
                                      )}
                                      <p className="text-primary/70">{t("checkout.usdNoBs")}</p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {cfg.paymentMethodId && !isCashPayment(workshopId) && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        {t("checkout.referenceNumber")}
                      </label>
                      <input
                        type="text"
                        value={cfg.referenceNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isForeignPayment(workshopId)) {
                            setConfig(workshopId, (prev: any) => ({ ...prev, referenceNumber: val }));
                          } else {
                            setConfig(workshopId, (prev: any) => ({ ...prev, referenceNumber: val.replace(/[^0-9]/g, "") }));
                          }
                        }}
                        placeholder={isForeignPayment(workshopId) ? t("checkout.referenceForeignPlaceholder") : t("checkout.referencePlaceholder")}
                        className="ml-input"
                        maxLength={100}
                        required
                      />
                    </div>
                  )}

                  {(() => {
                    const today = group.items.reduce((sum, item) => {
                      if (item.allows_installments) {
                        const isContadoItem =
                          payContado[item.id] ||
                          (downPayments[item.id] ?? item.installment_min_percentage ?? 20) === 100;
                        if (isContadoItem) return sum + item.subtotal;
                        const pct = downPayments[item.id] ?? item.installment_min_percentage ?? 20;
                        return sum + (item.subtotal * pct) / 100;
                      }
                      return sum + item.subtotal;
                    }, 0);
                    return (
                      <p className="text-xs text-muted-foreground text-right">
                        {t("checkout.totalToPay")}:{" "}
                        <span className="font-semibold text-foreground">${today.toFixed(2)}</span>
                      </p>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-4">
            <div className="ml-card p-6">
              <h2 className="mb-4 text-sm font-semibold">{t("checkout.summary")}</h2>

              <div className="space-y-3">
                {Object.entries(workshopGroups).map(([workshopId, group]) => (
                  <div key={workshopId}>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {group.workshop_name}
                    </p>
                    {group.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm ml-4">
                        <span className="text-muted-foreground">
                          {item.part_name} × {item.quantity}
                        </span>
                        <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
                  <span>${totals.itemsTotal.toFixed(2)}</span>
                </div>
                {totals.hasInstallmentItems && !totals.isContado && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">{t("checkout.initialPayment")}</span>
                      <span className="text-emerald-400">
                        -${totals.downPaymentTotal.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-primary/70 pl-2">
                      {t("checkout.pointsOnTime", "", { amount: totals.financedDownPayment.toFixed(2) })}
                    </p>
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-amber-400 font-medium">{t("checkout.toFinance")}</span>
                      <span className="text-amber-400 font-medium">
                        ${totals.financedTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="ml-2 space-y-1 border-l-2 border-amber-500/30 pl-3">
                      {(() => {
                        const now = new Date();
                        const amt = totals.financedTotal / 3;
                        return [15, 30, 45].map((days, i) => {
                          const d = new Date(now);
                          d.setDate(d.getDate() + days);
                          return (
                            <div
                              key={i}
                              className="flex justify-between text-xs text-muted-foreground"
                            >
                              <span>
                                {t("checkout.installment")} {i + 1} —{" "}
                                {d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                              </span>
                              <span className="font-mono">${amt.toFixed(2)} <span className="text-primary/70">(+{amt.toFixed(2)} pts)</span></span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
                {totals.isContado && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400 font-medium">{t("checkout.cashTotal")}</span>
                    <span className="text-emerald-400 font-medium">
                      ${totals.itemsTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {creditLine && !totals.isContado && totals.financedTotal > 0 && (
                <div className={`mt-3 rounded-lg border p-3 text-xs ${
                  totals.financedTotal > creditLine.parts_available
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                }`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Wallet className="h-3.5 w-3.5" />
                    {t("checkout.creditAvailable")}: ${creditLine.parts_available.toFixed(2)}
                  </div>
                  {totals.financedTotal > creditLine.parts_available ? (
                    <p className="mt-1 flex items-start gap-1">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {t("checkout.creditExceeded", "", { amount: totals.financedTotal.toFixed(2) })}
                    </p>
                  ) : (
                    <p className="mt-1">
                      {t("checkout.creditOk", "", { remaining: (creditLine.parts_available - totals.financedTotal).toFixed(2) })}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="font-semibold">{t("checkout.totalToPay")}</span>
                <span className="font-mono text-xl font-bold">${totals.grandTotal.toFixed(2)}</span>
              </div>
              {!totals.isContado && totals.totalPoints > 0 && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-primary/70 font-medium">{t("checkout.totalPoints")}</span>
                  <span className="text-primary/70 font-bold">+{totals.totalPoints.toFixed(2)} pts</span>
                </div>
              )}

              {totals.hasInstallmentItems && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-primary font-semibold">{t("checkout.payNow")}</span>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-primary">
                      ${(totals.isContado ? totals.itemsTotal : totals.downPaymentTotal).toFixed(2)}
                    </span>
                    {bcvRate && bcvRate > 0 && !allForeignPayments && (
                      <p className="font-mono text-xs text-primary/70">
                        {formatBcv(
                          totals.isContado ? totals.itemsTotal : totals.downPaymentTotal,
                          bcvRate,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || !isFormValid()}
                title={!isFormValid() ? t("checkout.selectPaymentMethod") : undefined}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {checkoutMutation.isPending
                  ? t("checkout.processing")
                  : (() => {
                      const payNowUsd = totals.isContado
                        ? totals.itemsTotal
                        : totals.downPaymentTotal;
                      const bcvDisplay =
                        bcvRate && bcvRate > 0 && !allForeignPayments ? ` (${formatBcv(payNowUsd, bcvRate)})` : "";
                      return `${t("checkout.payNow")} — $${payNowUsd.toFixed(2)}${bcvDisplay}`;
                    })()}
              </button>
              {!totals.isContado && totals.hasInstallmentItems && (
                <p className="text-center text-xs text-muted-foreground">
                  {t("checkout.payToday", "", { amount: totals.downPaymentTotal.toFixed(2), installment: (totals.financedTotal / 3).toFixed(2) })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
