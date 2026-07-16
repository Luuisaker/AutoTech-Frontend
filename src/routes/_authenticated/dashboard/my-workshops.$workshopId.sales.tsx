import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";

import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  DollarSign,
  Calendar,
  Package,
  Plus,
  Pencil,
  Save,
  X,
  ImageIcon,
  Camera,
  Eye,
  EyeOff,
  Trash2,
  Wrench,
  Car,
  User,
  CheckCircle2,
  ClipboardList,
  Clock,
  Truck,
  Search,
  Percent,
  CreditCard,
  Building2,
  Smartphone,
  Mail,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import { ImageCropModal } from "../../../components/ImageCropModal";
import { getBcvRate, formatBcv } from "../../../lib/bcv";
import {
  getWorkshopSales,
  getWorkshop,
  getWorkshopParts,
  createPart,
  updatePart,
  deletePart,
  getPartCategories,
  getPartConditions,
  getPhotoUrl,
  uploadPartPhoto,
  deletePartPhoto,
  getWorkshopServices,
  createService,
  updateService,
  deleteService,
  getWorkshopServiceOrders,
  getWorkshopOrders,
  type WorkshopSaleDTO,
  type PartDTO,
  type ServiceDTO,
  type ServiceOrderDTO,
  type WorkshopOrderDTO,
  getMyCommissions,
  registerAllWorkshopsCommissionsPayment,
  type MyCommissions,
  getPaymentDestinations,
  type PaymentDestination,
  getMyCreditLine,
  type MyCreditLine,
} from "../../../lib/api";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/my-workshops/$workshopId/sales")({
  component: WorkshopManagePage,
});


const STATUS_STYLES: Record<string, string> = {
  PENDING: "ml-badge ml-badge-warning",
  PENDING_VERIFICATION: "ml-badge ml-badge-warning",
  PAID: "ml-badge ml-badge-success",
  FINANCED: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  RECEIVED: "border border-teal-500/30 bg-teal-500/10 text-teal-400",
  CLOSED: "ml-badge ml-badge-success",
  CANCELLED: "ml-badge ml-badge-danger",
  PENDING_CONFIRMATION: "ml-badge ml-badge-warning",
  CONFIRMED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
};



function WorkshopManagePage() {
  const { pathname } = useLocation();
  const { workshopId } = Route.useParams();
  const isChildActive = pathname !== `/dashboard/my-workshops/${workshopId}/sales`;

  if (isChildActive) return <Outlet />;

  return <WorkshopSalesContent workshopId={workshopId} />;
}

function WorkshopSalesContent({ workshopId }: { workshopId: string }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "sales" | "parts" | "services" | "service-orders" | "cars" | "commissions" | "credit"
  >(() => {
    const saved = sessionStorage.getItem(`workshop-tab-${workshopId}`);
    return (saved as any) || "parts";
  });

  const handleTabChange = (newTab: typeof activeTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem(`workshop-tab-${workshopId}`, newTab);
  };
  const [showClosed, setShowClosed] = useState(false);
  const [showAll, setShowAll] = useState(true);

  const [showPartForm, setShowPartForm] = useState(false);
  const [editingPart, setEditingPart] = useState<PartDTO | null>(null);

  const { data: workshop } = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: () => getWorkshop(workshopId),
  });

  const { data: sales, isLoading: isLoadingSales } = useQuery({
    queryKey: ["workshop-sales", workshopId],
    queryFn: () => getWorkshopSales(workshopId),
  });

  const { data: workshopOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["workshop-orders", workshopId],
    queryFn: () => getWorkshopOrders(workshopId),
  });

  const { data: serviceOrders, isLoading: isLoadingServiceOrders } = useQuery({
    queryKey: ["workshop-service-orders", workshopId],
    queryFn: () => getWorkshopServiceOrders(workshopId),
  });

  const CLOSED_STATUSES = ["CLOSED", "CANCELLED"];
  const isPendingOrder = (status: string) => !CLOSED_STATUSES.includes(status);
  const isPendingSale = (status: string) =>
    status === "PENDING" ||
    status === "PENDING_VERIFICATION" ||
    status === "PENDING_CONFIRMATION" ||
    status === "FINANCED" ||
    status === "PAID" ||
    status === "SHIPPED";

  const filteredWorkshopOrders = useMemo(() => {
    if (showAll) return workshopOrders ?? [];
    if (showClosed) return workshopOrders?.filter((o) => !isPendingOrder(o.status)) ?? [];
    return workshopOrders?.filter((o) => isPendingOrder(o.status)) ?? [];
  }, [workshopOrders, showClosed, showAll]);

  const filteredSales = useMemo(() => {
    if (showAll) return sales ?? [];
    return sales?.filter((s) => isPendingSale(s.status)) ?? [];
  }, [sales, showAll]);

  const totalRevenue =
    (filteredSales?.reduce((s, p) => s + p.total_amount, 0) ?? 0) +
    (filteredWorkshopOrders?.reduce((s, o) => s + o.total_amount, 0) ?? 0);
  const totalTransactions = (filteredSales?.length ?? 0) + (filteredWorkshopOrders?.length ?? 0);

  const {
    data: parts,
    isLoading: isLoadingParts,
    refetch: refetchParts,
  } = useQuery({
    queryKey: ["workshop-parts", workshopId],
    queryFn: () => getWorkshopParts(workshopId),
  });

  const { data: categories } = useQuery({
    queryKey: ["part-categories"],
    queryFn: getPartCategories,
    staleTime: Infinity,
  });

  const { data: conditions } = useQuery({
    queryKey: ["part-conditions"],
    queryFn: getPartConditions,
    staleTime: Infinity,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: 0 | 1 }) =>
      updatePart(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-parts", workshopId] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message),
  });

  const deletePartMutation = useMutation({
    mutationFn: (id: string) => deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-parts", workshopId] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast.success(t("workshopSales.parts.partDeleted"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message),
  });

  const [confirmDeletePart, setConfirmDeletePart] = useState<PartDTO | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        to="/dashboard/my-workshops"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("workshopSales.backToWorkshops")}
      </Link>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("workshopSales.title")}{workshop ? ` — ${workshop.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("workshopSales.subtitle")}
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-border overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange("sales")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "sales" ? "ml-tab-active" : ""}`}
        >
          <ShoppingBag className="h-4 w-4" />
          {t("workshopSales.tabs.sales")}
        </button>
        <button
          onClick={() => handleTabChange("parts")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "parts" ? "ml-tab-active" : ""}`}
        >
          <Package className="h-4 w-4" />
          {t("workshopSales.tabs.parts")}
        </button>
        <button
          onClick={() => handleTabChange("services")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "services" ? "ml-tab-active" : ""}`}
        >
          <Wrench className="h-4 w-4" />
          {t("workshopSales.tabs.services")}
        </button>
        <button
          onClick={() => handleTabChange("service-orders")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "service-orders" ? "ml-tab-active" : ""}`}
        >
          <ClipboardList className="h-4 w-4" />
          {t("workshopSales.tabs.serviceOrders")}
        </button>
        <button
          onClick={() => handleTabChange("cars")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "cars" ? "ml-tab-active" : ""}`}
        >
          <Car className="h-4 w-4" />
          {t("workshopSales.tabs.cars")}
        </button>
        <button
          onClick={() => handleTabChange("commissions")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "commissions" ? "ml-tab-active" : ""}`}
        >
          <Percent className="h-4 w-4" />
          {t("workshopSales.tabs.commissions")}
        </button>
        <button
          onClick={() => handleTabChange("credit")}
          className={`ml-tab flex items-center gap-1.5 whitespace-nowrap ${activeTab === "credit" ? "ml-tab-active" : ""}`}
        >
          <Wallet className="h-4 w-4" />
          {t("workshopSales.tabs.credit")}
        </button>
      </div>

      {activeTab === "sales" ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 w-full">
            <div className="ml-stat-card">
              <p className="ml-stat-label">{t("workshopSales.sales.totalSales")}</p>
              <p className="ml-stat-value">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="ml-stat-card">
              <p className="ml-stat-label">{t("workshopSales.sales.transactions")}</p>
              <p className="ml-stat-value">{totalTransactions}</p>
            </div>
          </div>

          <div className="mb-4 flex items-start justify-end gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setShowAll(true);
                setShowClosed(false);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                showAll
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("workshopSales.sales.all")}
            </button>
            <button
              onClick={() => {
                setShowAll(false);
                setShowClosed(false);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                !showAll && !showClosed
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("workshopSales.sales.pending")}
            </button>
            <button
              onClick={() => {
                setShowAll(false);
                setShowClosed(true);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                showClosed
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("workshopSales.sales.closed")}
            </button>
          </div>

          {isLoadingSales || isLoadingOrders ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : totalTransactions > 0 ? (
            <div className="space-y-3">
              {filteredWorkshopOrders?.map((order) => (
                <OrderRow key={order.id} order={order} workshopId={workshopId} />
              ))}
              {filteredSales?.map((sale) => (
                <SaleRow key={sale.id} sale={sale} />
              ))}
            </div>
          ) : (
            <div className="ml-empty-state">
              <ShoppingBag className="ml-empty-state-icon" />
              <p className="ml-empty-state-title">{t("workshopSales.sales.noSales")}</p>
              <p className="ml-empty-state-desc">
                {t("workshopSales.sales.noSalesDesc")}
              </p>
            </div>
          )}
        </>
      ) : activeTab === "parts" ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("workshopSales.parts.count", "", { count: parts?.length ?? 0, s: (parts?.length ?? 0) !== 1 ? "s" : "" })}
            </p>
            <button
              onClick={() => {
                setEditingPart(null);
                setShowPartForm(true);
              }}
              className="ml-btn ml-btn-primary"
            >
              <Plus className="h-4 w-4" />
              {t("workshopSales.parts.addPart")}
            </button>
          </div>

          {showPartForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg">
                <PartForm
                  workshopId={workshopId}
                  categories={categories ?? []}
                  conditions={conditions ?? []}
                  editPart={editingPart}
                  onClose={() => {
                    setShowPartForm(false);
                    setEditingPart(null);
                  }}
                  onSuccess={() => {
                    setShowPartForm(false);
                    setEditingPart(null);
                    refetchParts();
                  }}
                />
              </div>
            </div>
          )}

          {isLoadingParts ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : parts && parts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...parts]
                .sort((a, b) => (b.is_active ?? 0) - (a.is_active ?? 0))
                .map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    onEdit={() => {
                      setEditingPart(part);
                      setShowPartForm(true);
                    }}
                    onToggleActive={() => {
                      toggleActiveMutation.mutate({
                        id: part.id,
                        is_active: part.is_active ? 0 : 1,
                      });
                    }}
                    onDelete={() => setConfirmDeletePart(part)}
                  />
                ))}
            </div>
          ) : (
            <div className="ml-empty-state">
              <Package className="ml-empty-state-icon" />
              <p className="ml-empty-state-title">{t("workshopSales.parts.noParts")}</p>
              <p className="ml-empty-state-desc">
                {t("workshopSales.parts.noPartsDesc")}
              </p>
            </div>
          )}
        </>
      ) : activeTab === "services" ? (
        <WorkshopServicesManageSection workshopId={workshopId} />
      ) : activeTab === "service-orders" ? (
        <ServiceOrderHistorySection workshopId={workshopId} />
      ) : activeTab === "commissions" ? (
        <WorkshopCommissionsSection />
      ) : activeTab === "credit" ? (
        <WorkshopCreditSection />
      ) : (
        <CarsInServiceSection workshopId={workshopId} />
      )}

      <ConfirmDialog
        open={!!confirmDeletePart}
        onOpenChange={(open) => {
          if (!open) setConfirmDeletePart(null);
        }}
        title={t("workshopSales.parts.deletePartTitle")}
        description={t("workshopSales.parts.deletePartDesc")}
        confirmText={t("workshopSales.parts.delete")}
        onConfirm={() => {
          if (confirmDeletePart) {
            deletePartMutation.mutate(confirmDeletePart.id);
            setConfirmDeletePart(null);
          }
        }}
      />
    </div>
  );
}

function SaleRow({ sale }: { sale: WorkshopSaleDTO }) {
  const { t } = useLocale();
  return (
    <div className="ml-card flex items-center justify-between p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <span className={STATUS_STYLES[sale.status] || STATUS_STYLES.PENDING}>
            {t(`workshopSales.statusLabels.${sale.status}`, sale.status)}
          </span>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {sale.quantity} {sale.quantity !== 1 ? t("workshopSales.sales.unitsPlural") : t("workshopSales.sales.units")} · $
            {sale.total_amount.toFixed(2)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(sale.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {sale.installment_count > 0 && (
              <span>
                {sale.installment_count} {sale.installment_count > 1 ? t("workshopSales.sales.installmentsPlural") : t("workshopSales.sales.installments")}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="font-mono text-base font-semibold">${sale.total_amount.toFixed(2)}</p>
    </div>
  );
}

function OrderRow({ order, workshopId }: { order: WorkshopOrderDTO; workshopId: string }) {
  const { t } = useLocale();
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Link
      to="/dashboard/my-workshops/$workshopId/sales/purchases/$purchaseId"
      params={{ workshopId, purchaseId: order.id }}
      className="ml-card flex items-center justify-between p-5"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <span className={STATUS_STYLES[order.status] || STATUS_STYLES.PENDING}>
            {order.status === "PENDING_VERIFICATION" && order.has_pending_verification
              ? t("workshopSales.sales.pendingVerification")
              : t(`workshopSales.statusLabels.${order.status}`, order.status)}
          </span>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {itemCount} {itemCount !== 1 ? t("workshopSales.sales.productsPlural") : t("workshopSales.sales.products")} · ${order.total_amount.toFixed(2)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {order.delivery_method === "PICKUP" ? t("workshopSales.sales.pickup") : t("workshopSales.sales.shipping")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-base font-semibold">${order.total_amount.toFixed(2)}</p>
        <svg
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function PartCard({
  part,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  part: PartDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="group ml-card flex flex-col overflow-hidden">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-border bg-background">
        {part.photo_url ? (
          <img
            src={getPhotoUrl(part.photo_url)}
            alt={part.name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
        )}
        <span className="absolute left-3 top-3 ml-badge ml-badge-success">
          {t(`workshopSales.conditions.${part.condition}`, part.condition)}
        </span>
        {part.category && (
          <span className="absolute right-3 top-3 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {t(`workshopSales.categories.${part.category}`, part.category)}
          </span>
        )}
        {!part.is_active && (
          <span className="absolute bottom-3 left-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
            {t("workshopSales.parts.notPublished")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug">{part.name}</h3>
        <p className="mt-1 font-mono text-lg font-bold">${part.price.toFixed(2)}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{t("workshopSales.parts.stock")}: {part.stock}</span>
          {part.allows_installments ? (
            <span className="ml-badge ml-badge-success">{t("workshopSales.parts.installments")}</span>
          ) : null}
        </div>
        <div className="mt-auto gap-2 grid grid-cols-3">
          <button onClick={onEdit} className="ml-btn ml-btn-outline py-2 text-xs">
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={onToggleActive}
            className={`ml-btn py-2 text-xs ${
              part.is_active
                ? "border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                : "border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
            }`}
          >
            {part.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button
            onClick={onDelete}
            className="ml-btn py-2 text-xs border border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

const inputBase = "ml-input";

function PartForm({
  workshopId,
  categories,
  conditions,
  editPart,
  onClose,
  onSuccess,
}: {
  workshopId: string;
  categories: string[];
  conditions: string[];
  editPart: PartDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const isEditing = !!editPart;
  const [allowInstallments, setAllowInstallments] = useState(!!editPart?.allows_installments);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(editPart?.photo_url ?? null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    },
    [pendingPreview, cropImageSrc],
  );

  const createMutation = useMutation({
    mutationFn: createPart,
    onSuccess: async (createdPart) => {
      queryClient.invalidateQueries({ queryKey: ["workshop-parts", workshopId] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      if (pendingPhoto && createdPart?.id) {
        try {
          const updated = await uploadPartPhoto(createdPart.id, pendingPhoto);
          setCurrentPhotoUrl(updated.photo_url);
        } catch {
          /* photo upload failed silently, part was already created */
        }
      }
      setPendingPhoto(null);
      setPendingPreview(null);
      toast.success(t("workshopSales.parts.partCreated"));
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updatePart>[1] }) =>
      updatePart(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-parts", workshopId] });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast.success(t("workshopSales.parts.partUpdated"));
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const name = form.get("name") as string;
    const price = Number(form.get("price"));
    const stock = Number(form.get("stock"));
    const condition = form.get("condition") as "NEW" | "USED";
    const category = (form.get("category") as string) || undefined;
    const description = (form.get("description") as string) || undefined;
    const allowsInstallments = form.get("allows_installments") === "on" ? 1 : 0;
    const installmentMinPercentage = allowsInstallments
      ? Number(form.get("installment_min_percentage"))
      : 0;

    if (isEditing && editPart) {
      updateMutation.mutate({
        id: editPart.id,
        input: {
          name,
          price,
          stock,
          condition,
          category,
          description,
          allows_installments: allowsInstallments as 0 | 1,
          installment_min_percentage: installmentMinPercentage,
        },
      });
    } else {
      createMutation.mutate({
        workshop_id: workshopId,
        name,
        price,
        stock,
        condition,
        category,
        description,
        allows_installments: allowsInstallments as 0 | 1,
        installment_min_percentage: installmentMinPercentage,
      });
    }
  }

  async function handlePartPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
  }

  async function handleCropConfirm(croppedFile: File) {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    if (isEditing && editPart) {
      setPhotoUploading(true);
      try {
        const part = await uploadPartPhoto(editPart.id, croppedFile);
        setCurrentPhotoUrl(part.photo_url);
        toast.success(t("workshopSales.parts.photoUpdated"));
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? err.message ?? t("workshopSales.parts.photoUploadError"));
      } finally {
        setPhotoUploading(false);
      }
    } else {
      const preview = URL.createObjectURL(croppedFile);
      setPendingPreview(preview);
      setPendingPhoto(croppedFile);
    }
  }

  async function handlePartPhotoDelete() {
    if (!editPart) return;
    setPhotoUploading(true);
    try {
      const part = await deletePartPhoto(editPart.id);
      setCurrentPhotoUrl(part.photo_url);
      toast.success(t("workshopSales.parts.photoDeleted"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? t("workshopSales.parts.photoDeleteError"));
    } finally {
      setPhotoUploading(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="mb-4 ml-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold sm:text-base">
          {isEditing ? t("workshopSales.parts.editPart") : t("workshopSales.parts.newPart")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("workshopSales.parts.name")}</label>
          <input
            name="name"
            className={inputBase}
            defaultValue={editPart?.name}
            required
            placeholder={t("workshopSales.parts.namePlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("workshopSales.parts.price")}
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            min={0.01}
            className={inputBase}
            defaultValue={editPart?.price}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("workshopSales.parts.stockLabel")}</label>
          <input
            name="stock"
            type="number"
            min={0}
            className={inputBase}
            defaultValue={editPart?.stock}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("workshopSales.parts.condition")}
          </label>
          <select
            name="condition"
            className={inputBase}
            defaultValue={editPart?.condition ?? "NEW"}
            required
          >
            {(conditions.length > 0 ? conditions : ["NEW", "USED"]).map((c) => (
              <option key={c} value={c}>
                {t(`workshopSales.conditions.${c}`, c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("workshopSales.parts.category")}
          </label>
          <select name="category" className={inputBase} defaultValue={editPart?.category ?? ""}>
            <option value="">{t("workshopSales.parts.noCategory")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(`workshopSales.categories.${c}`, c)}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("workshopSales.parts.description")}
          </label>
          <textarea
            name="description"
            className={inputBase}
            rows={3}
            defaultValue={editPart?.description ?? ""}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("workshopSales.parts.photo")}</label>
          <div className="flex items-center gap-3">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background">
              {pendingPreview ? (
                <img src={pendingPreview} alt="" className="h-full w-full object-contain" />
              ) : currentPhotoUrl ? (
                <img
                  src={getPhotoUrl(currentPhotoUrl)}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
              )}
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="ml-btn ml-btn-outline text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                {currentPhotoUrl || pendingPreview ? t("workshopSales.parts.changePhoto") : t("workshopSales.parts.uploadPhoto")}
              </button>
              {(currentPhotoUrl || pendingPreview) && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing && editPart) handlePartPhotoDelete();
                    else {
                      setPendingPhoto(null);
                      setPendingPreview(null);
                    }
                  }}
                  disabled={photoUploading}
                  className="ml-btn border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("workshopSales.parts.delete")}
                </button>
              )}
            </div>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePartPhotoSelect}
            className="hidden"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              name="allows_installments"
              type="checkbox"
              checked={allowInstallments}
              onChange={(e) => setAllowInstallments(e.target.checked)}
              className="rounded border-border"
            />
            {t("workshopSales.parts.allowInstallments")}
          </label>
        </div>
        {allowInstallments && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("workshopSales.parts.minInitialPct")}
            </label>
            <input
              name="installment_min_percentage"
              type="number"
              min={0}
              max={100}
              className={inputBase}
              defaultValue={editPart?.installment_min_percentage ?? 0}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="ml-btn ml-btn-outline">
          {t("workshopSales.parts.cancel")}
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="ml-btn ml-btn-primary"
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEditing ? t("workshopSales.parts.saveChanges") : t("workshopSales.parts.publishPart")}
        </button>
      </div>
    </form>

    {cropImageSrc && (
      <ImageCropModal
        imageSrc={cropImageSrc}
        onCancel={() => {
          if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
          setCropImageSrc(null);
        }}
        onConfirm={handleCropConfirm}
      />
    )}

    </>
  );
}

function WorkshopServicesManageSection({ workshopId }: { workshopId: string }) {
  return <WorkshopServiceCatalog workshopId={workshopId} />;
}

function WorkshopServiceCatalog({ workshopId }: { workshopId: string }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDTO | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [vehicleType, setVehicleType] = useState("ALL");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [revisionCostMin, setRevisionCostMin] = useState("");
  const [revisionCostMax, setRevisionCostMax] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteService, setConfirmDeleteService] = useState<ServiceDTO | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["workshop-services", workshopId],
    queryFn: () => getWorkshopServices(workshopId),
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createService>[0]) => createService(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-services", workshopId] });
      resetForm();
      toast.success(t("workshopSales.services.serviceCreated"));
    },
    onError: (err: any) => setFormError(err?.response?.data?.message ?? err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateService>[1] }) =>
      updateService(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-services", workshopId] });
      resetForm();
      toast.success(t("workshopSales.services.serviceUpdated"));
    },
    onError: (err: any) => setFormError(err?.response?.data?.message ?? err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-services", workshopId] });
      toast.success(t("workshopSales.services.serviceDeleted"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message),
  });

  function resetForm() {
    setShowForm(false);
    setEditingService(null);
    setServiceName("");
    setServiceType("");
    setVehicleType("ALL");
    setPriceMin("");
    setPriceMax("");
    setRevisionCostMin("");
    setRevisionCostMax("");
    setFormError(null);
  }

  function openEdit(s: ServiceDTO) {
    setEditingService(s);
    setShowForm(true);
    setServiceName(s.service_name);
    setServiceType(s.service_type ?? "");
    setVehicleType(s.vehicle_type ?? "ALL");
    setPriceMin(String(s.standard_price_min));
    setPriceMax(String(s.standard_price_max));
    setRevisionCostMin(s.revision_cost_min != null ? String(s.revision_cost_min) : "");
    setRevisionCostMax(s.revision_cost_max != null ? String(s.revision_cost_max) : "");
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!serviceName.trim() || !priceMin || !priceMax) {
      setFormError(t("workshopSales.services.allFieldsRequired"));
      return;
    }
    const min = Number(priceMin);
    const max = Number(priceMax);
    if (min >= max) {
      setFormError(t("workshopSales.services.minLessThanMax"));
      return;
    }
    const st = serviceType || null;
    const vt = vehicleType || null;
    const rcMin = revisionCostMin.trim() !== "" ? Number(revisionCostMin) : 0;
    const rcMax = revisionCostMax.trim() !== "" ? Number(revisionCostMax) : 0;
    if (editingService) {
      updateMutation.mutate({
        id: editingService.id,
        input: {
          service_name: serviceName,
          service_type: st,
          standard_price_min: min,
          standard_price_max: max,
          revision_cost_min: rcMin,
          revision_cost_max: rcMax,
          vehicle_type: vt,
        },
      });
    } else {
      createMutation.mutate({
        workshop_id: workshopId,
        service_name: serviceName,
        service_type: st,
        standard_price_min: min,
        standard_price_max: max,
        revision_cost_min: rcMin,
        revision_cost_max: rcMax,
        vehicle_type: vt,
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("workshopSales.services.count", "", { count: services?.length ?? 0, s: (services?.length ?? 0) !== 1 ? "s" : "" })}
        </p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="ml-btn ml-btn-primary"
        >
          <Plus className="h-4 w-4" />
          {t("workshopSales.services.addService")}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  {editingService ? t("workshopSales.services.editService") : t("workshopSales.services.newService")}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("workshopSales.services.serviceName")}
                </label>
                <input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="ml-input"
                  placeholder={t("workshopSales.services.serviceNamePlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("workshopSales.services.serviceType")}
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="ml-input"
                >
                  <option value="">{t("workshopSales.services.noType")}</option>
                  <option value="Mantenimiento">{t("workshopSales.serviceTypes.MAINTENANCE")}</option>
                  <option value="Reparación">{t("workshopSales.serviceTypes.REPAIR")}</option>
                  <option value="Limpieza">{t("workshopSales.serviceTypes.CLEANING")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("workshopSales.services.vehicleType")}
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="ml-input"
                >
                  <option value="ALL">{t("workshopSales.services.allVehicles")}</option>
                  <option value="CAR">{t("workshopSales.services.car")}</option>
                  <option value="MOTORCYCLE">{t("workshopSales.services.motorcycle")}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("workshopSales.services.minPrice")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="ml-input"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("workshopSales.services.maxPrice")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="ml-input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("workshopSales.services.revisionMin")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={revisionCostMin}
                    onChange={(e) => setRevisionCostMin(e.target.value)}
                    className="ml-input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("workshopSales.services.revisionMax")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={revisionCostMax}
                    onChange={(e) => setRevisionCostMax(e.target.value)}
                    className="ml-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {t("workshopSales.services.revisionDesc")}
              </p>
              {formError && (
                <div className="rounded-lg bg-destructive/10 px-4 py-2">
                  <p className="text-xs text-destructive">{formError}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="ml-btn ml-btn-outline">
                  {t("workshopSales.services.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="ml-btn ml-btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t("workshopSales.services.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="ml-card flex items-center justify-between p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {s.service_name}
                    {s.service_type && (
                      <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t(`workshopSales.serviceTypes.${s.service_type}`, s.service_type)}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${s.standard_price_min.toFixed(2)} — ${s.standard_price_max.toFixed(2)}
                  </p>
                  {s.revision_cost_min != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("workshopSales.services.revision")}: ${s.revision_cost_min.toFixed(2)}
                      {s.revision_cost_max != null &&
                        s.revision_cost_max !== s.revision_cost_min
                        ? ` — $${s.revision_cost_max.toFixed(2)}`
                        : ""}
                    </p>
                  )}
                  {s.vehicle_type && s.vehicle_type !== "ALL" && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Car className="h-3 w-3" />
                      {s.vehicle_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(s)} className="ml-btn ml-btn-outline py-2 text-xs">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDeleteService(s)}
                  className="ml-btn py-2 text-xs border border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ml-empty-state">
          <Wrench className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("workshopSales.services.noServices")}</p>
          <p className="ml-empty-state-desc">
            {t("workshopSales.services.noServicesDesc")}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteService}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteService(null);
        }}
        title={t("workshopSales.services.deleteServiceTitle")}
        description={t("workshopSales.services.deleteServiceDesc")}
        confirmText={t("workshopSales.parts.delete")}
        onConfirm={() => {
          if (confirmDeleteService) {
            deleteMutation.mutate(confirmDeleteService.id);
            setConfirmDeleteService(null);
          }
        }}
      />
    </div>
  );
}


const SERVICE_ORDER_STYLES: Record<string, string> = {
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400 rounded-full px-2.5 py-0.5 text-xs font-medium [text-shadow:0_0_10px_rgba(245,158,11,0.2)]",
  REVISION_SENT: "border border-purple-500/30 bg-purple-500/10 text-purple-400 rounded-full px-2.5 py-0.5 text-xs font-medium [text-shadow:0_0_10px_rgba(168,85,247,0.2)]",
  AT_WORKSHOP: "border border-slate-500/30 bg-slate-500/10 text-slate-300 rounded-full px-2.5 py-0.5 text-xs font-medium",
  QUOTED: "border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  ACCEPTED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  REJECTED: "border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  IN_PROGRESS: "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 rounded-full px-2.5 py-0.5 text-xs font-medium [text-shadow:0_0_10px_rgba(6,182,212,0.2)]",
  COMPLETED: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  SHIPPED: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  DELIVERED: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  CLOSED: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  CANCELLED: "border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-full px-2.5 py-0.5 text-xs font-medium",
  DROPPED_OFF: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 rounded-full px-2.5 py-0.5 text-xs font-medium"
};

const OPEN_STATUSES = [
  "PENDING",
  "AT_WORKSHOP",
  "QUOTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "SHIPPED",
  "DROPPED_OFF",
];
const CLOSED_STATUSES = ["DELIVERED", "CLOSED", "CANCELLED", "REJECTED"];

function ServiceOrderHistorySection({ workshopId }: { workshopId: string }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: orders, isLoading } = useQuery({
    queryKey: ["workshop-service-orders", workshopId],
    queryFn: () => getWorkshopServiceOrders(workshopId),
  });

  const statusGroups: Record<string, string[]> = {
    completado: ["DELIVERED", "CLOSED"],
    cancelado: ["CANCELLED", "REJECTED"],
    en_servicio: ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "SHIPPED", "DROPPED_OFF"],
    pendiente: ["PENDING", "AT_WORKSHOP", "QUOTED"],
  };

  const filteredOrders = orders?.filter((o) => {
    if (!statusFilter) return true;
    return statusGroups[statusFilter]?.includes(o.status) ?? false;
  }) ?? [];

  const openOrders = filteredOrders.filter((o) => OPEN_STATUSES.includes(o.status));
  const closedOrders = filteredOrders.filter((o) => CLOSED_STATUSES.includes(o.status));

  // Calcular estadísticas
  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + (order.final_price ?? order.base_price),
    0,
  );
  const activeServices = openOrders.length;
  const completedServices = closedOrders.filter((o) => ["DELIVERED", "CLOSED"].includes(o.status)).length;

  if (isLoading || !orders) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas de servicios */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="ml-stat-card">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <p className="ml-stat-label">{t("workshopSales.serviceOrders.totalServices")}</p>
          </div>
          <p className="ml-stat-value">{orders.length}</p>
        </div>
        <div className="ml-stat-card">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="ml-stat-label">{t("workshopSales.serviceOrders.active")}</p>
          </div>
          <p className="ml-stat-value">{activeServices}</p>
        </div>
        <div className="ml-stat-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <p className="ml-stat-label">{t("workshopSales.serviceOrders.completed")}</p>
          </div>
          <p className="ml-stat-value">{completedServices}</p>
        </div>
        <div className="ml-stat-card">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="ml-stat-label">{t("workshopSales.serviceOrders.totalRevenue")}</p>
          </div>
          <p className="ml-stat-value">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("workshopSales.serviceOrders.searchPlaceholder")}
            className="ml-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-input px-3 py-2 pr-8 w-full sm:w-auto"
        >
          <option value="">{t("workshopSales.serviceOrders.allStatuses")}</option>
          <option value="pendiente">{t("workshopSales.serviceOrders.pending")}</option>
          <option value="en_servicio">{t("workshopSales.serviceOrders.inService")}</option>
          <option value="completado">{t("workshopSales.serviceOrders.completedFilter")}</option>
          <option value="cancelado">{t("workshopSales.serviceOrders.cancelled")}</option>
        </select>
      </div>

      {/* Órdenes activas */}
      {openOrders.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              <Clock className="mr-2 inline h-5 w-5 text-amber-500" />
              {t("workshopSales.serviceOrders.activeServices")}
            </h2>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
              {openOrders.length} {openOrders.length === 1 ? t("workshopSales.serviceOrders.service") : t("workshopSales.serviceOrders.servicesPlural")}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {openOrders.map((o) => (
              <ServiceOrderCard
                key={o.id}
                order={o}
                queryClient={queryClient}
                workshopId={workshopId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Órdenes finalizadas */}
      {closedOrders.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              <CheckCircle2 className="mr-2 inline h-5 w-5 text-emerald-500" />
              {t("workshopSales.serviceOrders.finishedServices")}
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
              {closedOrders.length} {closedOrders.length === 1 ? t("workshopSales.serviceOrders.service") : t("workshopSales.serviceOrders.servicesPlural")}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {closedOrders.map((o) => (
              <ServiceOrderCard
                key={o.id}
                order={o}
                queryClient={queryClient}
                workshopId={workshopId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ServiceOrderCard({
  order,
  queryClient,
  workshopId,
}: {
  order: ServiceOrderDTO;
  queryClient: any;
  workshopId: string;
}) {
  const { t } = useLocale();
  return (
    <Link
      to="/dashboard/my-workshops/$workshopId/sales/service-orders/$orderId"
      params={{ workshopId, orderId: order.id }}
      className="ml-card flex items-center justify-between p-4 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background">
          <Wrench className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <span className={SERVICE_ORDER_STYLES[order.status] || SERVICE_ORDER_STYLES.PENDING}>
            {t(`workshopSales.statusLabels.${order.status}`, order.status)}
          </span>
          <p className="mt-1.5 text-sm font-medium">{order.service_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.vehicle_brand} {order.vehicle_model} · {order.vehicle_license_plate}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {order.user_first_name} {order.user_last_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {order.final_price != null && (
              <span className="font-mono font-semibold">${(
                order.final_price +
                (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
              ).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {order.final_price != null && (
          <p className="hidden sm:block font-mono text-base font-semibold">${(
            order.final_price +
            (order.extra_charge_status === "APPROVED" ? order.extra_charge : 0)
          ).toFixed(2)}</p>
        )}
        <svg
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function CarsInServiceSection({ workshopId }: { workshopId: string }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["workshop-service-orders", workshopId],
    queryFn: () => getWorkshopServiceOrders(workshopId),
  });

  const activeOrders = (orders ?? []).filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED" && o.status !== "REJECTED" && o.status !== "CLOSED",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="ml-empty-state">
        <Car className="ml-empty-state-icon" />
        <p className="ml-empty-state-title">{t("workshopSales.cars.noCars")}</p>
        <p className="ml-empty-state-desc">{t("workshopSales.cars.noCarsDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeOrders.map((o) => (
        <div key={o.id} className="ml-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background">
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{o.vehicle_license_plate || t("workshopSales.cars.noPlate")}</p>
                <p className="text-xs text-muted-foreground">
                  {o.vehicle_brand && o.vehicle_model
                    ? `${o.vehicle_brand} ${o.vehicle_model}`
                    : t("workshopSales.cars.vehicle")}
                </p>
              </div>
            </div>
            <span className={SERVICE_ORDER_STYLES[o.status] || SERVICE_ORDER_STYLES.PENDING}>
              {t(`workshopSales.statusLabels.${o.status}`, o.status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>{t("workshopSales.cars.service")}: {o.service_name || "—"}</span>
            <span>${(
              (o.final_price ?? o.base_price ?? 0) +
              (o.extra_charge_status === "APPROVED" ? o.extra_charge : 0)
            ).toFixed(2)}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(o.created_at).toLocaleDateString(undefined)}
            </span>
          </div>
          <Link
            to="/dashboard/my-workshops/$workshopId/sales/service-orders/$orderId"
            params={{ workshopId, orderId: o.id }}
            className="ml-btn ml-btn-outline text-xs"
          >
            {t("workshopSales.cars.viewDetail")}
          </Link>
        </div>
      ))}
    </div>
  );
}

function WorkshopCommissionsSection() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<MyCommissions>({
    queryKey: ["my-commissions"],
    queryFn: getMyCommissions,
  });

  const [payingAll, setPayingAll] = useState(false);

  const commissions = data?.commissions ?? [];
  const totalPending = data?.total_pending ?? 0;
  const totalPaid = data?.total_paid ?? 0;

  const pendingCommissions = commissions.filter((c) => c.status === "PENDING");

  const groupedByMonth = commissions.reduce(
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
    {} as Record<
      string,
      {
        period_month: number;
        period_year: number;
        count: number;
        total: number;
        pending: number;
        pendingCount: number;
        paid: number;
        verification: number;
      }
    >,
  );

  const monthName = (m: number, y: number) =>
    new Date(y, m - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="ml-stat-card">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="ml-stat-label">{t("workshopSales.commissions.pendingCommissions")}</p>
          </div>
          <p className="ml-stat-value text-amber-400">${totalPending.toFixed(2)}</p>
        </div>
        <div className="ml-stat-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="ml-stat-label">{t("workshopSales.commissions.paidCommissions")}</p>
          </div>
          <p className="ml-stat-value text-emerald-400">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {pendingCommissions.length > 0 && (
        <button onClick={() => setPayingAll(true)} className="ml-btn ml-btn-primary">
          <DollarSign className="h-4 w-4" />
          {t("workshopSales.commissions.payAll", "", { count: pendingCommissions.length, amount: pendingCommissions.reduce((s, c) => s + c.commission_amount, 0).toFixed(2) })}
        </button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : commissions.length === 0 ? (
        <div className="ml-card p-8 text-center">
          <Percent className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">{t("workshopSales.commissions.noCommissions")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("workshopSales.commissions.noCommissionsDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, group]) => (
              <div key={key} className="ml-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold capitalize">{monthName(group.period_month, group.period_year)}</p>
                    <p className="text-xs text-muted-foreground">{t("workshopSales.commissions.transactions", "", { count: group.count })}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("workshopSales.commissions.pending")}</p>
                      <p className="text-sm font-semibold text-amber-400 sm:text-base">${group.pending.toFixed(2)}</p>
                      {group.verification > 0 && (
                        <p className="text-[10px] text-blue-400">+${group.verification.toFixed(2)} {t("workshopSales.commissions.inVerification")}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("workshopSales.commissions.paid")}</p>
                      <p className="text-sm font-semibold text-emerald-400 sm:text-base">${group.paid.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("workshopSales.commissions.total")}</p>
                      <p className="text-sm font-semibold sm:text-base">${group.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                {group.pendingCount > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <button
                      onClick={() => setPayingAll(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t("workshopSales.commissions.registerPayment", "", { count: group.pendingCount, amount: group.pending.toFixed(2) })}
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {payingAll && (
        <WorkshopCommissionPaymentModal
          totalAmount={totalPending}
          onClose={() => setPayingAll(false)}
          onPaid={() => {
            setPayingAll(false);
            queryClient.invalidateQueries({ queryKey: ["my-commissions"] });
          }}
        />
      )}
    </div>
  );
}

function WorkshopCreditSection() {
  const { t } = useLocale();
  const { data: creditLine, isLoading } = useQuery<MyCreditLine>({
    queryKey: ["credit-line"],
    queryFn: getMyCreditLine,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!creditLine) {
    return (
      <div className="ml-empty-state">
        <Wallet className="ml-empty-state-icon" />
        <p className="ml-empty-state-title">{t("workshopSales.credit.unavailable")}</p>
        <p className="ml-empty-state-desc">{t("workshopSales.credit.unavailableDesc")}</p>
      </div>
    );
  }

  const levelLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: t("workshopSales.credit.level1"),
      2: t("workshopSales.credit.level2"),
      3: t("workshopSales.credit.level3"),
      4: t("workshopSales.credit.level4"),
    };
    return labels[level] ?? `Level ${level}`;
  };

  return (
    <div className="space-y-6">
      {/* Level + points summary */}
      <div className="ml-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("workshopSales.credit.title")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-background/50 p-4">
            <p className="text-xs text-muted-foreground">{t("workshopSales.credit.currentLevel")}</p>
            <p className="text-2xl font-bold text-primary">{levelLabel(creditLine.level)}</p>
          </div>
          <div className="rounded-lg bg-background/50 p-4">
            <p className="text-xs text-muted-foreground">{t("workshopSales.credit.consolidatedPoints")}</p>
            <p className="text-2xl font-bold text-primary">{creditLine.credit_points.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-background/50 p-4">
            <p className="text-xs text-muted-foreground">{t("workshopSales.credit.pendingPoints")}</p>
            <p className="text-2xl font-bold text-amber-400">{creditLine.pending_points.toFixed(2)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("workshopSales.credit.pendingPointsDesc")}</p>
          </div>
        </div>
        {creditLine.points_to_next_level !== null && (
          <div className="mt-4 rounded-lg bg-background/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{t("workshopSales.credit.toNextLevel")}</p>
              <p className="text-sm font-bold text-emerald-500">
                {creditLine.points_to_next_level.toFixed(2)} {t("workshopSales.credit.ptsRemaining")}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (creditLine.credit_points / (creditLine.credit_points + creditLine.points_to_next_level)) * 100)}%`,
                }}
              />
            </div>
            {creditLine.pending_points > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("workshopSales.credit.ifPayOnTime", "", { points: creditLine.pending_points.toFixed(2) })}
                {creditLine.pending_points >= creditLine.points_to_next_level
                  ? ` — ${t("workshopSales.credit.enoughToLevelUp")}!`
                  : ` — ${t("workshopSales.credit.ptsShort", "", { remaining: (creditLine.points_to_next_level - creditLine.pending_points).toFixed(2) })}`}
              </p>
            )}
          </div>
        )}
        {creditLine.points_to_next_level === null && (
          <p className="mt-3 text-sm font-medium text-emerald-500">{t("workshopSales.credit.maxLevel")}</p>
        )}
      </div>

      {/* Parts credit line */}
      <div className="ml-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">{t("workshopSales.credit.partsLine")}</h3>
        </div>
        <div className="space-y-3">
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
            <p className={`text-xs ${creditLine.parts_available < 0 ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
              {t("workshopSales.credit.currentDebt")}: ${creditLine.parts_debt.toFixed(2)}
              {creditLine.parts_available < 0 && ` — ${t("workshopSales.credit.exceeded")}`}
            </p>
          )}
        </div>
      </div>

      {/* Service credit line */}
      <div className="ml-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">{t("workshopSales.credit.serviceLine")}</h3>
        </div>
        <div className="space-y-3">
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
            <p className={`text-xs ${creditLine.service_available < 0 ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
              {t("workshopSales.credit.currentDebt")}: ${creditLine.service_debt.toFixed(2)}
              {creditLine.service_available < 0 && ` — ${t("workshopSales.credit.exceeded")}`}
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("workshopSales.credit.note")}
      </p>
    </div>
  );
}

function WorkshopCommissionPaymentModal({
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
