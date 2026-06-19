import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import {
  Store,
  Plus,
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  Shield,
  Upload,
  MapPin,
} from "lucide-react";

import { useAuth } from "../../../lib/auth-context";
import { getMyWorkshops, createWorkshop, type WorkshopInput } from "../../../lib/api";

const MapPicker = lazy(() => import("../../../components/map-picker"));

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, roles } = useAuth();
  const queryClient = useQueryClient();

  const { data: workshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: getMyWorkshops,
    enabled: roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN"),
  });

  const isWorkshopOwner = roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administra tu cuenta y preferencias.</p>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Cuenta</h2>
              <p className="text-xs text-muted-foreground">Información de tu perfil personal.</p>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <dl className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
                <dd className="col-span-2 text-sm">
                  {user?.first_name} {user?.last_name}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="col-span-2 text-sm">{user?.email}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-muted-foreground">Cédula</dt>
                <dd className="col-span-2 text-sm">{user?.ci}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
                <dd className="col-span-2 text-sm">{user?.phone}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-muted-foreground">Rol</dt>
                <dd className="col-span-2 text-sm">
                  {roles.includes("ADMIN")
                    ? "Administrador"
                    : roles.includes("WORKSHOP_OWNER")
                      ? "Dueño de Taller"
                      : "Conductor"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Taller Mecánico</h2>
              <p className="text-xs text-muted-foreground">
                {isWorkshopOwner
                  ? "Gestiona tu taller y servicios."
                  : "Conviértete en tallerista y ofrece tus servicios."}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            {isWorkshopOwner ? (
              <WorkshopManagement workshops={workshops ?? []} loading={workshopsLoading} />
            ) : (
              <BecomeWorkshop />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function BecomeWorkshop() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [rif, setRif] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const createMutation = useMutation({
    mutationFn: createWorkshop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workshops"] });
      setShowForm(false);
    },
  });

  const handleRifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^VEJPG0-9]/g, "");
    if (val.length > 1) val = val.replace(/^([VEJPG])(\d)/, "$1-$2");
    if (val.length > 10) val = val.replace(/^([VEJPG]-\d{8})(\d)/, "$1-$2");
    setRif(val.slice(0, 12));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d+]/g, "");
    setPhone(val);
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMapError("");

    if (!position || !address.trim()) {
      setMapError("Debes seleccionar una ubicación válida en Venezuela.");
      return;
    }

    const rifRegex = /^[VEJPG]-\d{8}-\d$/;
    if (!rifRegex.test(rif)) {
      alert("El formato del RIF es inválido. Debe ser como J-12345678-9");
      return;
    }

    const form = new FormData(e.currentTarget);
    const input: WorkshopInput = {
      name: form.get("name") as string,
      rif: rif,
      address: address,
      latitude: position.lat,
      longitude: position.lng,
    };

    const file = form.get("verification_document") as File;
    if (file?.size > 0) input.verification_document = file;

    createMutation.mutate(input);
  }

  if (!showForm) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Store className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">¿Tienes un taller?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Regístra tu taller y ofrece tus servicios a la red de conductores.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Conviértete en Tallerista
        </button>
      </div>
    );
  }

  const inputBase =
    "block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Nombre del taller <span className="text-destructive">*</span>
          </label>
          <input
            name="name"
            required
            minLength={2}
            maxLength={128}
            placeholder="Ej: Taller Mecánico Central"
            className={inputBase}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              RIF <span className="text-destructive">*</span>
            </label>
            <input
              name="rif"
              value={rif}
              onChange={handleRifChange}
              required
              placeholder="J-12345678-9"
              className={inputBase}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Formato: J-00000000-0</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Teléfono</label>
            <input
              name="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+584121234567"
              className={inputBase}
            />
          </div>
        </div>

        <div className="rounded-md border border-border bg-background/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">
              Ubicación del Taller <span className="text-destructive">*</span>
            </h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Busca tu ciudad o haz clic directamente en el mapa para marcar la ubicación exacta de tu taller.
          </p>

          {isMounted ? (
            <Suspense
              fallback={
                <div className="flex h-[250px] w-full items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              }
            >
              <MapPicker
                position={position}
                setPosition={setPosition}
                address={address}
                setAddress={setAddress}
                mapError={mapError}
                setMapError={setMapError}
              />
            </Suspense>
          ) : (
            <div className="h-[250px] w-full rounded-md border border-border bg-surface"></div>
          )}

          {mapError && <p className="mt-2 text-xs font-medium text-destructive">{mapError}</p>}

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Dirección detallada (Editable)
            </label>
            <textarea
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              minLength={5}
              maxLength={500}
              rows={3}
              placeholder="Utiliza el buscador o el mapa para autocompletar..."
              className={inputBase}
            />
          </div>

          {position && (
            <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
              <span>Lat: {position.lat.toFixed(6)}</span>
              <span>Lng: {position.lng.toFixed(6)}</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Documento de verificación
          </label>
          <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 shrink-0" />
            <input
              name="verification_document"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="flex-1 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary"
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Sube un documento (RIF digitalizado, licencia comercial)
          </p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {(createMutation.error as Error)?.message ?? "Error al crear el taller"}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || !position || !address}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar taller
        </button>
      </div>
    </form>
  );
}

function WorkshopManagement({
  workshops,
  loading,
}: {
  workshops: {
    id: string;
    name: string;
    is_certified: boolean;
    rif: string;
    address: string;
    average_rating: number;
    verification_document_url: string | null;
  }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (workshops.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Store className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">No tienes talleres registrados</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crea un taller para comenzar a ofrecer tus servicios.
          </p>
        </div>
        <Link
          to="/dashboard/settings"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Crear taller
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workshops.map((w) => (
        <div key={w.id} className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface">
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.address}</p>
              </div>
            </div>
            {w.is_certified ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Certificado
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-400">
                <XCircle className="h-3 w-3" />
                Pendiente
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">RIF:</span> {w.rif}
            </div>
            <div>
              <span className="font-medium text-foreground">Rating:</span>{" "}
              {w.average_rating.toFixed(1)} / 5.0
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}