import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { getToken } from "../lib/token";
import { useAuth } from "../lib/auth-context";
import {
  Loader2,
  LayoutDashboard,
  ShoppingBag,
  Car,
  Store,
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Clock,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", to: "/dashboard" as const },
  { icon: Car, label: "Mis Vehículos", to: "/dashboard/vehicles" as const },
  { icon: ShoppingBag, label: "Marketplace", to: "/dashboard/marketplace" as const },
  { icon: Clock, label: "Historial", to: "/dashboard/history" as const },
  { icon: CreditCard, label: "Mis Cuotas", to: "/dashboard/installments" as const },
];

const WORKSHOP_ITEMS = [
  { icon: Store, label: "Red Certificada", to: "/dashboard/workshops" as const },
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
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
          {NAV_ITEMS.map((item) => (
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
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground">
            <Settings className="h-4 w-4" />
            Configuración
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/50 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative grid h-10 w-10 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-border-strong">
                <span className="text-xs font-medium text-muted-foreground">
                  {user?.first_name?.charAt(0)?.toUpperCase()}
                  {user?.last_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {roles.includes("ADMIN")
                    ? "Administrador"
                    : roles.includes("WORKSHOP_OWNER")
                      ? "Dueño de Taller"
                      : "Conductor"}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </div>
          </div>
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
