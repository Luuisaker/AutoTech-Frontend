import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Store, MapPin, Star, Search, Loader2 } from "lucide-react";
import { getWorkshops, getPhotoUrl } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/workshops")({
  component: WorkshopsPage,
});

function WorkshopsPage() {
  const [query, setQuery] = useState("");
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["workshops", query],
    queryFn: () =>
      getWorkshops({
        search: query || undefined,
        certified_only: true,
      }),
  });

  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter((w) => w.owner_id !== user?.id)
        .sort((a, b) => b.average_rating - a.average_rating),
    [data, user?.id],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Red de Talleres</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Encuentra talleres certificados y de confianza cerca de ti.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="ml-input h-10 pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
) : filtered.length === 0 ? (
        <div className="ml-empty-state py-16">
          <Store className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">No se encontraron talleres</p>
          <p className="ml-empty-state-desc">Prueba ajustando los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkshopCard({
  workshop,
}: {
  workshop: {
    id: string;
    name: string;
    address: string;
    rif: string;
    average_rating: number;
    photo_url: string | null;
  };
}) {
  return (
    <div className="group ml-card flex flex-col overflow-hidden">
      <div className="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden border-b border-border bg-background">
        {workshop.photo_url ? (
          <img
            src={getPhotoUrl(workshop.photo_url)}
            alt={workshop.name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <Store className="h-8 w-8 text-border opacity-40" />
        )}
        <div className="absolute right-1.5 top-1.5 ml-badge border border-border bg-surface text-muted-foreground">
          <Star className="h-3 w-3 text-primary" />
          {workshop.average_rating.toFixed(1)}
        </div>
      </div>

      <div className="flex flex-col p-2.5">
        <h3 className="text-s font-semibold leading-snug line-clamp-1">{workshop.name}</h3>

        <div className="mt-1 flex items-start gap-1 text-[11.5px] text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-2">{workshop.address}</span>
        </div>

        <div className="mt-1.5 text-[12px] text-muted-foreground">
          RIF: <span className="font-mono text-foreground">{workshop.rif}</span>
        </div>
      </div>
    </div>
  );
}
