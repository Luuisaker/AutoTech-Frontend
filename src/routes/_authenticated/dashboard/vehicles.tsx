import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import {
  Car,
  Bike,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Camera,
  ImageIcon,
  Wrench,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import { InfoDialog } from "@/components/ui/info-dialog";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleTypes,
  uploadVehiclePhoto,
  deleteVehiclePhoto,
  getPhotoUrl,
  getServiceOrders,
  type Vehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
  type VehicleType,
  type ServiceOrderDTO,
} from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/vehicles")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"create" | null>(null);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ vehicleId: string; file: File } | null>(null);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const { data: serviceOrders } = useQuery({
    queryKey: ["service-orders"],
    queryFn: getServiceOrders,
  });

  const activeServiceOrders =
    serviceOrders?.filter(
      (so) => so.status !== "CANCELLED" && so.status !== "REJECTED" && so.status !== "DELIVERED" && so.status !== "CLOSED",
    ) ?? [];

  const vehicleServiceStatus = useMemo(() => {
    const map: Record<string, { status: string; workshop: string }> = {};
    for (const so of activeServiceOrders) {
      map[so.vehicle_id] = { status: so.status, workshop: so.workshop_name ?? "" };
    }
    return map;
  }, [activeServiceOrders]);

  const { data: types } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: getVehicleTypes,
    staleTime: Infinity,
  });

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: async (vehicle) => {
      if (pendingPhoto) {
        try {
          await uploadVehiclePhoto(vehicle.id, pendingPhoto.file);
        } catch {
          /* ignore photo error */
        }
        setPendingPhoto(null);
      }
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDialog(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      updateVehicle(id, input),
    onSuccess: async (_data, variables) => {
      if (pendingPhoto) {
        try {
          await uploadVehiclePhoto(variables.id, pendingPhoto.file);
        } catch {
          /* ignore photo error */
        }
        setPendingPhoto(null);
      }
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDeleting(null);
      toast.success(t("vehicles.deleted"));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        t("vehicles.deleteError");
      toast.error(msg);
      setDeleting(null);
    },
  });

  const activeVehicles = vehicles?.filter((v) => v.is_active) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("vehicles.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("vehicles.subtitle")}
          </p>
        </div>
        <button onClick={() => setDialog("create")} className="ml-btn ml-btn-primary">
          <Plus className="h-4 w-4" />
          {t("vehicles.registerVehicle")}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeVehicles.length === 0 ? (
        <div className="ml-empty-state py-16">
          <Car className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("vehicles.noVehicles")}</p>
          <button onClick={() => setDialog("create")} className="ml-btn ml-btn-primary">
            <Plus className="h-4 w-4" />
            {t("vehicles.registerVehicle")}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {activeVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              serviceInfo={vehicleServiceStatus[vehicle.id]}
              onEdit={() => setEditing(vehicle)}
              onDelete={() => setDeleting(vehicle)}
            />
          ))}
        </div>
      )}

      {dialog === "create" && (
        <VehicleFormDialog
          title={t("vehicles.registerVehicle")}
          types={types ?? []}
          loading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
          onSubmit={(input, photo) => {
            if (photo) setPendingPhoto({ vehicleId: "", file: photo });
            createMutation.mutate(input);
          }}
          onClose={() => {
            setDialog(null);
            setPendingPhoto(null);
          }}
        />
      )}

      {editing && (
        <VehicleFormDialog
          title={t("vehicles.editVehicle")}
          types={types ?? []}
          initial={editing}
          loading={updateMutation.isPending}
          error={updateMutation.error?.message ?? null}
          onSubmit={(input, photo) => {
            if (photo) setPendingPhoto({ vehicleId: editing.id, file: photo });
            updateMutation.mutate({ id: editing.id, input });
          }}
          onClose={() => {
            setEditing(null);
            setPendingPhoto(null);
          }}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          vehicle={deleting}
          loading={deleteMutation.isPending}
          onConfirm={() => {
            if (deleting) deleteMutation.mutate(deleting.id);
          }}
          onClose={() => setDeleting(null)}
        />
      )}

      {showDeleteError && (
        <InfoDialog
          open={showDeleteError}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteError(false);
              setDeleteError("");
            }
          }}
          title={t("vehicles.cannotDelete")}
          description={deleteError}
        />
      )}
    </div>
  );
}

const SERVICE_STATUS_STYLES: Record<string, string> = {
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  REVISION_SENT: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  AT_WORKSHOP: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  QUOTED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  ACCEPTED: "border border-green-500/30 bg-green-500/10 text-green-400",
  IN_PROGRESS: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  COMPLETED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  DELIVERED: "border border-teal-500/30 bg-teal-500/10 text-teal-400",
  REJECTED: "border border-red-500/30 bg-red-500/10 text-red-400",
  CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
};

function VehicleCard({
  vehicle,
  serviceInfo,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  serviceInfo?: { status: string; workshop: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="group ml-card flex flex-col overflow-hidden">
      <div className="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden border-b border-border bg-background">
        {vehicle.photo_url ? (
          <img src={getPhotoUrl(vehicle.photo_url)} alt="" className="h-full w-full object-cover object-center" />
        ) : vehicle.vehicle_type === "CAR" ? (
          <Car className="h-20 w-20 text-border opacity-40 transition-transform duration-300 ease-out group-hover:scale-110" />
        ) : (
          <Bike className="h-20 w-20 text-border opacity-40 transition-transform duration-300 ease-out group-hover:scale-110" />
        )}
        <span className="absolute left-3 top-3 ml-badge border border-border bg-surface text-muted-foreground">
          {vehicle.vehicle_type === "CAR" ? t("vehicles.car") : t("vehicles.motorcycle")}
        </span>
        <span className="absolute right-3 top-3 ml-badge border border-border bg-surface text-muted-foreground">
          {vehicle.year}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {serviceInfo && (
          <span
            className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider self-start ${SERVICE_STATUS_STYLES[serviceInfo.status] || "border border-border bg-surface text-muted-foreground"}`}
          >
            {serviceInfo.status === "ACCEPTED" || serviceInfo.status === "IN_PROGRESS" ? (
              <Wrench className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {t(`vehicles.serviceStatus.${serviceInfo.status}`, serviceInfo.status)}
            {serviceInfo.workshop && (
              <span className="ml-1 max-w-[120px] truncate opacity-60">· {serviceInfo.workshop}</span>
            )}
          </span>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-snug">
              {vehicle.brand} {vehicle.model}
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3 text-sm">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("vehicles.plate")}
            </p>
            <p className="font-mono text-sm">{vehicle.license_plate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleFormDialog({
  title,
  types,
  initial,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  title: string;
  types: VehicleType[];
  initial?: Vehicle;
  loading: boolean;
  error: string | null;
  onSubmit: (input: CreateVehicleInput, photo?: File) => void;
  onClose: () => void;
}) {
  const isEditing = !!initial;
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit(
      {
        vehicle_type: form.get("vehicle_type") as VehicleType,
        brand: form.get("brand") as string,
        model: form.get("model") as string,
        year: Number(form.get("year")),
        license_plate: isEditing
          ? (initial?.license_plate ?? "")
          : (form.get("license_plate") as string),
        vin: isEditing
          ? (initial?.vin ?? undefined)
          : form.get("vin")
            ? (form.get("vin") as string)
            : undefined,
      },
      photoFile || undefined,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
                {photoPreview || initial?.photo_url ? (
                  <img
                    src={photoPreview || getPhotoUrl(initial?.photo_url) || ""}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ml-btn ml-btn-outline text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                {photoPreview || initial?.photo_url ? t("vehicles.changePhoto") : t("vehicles.addPhoto")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("vehicles.vehicleType")}</label>
            <select
              name="vehicle_type"
              defaultValue={initial?.vehicle_type ?? "CAR"}
              required
              className="ml-input"
            >
              {types.map((vt) => (
                <option key={vt} value={vt}>
                  {vt === "CAR" ? t("vehicles.car") : t("vehicles.motorcycle")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("vehicles.brand")}
              </label>
              <input
                name="brand"
                defaultValue={initial?.brand}
                required
                minLength={1}
                maxLength={64}
                placeholder="Toyota"
                className="ml-input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("vehicles.model")}
              </label>
              <input
                name="model"
                defaultValue={initial?.model}
                required
                minLength={1}
                maxLength={64}
                placeholder="Corolla"
                className="ml-input"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("vehicles.year")}</label>
            <input
              name="year"
              type="number"
              defaultValue={initial?.year}
              required
              min={1900}
              max={2100}
              className="ml-input"
            />
          </div>

          {!isEditing && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("vehicles.plate")}
                </label>
                <input
                  name="license_plate"
                  required
                  minLength={4}
                  maxLength={15}
                  placeholder="ABC123"
                  className="ml-input uppercase"
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ml-btn ml-btn-outline"
            >
              {t("vehicles.cancel")}
            </button>
            <button type="submit" disabled={loading} className="ml-btn ml-btn-primary">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? t("vehicles.saveChanges") : t("vehicles.register")}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

function DeleteConfirmDialog({
  vehicle,
  loading,
  onConfirm,
  onClose,
}: {
  vehicle: Vehicle;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="text-lg font-semibold tracking-tight">{t("vehicles.deleteVehicle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("vehicles.deleteConfirm", "", { brand: vehicle.brand, model: vehicle.model, plate: vehicle.license_plate })}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="ml-btn ml-btn-outline"
          >
            {t("vehicles.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="ml-btn cursor-pointer inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("vehicles.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
