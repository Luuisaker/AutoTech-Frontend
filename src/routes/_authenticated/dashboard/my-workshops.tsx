import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import {
  Store,
  Plus,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MapPin,
  Pencil,
  Trash2,
  Save,
  X,
  ArrowRight,
  Camera,
  Trash,
  ImageIcon,
  Smartphone,
  DollarSign,
  Banknote,
  Building2,
  Search,
  Ban,
  AtSign,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import {
  getMyWorkshops,
  createWorkshop,
  updateWorkshop,
  toggleWorkshopSuspension,
  deleteWorkshopPhoto,
  getPhotoUrl,
  getWorkshopBanks,
  getWorkshopPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  type Workshop,
  type WorkshopPaymentMethodDTO,
  type CreatePaymentMethodInput,
  type UpdatePaymentMethodInput,
} from "../../../lib/api";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/my-workshops")({
  component: MyWorkshopsPage,
});

const CI_PREFIXES = ["V", "E", "P", "R", "J", "G"] as const;
const RIF_PREFIXES = ["V", "E", "P", "R", "J", "G"] as const;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("58") && digits.length >= 12) return "+" + digits;
  if (digits.startsWith("0") && digits.length >= 11) return "+58" + digits.slice(1);
  if (
    digits.length === 10 &&
    (digits.startsWith("412") ||
      digits.startsWith("414") ||
      digits.startsWith("416") ||
      digits.startsWith("424") ||
      digits.startsWith("426"))
  )
    return "+58" + digits;
  return raw;
}

function MyWorkshopsPage() {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const { roles } = useAuth();
  const navigate = useNavigate();

  const isChildActive = pathname !== "/dashboard/my-workshops";

  const isAuthorized = roles.includes("WORKSHOP_OWNER");

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t("myWorkshops.accessDenied")}</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {t("myWorkshops.accessDeniedDesc")}
        </p>
        <Link
          to="/dashboard"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("myWorkshops.backHome")}
        </Link>
      </div>
    );
  }

  if (isChildActive) return <Outlet />;

  return <AuthorizedWorkshopsView />;
}

const inputBase =
  "block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

function AuthorizedWorkshopsView() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: () => getMyWorkshops(),
  });

  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRifPrefix, setFormRifPrefix] = useState<string>("J");
  const [formRifDigits, setFormRifDigits] = useState("");
  const [formRifCheck, setFormRifCheck] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manageWorkshopId, setManageWorkshopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmSuspendWorkshop, setConfirmSuspendWorkshop] = useState<Workshop | null>(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<string | null>(null);

  const list = useMemo(() => {
    const items = data ?? [];
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? items.filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            w.address.toLowerCase().includes(q) ||
            w.rif.toLowerCase().includes(q),
        )
      : items;
    return [...filtered].sort((a, b) => a.is_suspended - b.is_suspended);
  }, [data, searchQuery]);

  const createMutation = useMutation({
    mutationFn: createWorkshop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workshops"] });
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateWorkshop>[1] }) =>
      updateWorkshop(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workshops"] });
      closeForm();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const toggleSuspensionMutation = useMutation({
    mutationFn: toggleWorkshopSuspension,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workshops"] });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: deleteWorkshopPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workshops"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message ?? "Error al eliminar la foto"),
  });

  function openCreate() {
    setEditingId(null);
    setFormName("");
    setFormRifPrefix("J");
    setFormRifDigits("");
    setFormRifCheck("");
    setFormAddress("");
    setFormPhoto(null);
    setFormPhotoPreview(null);
    setFormError(null);
    setShowWorkshopModal(true);
  }

  function openEdit(w: Workshop) {
    setEditingId(w.id);
    setFormName(w.name);
    const rifMatch = w.rif.match(/^([VEJPG])-(\d{8})-(\d)$/i);
    if (rifMatch) {
      setFormRifPrefix(rifMatch[1].toUpperCase());
      setFormRifDigits(rifMatch[2]);
      setFormRifCheck(rifMatch[3]);
    } else {
      setFormRifPrefix("J");
      setFormRifDigits("");
      setFormRifCheck("");
    }
    setFormAddress(w.address);
    setFormPhoto(null);
    setFormPhotoPreview(null);
    setFormError(null);
    setShowWorkshopModal(true);
  }

  function closeForm() {
    setEditingId(null);
    setFormName("");
    setFormRifPrefix("J");
    setFormRifDigits("");
    setFormRifCheck("");
    setFormAddress("");
    setFormPhoto(null);
    setFormPhotoPreview(null);
    setFormError(null);
    setShowWorkshopModal(false);
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhoto(file);
      setFormPhotoPreview(URL.createObjectURL(file));
    }
  }

  function clearSelectedPhoto() {
    setFormPhoto(null);
    setFormPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError(t("myWorkshops.nameMinLength"));
      return;
    }
    const rif = `${formRifPrefix}-${formRifDigits}-${formRifCheck}`;
    if (!/^[VEJPG]-\d{8}-\d$/i.test(rif)) {
      setFormError(t("myWorkshops.invalidRif"));
      return;
    }
    if (!formAddress.trim() || formAddress.trim().length < 5) {
      setFormError(t("myWorkshops.addressMinLength"));
      return;
    }

    if (editingId) {
      const input: Parameters<typeof updateWorkshop>[1] = { name: formName, address: formAddress };
      if (formPhoto) input.photo = formPhoto;
      updateMutation.mutate({ id: editingId, input });
    } else {
      const input: Parameters<typeof createWorkshop>[0] = {
        name: formName,
        rif,
        address: formAddress,
      };
      if (formPhoto) input.photo = formPhoto;
      createMutation.mutate(input);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("myWorkshops.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("myWorkshops.subtitle")}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t("myWorkshops.newWorkshop")}
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("myWorkshops.searchPlaceholder")}
            className="ml-input h-10 pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface py-20">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
            <Store className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <p className="text-base font-medium">{t("myWorkshops.noWorkshops")}</p>
          <p className="text-sm text-muted-foreground">
            {t("myWorkshops.noWorkshopsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {list.map((w: Workshop) => (
            <WorkshopCard
              key={w.id}
              workshop={w}
              onEdit={openEdit}
              onToggleSuspension={() => setConfirmSuspendWorkshop(w)}
              isToggling={toggleSuspensionMutation.isPending}
              onDeletePhoto={() => setConfirmDeletePhoto(w.id)}
              onManage={(id) => {
                setManageWorkshopId(id);
              }}
            />
          ))}
        </div>
      )}

      {showWorkshopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">
                {editingId ? t("myWorkshops.editWorkshop") : t("myWorkshops.registerNewWorkshop")}
              </h2>
              <button
                onClick={closeForm}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("myWorkshops.workshopName")}
                  </label>
                  <input
                    className={inputBase}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t("myWorkshops.workshopNamePlaceholder")}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("myWorkshops.rif")}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formRifPrefix}
                      onChange={(e) => setFormRifPrefix(e.target.value)}
                      className="w-20 shrink-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {RIF_PREFIXES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <span className="flex items-center text-muted-foreground">-</span>
                    <input
                      className={inputBase}
                      value={formRifDigits}
                      onChange={(e) =>
                        setFormRifDigits(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      placeholder="12345678"
                      maxLength={8}
                      required
                    />
                    <span className="flex items-center text-muted-foreground">-</span>
                    <input
                      className={`${inputBase} w-14`}
                      value={formRifCheck}
                      onChange={(e) =>
                        setFormRifCheck(e.target.value.replace(/\D/g, "").slice(0, 1))
                      }
                      placeholder="9"
                      maxLength={1}
                      required
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("myWorkshops.address")}
                  </label>
                  <input
                    className={inputBase}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder={t("myWorkshops.addressPlaceholder")}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("myWorkshops.workshopPhoto")}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-border/50"
                    >
                      <Camera className="h-4 w-4" />
                      {formPhoto ? t("myWorkshops.changePhoto") : editingId ? t("myWorkshops.changePhoto") : t("myWorkshops.selectPhoto")}
                    </button>
                    {formPhotoPreview && (
                      <button
                        type="button"
                        onClick={clearSelectedPhoto}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/30 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                        {t("myWorkshops.remove")}
                      </button>
                    )}
                    {editingId && !formPhotoPreview && (
                      <span className="text-xs text-muted-foreground">
                        {t("myWorkshops.keepCurrentPhoto")}
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  {(formPhotoPreview ||
                    (editingId &&
                      list.find((w) => w.id === editingId)?.photo_url &&
                      !formPhotoPreview)) && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      <img
                        src={
                          formPhotoPreview ||
                          getPhotoUrl(list.find((w) => w.id === editingId)?.photo_url) ||
                          ""
                        }
                        alt="Preview"
                        className="h-40 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              {formError && (
                <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-2.5">
                  <p className="text-xs font-medium text-destructive">{formError}</p>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-border/50"
                >
                  <X className="h-4 w-4" /> {t("myWorkshops.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t("myWorkshops.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageWorkshopId && (
        <ManageWorkshopPanel
          workshopId={manageWorkshopId}
          onClose={() => setManageWorkshopId(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmSuspendWorkshop}
        onOpenChange={(open) => {
          if (!open) setConfirmSuspendWorkshop(null);
        }}
        title={
          confirmSuspendWorkshop?.is_suspended ? t("myWorkshops.reactivateWorkshop") : t("myWorkshops.suspendWorkshop")
        }
        description={
          confirmSuspendWorkshop?.is_suspended
            ? t("myWorkshops.reactivateDesc")
            : t("myWorkshops.suspendDesc")
        }
        confirmText={confirmSuspendWorkshop?.is_suspended ? t("myWorkshops.reactivate") : t("myWorkshops.suspend")}
        onConfirm={() => {
          if (confirmSuspendWorkshop) {
            toggleSuspensionMutation.mutate(confirmSuspendWorkshop.id);
            setConfirmSuspendWorkshop(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDeletePhoto}
        onOpenChange={(open) => {
          if (!open) setConfirmDeletePhoto(null);
        }}
        title={t("myWorkshops.deletePhoto")}
        description={t("myWorkshops.deletePhotoDesc")}
        confirmText={t("myWorkshops.delete")}
        onConfirm={() => {
          if (confirmDeletePhoto) {
            deletePhotoMutation.mutate(confirmDeletePhoto);
            setConfirmDeletePhoto(null);
          }
        }}
      />

    </div>
  );
}

function WorkshopCard({
  workshop: w,
  onEdit,
  onToggleSuspension,
  isToggling,
  onDeletePhoto,
  onManage,
}: {
  workshop: Workshop;
  onEdit: (w: Workshop) => void;
  onToggleSuspension: () => void;
  isToggling: boolean;
  onDeletePhoto: () => void;
  onManage: (id: string) => void;
}) {
  const { t } = useLocale();
  const navigate = useNavigate();
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-border-strong hover:shadow-sm sm:flex-row ${w.is_suspended ? "opacity-60" : ""}`}
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-muted sm:h-auto sm:w-52">
        {w.photo_url ? (
          <>
            <img
              src={getPhotoUrl(w.photo_url)}
              alt={w.name}
              className="h-full w-full object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeletePhoto();
              }}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">{w.name}</h3>
            {w.is_certified ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {t("myWorkshops.certified")}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                <XCircle className="h-3 w-3" /> {t("myWorkshops.inReview")}
              </span>
            )}
            {w.is_suspended ? (
              <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                {t("myWorkshops.outOfService")}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{w.address}</span>
          </div>
          <div className="mt-2 flex gap-4 text-xs font-mono text-muted-foreground">
            <span>RIF: {w.rif}</span>
            <span>⭐ {w.average_rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={() => onEdit(w)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-border/50"
          >
            <Pencil className="h-3.5 w-3.5" /> {t("myWorkshops.edit")}
          </button>
          <button
            onClick={() => onToggleSuspension()}
            disabled={isToggling}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
              w.is_suspended
                ? "border-emerald-500/30 bg-background text-emerald-500 hover:bg-emerald-500/10"
                : "border-red-500/30 bg-background text-red-500 hover:bg-red-500/10"
            }`}
          >
            {isToggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : w.is_suspended ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Ban className="h-3.5 w-3.5" />
            )}
            {w.is_suspended ? t("myWorkshops.reactivate") : t("myWorkshops.suspend")}
          </button>
          <button
            onClick={() => onManage(w.id)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-background px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Smartphone className="h-3.5 w-3.5" /> {t("myWorkshops.payments")}
          </button>
          <button
            onClick={() =>
              navigate({
                to: "/dashboard/my-workshops/$workshopId/sales" as any,
                params: { workshopId: w.id } as any,
              })
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            {t("myWorkshops.manage")} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageWorkshopPanel({ workshopId, onClose }: { workshopId: string; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight">{t("myWorkshops.paymentMethods")}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <PaymentMethodsSection workshopId={workshopId} />
      </div>
    </div>
  );
}

function PaymentMethodsSection({ workshopId }: { workshopId: string }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<WorkshopPaymentMethodDTO | null>(null);
  const [methodType, setMethodType] = useState<"bank_transfer" | "mobile_payment" | "cash" | "zelle" | "zinli">(
    "mobile_payment",
  );
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [holderCiPrefix, setHolderCiPrefix] = useState<string>("V");
  const [holderCiNumber, setHolderCiNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteMethod, setConfirmDeleteMethod] = useState<WorkshopPaymentMethodDTO | null>(
    null,
  );

  const { data: banks } = useQuery({
    queryKey: ["workshop-banks"],
    queryFn: getWorkshopBanks,
    staleTime: Infinity,
  });

  const { data: methods, isLoading } = useQuery({
    queryKey: ["workshop-payment-methods", workshopId],
    queryFn: () => getWorkshopPaymentMethods(workshopId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePaymentMethodInput) => createPaymentMethod(workshopId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-payment-methods", workshopId] });
      resetForm();
      toast.success(t("myWorkshops.methodCreated"));
    },
    onError: (err: any) => setFormError(err?.response?.data?.message ?? err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentMethodInput }) =>
      updatePaymentMethod(workshopId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-payment-methods", workshopId] });
      resetForm();
      toast.success(t("myWorkshops.methodUpdated"));
    },
    onError: (err: any) => setFormError(err?.response?.data?.message ?? err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaymentMethod(workshopId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop-payment-methods", workshopId] });
      toast.success(t("myWorkshops.methodDeleted"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? err.message),
  });

  function resetForm() {
    setShowForm(false);
    setEditingMethod(null);
    setMethodType("mobile_payment");
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setPhoneNumber("");
    setEmail("");
    setHolderCiPrefix("V");
    setHolderCiNumber("");
    setFormError(null);
  }

  function openEdit(m: WorkshopPaymentMethodDTO) {
    setEditingMethod(m);
    setShowForm(true);
    setMethodType(m.type as any);
    setBankName(m.bank_name ?? "");
    setAccountNumber(m.account_number ?? "");
    setAccountHolder(m.account_holder ?? "");
    setPhoneNumber(m.phone_number ?? "");
    setEmail(m.email ?? "");
    const ciMatch = (m.holder_ci ?? "").match(/^([VEJPG])-(.+)$/i);
    if (ciMatch) {
      setHolderCiPrefix(ciMatch[1].toUpperCase());
      setHolderCiNumber(ciMatch[2]);
    } else {
      setHolderCiPrefix("V");
      setHolderCiNumber(m.holder_ci ?? "");
    }
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const ci = `${holderCiPrefix}-${holderCiNumber}`;

    if (methodType === "bank_transfer") {
      if (
        !bankName.trim() ||
        !accountNumber.trim() ||
        !accountHolder.trim() ||
        !holderCiNumber.trim()
      ) {
        setFormError(t("myWorkshops.bankTransferRequired"));
        return;
      }
    } else if (methodType === "mobile_payment") {
      if (!bankName.trim() || !phoneNumber.trim() || !holderCiNumber.trim()) {
        setFormError(t("myWorkshops.mobilePaymentRequired"));
        return;
      }
    } else if (methodType === "zelle" || methodType === "zinli") {
      if (!email.trim() || !accountHolder.trim()) {
        setFormError(t("myWorkshops.zelleRequired"));
        return;
      }
    }

    const input: CreatePaymentMethodInput = {
      type: methodType,
      bank_name: bankName || null,
      account_number: accountNumber || null,
      account_holder: accountHolder || null,
      phone_number: methodType === "mobile_payment" ? normalizePhone(phoneNumber) : null,
      email: (methodType === "zelle" || methodType === "zinli") ? email.trim() || null : null,
      holder_ci: holderCiNumber.trim() ? ci : null,
    };

    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  const typeIcons: Record<string, React.ReactNode> = {
    bank_transfer: <Building2 className="h-4 w-4" />,
    mobile_payment: <Smartphone className="h-4 w-4" />,
    cash: <DollarSign className="h-4 w-4" />,
    zelle: <AtSign className="h-4 w-4" />,
    zinli: <AtSign className="h-4 w-4" />,
  };

  const typeLabels: Record<string, string> = {
    bank_transfer: t("myWorkshops.paymentTypes.bank_transfer"),
    mobile_payment: t("myWorkshops.paymentTypes.mobile_payment"),
    cash: t("myWorkshops.paymentTypes.cash"),
    zelle: t("myWorkshops.paymentTypes.zelle"),
    zinli: t("myWorkshops.paymentTypes.zinli"),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {t("myWorkshops.methodCount", "", { count: methods?.length ?? 0, s: (methods?.length ?? 0) !== 1 ? "s" : "" })}
        </p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="ml-btn ml-btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("myWorkshops.add")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl border border-border bg-background p-4 space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("myWorkshops.type")}</label>
            <select
              value={methodType}
              onChange={(e) => setMethodType(e.target.value as any)}
              className="ml-input"
            >
              <option value="mobile_payment">{t("myWorkshops.paymentTypes.mobile_payment")}</option>
              <option value="bank_transfer">{t("myWorkshops.paymentTypes.bank_transfer")}</option>
              <option value="cash">{t("myWorkshops.paymentTypes.cash")}</option>
              <option value="zelle">{t("myWorkshops.paymentTypes.zelle")}</option>
              <option value="zinli">{t("myWorkshops.paymentTypes.zinli")}</option>
            </select>
          </div>

          {methodType === "bank_transfer" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.bank")}
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="ml-input"
                  required
                >
                  <option value="">{t("myWorkshops.selectBank")}</option>
                  {(banks ?? []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.accountNumber")}
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="ml-input"
                  placeholder="0123456789"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.holder")}
                </label>
                <input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="ml-input"
                  placeholder={t("myWorkshops.holderNamePlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.holderCi")}
                </label>
                <div className="flex gap-2">
                  <select
                    value={holderCiPrefix}
                    onChange={(e) => setHolderCiPrefix(e.target.value)}
                    className="w-20 shrink-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {CI_PREFIXES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className="flex items-center text-muted-foreground">-</span>
                  <input
                    value={holderCiNumber}
                    onChange={(e) =>
                      setHolderCiNumber(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    className="ml-input"
                    placeholder="12345678"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {methodType === "mobile_payment" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.bank")}
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="ml-input"
                  required
                >
                  <option value="">{t("myWorkshops.selectBank")}</option>
                  {(banks ?? []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.phone")}
                </label>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="ml-input"
                  placeholder={t("myWorkshops.phonePlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.holderCi")}
                </label>
                <div className="flex gap-2">
                  <select
                    value={holderCiPrefix}
                    onChange={(e) => setHolderCiPrefix(e.target.value)}
                    className="w-20 shrink-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {CI_PREFIXES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className="flex items-center text-muted-foreground">-</span>
                  <input
                    value={holderCiNumber}
                    onChange={(e) =>
                      setHolderCiNumber(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    className="ml-input"
                    placeholder="12345678"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {methodType === "cash" && (
            <p className="text-sm text-muted-foreground">
              {t("myWorkshops.cashDesc")}
            </p>
          )}

          {(methodType === "zelle" || methodType === "zinli") && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.email")} <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ml-input"
                  placeholder="ejemplo@gmail.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("myWorkshops.holder")} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="ml-input"
                  placeholder={t("myWorkshops.holderNamePlaceholder")}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("myWorkshops.usdNoBs")}
              </p>
            </>
          )}

          {formError && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2">
              <p className="text-xs text-destructive">{formError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="ml-btn ml-btn-outline text-xs">
              {t("myWorkshops.cancel")}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="ml-btn ml-btn-primary text-xs"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {t("myWorkshops.save")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : methods && methods.length > 0 ? (
        <div className="space-y-2">
          {methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  {typeIcons[m.type] ?? <Smartphone className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{typeLabels[m.type] ?? m.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.type === "bank_transfer" && `${m.bank_name} · ${m.account_number}`}
                    {m.type === "mobile_payment" && `${m.bank_name} · ${m.phone_number}`}
                    {m.type === "cash" && t("myWorkshops.cashPayment")}
                    {(m.type === "zelle" || m.type === "zinli") && m.email}
                  </p>
                  {m.type === "bank_transfer" && m.account_holder && (
                    <p className="text-xs text-muted-foreground">{t("myWorkshops.holder")}: {m.account_holder}</p>
                  )}
                  {m.type === "bank_transfer" && m.holder_ci && (
                    <p className="text-xs text-muted-foreground">CI: {m.holder_ci}</p>
                  )}
                  {m.type === "mobile_payment" && m.holder_ci && (
                    <p className="text-xs text-muted-foreground">CI: {m.holder_ci}</p>
                  )}
                  {(m.type === "zelle" || m.type === "zinli") && m.account_holder && (
                    <p className="text-xs text-muted-foreground">{t("myWorkshops.holder")}: {m.account_holder}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(m)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDeleteMethod(m)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Banknote className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("myWorkshops.noMethods")}</p>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteMethod}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteMethod(null);
        }}
        title={t("myWorkshops.deleteMethod")}
        description={t("myWorkshops.deleteMethodDesc")}
        confirmText={t("myWorkshops.delete")}
        onConfirm={() => {
          if (confirmDeleteMethod) {
            deleteMutation.mutate(confirmDeleteMethod.id);
            setConfirmDeleteMethod(null);
          }
        }}
      />
    </div>
  );
}
