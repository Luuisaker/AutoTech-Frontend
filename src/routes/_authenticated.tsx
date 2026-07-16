import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { getToken } from "../lib/token";
import { useAuth } from "../lib/auth-context";
import { useLocale } from "../lib/locale-context";
import { Logo } from "../components/Logo";
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
  User,
  Shield,
  Wrench,
  Truck,
  Wallet,
  Percent,
} from "lucide-react";
import { getPhotoUrl } from "../lib/api";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getToken()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

const MAIN_ITEMS: { icon: React.ComponentType<{ className?: string }>; labelKey: string; to: string }[] = [
  { icon: LayoutDashboard, labelKey: "nav.summary", to: "/dashboard" },
  { icon: ShoppingCart, labelKey: "nav.cart", to: "/dashboard/cart" },
  { icon: ShoppingBag, labelKey: "nav.marketplace", to: "/dashboard/marketplace" },
  { icon: CreditCard, labelKey: "nav.orders", to: "/dashboard/purchases" },
  { icon: Store, labelKey: "nav.workshopNetwork", to: "/dashboard/workshops" },
];

const CLIENT_ITEMS: { icon: React.ComponentType<{ className?: string }>; labelKey: string; to: string }[] = [
  { icon: Wallet, labelKey: "nav.myCredit", to: "/dashboard/credit-line" },
  { icon: Car, labelKey: "nav.myVehicles", to: "/dashboard/vehicles" },
  { icon: Wrench, labelKey: "nav.services", to: "/dashboard/services" },
  { icon: Truck, labelKey: "nav.serviceOrders", to: "/dashboard/service-orders" },
];

const WORKSHOP_ITEMS: { icon: React.ComponentType<{ className?: string }>; labelKey: string; to: string }[] = [
  { icon: Building2, labelKey: "nav.myWorkshops", to: "/dashboard/my-workshops" },
  { icon: Percent, labelKey: "nav.commissions", to: "/dashboard/commissions" },
  { icon: Wallet, labelKey: "nav.myCredit", to: "/dashboard/credit-line" },
];

function AuthenticatedLayout() {
  const { user, isLoading, roles, logout } = useAuth();
  const { t } = useLocale();
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

  const initials = (user?.first_name?.[0] ?? "") + (user?.last_name?.[0] ?? "");

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
          <Logo size={28} withText />
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {roles.includes("ADMIN") || roles.includes("SUPERADMIN") ? (
            <>
              <div className="mb-2 mt-4 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("nav.admin")}
              </div>
              <Link
                to="/dashboard/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive("/dashboard/admin")
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4 shrink-0" />
                {t("nav.adminPanel")}
              </Link>
            </>
          ) : (
            <>
              <div className="mb-2 mt-4 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("nav.mainMenu")}
              </div>
              {MAIN_ITEMS.filter(
                (item) => !(item.to === "/dashboard/cart" && (roles.includes("ADMIN") || roles.includes("SUPERADMIN"))),
              ).map((item) => (
                <Link
                  key={item.to}
                  to={item.to as any}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive(item.to)
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 shrink-0 ${isActive(item.to) ? "text-primary" : ""}`}
                  />
                  {t(item.labelKey)}
                </Link>
              ))}

              {!roles.includes("WORKSHOP_OWNER") && (
                <>
                  <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("nav.vehicles")}
                  </div>
                  {CLIENT_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to as any}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive(item.to)
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${isActive(item.to) ? "text-primary" : ""}`}
                      />
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </>
              )}

              {roles.includes("WORKSHOP_OWNER") && (
                <>
                  <div className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("nav.workshops")}
                  </div>
                  {WORKSHOP_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to as any}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive(item.to)
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${isActive(item.to) ? "text-primary" : ""}`}
                      />
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </>
              )}
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {user?.photo_url ? (
                <img
                  src={getPhotoUrl(user.photo_url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-foreground">
                  {initials ? initials : <User className="h-4 w-4 text-muted-foreground" />}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roles.includes("ADMIN")
                  ? t("nav.adminLabel")
                  : roles.includes("SUPERADMIN")
                    ? t("nav.superAdminLabel")
                    : roles.includes("WORKSHOP_OWNER")
                      ? t("nav.workshopOwnerLabel")
                      : t("nav.ownerLabel")}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>

          <button
            onClick={logout}
            className="cursor-pointer flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
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

