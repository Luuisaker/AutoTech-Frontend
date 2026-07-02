import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { getToken } from "../lib/token";
import { useAuth } from "../lib/auth-context";
import {
  Loader2,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Car,
  Store,
  Menu,
  ChevronDown,
  LogOut,
  Clock,
  CreditCard,
  Building2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

const MAIN_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", to: "/dashboard" as const },
  { icon: ShoppingCart, label: "Carrito", to: "/dashboard/cart" as const },
  { icon: ShoppingBag, label: "Marketplace", to: "/dashboard/marketplace" as const },
  { icon: CreditCard, label: "Órdenes", to: "/dashboard/purchases" as const },
  { icon: Store, label: "Red de Talleres", to: "/dashboard/workshops" as const },
];

const CLIENT_ITEMS = [
  { icon: Car, label: "Mis Vehículos", to: "/dashboard/vehicles" as const },
];

const WORKSHOP_ITEMS = [
  { icon: Building2, label: "Mis Talleres", to: "/dashboard/my-workshops" as const },
];

function AuthenticatedLayout() {
  const { user, isLoading, roles, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(`${path}/`));

  const initials =
    (user?.first_name?.[0] ?? "") + (user?.last_name?.[0] ?? "");

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-6">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">AutoTech</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <div className="mb-2 mt-4 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menú Principal
          </div>
          {MAIN_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}

          {!roles.includes("WORKSHOP_OWNER") && !roles.includes("ADMIN") && (
            <>
              <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Vehículos
              </div>
              {CLIENT_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {(roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN")) && (
            <>
              <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Talleres
              </div>
              {WORKSHOP_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            to="/dashboard/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`mb-3 flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors ${
              isActive("/dashboard/settings")
                ? "bg-primary/10 text-primary"
                : "bg-surface hover:bg-border/50"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-border-strong">
              <span className="text-xs font-medium text-foreground">
                {initials ? initials : "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roles.includes("ADMIN")
                  ? "Administrador"
                  : roles.includes("WORKSHOP_OWNER")
                    ? "Dueño de Taller"
                    : "Propietario"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>

          <button
            onClick={logout}
            className="cursor-pointer flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-border bg-surface/50 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border-strong bg-background">
      <div className="h-3 w-3 rounded-sm bg-primary" />
    </div>
  );
}
