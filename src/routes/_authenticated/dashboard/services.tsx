import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  Wrench,
  Loader2,
  Search,
  Store,
  MapPin,
  Star,
  DollarSign,
  Car,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import {
  getServicesWithWorkshops,
  getVehicles,
  getServiceOrders,
  createServiceOrder,
  getWorkshops,
  getPhotoUrl,
  type ServiceWithWorkshop,
  type Vehicle,
  type Workshop,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/dashboard/services")({
  component: ServicesPage,
});

const SERVICE_TYPES = [
  { value: "" },
  { value: "MAINTENANCE" },
  { value: "REPAIR" },
  { value: "CLEANING" },
];

function ServicesPage() {
  const { t } = useLocale();
  const { roles } = useAuth();
  const queryClient = useQueryClient();
  const [serviceType, setServiceType] = useState("");
  const [query, setQuery] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("");
  const [requestTarget, setRequestTarget] = useState<{
    service: ServiceWithWorkshop;
    workshop: { id: string; name: string };
  } | null>(null);

  const { data: workshops } = useQuery({
    queryKey: ["workshops-filter"],
    queryFn: () => getWorkshops({}),
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["services-with-workshops", serviceType, query, workshopFilter],
    queryFn: () =>
      getServicesWithWorkshops({
        query: query || undefined,
        service_type: serviceType || undefined,
        certified_only: true,
        workshop_id: workshopFilter || undefined,
      }),
  });

  const isClient = !roles.includes("WORKSHOP_OWNER") && !roles.includes("ADMIN");

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
    enabled: !roles.includes("WORKSHOP_OWNER"),
  });

  const { data: myServiceOrders } = useQuery({
    queryKey: ["my-service-orders"],
    queryFn: getServiceOrders,
    enabled: isClient,
  });

  const ineligibleVehicleIds = useMemo(() => {
    const set = new Set<string>();
    for (const o of myServiceOrders ?? []) {
      const active = o.status !== "CLOSED" && o.status !== "CANCELLED";
      if (!active) continue;
      set.add(o.vehicle_id);
    }
    return set;
  }, [myServiceOrders]);

  const eligibleVehicles = useMemo(
    () => (vehicles ?? []).filter((v) => !ineligibleVehicleIds.has(v.id)),
    [vehicles, ineligibleVehicleIds],
  );

  const groupedByWorkshop = useMemo(() => {
    const groups: Record<string, { workshop: any; services: ServiceWithWorkshop[] }> = {};
    for (const s of services ?? []) {
      const key = s.workshop_id;
      if (!groups[key]) {
        groups[key] = {
          workshop: {
            id: s.workshop_id,
            name: s.workshop_name ?? "Taller",
            address: s.workshop_address ?? "",
            photo_url: s.workshop_photo_url,
            certified: s.workshop_certified,
            rating: s.workshop_rating,
          },
          services: [],
        };
      }
      groups[key].services.push(s);
    }
    return Object.values(groups);
  }, [services]);

  const navigate = useNavigate();
  const createOrderMutation = useMutation({
    mutationFn: ({
      workshop_id,
      service_id,
      vehicle_id,
      notes,
    }: {
      workshop_id: string;
      service_id: string;
      vehicle_id: string;
      notes?: string;
    }) => createServiceOrder({ workshop_id, service_id, vehicle_id, notes }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["my-service-orders"] });
      setRequestTarget(null);
      toast.success(t("services.requestSent"));
      navigate({ to: "/dashboard/service-orders/$orderId", params: { orderId: order.id } });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? t("services.requestError");
      toast.error(msg);
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("services.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("services.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("services.searchPlaceholder")}
            className="ml-input h-9 sm:h-10 pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:shrink-0">
          {SERVICE_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => setServiceType(st.value)}
              className={`ml-btn h-8 sm:h-10 text-xs whitespace-nowrap shrink-0 ${
                serviceType === st.value
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "ml-btn-outline"
              }`}
            >
              {st.value ? <Wrench className="h-3.5 w-3.5" /> : null}
              {st.value ? t(`services.types.${st.value}`, st.value) : t("services.allTypes")}
            </button>
          ))}
          <select
            value={workshopFilter}
            onChange={(e) => setWorkshopFilter(e.target.value)}
            className="ml-input h-8 sm:h-10 w-auto min-w-[8rem] sm:min-w-[10rem] whitespace-nowrap shrink-0"
          >
            <option value="">{t("services.allWorkshops")}</option>
            {(workshops ?? []).map((w: Workshop) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupedByWorkshop.length === 0 ? (
        <div className="ml-empty-state py-16">
          <Wrench className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("services.noServices")}</p>
          <p className="ml-empty-state-desc">{t("services.noServicesDesc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByWorkshop.map((group) => (
            <div key={group.workshop.id} className="ml-card overflow-hidden">
              <div className="flex items-start gap-4 border-b border-border bg-surface/50 p-4 sm:p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {group.workshop.photo_url ? (
                    <img
                      src={getPhotoUrl(group.workshop.photo_url)}
                      alt={group.workshop.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{group.workshop.name}</h3>
                    {group.workshop.certified && (
                      <span className="ml-badge ml-badge-success">
                        <ShieldCheck className="h-3 w-3" />
                        {t("services.certified")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {group.workshop.address}
                    </span>
                    {group.workshop.rating != null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-primary" />
                        {group.workshop.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {group.services.map((service) => (
                  <div key={service.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{service.service_name}</p>
                        {service.service_type && (
                          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {t(`services.types.${service.service_type}`, service.service_type)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {service.vehicle_type && service.vehicle_type !== "ALL" && (
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                            {service.vehicle_type === "CAR" ? t("services.cars") : t("services.motorcycles")}
                          </span>
                        )}
                        {service.vehicle_type === "ALL" && (
                          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                            {t("services.allVehicles")}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          ${service.standard_price_min.toFixed(2)} - ${service.standard_price_max.toFixed(2)}
                        </span>
                      </div>
                      {service.revision_cost_min != null && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          <span className="font-medium text-foreground">
                            {t("services.revision")}: ${service.revision_cost_min.toFixed(2)}
                            {service.revision_cost_max != null &&
                            service.revision_cost_max !== service.revision_cost_min
                              ? ` - $${service.revision_cost_max.toFixed(2)}`
                              : ""}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isClient ? (
                        vehicles && vehicles.length > 0 ? (
                          <button
                            onClick={() =>
                              setRequestTarget({
                                service,
                                workshop: {
                                  id: group.workshop.id,
                                  name: group.workshop.name,
                                },
                              })
                            }
                            className="ml-btn ml-btn-primary text-xs"
                          >
                            {t("services.request")}
                          </button>
                        ) : (
                          <Link
                            to="/dashboard/vehicles"
                            className="ml-btn ml-btn-outline text-xs"
                          >
                            {t("services.registerVehicle")}
                          </Link>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border bg-muted/30 px-5 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  {t("services.priceDisclaimer")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <RequestServiceModal
        target={requestTarget}
        eligibleVehicles={eligibleVehicles}
        onClose={() => setRequestTarget(null)}
        onCreate={createOrderMutation}
      />
    </div>
  );
}

type RequestTarget = {
  service: ServiceWithWorkshop;
  workshop: { id: string; name: string };
};

function RequestServiceModal({
  target,
  eligibleVehicles,
  onClose,
  onCreate,
}: {
  target: RequestTarget | null;
  eligibleVehicles: Vehicle[];
  onClose: () => void;
  onCreate: {
    mutate: (input: {
      workshop_id: string;
      service_id: string;
      vehicle_id: string;
      notes?: string;
    }) => void;
    isPending: boolean;
  };
}) {
  const { t } = useLocale();
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (target) {
      setVehicleId(eligibleVehicles.length === 1 ? eligibleVehicles[0].id : "");
      setNotes("");
    }
  }, [target]);

  if (!target) return null;

  const { service, workshop } = target;

  const handleConfirm = () => {
    if (!vehicleId) {
      toast.error(t("services.selectVehicle"));
      return;
    }
    onCreate.mutate({
      workshop_id: workshop.id,
      service_id: service.id,
      vehicle_id: vehicleId,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service.service_name}</DialogTitle>
          <DialogDescription>{workshop.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-3 text-sm">
            <p className="text-muted-foreground">
              {t("services.servicePrice")}:{" "}
              <span className="font-medium text-foreground">
                ${service.standard_price_min.toFixed(2)} — $
                {service.standard_price_max.toFixed(2)}
              </span>
            </p>
            {service.revision_cost_min != null && (
              <p className="mt-1 text-muted-foreground">
                {t("services.revision")}:{" "}
                <span className="font-medium text-foreground">
                  ${service.revision_cost_min.toFixed(2)}
                  {service.revision_cost_max != null &&
                  service.revision_cost_max !== service.revision_cost_min
                    ? ` - $${service.revision_cost_max.toFixed(2)}`
                    : ""}
                </span>
              </p>
            )}
          </div>

          {eligibleVehicles.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("services.noVehiclesAvailable")}
            </p>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("services.vehicle")}
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="ml-input h-9 text-xs w-full"
              >
                <option value="">{t("services.selectVehiclePlaceholder")}</option>
                {eligibleVehicles.map((v: Vehicle) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} {v.year}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("services.noteLabel")}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("services.notePlaceholder")}
              className="min-h-[80px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="ml-btn ml-btn-outline text-xs">
            {t("services.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={onCreate.isPending || eligibleVehicles.length === 0}
            className="ml-btn ml-btn-primary text-xs"
          >
            {onCreate.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              t("services.confirmRequest")
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

