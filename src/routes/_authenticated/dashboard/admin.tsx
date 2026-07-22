import {
  createFileRoute,
  redirect,
  Link,
  useNavigate,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Users,
  Store,
  Package,
  Car,
  ShoppingBag,
  BarChart3,
  CheckCircle,
  Trash2,
  ShieldCheck,
  CreditCard,
  Pencil,
  X,
  Save,
  Ban,
  Check,
  Wrench,
  ClipboardList,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Search,
  Wallet,
  TrendingUp,
  Percent,
  AlertTriangle,
  Plus,
  Building2,
  Smartphone,
  Mail,
  Phone,
  UserPlus,
  XCircle,
  CheckCircle2,
  Headphones,
  Star,
  Eye,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { getToken, decodeJwt } from "../../../lib/token";
import { InfoDialog } from "@/components/ui/info-dialog";
import {
  getAdminStats,
  adminListUsers,
  adminDeleteUser,
  adminGetOpenOrders,
  adminUpdateUser,
  adminListWorkshops,
  adminUpdateWorkshop,
  adminDeleteWorkshop,
  adminListParts,
  adminUpdatePart,
  adminDeletePart,
  adminListVehicles,
  adminUpdateVehicle,
  adminDeleteVehicle,
  adminListOrders,
  adminDeleteOrder,
  adminForceCloseOrder,
  adminDeleteServiceOrder,
  adminListServiceOrders,
  type AdminOrder,
  type AdminServiceOrder,
  type AdminVehicle,
  type AdminUser,
  type AdminUpdateUserInput,
  type AdminPart,
  type AdminWorkshop,
  type AdminUpdateWorkshopInput,
  adminGetEarnings,
  type AdminOwnerEarnings,
  type AdminWorkshopEarnings,
  type PeriodFilter,
  adminGetCreditLines,
  adminUpdateCreditLine,
  adminGetLimitRequests,
  adminReviewLimitRequest,
  adminListCommissions,
  adminMarkAllCommissionsPaid,
  adminMarkAllCommissionsErroneous,
  adminGetCutoff,
  adminListLateFees,
  adminVerifyLateFee,
  adminMarkLateFeePaid,
  adminMarkLateFeeErroneous,
  adminListPaymentMethods,
  adminCreatePaymentMethod,
  adminTogglePaymentMethod,
  adminDeletePaymentMethod,
  adminCreateUser,
  getWorkshopBanks,
  type AdminCreditLine,
  type AdminLimitReview,
  type AdminCommission,
  type CommissionItem,
  type CutoffSummary,
  type AdminLateFee,
  type AdminPaymentMethod,
  type CreateAdminPaymentMethodInput,
  type SuperadminCreateUserInput,
  adminListSupportMessages,
  resolveSupportMessage,
  rejectSupportMessage,
  getLateFeesUsersSummary,
  getUserOrdersSummary,
  type SupportMessageDTO,
  type LateFeeUserSummaryDTO,
  type UserOrderSummaryDTO,
} from "../../../lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import { useLocale } from "../../../lib/locale-context";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminPage,
  beforeLoad: () => {
    const token = getToken();
    if (!token) throw redirect({ to: "/auth" });
    const payload = decodeJwt(token);
    if (!payload?.roles?.includes("ADMIN") && !payload?.roles?.includes("SUPERADMIN")) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

type Tab =
  "stats" | "users" | "workshops" | "parts" | "vehicles" | "orders" | "service-orders" | "earnings" | "credit" | "commissions" | "late-fees" | "support" | "payment-methods";

const TABS: { key: Tab; labelKey: string; icon: React.ComponentType<{ className?: string }>; superadminOnly?: boolean; adminOnly?: boolean }[] = [
  { key: "stats", labelKey: "admin.tabs.stats", icon: BarChart3 },
  { key: "users", labelKey: "admin.tabs.users", icon: Users },
  { key: "credit", labelKey: "admin.tabs.credit", icon: Wallet, adminOnly: true },
  { key: "workshops", labelKey: "admin.tabs.workshops", icon: Store },
  { key: "parts", labelKey: "admin.tabs.parts", icon: Package, adminOnly: true },
  { key: "vehicles", labelKey: "admin.tabs.vehicles", icon: Car, adminOnly: true },
  { key: "orders", labelKey: "admin.tabs.orders", icon: CreditCard },
  { key: "service-orders", labelKey: "admin.tabs.serviceOrders", icon: Wrench },
  { key: "earnings", labelKey: "admin.tabs.earnings", icon: DollarSign }, 
  { key: "commissions", labelKey: "admin.tabs.commissions", icon: Percent, superadminOnly: true },
  { key: "late-fees", labelKey: "admin.tabs.lateFees", icon: AlertTriangle, superadminOnly: true },
  { key: "support", labelKey: "adminSupport.title", icon: Headphones },
  { key: "payment-methods", labelKey: "admin.tabs.paymentMethods", icon: CreditCard, superadminOnly: true },
];

function AdminPage() {
  const { roles } = useAuth();
  const location = useLocation();
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem("admin-tab");
    return (saved as Tab) || "stats";
  });

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    sessionStorage.setItem("admin-tab", newTab);
  };

  if (!roles.includes("ADMIN") && !roles.includes("SUPERADMIN")) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{t("admin.noPermissions")}</p>
      </div>
    );
  }

  if (location.pathname !== "/dashboard/admin") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("admin.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {TABS.filter((tabItem) => {
          if (tabItem.superadminOnly && !roles.includes("SUPERADMIN")) return false;
          if (tabItem.adminOnly && roles.includes("SUPERADMIN")) return false;
          return true;
        }).map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => handleTabChange(tabItem.key)}
            className={`flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all flex-1 min-w-fit ${
              tab === tabItem.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tabItem.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(tabItem.labelKey)}</span>
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "workshops" && <WorkshopsTab />}
      {tab === "parts" && <PartsTab />}
      {tab === "vehicles" && <VehiclesTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "service-orders" && <ServiceOrdersTab />}
      {tab === "earnings" && <EarningsTab />}
      {tab === "credit" && <CreditTab />}
      {tab === "commissions" && <CommissionsTab />}
      {tab === "late-fees" && <LateFeesTab />}
      {tab === "support" && <SupportTab />}
      {tab === "payment-methods" && <PaymentMethodsTab />}
    </div>
  );
}

// ---- Stats Tab ----

function StatsTab() {
  const { t } = useLocale();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: Users, label: t("admin.stats.users"), value: String(stats.total_users), color: "text-blue-500" },
    { icon: Store, label: t("admin.stats.workshops"), value: String(stats.total_workshops), color: "text-emerald-500" },
    {
      icon: CheckCircle,
      label: t("admin.stats.certified"),
      value: String(stats.total_certified_workshops),
      color: "text-emerald-500",
    },
    { icon: Package, label: t("admin.stats.parts"), value: String(stats.total_parts), color: "text-amber-500" },
    { icon: Car, label: t("admin.stats.vehicles"), value: String(stats.total_vehicles), color: "text-violet-500" },
    { icon: ShoppingBag, label: t("admin.stats.sales"), value: String(stats.total_sales), color: "text-cyan-500" },
    {
      icon: BarChart3,
      label: t("admin.stats.revenue30days"),
      value: `$${stats.total_revenue.toFixed(2)}`,
      color: "text-green-500",
    },
    {
      icon: CreditCard,
      label: t("admin.stats.totalFinanced"),
      value: `$${stats.total_financed.toFixed(2)}`,
      color: "text-purple-500",
    },
    {
      icon: Wallet,
      label: t("admin.stats.creditLine"),
      value: t("admin.stats.creditLineValue", undefined, { limit: stats.total_credit_limit.toFixed(2), available: stats.total_credit_available.toFixed(2) }),
      color: "text-blue-500",
    },
    {
      icon: TrendingUp,
      label: t("admin.stats.currentFinancing"),
      value: `$${stats.total_financing.toFixed(2)}`,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
      {cards.map((c) => (
        <div key={c.label} className="ml-card flex items-center gap-4 p-5">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-current/15 ${c.color}`}
          >
            <c.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold tracking-tight">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Users Tab ----

function UsersTab() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const { t } = useLocale();
  const isSuperadmin = roles.includes("SUPERADMIN");
  const [search, setSearch] = useState("");
  const {
    data: users,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => adminListUsers(search || undefined),
    placeholderData: (prev) => prev,
  });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCi, setEditCi] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);

  const [confirmSuspendUser, setConfirmSuspendUser] = useState<AdminUser | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUser | null>(null);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [openOrdersWarning, setOpenOrdersWarning] = useState<{ id: string; count: number } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<SuperadminCreateUserInput>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    ci: "",
    phone: "+58",
    role: "CLIENT",
    credit_level: 1,
    parts_credit_limit: 150,
    service_credit_limit: 50,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => adminDeleteUser(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.userDeleted"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  async function deleteUser(id: string) {
    try {
      const { open_orders } = await adminGetOpenOrders("users", id);
      if (open_orders > 0) {
        setOpenOrdersWarning({ id, count: open_orders });
        return;
      }
    } catch {
      /* ignore pre-check failure and fall through to the delete attempt */
    }
    deleteMutation.mutate({ id });
  }

  const createUserMutation = useMutation({
    mutationFn: (input: SuperadminCreateUserInput) => adminCreateUser(input),
    onSuccess: () => {
      toast.success(t("admin.users.userCreated"));
      setShowCreateForm(false);
      setCreateForm({ email: "", password: "", first_name: "", last_name: "", ci: "", phone: "+58", role: "CLIENT", credit_level: 1, parts_credit_limit: 150, service_credit_limit: 50 });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.users.errorCreating"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateUserInput }) =>
      adminUpdateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
  });

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setEditFirstName(user.first_name);
    setEditLastName(user.last_name);
    setEditPhone(user.phone ?? "");
    setEditEmail(user.email ?? "");
    setEditCi(user.ci ?? "");
    setEditRoles([...user.roles]);
  }

  function toggleRole(role: string) {
    if (role === "ADMIN" && !isSuperadmin) return;
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  if (isLoading && !users) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.searchPlaceholder")}
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {isSuperadmin && (
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            {t("admin.users.newUser")}
          </button>
        )}
      </div>

      {isSuperadmin && showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("admin.users.createNewUser")}</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.users.firstName")}</label>
                  <input type="text" value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} placeholder={t("admin.users.firstName")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.users.lastName")}</label>
                  <input type="text" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} placeholder={t("admin.users.lastName")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.email")}</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@ejemplo.com" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.users.password")}</label>
                  <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="********" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.ci")}</label>
                  <input type="text" value={createForm.ci} onChange={(e) => setCreateForm({ ...createForm, ci: e.target.value })} placeholder="V-12345678" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.phone")}</label>
                  <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+58412..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.users.role")}</label>
                  <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as SuperadminCreateUserInput["role"] })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="CLIENT">{t("admin.users.roleClient")}</option>
                    <option value="WORKSHOP_OWNER">{t("admin.users.roleWorkshopOwner")}</option>
                    {isSuperadmin && <option value="ADMIN">{t("admin.users.roleAdmin")}</option>}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => createUserMutation.mutate(createForm)}
                  disabled={!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name || !createForm.ci || createUserMutation.isPending}
                  className="ml-btn ml-btn-primary flex-1"
                >
                  {createUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("admin.users.createUser")}
                </button>
                <button onClick={() => setShowCreateForm(false)} className="ml-btn ml-btn-outline flex-1">
                  {t("admin.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.name")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.email")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.ci")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.users.roles")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-border transition-colors hover:bg-border/20 ${u.is_suspended ? "opacity-60" : ""}`}
              >
                <td className="px-4 py-3 font-medium">
                  {u.first_name} {u.last_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.ci}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {r === "ADMIN" ? t("admin.users.roleAdmin") : r === "SUPERADMIN" ? t("admin.users.roleSuperadmin") : r === "WORKSHOP_OWNER" ? t("admin.users.roleWorkshopOwner") : t("admin.users.roleClient")}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.is_suspended ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                      <Ban className="h-3 w-3" />
                      {t("admin.suspended")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      {t("admin.active")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmSuspendUser(u)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-400"
                      title={u.is_suspended ? t("admin.users.restore") : t("admin.users.suspend")}
                    >
                      {u.is_suspended ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(u)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title={t("admin.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUser(u)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title={t("admin.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("admin.users.editUser")}</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nombre
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("admin.users.lastName")}
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("admin.phone")}
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="04141234567"
                />
              </div>
              {isSuperadmin && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.email")}
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              )}
              {isSuperadmin && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.ci")}
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editCi}
                    onChange={(e) => setEditCi(e.target.value)}
                    placeholder="V-12345678"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("admin.users.roles")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(isSuperadmin ? ["CLIENT", "WORKSHOP_OWNER", "ADMIN"] : ["CLIENT", "WORKSHOP_OWNER"]).map((role) => (
                    <label
                      key={role}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        editRoles.includes(role)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="hidden"
                      />
                      {role === "ADMIN"
                        ? t("admin.users.roleAdmin")
                        : role === "WORKSHOP_OWNER"
                          ? t("admin.users.roleWorkshopOwner")
                          : t("admin.users.roleClient")}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {updateMutation.isError && (
              <p className="mt-3 text-xs text-destructive">
                {(updateMutation.error as any)?.response?.data?.detail ?? t("admin.users.errorUpdating")}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="ml-btn ml-btn-outline">
                {t("admin.cancel")}
              </button>
              <button
                onClick={() => {
                  const input: AdminUpdateUserInput = {};
                  if (editFirstName.trim() !== editingUser.first_name)
                    input.first_name = editFirstName.trim();
                  if (editLastName.trim() !== editingUser.last_name)
                    input.last_name = editLastName.trim();
                  if (editPhone.trim() !== (editingUser.phone ?? ""))
                    input.phone = editPhone.trim();
                  if (isSuperadmin && editEmail.trim() !== (editingUser.email ?? ""))
                    input.email = editEmail.trim();
                  if (isSuperadmin && editCi.trim() !== (editingUser.ci ?? ""))
                    input.ci = editCi.trim();
                  const sortedRoles = [...editRoles].sort();
                  const origRoles = [...editingUser.roles].sort();
                  if (JSON.stringify(sortedRoles) !== JSON.stringify(origRoles))
                    input.roles = editRoles;
                  if (Object.keys(input).length === 0) {
                    setEditingUser(null);
                    return;
                  }
                  updateMutation.mutate({ id: editingUser.id, input });
                }}
                disabled={updateMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmSuspendUser}
        onOpenChange={(open) => {
          if (!open) setConfirmSuspendUser(null);
        }}
        title={confirmSuspendUser?.is_suspended ? t("admin.users.restoreUser") : t("admin.users.suspendUser")}
        description={
          confirmSuspendUser?.is_suspended
            ? t("admin.users.restoreConfirm")
            : t("admin.users.suspendConfirm")
        }
        confirmText={confirmSuspendUser?.is_suspended ? t("admin.users.restore") : t("admin.users.suspend")}
        onConfirm={() => {
          if (confirmSuspendUser) {
            updateMutation.mutate({
              id: confirmSuspendUser.id,
              input: { is_suspended: confirmSuspendUser.is_suspended ? 0 : 1 },
            });
            setConfirmSuspendUser(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteUser}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteUser(null);
        }}
        title={t("admin.users.deleteUser")}
        description={t("admin.users.deleteConfirm")}
        confirmText={t("admin.delete")}
        onConfirm={() => {
          if (confirmDeleteUser) {
            deleteUser(confirmDeleteUser.id);
            setConfirmDeleteUser(null);
          }
        }}
      />

      {showDeleteError && (
        <InfoDialog
          open={showDeleteError}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteError(false);
              setDeleteError("");
            }
          }}
          title={t("admin.cannotDelete")}
          description={deleteError}
        />
      )}

      {openOrdersWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold tracking-tight">{t("admin.users.deleteUser")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("admin.users.hasOpenOrdersDesc", undefined, { n: openOrdersWarning.count })}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenOrdersWarning(null)}
                className="ml-btn ml-btn-outline"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMutation.mutate({ id: openOrdersWarning.id, force: true });
                  setOpenOrdersWarning(null);
                }}
                disabled={deleteMutation.isPending}
                className="ml-btn ml-btn-primary bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("admin.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---- Workshops Tab ----

function WorkshopsTab() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const {
    data: workshops,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-workshops", search],
    queryFn: () => adminListWorkshops(search || undefined),
    placeholderData: (prev) => prev,
  });
  const [editingWorkshop, setEditingWorkshop] = useState<AdminWorkshop | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRif, setEditRif] = useState("");

  const [confirmSuspendWorkshop, setConfirmSuspendWorkshop] = useState<AdminWorkshop | null>(null);
  const [confirmDeleteWorkshop, setConfirmDeleteWorkshop] = useState<AdminWorkshop | null>(null);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [openOrdersWarningW, setOpenOrdersWarningW] = useState<{ id: string; count: number } | null>(null);

  const toggleCertify = useMutation({
    mutationFn: ({ id, is_certified }: { id: string; is_certified: number }) =>
      adminUpdateWorkshop(id, { is_certified }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-workshops"] }),
  });

  const toggleSuspend = useMutation({
    mutationFn: ({ id, is_suspended }: { id: string; is_suspended: number }) =>
      adminUpdateWorkshop(id, { is_suspended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-workshops"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateWorkshopInput }) =>
      adminUpdateWorkshop(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
      setEditingWorkshop(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => adminDeleteWorkshop(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
      toast.success(t("admin.workshops.workshopDeleted"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  async function deleteWorkshop(id: string) {
    try {
      const { open_orders } = await adminGetOpenOrders("workshops", id);
      if (open_orders > 0) {
        setOpenOrdersWarningW({ id, count: open_orders });
        return;
      }
    } catch {
      /* ignore pre-check failure and fall through to the delete attempt */
    }
    deleteMutation.mutate({ id });
  }

  function openEdit(w: AdminWorkshop) {
    setEditingWorkshop(w);
    setEditName(w.name);
    setEditAddress(w.address);
    setEditRif(w.rif);
  }

  if (isLoading && !workshops) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.workshops.searchPlaceholder")}
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.name")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.workshops.rif")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.workshops.owner")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {workshops?.map((w) => (
              <tr
                key={w.id}
                className={`border-b border-border transition-colors hover:bg-border/20 ${w.is_suspended ? "opacity-60" : ""}`}
              >
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{w.rif}</td>
                <td className="px-4 py-3 text-muted-foreground">{w.owner_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        w.is_certified
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {w.is_certified ? t("admin.certified") : t("admin.notCertified")}
                    </span>
                    {w.is_suspended ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-400">
                        {t("admin.outOfService")}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(w)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title={t("admin.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        toggleCertify.mutate({
                          id: w.id,
                          is_certified: w.is_certified ? 0 : 1,
                        })
                      }
                      className={`cursor-pointer rounded p-1 transition-colors ${
                        w.is_certified
                          ? "text-amber-500 hover:bg-amber-500/10"
                          : "text-emerald-500 hover:bg-emerald-500/10"
                      }`}
                      title={w.is_certified ? t("admin.workshops.revokeCert") : t("admin.workshops.certify")}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmSuspendWorkshop(w)}
                      className={`cursor-pointer rounded p-1 transition-colors ${
                        w.is_suspended
                          ? "text-emerald-500 hover:bg-emerald-500/10"
                          : "text-red-500 hover:bg-red-500/10"
                      }`}
                      title={w.is_suspended ? t("admin.workshops.reactivate") : t("admin.workshops.suspend")}
                    >
                      {w.is_suspended ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteWorkshop(w)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title={t("admin.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingWorkshop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("admin.workshops.editWorkshop")}</h3>
              <button
                onClick={() => setEditingWorkshop(null)}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("admin.name")}
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.workshops.rif")}</label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editRif}
                  onChange={(e) => setEditRif(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("admin.workshops.address")}
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingWorkshop(null)} className="ml-btn ml-btn-outline">
                {t("admin.cancel")}
              </button>
              <button
                onClick={() => {
                  const input: AdminUpdateWorkshopInput = {};
                  if (editName.trim() !== editingWorkshop.name) input.name = editName.trim();
                  if (editAddress.trim() !== editingWorkshop.address)
                    input.address = editAddress.trim();
                  if (editRif.trim() !== editingWorkshop.rif) input.rif = editRif.trim();
                  if (Object.keys(input).length === 0) {
                    setEditingWorkshop(null);
                    return;
                  }
                  updateMutation.mutate({ id: editingWorkshop.id, input });
                }}
                disabled={updateMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmSuspendWorkshop}
        onOpenChange={(open) => {
          if (!open) setConfirmSuspendWorkshop(null);
        }}
        title={confirmSuspendWorkshop?.is_suspended ? t("admin.workshops.reactivate") : t("admin.workshops.suspend")}
        description={
          confirmSuspendWorkshop?.is_suspended
            ? t("admin.workshops.reactivateConfirm")
            : t("admin.workshops.suspendConfirm")
        }
        confirmText={confirmSuspendWorkshop?.is_suspended ? t("admin.workshops.reactivate") : t("admin.workshops.suspend")}
        onConfirm={() => {
          if (confirmSuspendWorkshop) {
            toggleSuspend.mutate({
              id: confirmSuspendWorkshop.id,
              is_suspended: confirmSuspendWorkshop.is_suspended ? 0 : 1,
            });
            setConfirmSuspendWorkshop(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteWorkshop}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteWorkshop(null);
        }}
        title={t("admin.workshops.deleteWorkshop")}
        description={t("admin.workshops.deleteConfirm")}
        confirmText={t("admin.delete")}
        onConfirm={() => {
          if (confirmDeleteWorkshop) {
            deleteWorkshop(confirmDeleteWorkshop.id);
            setConfirmDeleteWorkshop(null);
          }
        }}
      />
      {showDeleteError && (
        <InfoDialog
          open={showDeleteError}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteError(false);
              setDeleteError("");
            }
          }}
          title={t("admin.cannotDelete")}
          description={deleteError}
        />
      )}

      {openOrdersWarningW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold tracking-tight">{t("admin.workshops.deleteWorkshop")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("admin.workshops.hasOpenOrdersDesc", undefined, { n: openOrdersWarningW.count })}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenOrdersWarningW(null)}
                className="ml-btn ml-btn-outline"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMutation.mutate({ id: openOrdersWarningW.id, force: true });
                  setOpenOrdersWarningW(null);
                }}
                disabled={deleteMutation.isPending}
                className="ml-btn ml-btn-primary bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("admin.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---- Parts Tab ----

function PartsTab() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const {
    data: parts,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-parts", search],
    queryFn: () => adminListParts(search || undefined, false),
    placeholderData: (prev) => prev,
  });
  const [editingPart, setEditingPart] = useState<AdminPart | null>(null);
  const [editPartName, setEditPartName] = useState("");
  const [editPartPrice, setEditPartPrice] = useState(0);
  const [editPartStock, setEditPartStock] = useState(0);
  const [editPartActive, setEditPartActive] = useState(0);

  const [confirmDeletePart, setConfirmDeletePart] = useState<AdminPart | null>(null);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: import("../../../lib/api").AdminUpdatePartInput;
    }) => adminUpdatePart(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
      setEditingPart(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
      toast.success(t("admin.parts.partDeleted"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  function deletePart(id: string) {
    deleteMutation.mutate(id);
  }

  function openEditPart(p: AdminPart) {
    setEditingPart(p);
    setEditPartName(p.name);
    setEditPartPrice(p.price);
    setEditPartStock(p.stock);
    setEditPartActive(p.is_active);
  }

  if (isLoading && !parts) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.parts.searchPlaceholder")}
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.name")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.parts.price")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.parts.stock")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.parts.workshop")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {parts?.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border transition-colors hover:bg-border/20"
              >
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">${p.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${p.is_active ? "text-emerald-400" : "text-muted-foreground"}`}
                  >
                    {p.is_active ? t("admin.active") : t("admin.inactive")}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.workshop_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPart(p)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title={t("admin.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeletePart(p)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("admin.parts.editPart")}</h3>
              <button
                onClick={() => setEditingPart(null)}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("admin.name")}
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editPartName}
                  onChange={(e) => setEditPartName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.parts.price")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editPartPrice}
                    onChange={(e) => setEditPartPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.parts.stock")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editPartStock}
                    onChange={(e) => setEditPartStock(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editPartActive === 1}
                    onChange={(e) => setEditPartActive(e.target.checked ? 1 : 0)}
                    className="rounded border-border"
                  />
                  {t("admin.active")}
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingPart(null)} className="ml-btn ml-btn-outline">
                {t("admin.cancel")}
              </button>
              <button
                onClick={() => {
                  const input: import("../../../lib/api").AdminUpdatePartInput = {};
                  if (editPartName.trim() !== editingPart.name) input.name = editPartName.trim();
                  if (editPartPrice !== editingPart.price) input.price = editPartPrice;
                  if (editPartStock !== editingPart.stock) input.stock = editPartStock;
                  if (editPartActive !== editingPart.is_active) input.is_active = editPartActive;
                  if (Object.keys(input).length === 0) {
                    setEditingPart(null);
                    return;
                  }
                  updateMutation.mutate({ id: editingPart.id, input });
                }}
                disabled={updateMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeletePart}
        onOpenChange={(open) => {
          if (!open) setConfirmDeletePart(null);
        }}
        title={t("admin.parts.deletePart")}
        description={t("admin.parts.deleteConfirm")}
        confirmText={t("admin.delete")}
        onConfirm={() => {
          if (confirmDeletePart) {
            deletePart(confirmDeletePart.id);
            setConfirmDeletePart(null);
          }
        }}
      />

      {showDeleteError && (
        <InfoDialog
          open={showDeleteError}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteError(false);
              setDeleteError("");
            }
          }}
          title={t("admin.cannotDelete")}
          description={deleteError}
        />
      )}
    </>
  );
}

// ---- Vehicles Tab ----

function VehiclesTab() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const {
    data: vehicles,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-vehicles", search],
    queryFn: () => adminListVehicles(search || undefined),
    placeholderData: (prev) => prev,
  });
  const [editingVehicle, setEditingVehicle] = useState<AdminVehicle | null>(
    null,
  );
  const [editVBrand, setEditVBrand] = useState("");
  const [editVModel, setEditVModel] = useState("");
  const [editVYear, setEditVYear] = useState(0);
  const [editVPlate, setEditVPlate] = useState("");
  const [editVType, setEditVType] = useState<string>("CAR");

  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState<
    AdminVehicle | null
  >(null);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: import("../../../lib/api").AdminUpdateVehicleInput;
    }) => adminUpdateVehicle(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      setEditingVehicle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] });
      toast.success(t("admin.vehicles.vehicleDeleted"));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  async function deleteVehicle(id: string) {
    try {
      const { open_orders } = await adminGetOpenOrders("vehicles", id);
      if (open_orders > 0) {
        toast.error(t("admin.vehicles.hasOpenOrders"));
        return;
      }
    } catch {
      /* ignore pre-check failure and fall through to the delete attempt */
    }
    deleteMutation.mutate(id);
  }

  function openEditVehicle(v: AdminVehicle) {
    setEditingVehicle(v);
    setEditVBrand(v.brand);
    setEditVModel(v.model);
    setEditVYear(v.year);
    setEditVPlate(v.license_plate);
    setEditVType(v.vehicle_type);
  }

  if (isLoading && !vehicles) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.vehicles.searchPlaceholder")}
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.owner")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.brand")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.model")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.year")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.plate")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.type")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {vehicles?.map((v) => (
              <tr
                key={v.id}
                className="border-b border-border transition-colors hover:bg-border/20"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{v.owner_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{v.owner_ci ?? ""}</div>
                </td>
                <td className="px-4 py-3 font-medium">{v.brand}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.model}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.year}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.license_plate}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {v.vehicle_type === "CAR" ? t("admin.vehicles.car") : t("admin.vehicles.motorcycle")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditVehicle(v)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title={t("admin.edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteVehicle(v)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("admin.vehicles.editVehicle")}</h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.vehicles.brand")}
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editVBrand}
                    onChange={(e) => setEditVBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.vehicles.model")}
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editVModel}
                    onChange={(e) => setEditVModel(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.vehicles.year")}
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editVYear}
                    onChange={(e) => setEditVYear(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t("admin.vehicles.plate")}
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editVPlate}
                    onChange={(e) => setEditVPlate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.vehicles.type")}</label>
                <div className="flex gap-2">
                  {(["CAR", "MOTORCYCLE"] as const).map((vt) => (
                    <label
                      key={vt}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        editVType === vt
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="vtype"
                        checked={editVType === vt}
                        onChange={() => setEditVType(vt)}
                        className="hidden"
                      />
                      {vt === "CAR" ? t("admin.vehicles.car") : t("admin.vehicles.motorcycle")}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingVehicle(null)} className="ml-btn ml-btn-outline">
                {t("admin.cancel")}
              </button>
              <button
                onClick={() => {
                  const input: import("../../../lib/api").AdminUpdateVehicleInput = {};
                  if (editVBrand.trim() !== editingVehicle.brand) input.brand = editVBrand.trim();
                  if (editVModel.trim() !== editingVehicle.model) input.model = editVModel.trim();
                  if (editVYear !== editingVehicle.year) input.year = editVYear;
                  if (editVPlate.trim() !== editingVehicle.license_plate)
                    input.license_plate = editVPlate.trim();
                  if (editVType !== editingVehicle.vehicle_type) input.vehicle_type = editVType;
                  if (Object.keys(input).length === 0) {
                    setEditingVehicle(null);
                    return;
                  }
                  updateMutation.mutate({ id: editingVehicle.id, input });
                }}
                disabled={updateMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteVehicle}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteVehicle(null);
        }}
        title={t("admin.vehicles.deleteVehicle")}
        description={t("admin.vehicles.deleteConfirm")}
        confirmText={t("admin.delete")}
        onConfirm={() => {
          if (confirmDeleteVehicle) {
            deleteVehicle(confirmDeleteVehicle.id);
            setConfirmDeleteVehicle(null);
          }
        }}
      />

      {showDeleteError && (
        <InfoDialog
          open={showDeleteError}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeleteError(false);
              setDeleteError("");
            }
          }}
          title={t("admin.cannotDelete")}
          description={deleteError}
        />
      )}
    </>
  );
}

// ---- Orders Tab ----

function OrdersTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<AdminOrder | null>(null);
  const [confirmForceClose, setConfirmForceClose] = useState<AdminOrder | null>(null);
  const { roles } = useAuth();
  const isSuperadmin = roles.includes("SUPERADMIN");
  const {
    data: orders,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-orders", search, statusFilter],
    queryFn: () => adminListOrders(search || undefined, statusFilter || undefined),
    placeholderData: (prev) => prev,
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => adminDeleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(t("admin.orders.orderDeleted"));
      setConfirmDeleteOrder(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  const forceCloseMutation = useMutation({
    mutationFn: (id: string) => adminForceCloseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(t("admin.orders.orderForceClosed"));
      setConfirmForceClose(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  if (isLoading && !orders) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedOrders = [...(orders ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.orders.searchPlaceholder")}
          className="ml-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-input px-3 py-2 pr-8"
        >
          <option value="">{t("admin.orders.allStatuses")}</option>
          <option value="PENDING">{t("admin.orders.pending")}</option>
          <option value="CLOSED">{t("admin.orders.closed")}</option>
        </select>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.orders.id")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.buyer")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.workshop")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.total")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.payment")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.date")}</th>
              {isSuperadmin && <th className="px-4 py-3 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((o) => (
              <tr
                key={o.id}
                onClick={() =>
                  navigate({ to: "/dashboard/purchases/$purchaseId", params: { purchaseId: o.id } })
                }
                className="cursor-pointer border-b border-border transition-colors hover:bg-border/20"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {o.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{o.buyer_name}</p>
                  {o.buyer_ci && <p className="text-xs text-muted-foreground">CI: {o.buyer_ci}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{o.workshop_name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">
                  ${o.total_amount.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      o.status === "CLOSED"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {o.status === "CLOSED" ? t("admin.orders.closedBadge") : t("admin.orders.pending")}
                  </span>
                  {o.status !== "CLOSED" && o.installments_pending_verification > 0 && (
                    <p className="mt-1 text-[10px] text-amber-400">
                      {t("admin.orders.pendingVerification", undefined, { n: o.installments_pending_verification })}
                    </p>
                  )}
                  {o.status !== "CLOSED" && o.installments_pending > 0 && o.installments_pending_verification === 0 && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t("admin.orders.pendingInstallments", undefined, { n: o.installments_pending, s: o.installments_pending > 1 ? "s" : "" })}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      o.payment_type === "FINANCIADO"
                        ? "border border-purple-500/30 bg-purple-500/10 text-purple-400"
                        : "border border-blue-500/30 bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {o.payment_type === "FINANCIADO" ? t("admin.orders.financed") : t("admin.orders.cash")}
                  </span>
                  {o.installments_paid === o.installment_count && o.installment_count > 0 ? (
                    <p className="mt-1 text-[10px] text-emerald-400">{t("admin.orders.paid")}</p>
                  ) : o.installments_pending_verification > 0 ? (
                    <p className="mt-1 text-[10px] text-amber-400">{t("admin.orders.toVerify")}</p>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t("admin.orders.installmentsPaid", undefined, { paid: o.installments_paid, total: o.installment_count })}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(o.created_at).toLocaleDateString("es-ES")}
                </td>
                {isSuperadmin && (
                  <td className="px-4 py-3">
                    {o.status !== "CLOSED" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmForceClose(o);
                        }}
                        className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                        title={t("admin.orders.forceClose")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteOrder(o);
                        }}
                        className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title={t("admin.orders.deleteOrder")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={isSuperadmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("admin.orders.noOrders")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteOrder}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteOrder(null);
        }}
        title={t("admin.orders.deleteOrderTitle")}
        description={t("admin.orders.deleteConfirm")}
        confirmText={t("admin.delete")}
        onConfirm={() => {
          if (confirmDeleteOrder) {
            deleteOrderMutation.mutate(confirmDeleteOrder.id);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmForceClose}
        onOpenChange={(open) => {
          if (!open) setConfirmForceClose(null);
        }}
        title={t("admin.orders.forceCloseTitle")}
        description={t("admin.orders.forceCloseConfirm")}
        confirmText={t("admin.orders.forceClose")}
        onConfirm={() => {
          if (confirmForceClose) {
            forceCloseMutation.mutate(confirmForceClose.id);
          }
        }}
      />
    </>
  );
}

// ---- Service Orders Tab ----

const SERVICE_ORDER_STYLES: Record<string, string> = {
  PENDING: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  REVISION_SENT: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
  AT_WORKSHOP: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  QUOTED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  ACCEPTED: "border border-green-500/30 bg-green-500/10 text-green-400",
  REJECTED: "border border-red-500/30 bg-red-500/10 text-red-400",
  IN_PROGRESS: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  COMPLETED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  SHIPPED: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  DELIVERED: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  CLOSED: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  DROPPED_OFF: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  CANCELLED: "border border-red-500/30 bg-red-500/10 text-red-400",
};

function ServiceOrdersTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmCancelServiceOrder, setConfirmCancelServiceOrder] =
    useState<AdminServiceOrder | null>(null);
  const [confirmDeleteServiceOrder, setConfirmDeleteServiceOrder] = useState<AdminServiceOrder | null>(null);
  const { roles } = useAuth();
  const isSuperadmin = roles.includes("SUPERADMIN");
  const statusGroups: Record<string, string[]> = {
    activo: ["PENDING", "DROPPED_OFF", "AT_WORKSHOP", "REVISION_SENT", "QUOTED", "REJECTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "SHIPPED", "DELIVERED"],
    finalizado: ["CLOSED", "CANCELLED"],
  };

  const {
    data: orders,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-service-orders", search, statusFilter],
    queryFn: () =>
      adminListServiceOrders(
        search || undefined,
        statusFilter || undefined,
      ),
    placeholderData: (prev) => prev,
  });

  const deleteServiceOrderMutation = useMutation({
    mutationFn: (id: string) => adminDeleteServiceOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-orders"] });
      toast.success(t("admin.serviceOrders.orderDeleted"));
      setConfirmDeleteServiceOrder(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? t("admin.errorDeleting");
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.serviceOrders.searchPlaceholder")}
            className="ml-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-input px-3 py-2 pr-8"
        >
          <option value="">{t("admin.serviceOrders.allStatuses")}</option>
          <option value="activo">{t("admin.serviceOrders.active")}</option>
          <option value="finalizado">{t("admin.serviceOrders.finished")}</option>
        </select>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.orders.id")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.serviceOrders.service")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.workshop")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.vehicles.vehicle")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.serviceOrders.owner")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.serviceOrders.price")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.orders.date")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr
                key={o.id}
                className="border-b border-border transition-colors hover:bg-border/20 cursor-pointer"
                onClick={() =>
                  navigate({
                    to: "/dashboard/admin/service-orders/$orderId",
                    params: { orderId: o.id },
                  })
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {o.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 font-medium">{o.service_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.workshop_name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.vehicle_brand} {o.vehicle_model}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.owner_first_name || o.owner_last_name
                    ? `${o.owner_first_name || ""} ${o.owner_last_name || ""}`.trim()
                    : o.owner_ci || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${SERVICE_ORDER_STYLES[o.status] || SERVICE_ORDER_STYLES.PENDING}`}
                  >
                    {t(`admin.serviceOrders.statusLabels.${o.status}`, o.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  ${(o.final_price ?? o.base_price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  {o.status === "PENDING" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmCancelServiceOrder(o);
                      }}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title={t("admin.serviceOrders.cancelOrder")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {isSuperadmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteServiceOrder(o);
                      }}
                      className="ml-1 cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title={t("admin.serviceOrders.deleteOrder")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("admin.serviceOrders.noOrders")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmCancelServiceOrder}
        onOpenChange={(open) => {
          if (!open) setConfirmCancelServiceOrder(null);
        }}
        title={t("admin.serviceOrders.cancelTitle")}
        description={t("admin.serviceOrders.cancelConfirm")}
        confirmText={t("admin.serviceOrders.cancelOrder")}
        onConfirm={() => {
          // Aquí irá la lógica para cancelar la orden de servicio
          toast.info(t("admin.serviceOrders.cancelSoon"));
          setConfirmCancelServiceOrder(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteServiceOrder}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteServiceOrder(null);
        }}
        title={t("admin.serviceOrders.deleteTitle")}
        description={t("admin.serviceOrders.deleteConfirm")}
        confirmText={t("admin.delete")}
        onConfirm={() => {
          if (confirmDeleteServiceOrder) {
            deleteServiceOrderMutation.mutate(confirmDeleteServiceOrder.id);
          }
        }}
      />
    </>
  );
}

// ---- Earnings Tab ----

const PERIOD_KEYS: Record<PeriodFilter, string> = {
  month: "admin.earnings.periods.month",
  "3months": "admin.earnings.periods.3months",
  "6months": "admin.earnings.periods.6months",
  year: "admin.earnings.periods.year",
};

function CreditTab() {
  const [creditSubTab, setCreditSubTab] = useState<"lines" | "requests">("lines");
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-border">
        <button
          onClick={() => setCreditSubTab("lines")}
          className={`pb-2 text-sm font-medium transition-colors ${
            creditSubTab === "lines"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("admin.credit.lines")}
        </button>
        <button
          onClick={() => setCreditSubTab("requests")}
          className={`pb-2 text-sm font-medium transition-colors ${
            creditSubTab === "requests"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("admin.credit.requests")}
        </button>
      </div>
      {creditSubTab === "lines" ? <CreditLinesTable /> : <CreditRequestsTable />}
    </div>
  );
}

function CreditLinesTable() {
  const { t } = useLocale();
  const { data, isLoading, isFetching } = useQuery<AdminCreditLine[]>({
    queryKey: ["admin-credit-lines"],
    queryFn: adminGetCreditLines,
  });

  const [editingUser, setEditingUser] = useState<AdminCreditLine | null>(null);
  const [editParts, setEditParts] = useState("");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: { parts_credit_limit?: number };
    }) => adminUpdateCreditLine(userId, input),
    onSuccess: () => {
      toast.success(t("admin.credit.lineUpdated"));
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-credit-lines"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? t("admin.credit.errorUpdating"));
    },
  });

  const levelBadge = (level: number) => {
    const styles: Record<number, string> = {
      1: "border-border bg-muted text-muted-foreground",
      2: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      3: "border-slate-400/30 bg-slate-400/10 text-slate-300",
      4: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    };
    return styles[level] ?? styles[1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("admin.credit.creditLines")}</h2>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("admin.credit.user")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.users.rating")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.level")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.points")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.partsLimit")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.partsAvailable")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.serviceLimit")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.serviceAvailable")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.onTime")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.late")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.credit.adjustment")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.user_name}</div>
                  <div className="text-xs text-muted-foreground">{u.user_email}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {u.user_roles?.map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {r === "ADMIN" ? t("admin.users.roleAdmin") : r === "SUPERADMIN" ? t("admin.users.roleSuperadmin") : r === "WORKSHOP_OWNER" ? t("admin.users.roleWorkshopOwner") : t("admin.users.roleClient")}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.client_rating_count > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= Math.round(u.client_average_rating)
                                ? "text-yellow-400 fill-current"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {u.client_average_rating.toFixed(1)} ({u.client_rating_count})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${levelBadge(u.level)}`}>
                    Nivel {u.level}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{u.credit_points.toFixed(0)}</td>
                <td className="px-4 py-3 font-mono">${u.parts_limit.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-emerald-400">${u.parts_available.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">${u.service_limit.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-emerald-400">${u.service_available.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-emerald-400">
                  {u.parts_installments_on_time + u.service_installments_on_time}
                </td>
                <td className="px-4 py-3 font-mono text-red-400">
                  {u.parts_installments_late + u.service_installments_late}
                </td>
                <td className="px-4 py-3 font-mono">
                  {u.manual_adjustment ? (
                    <span className="text-yellow-400">+${u.manual_adjustment.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setEditParts(u.parts_limit.toString());
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    {t("admin.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("admin.credit.editLine", undefined, { name: editingUser.user_name })}</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("admin.credit.partsLimitLabel")}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editParts}
                  onChange={(e) => setEditParts(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("admin.credit.serviceAutoCalc", undefined, { amount: (editParts ? parseFloat(editParts) / 3 : 0).toFixed(2) })}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  onClick={() => {
                    const input: { parts_credit_limit?: number } = {};
                    if (editParts) input.parts_credit_limit = parseFloat(editParts);
                    updateMutation.mutate({ userId: editingUser.user_id, input });
                  }}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("admin.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreditRequestsTable() {
  const { t } = useLocale();
  const { data: requests, isLoading } = useQuery<AdminLimitReview[]>({
    queryKey: ["admin-limit-requests"],
    queryFn: adminGetLimitRequests,
  });

  const queryClient = useQueryClient();
  const [approving, setApproving] = useState<AdminLimitReview | null>(null);
  const [newLimit, setNewLimit] = useState("");

  const approveMutation = useMutation({
    mutationFn: ({
      requestId,
      newPartsLimit,
    }: {
      requestId: string;
      newPartsLimit: number;
    }) => adminReviewLimitRequest(requestId, "APPROVED", newPartsLimit),
    onSuccess: () => {
      toast.success(t("admin.credit.requestApproved"));
      setApproving(null);
      queryClient.invalidateQueries({ queryKey: ["admin-limit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-credit-lines"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? t("admin.credit.errorApproving"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      adminReviewLimitRequest(requestId, "REJECTED"),
    onSuccess: () => {
      toast.success(t("admin.credit.requestRejected"));
      queryClient.invalidateQueries({ queryKey: ["admin-limit-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? t("admin.credit.errorRejecting"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("admin.credit.reviewRequests")}</h2>
      {!requests || requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("admin.credit.noRequests")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("admin.credit.user")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.credit.currentLimit")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.credit.requestedOn")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.user_name}</div>
                    <div className="text-xs text-muted-foreground">{r.user_email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    ${r.current_parts_limit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setApproving(r);
                          setNewLimit(
                            (r.current_parts_limit * 1.5).toFixed(0),
                          );
                        }}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        <Check className="h-3 w-3" />
                        {t("admin.credit.approve")}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("admin.credit.rejectConfirm", undefined, { name: r.user_name }))) {
                            rejectMutation.mutate(r.id);
                          }
                        }}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                      >
                        <X className="h-3 w-3" />
                        {t("admin.credit.reject")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t("admin.credit.approveTitle", undefined, { name: approving.user_name })}
              </h3>
              <button
                onClick={() => setApproving(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("admin.credit.currentLimit")}</p>
                <p className="font-mono font-semibold">
                  ${approving.current_parts_limit.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("admin.credit.newPartsLimit")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("admin.credit.serviceAuto", undefined, { amount: (parseFloat(newLimit || "0") / 3).toFixed(2) })}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setApproving(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(newLimit);
                    if (isNaN(val) || val <= 0) {
                      toast.error(t("admin.credit.invalidLimit"));
                      return;
                    }
                    approveMutation.mutate({
                      requestId: approving.id,
                      newPartsLimit: val,
                    });
                  }}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {approveMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("admin.credit.approve")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EarningsTab() {
  const { t } = useLocale();
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());

  const { data: owners, isLoading } = useQuery({
    queryKey: ["admin-earnings", period],
    queryFn: () => adminGetEarnings(period),
  });

  function toggleOwner(id: string) {
    setExpandedOwners((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">{t("admin.earnings.period")}</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
          style={{ colorScheme: "dark" }}
        >
          {(["month", "3months", "6months", "year"] as PeriodFilter[]).map((p) => (
            <option
              key={p}
              value={p}
              className="text-foreground bg-surface"
              style={{ color: "#f0f0f0", background: "#1a1a2e" }}
            >
              {t(PERIOD_KEYS[p])}
            </option>
          ))}
        </select>
      </div>

      {(!owners || owners.length === 0) && (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          {t("admin.earnings.noEarnings")}
        </div>
      )}

      <div className="space-y-3">
        {owners?.map((owner) => {
          const isExpanded = expandedOwners.has(owner.owner_id);
          return (
            <div key={owner.owner_id} className="ml-card overflow-hidden">
              <button
                onClick={() => toggleOwner(owner.owner_id)}
                className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-border/10"
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-semibold">{owner.owner_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {owner.total_sales} {t("admin.earnings.sales")} &middot; {owner.workshops.length} {owner.workshops.length !== 1 ? t("admin.earnings.workshops") : t("admin.earnings.workshop")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.earnings.revenue")}</p>
                    <p className="font-bold text-green-500">${owner.total_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.earnings.paid")}</p>
                    <p className="font-semibold text-emerald-400">${owner.total_paid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("admin.earnings.pending")}</p>
                    <p className="font-semibold text-amber-400">
                      ${owner.total_pending.toFixed(2)}
                    </p>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-medium">{t("admin.orders.workshop")}</th>
                        <th className="px-5 py-3 font-medium">{t("admin.earnings.sales")}</th>
                        <th className="px-5 py-3 font-medium">{t("admin.earnings.revenue")}</th>
                        <th className="px-5 py-3 font-medium">{t("admin.earnings.paid")}</th>
                        <th className="px-5 py-3 font-medium">{t("admin.earnings.pending")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owner.workshops.map((ws) => (
                        <tr
                          key={ws.workshop_id}
                          className="border-b border-border/50 transition-colors hover:bg-border/10"
                        >
                          <td className="px-5 py-3 font-medium">{ws.workshop_name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{ws.sales_count}</td>
                          <td className="px-5 py-3 text-green-500 font-medium">
                            ${ws.total_revenue.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-emerald-400">
                            ${ws.paid_amount.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-amber-400">
                            ${ws.pending_amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Commissions Tab ----

function CommissionsTab() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCutoff, setShowCutoff] = useState(false);
  const [verifyModalCommissions, setVerifyModalCommissions] = useState<AdminCommission[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-commissions", statusFilter],
    queryFn: () => adminListCommissions(statusFilter || undefined),
  });

  const verifyAllMutation = useMutation({
    mutationFn: (workshopId: string) => adminMarkAllCommissionsPaid(workshopId),
    onSuccess: () => {
      toast.success(t("admin.commissions.verifiedToast"));
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cutoff"] });
      setVerifyModalCommissions(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.commissions.errorVerifying"));
    },
  });

  const rejectAllMutation = useMutation({
    mutationFn: (workshopId: string) => adminMarkAllCommissionsErroneous(workshopId),
    onSuccess: () => {
      toast.success(t("admin.commissions.rejectedToast"));
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      setVerifyModalCommissions(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.commissions.errorRejecting"));
    },
  });

  const sortedCommissions = [...(data?.commissions ?? [])].sort((a, b) => {
    const statusOrder: Record<string, number> = { PENDING: 0, PENDING_VERIFICATION: 1, PAID: 3 };
    const orderA = statusOrder[a.status] ?? 99;
    const orderB = statusOrder[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const groupedByWorkshopMonth = sortedCommissions.reduce((acc, c) => {
    const key = `${c.workshop_id}-${c.period_year}-${c.period_month}`;
    if (!acc[key]) acc[key] = {
      workshop_name: c.workshop_name,
      owner_name: c.owner_name,
      owner_email: c.owner_email,
      period_month: c.period_month,
      period_year: c.period_year,
      items: [],
      total_amount: 0,
      pending_amount: 0,
      pending_count: 0,
      paid_amount: 0,
      verification_amount: 0,
      verification_count: 0,
    };
    acc[key].items.push(c);
    acc[key].total_amount += c.commission_amount;
    if (c.status === "PAID") acc[key].paid_amount += c.commission_amount;
    else if (c.status === "PENDING") {
      acc[key].pending_amount += c.commission_amount;
      acc[key].pending_count++;
    } else if (c.status === "PENDING_VERIFICATION") {
      acc[key].verification_amount += c.commission_amount;
      acc[key].verification_count++;
    }
    return acc;
  }, {} as Record<string, {
    workshop_name: string;
    owner_name: string;
    owner_email: string;
    period_month: number;
    period_year: number;
    items: AdminCommission[];
    total_amount: number;
    pending_amount: number;
    pending_count: number;
    paid_amount: number;
    verification_amount: number;
    verification_count: number;
  }>);

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      BANK_TRANSFER: "Transferencia Bancaria",
      MOBILE_PAYMENT: "Pago Móvil",
      ZELLE: "Zelle",
      BINANCE: "Binance",
      CASH: "Efectivo",
      ZINLI: "Zinli",
    };
    return map[method] ?? method;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="">{t("admin.commissions.all")}</option>
          <option value="PENDING">{t("admin.commissions.pending")}</option>
          <option value="PENDING_VERIFICATION">{t("admin.commissions.inVerification")}</option>
          <option value="PAID">{t("admin.commissions.verified")}</option>
        </select>
        <button
          onClick={() => setShowCutoff((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface"
        >
          <ClipboardList className="h-4 w-4" />
          {showCutoff ? t("admin.commissions.hideCutoff") : t("admin.commissions.showCutoff")}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">{t("admin.commissions.totalPending")}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-400">
              ${data.total_pending.toFixed(2)}
            </p>
          </div>
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">{t("admin.commissions.totalVerified")}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-500">
              ${data.total_paid.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {showCutoff && <CutoffPanel />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(groupedByWorkshopMonth).length === 0 ? (
        <div className="ml-card p-8 text-center text-muted-foreground">
          {t("admin.commissions.noCommissions")}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByWorkshopMonth).map(([key, group]) => {
            const monthName = new Date(group.period_year, group.period_month - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
            return (
              <div key={key} className="ml-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{group.workshop_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{monthName} · {group.owner_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("admin.commissions.pendingLabel")}</p>
                      <p className="font-semibold text-amber-400">${group.pending_amount.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{group.pending_count} {t("admin.commissions.trans")}</p>
                    </div>
                    {group.verification_count > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t("admin.commissions.verificationLabel")}</p>
                        <p className="font-semibold text-blue-400">${group.verification_amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{group.verification_count} {t("admin.commissions.trans")}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("admin.commissions.verifiedLabel")}</p>
                      <p className="font-semibold text-emerald-500">${group.paid_amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("admin.commissions.totalLabel")}</p>
                      <p className="font-semibold">${group.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                {group.verification_count > 0 && (
                  <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
                    <button
                      onClick={() => {
                        const pendingItems = group.items.filter(c => c.status === "PENDING_VERIFICATION");
                        if (pendingItems.length > 0) setVerifyModalCommissions(pendingItems);
                      }}
                      className="flex items-center gap-1 rounded-md border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-500 transition-colors hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {t("admin.commissions.verifyPayments", undefined, { n: group.verification_count })}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {verifyModalCommissions && verifyModalCommissions.length > 0 && (() => {
        const first = verifyModalCommissions[0];
        const totalAmount = verifyModalCommissions.reduce((s, c) => s + c.commission_amount, 0);
        const effectiveRate = (first.rate && first.rate > 0) ? first.rate : 0;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{t("admin.commissions.paymentInfo")}</h2>

            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">{t("admin.commissions.totalAmount", undefined, { n: verifyModalCommissions.length })}</p>
              {effectiveRate > 0 ? (
                <p className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                  {(totalAmount * effectiveRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}bs
                  <span className="text-sm font-normal text-muted-foreground">
                    (${totalAmount.toFixed(2)})
                  </span>
                </p>
              ) : (
                <p className="mt-1 font-mono text-2xl font-bold text-primary">
                  ${totalAmount.toFixed(2)}
                </p>
              )}
              {effectiveRate > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("admin.commissions.bcvRate", undefined, { rate: effectiveRate.toFixed(2) })}
                  {first.rate_date && (
                    <span className="ml-1">
                      — {new Date(first.rate_date).toLocaleDateString("es-ES")}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.commissions.workshop")}</p>
                <p className="text-sm font-medium">{first.workshop_name}</p>
              </div>
              {first.owner_name && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("admin.commissions.owner")}</p>
                  <p className="text-sm">{first.owner_name}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.commissions.paymentMethod")}</p>
                <p className="text-sm">{first.payment_method ? methodLabel(first.payment_method) : "—"}</p>
              </div>
              {first.reference_number && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("admin.commissions.referenceNumber")}</p>
                  <p className="text-sm font-mono">{first.reference_number}</p>
                </div>
              )}
              {first.paid_at && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("admin.commissions.paymentDate")}</p>
                  <p className="text-sm">
                    {new Date(first.paid_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.commissions.statusLabel")}</p>
                <p className="text-sm">
                  <span className="rounded-full px-2.5 py-0.5 text-xs bg-amber-500/10 text-amber-400">{t("admin.commissions.pendingBadge")}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={verifyAllMutation.isPending}
                onClick={() => verifyAllMutation.mutate(first.workshop_id)}
                className="w-full ml-btn ml-btn-primary"
              >
                {verifyAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("admin.commissions.verifyPayment")}
              </button>
              <button
                type="button"
                disabled={rejectAllMutation.isPending}
                onClick={() => rejectAllMutation.mutate(first.workshop_id)}
                className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {rejectAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("admin.commissions.rejectInstallment")}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyModalCommissions(null)}
                className="ml-btn ml-btn-outline"
              >
                {t("admin.close")}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

// ---- Late Fees Tab ----

function CutoffPanel() {
  const { t } = useLocale();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cutoff", month, year],
    queryFn: () => adminGetCutoff(month, year),
  });

  return (
    <div className="ml-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">{t("admin.commissions.cutoff.title")}</h3>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm text-foreground"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("admin.commissions.cutoff.total")}</p>
              <p className="text-lg font-semibold">${data.grand_total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("admin.commissions.cutoff.pending")}</p>
              <p className="text-lg font-semibold text-amber-400">${data.grand_pending.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("admin.commissions.cutoff.paid")}</p>
              <p className="text-lg font-semibold text-emerald-500">${data.grand_paid.toFixed(2)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{t("admin.commissions.cutoff.workshop")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.commissions.cutoff.commissions")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.commissions.cutoff.total")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.commissions.cutoff.pending")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.commissions.cutoff.paid")}</th>
                </tr>
              </thead>
              <tbody>
                {data.workshops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      {t("admin.commissions.cutoff.noData")}
                    </td>
                  </tr>
                ) : (
                  data.workshops.map((w) => (
                    <tr key={w.workshop_id} className="border-b border-border/50">
                      <td className="px-3 py-2">{w.workshop_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{w.commission_count}</td>
                      <td className="px-3 py-2 font-medium">${w.total_amount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-amber-400">${w.pending_amount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-emerald-500">${w.paid_amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---- Late Fees Tab ----

function LateFeesTab() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [lateFeesSubTab, setLateFeesSubTab] = useState<"individual" | "users">("individual");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [verifyModalFee, setVerifyModalFee] = useState<AdminLateFee | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-late-fees", statusFilter],
    queryFn: () => adminListLateFees(statusFilter || undefined),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => adminVerifyLateFee(id),
    onSuccess: () => {
      toast.success(t("admin.lateFees.verifiedToast"));
      queryClient.invalidateQueries({ queryKey: ["admin-late-fees"] });
      setVerifyModalFee(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.lateFees.errorVerifying"));
    },
  });

  const markErroneousMutation = useMutation({
    mutationFn: (lateFeeId: string) => adminMarkLateFeeErroneous(lateFeeId),
    onSuccess: () => {
      toast.success(t("admin.lateFees.rejectedToast"));
      queryClient.invalidateQueries({ queryKey: ["admin-late-fees"] });
      setVerifyModalFee(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.lateFees.errorRejecting"));
    },
  });

  const sortedLateFees = [...(data?.late_fees ?? [])].sort((a, b) => {
    const statusOrder: Record<string, number> = { PENDING: 0, PENDING_VERIFICATION: 1, PAID: 3, WAIVED: 4 };
    const orderA = statusOrder[a.status] ?? 99;
    const orderB = statusOrder[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      PENDING: { label: t("admin.lateFees.statusBadges.PENDING"), color: "bg-amber-500/10 text-amber-400" },
      PENDING_VERIFICATION: { label: t("admin.lateFees.statusBadges.PENDING_VERIFICATION"), color: "bg-blue-500/10 text-blue-400" },
      PAID: { label: t("admin.lateFees.statusBadges.PAID"), color: "bg-emerald-500/10 text-emerald-500" },
      WAIVED: { label: t("admin.lateFees.statusBadges.WAIVED"), color: "bg-muted text-muted-foreground" },
      ERRONEOUS: { label: t("admin.lateFees.statusBadges.ERRONEOUS"), color: "bg-red-500/10 text-red-400" },
    };
    const s = map[status] ?? { label: status, color: "bg-muted text-muted-foreground" };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.color}`}>{s.label}</span>;
  };

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      BANK_TRANSFER: t("admin.paymentMethods.methodTypes.bank_transfer"),
      MOBILE_PAYMENT: t("admin.paymentMethods.methodTypes.mobile_payment"),
      ZELLE: t("admin.paymentMethods.methodTypes.zelle"),
      BINANCE: t("admin.paymentMethods.methodTypes.BINANCE"),
      CASH: t("admin.paymentMethods.methodTypes.cash"),
      ZINLI: t("admin.paymentMethods.methodTypes.zinli"),
    };
    return map[method] ?? method;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-border">
        <button
          onClick={() => setLateFeesSubTab("individual")}
          className={`pb-2 text-sm font-medium transition-colors ${
            lateFeesSubTab === "individual"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("admin.lateFees.title")}
        </button>
        <button
          onClick={() => setLateFeesSubTab("users")}
          className={`pb-2 text-sm font-medium transition-colors ${
            lateFeesSubTab === "users"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("lateFeesUsers.title")}
        </button>
      </div>

      {lateFeesSubTab === "users" ? (
        <LateFeesUsersTab />
      ) : (
      <>
      <div className="flex items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="">{t("admin.lateFees.all")}</option>
          <option value="PENDING">{t("admin.lateFees.pending")}</option>
          <option value="PENDING_VERIFICATION">{t("admin.lateFees.inVerification")}</option>
          <option value="PAID">{t("admin.lateFees.verified")}</option>
        </select>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">{t("admin.lateFees.totalPending")}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-400">
              ${data.total_pending.toFixed(2)}
            </p>
          </div>
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">{t("admin.lateFees.totalVerified")}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-500">
              ${data.total_paid.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedLateFees.length === 0 ? (
        <div className="ml-card p-8 text-center text-muted-foreground">
          {t("admin.lateFees.noLateFees")}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLateFees.map((f) => (
            <div key={f.id} className="ml-card p-5 transition-colors hover:bg-surface/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{f.user_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${f.installment_type === "PARTS" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                        {f.installment_type === "PARTS" ? t("admin.lateFees.parts") : t("admin.lateFees.service")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("admin.lateFees.amount")}</p>
                    <p className="text-lg font-bold text-red-400">${f.amount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("admin.lateFees.date")}</p>
                    <p className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusBadge(f.status)}
                    {f.payment_method && f.payment_method !== "OTHER" && (
                      <span className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                        {methodLabel(f.payment_method)}
                      </span>
                    )}
                  </div>
                  {f.status === "PENDING_VERIFICATION" && (
                    <button
                      onClick={() => setVerifyModalFee(f)}
                      className="flex items-center gap-1 rounded-md border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-500 transition-colors hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {t("admin.lateFees.verify")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {verifyModalFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight">{t("admin.lateFees.paymentInfo")}</h2>

            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">{t("admin.lateFees.amount")}</p>
              {(() => {
                const effectiveRate = (verifyModalFee.rate && verifyModalFee.rate > 0) ? verifyModalFee.rate : 0;
                if (effectiveRate > 0) {
                  const bsAmount = verifyModalFee.amount * effectiveRate;
                  return (
                    <p className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-bold text-primary">
                      {bsAmount.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}bs
                      <span className="text-sm font-normal text-muted-foreground">
                        (${verifyModalFee.amount.toFixed(2)})
                      </span>
                    </p>
                  );
                }
                return (
                  <p className="mt-1 font-mono text-2xl font-bold text-primary">
                    ${verifyModalFee.amount.toFixed(2)}
                  </p>
                );
              })()}
              {verifyModalFee.rate && verifyModalFee.rate > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("admin.lateFees.bcvRate", undefined, { rate: verifyModalFee.rate.toFixed(2) })}
                  {verifyModalFee.rate_date && (
                    <span className="ml-1">
                      — {new Date(verifyModalFee.rate_date).toLocaleDateString("es-ES")}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.lateFees.client")}</p>
                <p className="text-sm font-medium">{verifyModalFee.user_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.lateFees.type")}</p>
                <p className="text-sm">{verifyModalFee.installment_type === "PARTS" ? t("admin.lateFees.parts") : t("admin.lateFees.service")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.lateFees.paymentMethod")}</p>
                <p className="text-sm">{verifyModalFee.payment_method ? methodLabel(verifyModalFee.payment_method) : "—"}</p>
              </div>
              {verifyModalFee.reference_number && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("admin.lateFees.referenceNumber")}</p>
                  <p className="text-sm font-mono">{verifyModalFee.reference_number}</p>
                </div>
              )}
              {verifyModalFee.paid_at && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("admin.lateFees.paymentDate")}</p>
                  <p className="text-sm">
                    {new Date(verifyModalFee.paid_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("admin.lateFees.statusLabel")}</p>
                <p className="text-sm">
                  <span className="rounded-full px-2.5 py-0.5 text-xs bg-amber-500/10 text-amber-400">{t("admin.lateFees.pendingBadge")}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={verifyMutation.isPending}
                onClick={() => verifyMutation.mutate({ id: verifyModalFee.id })}
                className="w-full ml-btn ml-btn-primary"
              >
                {verifyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("admin.lateFees.verifyPayment")}
              </button>
              <button
                type="button"
                disabled={markErroneousMutation.isPending}
                onClick={() => markErroneousMutation.mutate(verifyModalFee.id)}
                className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {markErroneousMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("admin.lateFees.rejectInstallment")}
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyModalFee(null)}
                className="ml-btn ml-btn-outline"
              >
                {t("admin.close")}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ---- Payment Methods Tab ----

const ADMIN_CI_PREFIXES = ["V", "E", "P", "R", "J", "G"] as const;

function PaymentMethodsTab() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [holderCiPrefix, setHolderCiPrefix] = useState<string>("V");
  const [holderCiNumber, setHolderCiNumber] = useState<string>("");
  const [methodType, setMethodType] = useState<"bank_transfer" | "mobile_payment" | "cash" | "zelle" | "zinli">("mobile_payment");
  const [label, setLabel] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: methods, isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: adminListPaymentMethods,
  });

  const { data: banks } = useQuery({
    queryKey: ["workshop-banks"],
    queryFn: getWorkshopBanks,
    staleTime: Infinity,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateAdminPaymentMethodInput) => adminCreatePaymentMethod(input),
    onSuccess: () => {
      toast.success(t("admin.paymentMethods.methodCreated"));
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.paymentMethods.errorCreating"));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminTogglePaymentMethod(id),
    onSuccess: () => {
      toast.success(t("admin.paymentMethods.methodUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.paymentMethods.errorToggle"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeletePaymentMethod(id),
    onSuccess: () => {
      toast.success(t("admin.paymentMethods.methodDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? t("admin.paymentMethods.errorToggle"));
    },
  });

  function resetForm() {
    setShowForm(false);
    setMethodType("mobile_payment");
    setLabel("");
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setPhoneNumber("");
    setEmail("");
    setHolderCiPrefix("V");
    setHolderCiNumber("");
    setFormError(null);
  }

  function handleMethodTypeChange(type: typeof methodType) {
    setMethodType(type);
    setBankName("");
    setAccountNumber("");
    setPhoneNumber("");
    setEmail("");
    setFormError(null);
  }

  function handleSave() {
    setFormError(null);
    if (!label.trim()) {
      setFormError(t("admin.paymentMethods.labelRequired"));
      return;
    }
    const ci = holderCiNumber ? `${holderCiPrefix}-${holderCiNumber}` : "";
    const input: CreateAdminPaymentMethodInput = {
      label: label.trim(),
      method_type: methodType,
      bank_name: bankName || undefined,
      account_number: accountNumber || phoneNumber || undefined,
      holder_name: accountHolder || undefined,
      holder_ci: ci || undefined,
      phone: phoneNumber || undefined,
      email: email || undefined,
    };
    createMutation.mutate(input);
  }

  const methodTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      bank_transfer: t("admin.paymentMethods.methodTypes.bank_transfer"),
      mobile_payment: t("admin.paymentMethods.methodTypes.mobile_payment"),
      cash: t("admin.paymentMethods.methodTypes.cash"),
      zelle: t("admin.paymentMethods.methodTypes.zelle"),
      zinli: t("admin.paymentMethods.methodTypes.zinli"),
      BANK_TRANSFER: t("admin.paymentMethods.methodTypes.bank_transfer"),
      MOBILE_PAYMENT: t("admin.paymentMethods.methodTypes.mobile_payment"),
      ZELLE: t("admin.paymentMethods.methodTypes.zelle"),
      BINANCE: t("admin.paymentMethods.methodTypes.BINANCE"),
      OTHER: t("admin.paymentMethods.methodTypes.OTHER"),
    };
    return map[type] ?? type;
  };

  const methodIcon = (type: string) => {
    const lc = type.toLowerCase();
    if (lc === "bank_transfer") return <Building2 className="h-5 w-5 text-primary" />;
    if (lc === "mobile_payment") return <Smartphone className="h-5 w-5 text-primary" />;
    if (lc === "zelle" || lc === "zinli") return <Mail className="h-5 w-5 text-primary" />;
    if (lc === "cash") return <CreditCard className="h-5 w-5 text-primary" />;
    return <CreditCard className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("admin.paymentMethods.description")}
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("admin.paymentMethods.newMethod")}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t("admin.paymentMethods.registerMethod")}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.label")}</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Cuenta principal"
                  className="ml-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.type")}</label>
                <select
                  value={methodType}
                  onChange={(e) => handleMethodTypeChange(e.target.value as any)}
                  className="ml-input"
                >
                  <option value="mobile_payment">{t("admin.paymentMethods.methodTypes.mobile_payment")}</option>
                  <option value="bank_transfer">{t("admin.paymentMethods.methodTypes.bank_transfer")}</option>
                  <option value="cash">{t("admin.paymentMethods.methodTypes.cash")}</option>
                  <option value="zelle">{t("admin.paymentMethods.methodTypes.zelle")}</option>
                  <option value="zinli">{t("admin.paymentMethods.methodTypes.zinli")}</option>
                </select>
              </div>

              {methodType === "bank_transfer" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.bank")}</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="ml-input"
                    >
                      <option value="">{t("admin.paymentMethods.selectBank")}</option>
                      {(banks ?? []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.accountNumber")}</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="ml-input"
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.holder")}</label>
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="ml-input"
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.holderCi")}</label>
                    <div className="flex gap-2">
                      <select
                        value={holderCiPrefix}
                        onChange={(e) => setHolderCiPrefix(e.target.value)}
                        className="w-20 shrink-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        {ADMIN_CI_PREFIXES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <span className="flex items-center text-muted-foreground">-</span>
                      <input
                        value={holderCiNumber}
                        onChange={(e) => setHolderCiNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        className="ml-input"
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                </>
              )}

              {methodType === "mobile_payment" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.bank")}</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="ml-input"
                    >
                      <option value="">{t("admin.paymentMethods.selectBank")}</option>
                      {(banks ?? []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.phone")}</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="ml-input"
                      placeholder="04121234567 o +584121234567"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.holderCi")}</label>
                    <div className="flex gap-2">
                      <select
                        value={holderCiPrefix}
                        onChange={(e) => setHolderCiPrefix(e.target.value)}
                        className="w-20 shrink-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        {ADMIN_CI_PREFIXES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <span className="flex items-center text-muted-foreground">-</span>
                      <input
                        value={holderCiNumber}
                        onChange={(e) => setHolderCiNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        className="ml-input"
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                </>
              )}

              {methodType === "cash" && (
                <p className="text-sm text-muted-foreground">
                  {t("admin.paymentMethods.cashDesc")}
                </p>
              )}

              {(methodType === "zelle" || methodType === "zinli") && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ml-input"
                      placeholder="ejemplo@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("admin.paymentMethods.holder")}</label>
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="ml-input"
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.paymentMethods.usdDesc")}
                  </p>
                </>
              )}

              {formError && (
                <div className="rounded-lg bg-destructive/10 px-4 py-2">
                  <p className="text-xs text-destructive">{formError}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="ml-btn ml-btn-outline text-xs">
                  {t("admin.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                  className="ml-btn ml-btn-primary text-xs"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("admin.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !methods || methods.length === 0 ? (
        <div className="ml-card p-8 text-center text-muted-foreground">
          {t("admin.paymentMethods.noMethods")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {methods.map((m) => (
            <div key={m.id} className={`ml-card p-5 ${!m.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15">
                    {methodIcon(m.method_type)}
                  </div>
                  <div>
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{methodTypeLabel(m.method_type)}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${m.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  {m.is_active ? t("admin.paymentMethods.activate") : t("admin.paymentMethods.deactivate")}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {m.bank_name && <p className="text-muted-foreground">{t("admin.paymentMethods.bankColon")} <span className="text-foreground">{m.bank_name}</span></p>}
                {m.account_number && <p className="text-muted-foreground">{m.method_type.toLowerCase() === "mobile_payment" ? t("admin.paymentMethods.phoneLabel") : t("admin.paymentMethods.accountColon")}: <span className="text-foreground font-mono">{m.account_number}</span></p>}
                {m.holder_name && <p className="text-muted-foreground">{t("admin.paymentMethods.holderColon")} <span className="text-foreground">{m.holder_name}</span></p>}
                {m.holder_ci && <p className="text-muted-foreground">{t("admin.paymentMethods.ciColon")} <span className="text-foreground">{m.holder_ci}</span></p>}
                {m.phone && <p className="text-muted-foreground">{t("admin.paymentMethods.telColon")} <span className="text-foreground">{m.phone}</span></p>}
                {m.email && <p className="text-muted-foreground">Email: <span className="text-foreground">{m.email}</span></p>}
              </div>
              <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
                <button
                  onClick={() => toggleMutation.mutate(m.id)}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-surface"
                >
                  {m.is_active ? t("admin.paymentMethods.deactivate") : t("admin.paymentMethods.activate")}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(m.id)}
                  className="flex items-center gap-1 rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  {t("admin.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Support Tab ----

function SupportTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedMsg, setSelectedMsg] = useState<SupportMessageDTO | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-support-messages", statusFilter],
    queryFn: () => adminListSupportMessages(statusFilter || undefined),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => resolveSupportMessage(id, note),
    onSuccess: () => {
      toast.success(t("adminSupport.resolve"));
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
      setShowResolveModal(false);
      setActionNote("");
      setSelectedMsg(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? err?.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => rejectSupportMessage(id, note),
    onSuccess: () => {
      toast.success(t("adminSupport.reject"));
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
      setShowRejectModal(false);
      setActionNote("");
      setSelectedMsg(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? err?.message),
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      PENDING: { label: t("support.status.PENDING"), color: "bg-amber-500/10 text-amber-400" },
      RESOLVED: { label: t("support.status.RESOLVED"), color: "bg-emerald-500/10 text-emerald-400" },
      REJECTED: { label: t("adminSupport.rejected"), color: "bg-red-500/10 text-red-400" },
    };
    return map[status] ?? { label: status, color: "bg-muted text-muted-foreground" };
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      REPORT: t("support.types.REPORT"),
      QUESTION: t("support.types.QUESTION"),
      SUGGESTION: t("support.types.SUGGESTION"),
      COMPLAINT: t("support.types.COMPLAINT"),
      OTHER: t("support.types.OTHER"),
    };
    return map[type] ?? type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          <option value="">{t("adminSupport.filterAll")}</option>
          <option value="PENDING">{t("adminSupport.filterPending")}</option>
          <option value="RESOLVED">{t("adminSupport.filterResolved")}</option>
          <option value="REJECTED">{t("adminSupport.filterRejected")}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Headphones className="h-10 w-10 text-destructive/40" />
          <p className="mt-3 text-sm text-destructive">
            {(error as any)?.response?.data?.detail ?? (error as any)?.message ?? "Error al cargar mensajes"}
          </p>
        </div>
      ) : data && data.messages.length > 0 ? (
        <div className="space-y-3">
          {data.messages.map((msg) => {
            const badge = statusBadge(msg.status);
            return (
              <div
                key={msg.id}
                className="ml-card cursor-pointer p-4 transition-all hover:border-border-strong"
                onClick={() => setSelectedMsg(msg)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{typeLabel(msg.type)}</span>
                    </div>
                    <h4 className="mt-1.5 truncate text-sm font-medium text-foreground">{msg.subject}</h4>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{msg.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{msg.user_name}</span>
                      <span>{msg.user_email}</span>
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                    {msg.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedMsg(msg);
                            setShowResolveModal(true);
                          }}
                          className="flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
                        >
                          <Check className="h-3 w-3" />
                          {t("adminSupport.resolve")}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMsg(msg);
                            setShowRejectModal(true);
                          }}
                          className="flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <XCircle className="h-3 w-3" />
                          {t("adminSupport.reject")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Headphones className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t("adminSupport.noMessages")}</p>
        </div>
      )}

      {/* Detail modal */}
      {selectedMsg && !showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{t("adminSupport.detail")}</h2>
              <button onClick={() => setSelectedMsg(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("adminSupport.user")}</p>
                <p className="text-sm font-medium">{selectedMsg.user_name} ({selectedMsg.user_email})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("adminSupport.subject")}</p>
                <p className="text-sm font-medium">{selectedMsg.subject}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("adminSupport.type")}</p>
                <p className="text-sm">{typeLabel(selectedMsg.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("support.message")}</p>
                <p className="text-sm whitespace-pre-wrap">{selectedMsg.message}</p>
              </div>
              {selectedMsg.related_order_id && (
                <div>
                  <p className="text-xs text-muted-foreground">{t("adminSupport.relatedOrder")}</p>
                  <button
                    onClick={() => {
                      const oid = selectedMsg.related_order_id!;
                      setSelectedMsg(null);
                      if (selectedMsg.related_order_type === "SERVICE") {
                        navigate({ to: "/dashboard/service-orders/$orderId", params: { orderId: oid } });
                      } else {
                        navigate({ to: "/dashboard/purchases/$purchaseId", params: { purchaseId: oid } });
                      }
                    }}
                    className="text-sm font-mono text-primary hover:underline"
                  >
                    #{selectedMsg.related_order_id.slice(0, 8)} →
                  </button>
                </div>
              )}
              {selectedMsg.admin_note && (
                <div>
                  <p className="text-xs text-muted-foreground">{t("adminSupport.adminNote")}</p>
                  <p className="text-sm">{selectedMsg.admin_note}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">{t("adminSupport.status")}</p>
                <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusBadge(selectedMsg.status).color}`}>
                  {statusBadge(selectedMsg.status).label}
                </span>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSelectedMsg(null)} className="ml-btn ml-btn-outline">
                {t("admin.close")}
              </button>
              {selectedMsg.status === "PENDING" && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4" />
                    {t("adminSupport.reject")}
                  </button>
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="ml-btn ml-btn-primary"
                  >
                    <Check className="h-4 w-4" />
                    {t("adminSupport.resolve")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {showResolveModal && selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{t("adminSupport.resolveWithNote")}</h2>
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setActionNote("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("adminSupport.adminNote")}
                </label>
                <textarea
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong min-h-[80px] resize-y"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={t("adminSupport.adminNotePlaceholder")}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setActionNote("");
                }}
                className="ml-btn ml-btn-outline"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() =>
                  resolveMutation.mutate({
                    id: selectedMsg.id,
                    note: actionNote || undefined,
                  })
                }
                disabled={resolveMutation.isPending}
                className="ml-btn ml-btn-primary"
              >
                {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t("adminSupport.resolve")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{t("adminSupport.rejectWithNote")}</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setActionNote("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("adminSupport.adminNote")}
                </label>
                <textarea
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong min-h-[80px] resize-y"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={t("adminSupport.rejectNotePlaceholder")}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setActionNote("");
                }}
                className="ml-btn ml-btn-outline"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() =>
                  rejectMutation.mutate({
                    id: selectedMsg.id,
                    note: actionNote || undefined,
                  })
                }
                disabled={rejectMutation.isPending}
                className="ml-btn ml-btn-primary border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {t("adminSupport.reject")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ---- Late Fees Users Summary Tab ----

function LateFeesUsersTab() {
  const { t } = useLocale();
  const [selectedUser, setSelectedUser] = useState<LateFeeUserSummaryDTO | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-late-fees-users-summary"],
    queryFn: getLateFeesUsersSummary,
  });

  const { data: userOrdersData, isLoading: userOrdersLoading } = useQuery({
    queryKey: ["admin-user-orders-summary", selectedUser?.user_id],
    queryFn: () => getUserOrdersSummary(selectedUser!.user_id),
    enabled: !!selectedUser,
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">{t("lateFeesUsers.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("lateFeesUsers.subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.users.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("lateFeesUsers.userName")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("lateFeesUsers.feesCount")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("lateFeesUsers.totalFees")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("lateFeesUsers.oldestDays")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("lateFeesUsers.activeDebt")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("lateFeesUsers.activeOrders")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.user_id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.user_name}</p>
                    <p className="text-xs text-muted-foreground">{u.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                      {u.late_fees_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">${u.total_late_fees_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={u.oldest_late_fee_days > 7 ? "text-red-400" : "text-amber-400"}>
                      {u.oldest_late_fee_days}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">${u.total_active_debt.toFixed(2)}</td>
                  <td className="px-4 py-3 text-foreground">{u.active_orders_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Eye className="h-3 w-3" />
                      {t("lateFeesUsers.viewOrders")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t("lateFeesUsers.noUsers")}</p>
        </div>
      )}

      {/* User orders modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("lateFeesUsers.ordersTitle", undefined, { name: selectedUser.user_name })}
              </h2>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {userOrdersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userOrdersData && userOrdersData.orders.length > 0 ? (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                {userOrdersData.orders.map((order) => (
                  <div key={`${order.type}-${order.id}`} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          order.type === "PARTS" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                        }`}>
                          {order.type === "PARTS" ? t("lateFeesUsers.typeParts") : t("lateFeesUsers.typeService")}
                        </span>
                        <span className="text-sm font-mono text-muted-foreground">{order.short_id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{order.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("lateFeesUsers.workshop")}: {order.workshop_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("lateFeesUsers.total")}: ${order.total_amount.toFixed(2)} · {t("lateFeesUsers.pending")}: ${order.pending_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("lateFeesUsers.noUsers")}</p>
            )}

            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelectedUser(null)} className="ml-btn ml-btn-outline">
                {t("lateFeesUsers.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
