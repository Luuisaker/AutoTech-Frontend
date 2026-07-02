import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import {
  getMyWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  type Workshop,
} from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/my-workshops")({
  component: MyWorkshopsPage,
});

function MyWorkshopsPage() {
  const { roles } = useAuth();

  const isAuthorized = roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN");

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Acceso Denegado</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          No tienes los permisos necesarios para acceder a esta área. Debes ser dueño de un taller o administrador.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return <AuthorizedWorkshopsView />;
}

const inputBase =
  "block w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong";

function AuthorizedWorkshopsView() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: () => getMyWorkshops(),
  });

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRif, setFormRif] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const list = data ?? [];

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

  const deleteMutation = useMutation({
    mutationFn: deleteWorkshop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workshops"] });
    },
  });

  function openCreate() {
    setIsCreating(true);
    setEditingId(null);
    setFormName("");
    setFormRif("");
    setFormAddress("");
    setFormError(null);
  }

  function openEdit(w: Workshop) {
    setIsCreating(false);
    setEditingId(w.id);
    setFormName(w.name);
    setFormRif(w.rif);
    setFormAddress(w.address);
    setFormError(null);
  }

  function closeForm() {
    setIsCreating(false);
    setEditingId(null);
    setFormName("");
    setFormRif("");
    setFormAddress("");
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!/^[VEJPG]-\d{8}-\d$/i.test(formRif)) {
      setFormError("RIF inválido. Formato: J-12345678-9.");
      return;
    }
    if (!formAddress.trim() || formAddress.trim().length < 5) {
      setFormError("La dirección debe tener al menos 5 caracteres.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        input: { name: formName, rif: formRif, address: formAddress },
      });
    } else {
      createMutation.mutate({ name: formName, rif: formRif, address: formAddress });
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Talleres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra, registra y elimina tus talleres.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo Taller
        </button>
      </div>

      {(isCreating || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-border bg-surface p-4"
        >
          <h2 className="mb-4 text-sm font-semibold">
            {editingId ? "Editar taller" : "Registrar nuevo taller"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
              <input
                className={inputBase}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del taller"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">RIF</label>
              <input
                className={inputBase}
                value={formRif}
                onChange={(e) => setFormRif(e.target.value.toUpperCase())}
                placeholder="J-12345678-9"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Dirección</label>
              <input
                className={inputBase}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Dirección del taller"
                required
              />
            </div>
          </div>
          {formError && <p className="mt-3 text-xs text-destructive">{formError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-border/50"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-border bg-surface py-16">
          <Store className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">Aún no tienes talleres registrados</p>
          <p className="text-xs text-muted-foreground">Usa el botón Nuevo Taller para registrar uno.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((w: Workshop) => (
            <div
              key={w.id}
              className="flex flex-col items-start justify-between rounded-md border border-border bg-surface p-5 transition-colors hover:border-border-strong sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-background">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{w.name}</h3>
                    {w.is_certified ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" /> Certificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                        <XCircle className="h-3 w-3" /> En Revisión
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{w.address}</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs font-mono text-muted-foreground">
                    <span>RIF: {w.rif}</span>
                    <span>⭐ {w.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex w-full shrink-0 gap-2 sm:mt-0 sm:w-auto">
                <button
                  onClick={() => openEdit(w)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-border/50 sm:flex-none"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Estás seguro de eliminar este taller?")) {
                      deleteMutation.mutate(w.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 sm:flex-none"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
                <Link
                  to="/dashboard/my-workshops/$workshopId/sales"
                  params={{ workshopId: w.id }}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none"
                >
                  Gestionar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}