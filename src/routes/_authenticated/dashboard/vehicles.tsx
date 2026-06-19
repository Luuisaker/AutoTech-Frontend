import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Car, Bike, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleTypes,
  type Vehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
  type VehicleType,
} from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/vehicles")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<"create" | null>(null);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const { data: types } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: getVehicleTypes,
    staleTime: Infinity,
  });

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDialog(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      updateVehicle(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setDeleting(null);
    },
  });

  const activeVehicles = vehicles?.filter((v) => v.is_active) ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Vehículos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona los vehículos registrados en tu cuenta.
          </p>
        </div>
        <button
          onClick={() => setDialog("create")}
          className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Registrar vehículo
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeVehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20">
          <Car className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tienes vehículos registrados</p>
          <button
            onClick={() => setDialog("create")}
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Registrar vehículo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => setEditing(vehicle)}
              onDelete={() => setDeleting(vehicle)}
            />
          ))}
        </div>
      )}

      {dialog === "create" && (
        <VehicleFormDialog
          title="Registrar vehículo"
          types={types ?? []}
          loading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
          onSubmit={(input) => createMutation.mutate(input)}
          onClose={() => setDialog(null)}
        />
      )}

      {editing && (
        <VehicleFormDialog
          title="Editar vehículo"
          types={types ?? []}
          initial={editing}
          loading={updateMutation.isPending}
          error={updateMutation.error?.message ?? null}
          onSubmit={(input) => updateMutation.mutate({ id: editing.id, input })}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          vehicle={deleting}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-border-strong hover:shadow-sm">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center border-b border-border bg-background">
        <div className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />
        {vehicle.vehicle_type === "CAR" ? (
          <Car className="h-20 w-20 text-border-500 opacity-50 transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <Bike className="h-20 w-20 text-border-500 opacity-50 transition-transform duration-500 group-hover:scale-110" />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
          {vehicle.vehicle_type === "CAR" ? "Automóvil" : "Motocicleta"}
        </span>
        <span className="absolute right-3 top-3 inline-flex rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
          {vehicle.year}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold leading-snug">
              {vehicle.brand} {vehicle.model}
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="cursor-pointer grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="cursor-pointer grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-3 text-sm">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Placa
            </p>
            <p className="font-mono text-sm">{vehicle.license_plate}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              VIN
            </p>
            <p className="font-mono text-sm truncate">{vehicle.vin}</p>
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
  onSubmit: (input: CreateVehicleInput) => void;
  onClose: () => void;
}) {
  const isEditing = !!initial;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      vehicle_type: form.get("vehicle_type") as VehicleType,
      brand: form.get("brand") as string,
      model: form.get("model") as string,
      year: Number(form.get("year")),
      license_plate: isEditing
        ? (initial?.license_plate ?? "")
        : (form.get("license_plate") as string),
      vin: isEditing ? (initial?.vin ?? "") : (form.get("vin") as string),
    });
  }

  const inputBase =
    "block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg border border-border-strong bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              name="vehicle_type"
              defaultValue={initial?.vehicle_type ?? "CAR"}
              required
              className={inputBase}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === "CAR" ? "Automóvil" : "Motocicleta"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Marca
              </label>
              <input
                name="brand"
                defaultValue={initial?.brand}
                required
                minLength={1}
                maxLength={64}
                placeholder="Toyota"
                className={inputBase}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Modelo
              </label>
              <input
                name="model"
                defaultValue={initial?.model}
                required
                minLength={1}
                maxLength={64}
                placeholder="Corolla"
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Año</label>
            <input
              name="year"
              type="number"
              defaultValue={initial?.year}
              required
              min={1900}
              max={2100}
              className={inputBase}
            />
          </div>

          {!isEditing && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Placa
                </label>
                <input
                  name="license_plate"
                  required
                  minLength={4}
                  maxLength={15}
                  placeholder="ABC123"
                  className={`${inputBase} uppercase`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  VIN
                </label>
                <input
                  name="vin"
                  required
                  minLength={11}
                  maxLength={17}
                  placeholder="1HGBH41JXMN109186"
                  className={`${inputBase} uppercase`}
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Registrar"}
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-lg border border-border-strong bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold tracking-tight">Eliminar vehículo</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ¿Estás seguro de eliminar {vehicle.brand} {vehicle.model} ({vehicle.license_plate})? Esta
          acción es reversible.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
