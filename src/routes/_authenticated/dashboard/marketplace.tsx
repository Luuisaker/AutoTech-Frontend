import { createFileRoute } from "@tanstack/react-router";
import { Car, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/marketplace")({
  component: MarketplacePage,
});

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Transmisión Automática 6 Velocidades",
    brand: "Aisin",
    totalPrice: "$850",
    monthlyPrice: "$75",
    months: 12,
  },
  {
    id: 2,
    name: "Set de Amortiguadores Delanteros",
    brand: "Monroe",
    totalPrice: "$240",
    monthlyPrice: "$40",
    months: 6,
  },
  {
    id: 3,
    name: "Motor V8 Reconstruido 5.0L",
    brand: "Ford",
    totalPrice: "$2,100",
    monthlyPrice: "$175",
    months: 12,
  },
  {
    id: 4,
    name: "Kit de Embrague Completo",
    brand: "LuK",
    totalPrice: "$320",
    monthlyPrice: "$53",
    months: 6,
  },
  {
    id: 5,
    name: "Batería AGM 850 CCA",
    brand: "Bosch",
    totalPrice: "$180",
    monthlyPrice: "$60",
    months: 3,
  },
  {
    id: 6,
    name: "Alternador 130 Amp",
    brand: "Denso",
    totalPrice: "$150",
    monthlyPrice: "$50",
    months: 3,
  },
];

function MarketplacePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encuentra y financia los repuestos que tu vehículo necesita.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar repuestos..."
              className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none">
            <option>Filtrar por: Relevancia</option>
            <option>Menor precio</option>
            <option>Mayor precio</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: (typeof MOCK_PRODUCTS)[0] }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-border-strong hover:shadow-sm">
      <div className="relative flex aspect-[4/3] w-full items-center justify-center border-b border-border bg-background p-6">
        <div className="absolute inset-0 bg-gradient-to-t from-surface/50 to-transparent" />
        <Car className="h-16 w-16 text-border-500 opacity-50 transition-transform duration-500 group-hover:scale-110" />
        <span className="absolute left-3 top-3 inline-flex rounded-full border border-border bg-surface/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
          {product.brand}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.name}
        </h3>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Precio total</p>
            <p className="font-mono text-lg font-semibold">{product.totalPrice}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Desde</p>
            <p className="font-mono text-sm font-medium text-primary">
              {product.monthlyPrice}
              <span className="text-xs text-muted-foreground">/mes</span>
            </p>
          </div>
        </div>

        <button className="mt-6 flex w-full items-center justify-center rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]">
          Solicitar financiamiento
        </button>
      </div>
    </div>
  );
}
