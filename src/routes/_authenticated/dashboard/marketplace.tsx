import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  Package,
  Loader2,
  Wrench,
  ShoppingCart,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../../../lib/locale-context";
import {
  getParts,
  getPartCategories,
  getPartConditions,
  getMyWorkshops,
  addToCart,
  getPhotoUrl,
  getWorkshops,
  type PartDTO,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/marketplace")({
  component: MarketplacePage,
});

const SORT_OPTIONS = [
  { value: "relevance" },
  { value: "price-asc" },
  { value: "price-desc" },
];

function MarketplacePage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const { data: myWorkshops } = useQuery({
    queryKey: ["my-workshops"],
    queryFn: getMyWorkshops,
    enabled: user?.roles?.includes("WORKSHOP_OWNER"),
  });
  const ownWorkshopIds = useMemo(() => new Set(myWorkshops?.map((w) => w.id) ?? []), [myWorkshops]);

  const { data: allWorkshops } = useQuery({
    queryKey: ["all-workshops"],
    queryFn: () => getWorkshops(),
  });

  const { data: parts, isLoading } = useQuery({
    queryKey: ["parts", query, category, condition, minPrice, maxPrice, workshopId],
    queryFn: () =>
      getParts({
        query: query || undefined,
        category: category || undefined,
        condition: condition || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        workshop_id: workshopId || undefined,
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
    const list = (parts ?? []).filter((p) => !ownWorkshopIds.has(p.workshop_id));
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [parts, sort, ownWorkshopIds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("marketplace.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("marketplace.subtitle")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("marketplace.searchPlaceholder")}
              className="ml-input h-10 pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-input h-10 w-auto"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(`marketplace.sortBy.${o.value}`, o.value)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`ml-btn h-10 px-3 ${
                showFilters
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "ml-btn-outline"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("marketplace.filters")}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 ml-card grid gap-4 p-5 sm:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("marketplace.category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="ml-input"
            >
              <option value="">{t("marketplace.allCategories")}</option>
              {(categories ?? []).map((c) => (
                <option key={c} value={c}>
                  {t(`marketplace.categories.${c}`, c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("marketplace.condition")}
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="ml-input"
            >
              <option value="">{t("marketplace.allConditions")}</option>
              {(conditions ?? []).map((c) => (
                <option key={c} value={c}>
                  {t(`marketplace.conditions.${c}`, c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("marketplace.workshop")}</label>
            <select
              value={workshopId}
              onChange={(e) => setWorkshopId(e.target.value)}
              className="ml-input"
            >
              <option value="">{t("marketplace.allWorkshops")}</option>
              {(allWorkshops ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("marketplace.minPrice")}
            </label>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="ml-input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("marketplace.maxPrice")}
            </label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="5000"
              className="ml-input"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ml-empty-state py-16">
          <Package className="ml-empty-state-icon" />
          <p className="ml-empty-state-title">{t("marketplace.noResults")}</p>
          <p className="ml-empty-state-desc">
            {t("marketplace.noResultsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((part) => (
            <ProductCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ part }: { part: PartDTO }) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(part.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("marketplace.addedToCart"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? t("marketplace.addError");
      toast.error(msg);
    },
  });

  return (
    <div className="group ml-card flex flex-col overflow-hidden">
      <Link to="/dashboard/parts/$id" params={{ id: part.id }} className="flex flex-1 flex-col">
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-border bg-background">
          {part.photo_url ? (
            <img
              src={getPhotoUrl(part.photo_url)}
              alt={part.name}
              className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <Wrench className="h-16 w-16 text-border opacity-40 transition-transform duration-300 ease-out group-hover:scale-110" />
          )}
          {part.category && (
            <span className="absolute left-3 top-3 ml-badge bg-black text-white">
              {t(`marketplace.categories.${part.category}`, part.category)}
            </span>
          )}
          <span className="absolute right-3 top-3 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {t(`marketplace.conditions.${part.condition}`, part.condition)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{part.name}</h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{part.workshop_name}</span>
            {part.workshop_is_certified && (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                {t("marketplace.certified")}
              </span>
            )}
          </div>

          <div className="mt-2">
            <p className="text-[11px] text-muted-foreground">{t("marketplace.totalPrice")}</p>
            <p className="font-mono text-xl font-bold tracking-tight">${part.price.toFixed(2)}</p>
            {part.allows_installments === 1 && (
              <p className="mt-1 text-xs font-medium text-purple-400">
                {t("marketplace.initial")}{" "}
                <span className="font-mono text-sm">
                  ${((part.price * part.installment_min_percentage) / 100).toFixed(2)}
                </span>{" "}
                {t("marketplace.installments")}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCartMutation.mutate();
          }}
          disabled={addToCartMutation.isPending || part.stock < 1}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {part.stock < 1
            ? t("marketplace.outOfStock")
            : addToCartMutation.isPending
              ? t("marketplace.addingToCart")
              : t("marketplace.addToCart")}
        </button>
      </div>
    </div>
  );
}
