import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, Search, SlidersHorizontal, Package, Loader2, Wrench } from "lucide-react";
import {
  getParts,
  getPartCategories,
  getPartConditions,
  type PartDTO,
} from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/marketplace")({
  component: MarketplacePage,
});

const CONDITION_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  USED: "Usado",
};

const CATEGORY_LABELS: Record<string, string> = {
  ENGINE: "Motor",
  ELECTRICAL: "Eléctrico",
  BODY: "Carrocería",
  SUSPENSION: "Suspensión",
  BRAKES: "Frenos",
  TRANSMISSION: "Transmisión",
  EXHAUST: "Escape",
  COOLING: "Refrigeración",
  INTERIOR: "Interior",
  CONSUMABLE: "Consumible",
  OTHER: "Otro",
};

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
];

function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const { data: parts, isLoading } = useQuery({
    queryKey: ["parts", query, category, condition, minPrice, maxPrice],
    queryFn: () =>
      getParts({
        query: query || undefined,
        category: category || undefined,
        condition: condition || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        certified_only: true,
        limit: 200,
      }),
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

  const filtered = useMemo(() => {
    const list = parts ?? [];
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [parts, sort]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encuentra y financia los repuestos certificados que tu vehículo necesita.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar repuestos..."
              className="h-10 w-full rounded-md border border-border bg-transparent pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                showFilters
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong"
            >
              <option value="">Todas</option>
              {(categories ?? []).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Condición</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong"
            >
              <option value="">Todas</option>
              {(conditions ?? []).map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Precio mín.</label>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Precio máx.</label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="5000"
              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium">No se encontraron repuestos</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Prueba ajustando los filtros o buscando otro término.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((part) => (
            <ProductCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ part }: { part: PartDTO }) {
  const monthly = part.allows_installments ? (part.price / 6).toFixed(2) : null;

  return (
    <Link
      to="/dashboard/parts/$id"
      params={{ id: part.id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-border-strong"
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center border-b border-border bg-background p-6">
        <Wrench className="h-16 w-16 text-border opacity-50 transition-transform duration-300 ease-out group-hover:scale-110" />
        {part.category && (
          <span className="absolute left-3 top-3 inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABELS[part.category] ?? part.category}
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {CONDITION_LABELS[part.condition] ?? part.condition}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{part.name}</h3>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Precio total</p>
            <p className="font-mono text-lg font-semibold">${part.price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {part.allows_installments ? "Desde" : "Stock"}
            </p>
            <p className="font-mono text-sm font-medium text-primary">
              {part.allows_installments ? (
                <>
                  ${monthly}
                  <span className="text-xs text-muted-foreground">/mes</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{part.stock}</span>
              )}
            </p>
          </div>
        </div>

        <span className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors group-hover:border-primary group-hover:text-primary">
          Ver detalle
        </span>
      </div>
    </Link>
  );
}
