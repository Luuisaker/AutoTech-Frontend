import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Store, MapPin, Star, Search, Loader2, ShieldCheck } from "lucide-react";
import { getWorkshops, type Workshop } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/workshops")({
  component: WorkshopsPage,
});

function WorkshopsPage() {
  const [query, setQuery] = useState("");
  const [certifiedOnly, setCertifiedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["workshops", query, certifiedOnly],
    queryFn: () => getWorkshops(),
  });

  const filtered = (data ?? []).filter((w) => {
    if (certifiedOnly && !w.is_certified) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!w.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Red de Talleres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encuentra talleres certificados y de confianza cerca de ti.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCertifiedOnly(!certifiedOnly)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              certifiedOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Solo Certificados
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20">
          <Store className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No se encontraron talleres con esos parámetros</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-all hover:border-border-strong">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center border-b border-border bg-background">
        <div className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />
        <Store className="h-16 w-16 text-border-500 opacity-50 transition-transform duration-500 group-hover:scale-105" />
        {workshop.is_certified === true && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400 backdrop-blur">
            <ShieldCheck className="h-3 w-3" />
            Certificado
          </span>
        )}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-[4px] border border-border bg-surface/80 px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground backdrop-blur">
          <Star className="h-3 w-3 text-amber-400" />
          {workshop.average_rating.toFixed(1)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold leading-snug">{workshop.name}</h3>

        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{workshop.address}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          RIF: <span className="font-mono text-foreground">{workshop.rif}</span>
        </div>
      </div>
    </div>
  );
}