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
} from "../../../lib/api";
import { toast } from "sonner";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";

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
  "stats" | "users" | "workshops" | "parts" | "vehicles" | "orders" | "service-orders" | "earnings" | "credit" | "commissions" | "late-fees" | "payment-methods";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; superadminOnly?: boolean; adminOnly?: boolean }[] = [
  { key: "stats", label: "Estadísticas", icon: BarChart3 },
  { key: "users", label: "Usuarios", icon: Users },
  { key: "credit", label: "Crédito", icon: Wallet, adminOnly: true },
  { key: "workshops", label: "Talleres", icon: Store },
  { key: "parts", label: "Repuestos", icon: Package, adminOnly: true },
  { key: "vehicles", label: "Vehículos", icon: Car, adminOnly: true },
  { key: "orders", label: "Órdenes", icon: CreditCard },
  { key: "service-orders", label: "Servicios", icon: Wrench },
  { key: "earnings", label: "Ganancias", icon: DollarSign }, 
  { key: "commissions", label: "Comisiones", icon: Percent, superadminOnly: true },
  { key: "late-fees", label: "Moras", icon: AlertTriangle, superadminOnly: true },
  { key: "payment-methods", label: "Métodos de Pago", icon: CreditCard, superadminOnly: true },
];

function AdminPage() {
  const { roles } = useAuth();
  const location = useLocation();
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
        <p className="text-muted-foreground">No tienes permisos de administrador.</p>
      </div>
    );
  }

  if (location.pathname !== "/dashboard/admin") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gestiona usuarios, talleres, repuestos y vehículos de la plataforma.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
        {TABS.filter((t) => {
          if (t.superadminOnly && !roles.includes("SUPERADMIN")) return false;
          if (t.adminOnly && roles.includes("SUPERADMIN")) return false;
          return true;
        }).map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
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
      {tab === "payment-methods" && <PaymentMethodsTab />}
    </div>
  );
}

// ---- Stats Tab ----

function StatsTab() {
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
    { icon: Users, label: "Usuarios", value: stats.total_users, color: "text-blue-500" },
    { icon: Store, label: "Talleres", value: stats.total_workshops, color: "text-emerald-500" },
    {
      icon: CheckCircle,
      label: "Certificados",
      value: stats.total_certified_workshops,
      color: "text-emerald-500",
    },
    { icon: Package, label: "Repuestos", value: stats.total_parts, color: "text-amber-500" },
    { icon: Car, label: "Vehículos", value: stats.total_vehicles, color: "text-violet-500" },
    { icon: ShoppingBag, label: "Ventas", value: stats.total_sales, color: "text-cyan-500" },
    {
      icon: BarChart3,
      label: "Ingresos (30 días)",
      value: `$${stats.total_revenue.toFixed(2)}`,
      color: "text-green-500",
    },
    {
      icon: CreditCard,
      label: "Total Financiado",
      value: `$${stats.total_financed.toFixed(2)}`,
      color: "text-purple-500",
    },
    {
      icon: Wallet,
      label: "Línea de Crédito",
      value: `$${stats.total_credit_limit.toFixed(2)} límite / $${stats.total_credit_available.toFixed(2)} disponible`,
      color: "text-blue-500",
    },
    {
      icon: TrendingUp,
      label: "Financiamiento actual",
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
  const [editRoles, setEditRoles] = useState<string[]>([]);

  const [confirmSuspendUser, setConfirmSuspendUser] = useState<AdminUser | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUser | null>(null);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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
      toast.success("Usuario eliminado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Error al eliminar";
      toast.error(msg);
    },
  });

  async function deleteUser(id: string) {
    try {
      const { open_orders } = await adminGetOpenOrders("users", id);
      if (open_orders > 0) {
        const ok = confirm(
          `Este usuario tiene ${open_orders} orden(es) activa(s). Al eliminarlo, se cancelarán todas sus órdenes y se eliminarán sus datos.\n\n¿Deseas continuar?`
        );
        if (!ok) return;
        deleteMutation.mutate({ id, force: true });
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
      toast.success("Usuario creado exitosamente");
      setShowCreateForm(false);
      setCreateForm({ email: "", password: "", first_name: "", last_name: "", ci: "", phone: "+58", role: "CLIENT", credit_level: 1, parts_credit_limit: 150, service_credit_limit: 50 });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error al crear usuario");
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
    setEditRoles([...user.roles]);
  }

  function toggleRole(role: string) {
    if (role === "ADMIN") return;
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
            placeholder="Buscar por nombre, email o CI..."
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
            Nuevo usuario
          </button>
        )}
      </div>

      {isSuperadmin && showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Crear nuevo usuario</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nombre</label>
                  <input type="text" value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} placeholder="Nombre" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Apellido</label>
                  <input type="text" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} placeholder="Apellido" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@ejemplo.com" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contraseña</label>
                  <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="********" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">CI</label>
                  <input type="text" value={createForm.ci} onChange={(e) => setCreateForm({ ...createForm, ci: e.target.value })} placeholder="V-12345678" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Teléfono</label>
                  <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+58412..." className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Rol</label>
                  <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as SuperadminCreateUserInput["role"] })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="CLIENT">Cliente</option>
                    <option value="WORKSHOP_OWNER">Dueño de Taller</option>
                    <option value="ADMIN">Admin</option>
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
                  Crear usuario
                </button>
                <button onClick={() => setShowCreateForm(false)} className="ml-btn ml-btn-outline flex-1">
                  Cancelar
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
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">CI</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Registro</th>
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
                        {r === "ADMIN" ? "Admin" : r === "WORKSHOP_OWNER" ? "Taller" : "Cliente"}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.is_suspended ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                      <Ban className="h-3 w-3" />
                      Suspendido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      Activo
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
                      title={u.is_suspended ? "Restaurar" : "Suspender"}
                    >
                      {u.is_suspended ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(u)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUser(u)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar"
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
              <h3 className="text-lg font-semibold">Editar Usuario</h3>
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
                  Apellido
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Teléfono
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="04141234567"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {["CLIENT", "WORKSHOP_OWNER"].map((role) => (
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
                        ? "Admin"
                        : role === "WORKSHOP_OWNER"
                          ? "Dueño de Taller"
                          : "Cliente"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {updateMutation.isError && (
              <p className="mt-3 text-xs text-destructive">
                {(updateMutation.error as any)?.response?.data?.detail ?? "Error al actualizar"}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="ml-btn ml-btn-outline">
                Cancelar
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
                Guardar
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
        title={confirmSuspendUser?.is_suspended ? "Restaurar usuario" : "Suspender usuario"}
        description={
          confirmSuspendUser?.is_suspended
            ? "¿Restaurar este usuario? Volverá a tener acceso a la plataforma."
            : "¿Suspender este usuario? No podrá acceder a la plataforma."
        }
        confirmText={confirmSuspendUser?.is_suspended ? "Restaurar" : "Suspender"}
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
        title="Eliminar usuario"
        description="¿Eliminar este usuario? Se cancelarán órdenes activas y se eliminarán todos sus datos. Esta acción no se puede deshacer."
        confirmText="Eliminar"
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
          title="No se puede eliminar"
          description={deleteError}
        />
      )}
    </>
  );
}

// ---- Workshops Tab ----

function WorkshopsTab() {
  const queryClient = useQueryClient();
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
      toast.success("Taller eliminado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Error al eliminar";
      toast.error(msg);
    },
  });

  async function deleteWorkshop(id: string) {
    try {
      const { open_orders } = await adminGetOpenOrders("workshops", id);
      if (open_orders > 0) {
        const ok = confirm(
          `Este taller tiene ${open_orders} orden(es) activa(s). Al eliminarlo, se cancelarán todas sus órdenes y se eliminarán repuestos y servicios.\n\n¿Deseas continuar?`
        );
        if (!ok) return;
        deleteMutation.mutate({ id, force: true });
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
            placeholder="Buscar por nombre, RIF o dueño..."
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">RIF</th>
              <th className="px-4 py-3 font-medium">Dueño</th>
              <th className="px-4 py-3 font-medium">Estado</th>
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
                      {w.is_certified ? "Certificado" : "Pendiente"}
                    </span>
                    {w.is_suspended ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-400">
                        Fuera de servicio
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(w)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar"
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
                      title={w.is_certified ? "Revocar certificación" : "Certificar"}
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
                      title={w.is_suspended ? "Reactivar taller" : "Suspender taller"}
                    >
                      {w.is_suspended ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteWorkshop(w)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar"
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
              <h3 className="text-lg font-semibold">Editar Taller</h3>
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
                  Nombre
                </label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">RIF</label>
                <input
                  className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                  value={editRif}
                  onChange={(e) => setEditRif(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Dirección
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
                Cancelar
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
                Guardar
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
        title={confirmSuspendWorkshop?.is_suspended ? "Reactivar taller" : "Suspender taller"}
        description={
          confirmSuspendWorkshop?.is_suspended
            ? "¿Reactivar este taller? Volverá a aparecer en la red de talleres."
            : "¿Suspender este taller? No podrá recibir nuevas compras ni solicitudes de servicio, pero las órdenes abiertas seguirán activas."
        }
        confirmText={confirmSuspendWorkshop?.is_suspended ? "Reactivar" : "Suspender"}
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
        title="Eliminar taller"
        description="¿Eliminar este taller? Se eliminarán todos sus repuestos y servicios. Esta acción no se puede deshacer."
        confirmText="Eliminar"
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
          title="No se puede eliminar"
          description={deleteError}
        />
      )}
    </>
  );
}

// ---- Parts Tab ----

function PartsTab() {
  const queryClient = useQueryClient();
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
      toast.success("Repuesto eliminado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Error al eliminar";
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
            placeholder="Buscar por nombre o taller..."
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Taller</th>
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
                    {p.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.workshop_name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPart(p)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar"
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
              <h3 className="text-lg font-semibold">Editar Repuesto</h3>
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
                  Nombre
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
                    Precio
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
                    Stock
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
                  Activo
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingPart(null)} className="ml-btn ml-btn-outline">
                Cancelar
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
                Guardar
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
        title="Eliminar repuesto"
        description="¿Eliminar este repuesto? No afectará las órdenes activas que lo incluyan."
        confirmText="Eliminar"
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
          title="No se puede eliminar"
          description={deleteError}
        />
      )}
    </>
  );
}

// ---- Vehicles Tab ----

function VehiclesTab() {
  const queryClient = useQueryClient();
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
      toast.success("Vehículo eliminado");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Error al eliminar";
      toast.error(msg);
    },
  });

  async function deleteVehicle(id: string) {
    try {
      const { open_orders } = await adminGetOpenOrders("vehicles", id);
      if (open_orders > 0) {
        toast.error("No se puede eliminar el vehículo porque tiene órdenes activas.");
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
            placeholder="Buscar por marca, modelo o placa..."
            className="ml-input pl-9"
          />
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Dueño</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Modelo</th>
              <th className="px-4 py-3 font-medium">Año</th>
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
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
                    {v.vehicle_type === "CAR" ? "Auto" : "Moto"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditVehicle(v)}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar"
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
              <h3 className="text-lg font-semibold">Editar Vehículo</h3>
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
                    Marca
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editVBrand}
                    onChange={(e) => setEditVBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Modelo
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
                    Año
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
                    Placa
                  </label>
                  <input
                    className="block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong"
                    value={editVPlate}
                    onChange={(e) => setEditVPlate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
                <div className="flex gap-2">
                  {(["CAR", "MOTORCYCLE"] as const).map((t) => (
                    <label
                      key={t}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        editVType === t
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="vtype"
                        checked={editVType === t}
                        onChange={() => setEditVType(t)}
                        className="hidden"
                      />
                      {t === "CAR" ? "Auto" : "Moto"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditingVehicle(null)} className="ml-btn ml-btn-outline">
                Cancelar
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
                Guardar
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
        title="Eliminar vehículo"
        description="¿Eliminar este vehículo? No podrá eliminarse si tiene órdenes abiertas."
        confirmText="Eliminar"
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
          title="No se puede eliminar"
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<AdminOrder | null>(null);
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
      toast.success("Orden eliminada");
      setConfirmDeleteOrder(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Error al eliminar";
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
          placeholder="Buscar por ID, comprador o taller..."
          className="ml-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-input px-3 py-2 pr-8"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="CLOSED">Cerrada</option>
        </select>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Comprador</th>
              <th className="px-4 py-3 font-medium">Taller</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
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
                    {o.status === "CLOSED" ? "Cerrado" : "Pendiente"}
                  </span>
                  {o.status !== "CLOSED" && o.installments_pending_verification > 0 && (
                    <p className="mt-1 text-[10px] text-amber-400">
                      {o.installments_pending_verification} por verificar
                    </p>
                  )}
                  {o.status !== "CLOSED" && o.installments_pending > 0 && o.installments_pending_verification === 0 && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {o.installments_pending} cuota{o.installments_pending > 1 ? "s" : ""} pendiente{o.installments_pending > 1 ? "s" : ""}
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
                    {o.payment_type === "FINANCIADO" ? "Financiado" : "Contado"}
                  </span>
                  {o.installments_paid === o.installment_count && o.installment_count > 0 ? (
                    <p className="mt-1 text-[10px] text-emerald-400">Pagado</p>
                  ) : o.installments_pending_verification > 0 ? (
                    <p className="mt-1 text-[10px] text-amber-400">Por verificar</p>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {o.installments_paid}/{o.installment_count} pagadas
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(o.created_at).toLocaleDateString("es-ES")}
                </td>
                {isSuperadmin && (
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteOrder(o);
                      }}
                      className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar orden"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={isSuperadmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay órdenes registradas
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
        title="Eliminar orden"
        description="¿Eliminar esta orden permanentemente? Se eliminarán cuotas, pagos y transacciones asociadas. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => {
          if (confirmDeleteOrder) {
            deleteOrderMutation.mutate(confirmDeleteOrder.id);
          }
        }}
      />
    </>
  );
}

// ---- Service Orders Tab ----

const SERVICE_ORDER_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  REVISION_SENT: "Revisión enviada",
  AT_WORKSHOP: "Esperando en taller",
  QUOTED: "Presupuesto enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  IN_PROGRESS: "En servicio",
  COMPLETED: "Listo para retirar",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CLOSED: "Cerrada",
  DROPPED_OFF: "Entregado en el taller",
  CANCELLED: "Cancelado",
};

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
      toast.success("Orden de servicio eliminada");
      setConfirmDeleteServiceOrder(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? "Error al eliminar";
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
            placeholder="Buscar por servicio, taller, vehículo o propietario..."
            className="ml-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-input px-3 py-2 pr-8"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="finalizado">Finalizado</option>
        </select>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Servicio</th>
              <th className="px-4 py-3 font-medium">Taller</th>
              <th className="px-4 py-3 font-medium">Vehículo</th>
              <th className="px-4 py-3 font-medium">Propietario</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
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
                    {SERVICE_ORDER_LABELS[o.status] ?? o.status}
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
                      title="Cancelar orden"
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
                      title="Eliminar orden"
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
                  No hay órdenes de servicio registradas
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
        title="Cancelar orden de servicio"
        description="¿Cancelar esta orden de servicio? Esta acción no se puede deshacer."
        confirmText="Cancelar orden"
        onConfirm={() => {
          // Aquí irá la lógica para cancelar la orden de servicio
          toast.info("Funcionalidad de cancelar orden de servicio próximamente");
          setConfirmCancelServiceOrder(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteServiceOrder}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteServiceOrder(null);
        }}
        title="Eliminar orden de servicio"
        description="¿Eliminar esta orden de servicio permanentemente? Se eliminarán pagos, cuotas y comisiones asociadas. Esta acción no se puede deshacer."
        confirmText="Eliminar"
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

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  month: "Último mes",
  "3months": "Últimos 3 meses",
  "6months": "Últimos 6 meses",
  year: "Último año",
};

function CreditTab() {
  const [creditSubTab, setCreditSubTab] = useState<"lines" | "requests">("lines");
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
          Líneas
        </button>
        <button
          onClick={() => setCreditSubTab("requests")}
          className={`pb-2 text-sm font-medium transition-colors ${
            creditSubTab === "requests"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Solicitudes
        </button>
      </div>
      {creditSubTab === "lines" ? <CreditLinesTable /> : <CreditRequestsTable />}
    </div>
  );
}

function CreditLinesTable() {
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
      toast.success("Línea de crédito actualizada");
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-credit-lines"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Error al actualizar");
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
        <h2 className="text-lg font-semibold">Líneas de Crédito</h2>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Nivel</th>
              <th className="px-4 py-3 font-medium">Puntos</th>
              <th className="px-4 py-3 font-medium">Límite Rep.</th>
              <th className="px-4 py-3 font-medium">Disp. Rep.</th>
              <th className="px-4 py-3 font-medium">Límite Svc.</th>
              <th className="px-4 py-3 font-medium">Disp. Svc.</th>
              <th className="px-4 py-3 font-medium">A tiempo</th>
              <th className="px-4 py-3 font-medium">Atrasadas</th>
              <th className="px-4 py-3 font-medium">Ajuste</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.user_name}</div>
                  <div className="text-xs text-muted-foreground">{u.user_email}</div>
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
                    Editar
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
              <h3 className="text-lg font-semibold">Editar Línea — {editingUser.user_name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Límite de Repuestos ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editParts}
                  onChange={(e) => setEditParts(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  El límite de servicios se calcula automáticamente: ${(editParts ? parseFloat(editParts) / 3 : 0).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
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
                  Guardar
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
      toast.success("Solicitud aprobada");
      setApproving(null);
      queryClient.invalidateQueries({ queryKey: ["admin-limit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-credit-lines"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Error al aprobar");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      adminReviewLimitRequest(requestId, "REJECTED"),
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      queryClient.invalidateQueries({ queryKey: ["admin-limit-requests"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Error al rechazar");
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
      <h2 className="text-lg font-semibold">Solicitudes de Revisión</h2>
      {!requests || requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay solicitudes pendientes
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Límite actual</th>
                <th className="px-4 py-3 font-medium">Solicitó el</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
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
                        Aprobar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Rechazar solicitud de ${r.user_name}?`)) {
                            rejectMutation.mutate(r.id);
                          }
                        }}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                      >
                        <X className="h-3 w-3" />
                        Rechazar
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
                Aprobar — {approving.user_name}
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
                <p className="text-xs text-muted-foreground">Límite actual</p>
                <p className="font-mono font-semibold">
                  ${approving.current_parts_limit.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Nuevo límite de repuestos ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Servicio auto: ${(parseFloat(newLimit || "0") / 3).toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setApproving(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(newLimit);
                    if (isNaN(val) || val <= 0) {
                      toast.error("Ingresa un límite válido");
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
                  Aprobar
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
        <label className="text-sm font-medium text-muted-foreground">Período:</label>
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
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {(!owners || owners.length === 0) && (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No hay ganancias registradas en este período
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
                      {owner.total_sales} ventas &middot; {owner.workshops.length} taller
                      {owner.workshops.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                    <p className="font-bold text-green-500">${owner.total_revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagado</p>
                    <p className="font-semibold text-emerald-400">${owner.total_paid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
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
                        <th className="px-5 py-3 font-medium">Taller</th>
                        <th className="px-5 py-3 font-medium">Ventas</th>
                        <th className="px-5 py-3 font-medium">Ingresos</th>
                        <th className="px-5 py-3 font-medium">Pagado</th>
                        <th className="px-5 py-3 font-medium">Pendiente</th>
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
      toast.success("Comisiones verificadas");
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cutoff"] });
      setVerifyModalCommissions(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error al verificar comisiones");
    },
  });

  const rejectAllMutation = useMutation({
    mutationFn: (workshopId: string) => adminMarkAllCommissionsErroneous(workshopId),
    onSuccess: () => {
      toast.success("Comisiones rechazadas — vuelven a PENDING");
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      setVerifyModalCommissions(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error al rechazar comisiones");
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
          <option value="">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="PENDING_VERIFICATION">En verificación</option>
          <option value="PAID">Verificadas</option>
        </select>
        <button
          onClick={() => setShowCutoff((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface"
        >
          <ClipboardList className="h-4 w-4" />
          {showCutoff ? "Ocultar corte" : "Ver corte mensual"}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">Total Pendiente</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-400">
              ${data.total_pending.toFixed(2)}
            </p>
          </div>
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Total Verificado</p>
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
          No hay comisiones registradas
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
                      <p className="text-xs text-muted-foreground">Pendiente</p>
                      <p className="font-semibold text-amber-400">${group.pending_amount.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{group.pending_count} trans.</p>
                    </div>
                    {group.verification_count > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Verificación</p>
                        <p className="font-semibold text-blue-400">${group.verification_amount.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{group.verification_count} trans.</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Verificado</p>
                      <p className="font-semibold text-emerald-500">${group.paid_amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
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
                      Verificar pagos ({group.verification_count})
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
            <h2 className="text-lg font-semibold tracking-tight">Información de pago</h2>

            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">Monto total ({verifyModalCommissions.length} comisiones)</p>
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
                  Tasa BCV: {effectiveRate.toFixed(2)} Bs/$
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
                <p className="text-xs font-medium text-muted-foreground">Taller:</p>
                <p className="text-sm font-medium">{first.workshop_name}</p>
              </div>
              {first.owner_name && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Dueño:</p>
                  <p className="text-sm">{first.owner_name}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Método de pago:</p>
                <p className="text-sm">{first.payment_method ? methodLabel(first.payment_method) : "—"}</p>
              </div>
              {first.reference_number && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Número de referencia:</p>
                  <p className="text-sm font-mono">{first.reference_number}</p>
                </div>
              )}
              {first.paid_at && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Fecha de pago:</p>
                  <p className="text-sm">
                    {new Date(first.paid_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Estado:</p>
                <p className="text-sm">
                  <span className="rounded-full px-2.5 py-0.5 text-xs bg-amber-500/10 text-amber-400">Pendiente</span>
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
                Verificar pago
              </button>
              <button
                type="button"
                disabled={rejectAllMutation.isPending}
                onClick={() => rejectAllMutation.mutate(first.workshop_id)}
                className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {rejectAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Rechazar cuota
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyModalCommissions(null)}
                className="ml-btn ml-btn-outline"
              >
                Cerrar
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
        <h3 className="text-sm font-semibold">Corte mensual</h3>
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
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">${data.grand_total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendiente</p>
              <p className="text-lg font-semibold text-amber-400">${data.grand_pending.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="text-lg font-semibold text-emerald-500">${data.grand_paid.toFixed(2)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Taller</th>
                  <th className="px-3 py-2 font-medium">Comisiones</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Pendiente</th>
                  <th className="px-3 py-2 font-medium">Pagado</th>
                </tr>
              </thead>
              <tbody>
                {data.workshops.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Sin comisiones en este periodo
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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [verifyModalFee, setVerifyModalFee] = useState<AdminLateFee | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-late-fees", statusFilter],
    queryFn: () => adminListLateFees(statusFilter || undefined),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => adminVerifyLateFee(id),
    onSuccess: () => {
      toast.success("Mora verificada");
      queryClient.invalidateQueries({ queryKey: ["admin-late-fees"] });
      setVerifyModalFee(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error al verificar mora");
    },
  });

  const markErroneousMutation = useMutation({
    mutationFn: (lateFeeId: string) => adminMarkLateFeeErroneous(lateFeeId),
    onSuccess: () => {
      toast.success("Mora rechazada — vuelve a PENDING");
      queryClient.invalidateQueries({ queryKey: ["admin-late-fees"] });
      setVerifyModalFee(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error al marcar mora");
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
      PENDING: { label: "Pendiente", color: "bg-amber-500/10 text-amber-400" },
      PENDING_VERIFICATION: { label: "Verificación", color: "bg-blue-500/10 text-blue-400" },
      PAID: { label: "Verificada", color: "bg-emerald-500/10 text-emerald-500" },
      WAIVED: { label: "Condonada", color: "bg-muted text-muted-foreground" },
      ERRONEOUS: { label: "Rechazada", color: "bg-red-500/10 text-red-400" },
    };
    const s = map[status] ?? { label: status, color: "bg-muted text-muted-foreground" };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.color}`}>{s.label}</span>;
  };

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
          <option value="">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="PENDING_VERIFICATION">En verificación</option>
          <option value="PAID">Verificadas</option>
        </select>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">Total Pendiente</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-400">
              ${data.total_pending.toFixed(2)}
            </p>
          </div>
          <div className="ml-card p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Total Verificado</p>
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
          No hay moras registradas
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
                        {f.installment_type === "PARTS" ? "Repuestos" : "Servicio"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Monto</p>
                    <p className="text-lg font-bold text-red-400">${f.amount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Fecha</p>
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
                      Verificar
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
            <h2 className="text-lg font-semibold tracking-tight">Información de pago</h2>

            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">Monto</p>
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
                  Tasa BCV: {verifyModalFee.rate.toFixed(2)} Bs/$
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
                <p className="text-xs font-medium text-muted-foreground">Cliente:</p>
                <p className="text-sm font-medium">{verifyModalFee.user_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tipo:</p>
                <p className="text-sm">{verifyModalFee.installment_type === "PARTS" ? "Repuestos" : "Servicio"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Método de pago:</p>
                <p className="text-sm">{verifyModalFee.payment_method ? methodLabel(verifyModalFee.payment_method) : "—"}</p>
              </div>
              {verifyModalFee.reference_number && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Número de referencia:</p>
                  <p className="text-sm font-mono">{verifyModalFee.reference_number}</p>
                </div>
              )}
              {verifyModalFee.paid_at && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Fecha de pago:</p>
                  <p className="text-sm">
                    {new Date(verifyModalFee.paid_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Estado:</p>
                <p className="text-sm">
                  <span className="rounded-full px-2.5 py-0.5 text-xs bg-amber-500/10 text-amber-400">Pendiente</span>
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
                Verificar pago
              </button>
              <button
                type="button"
                disabled={markErroneousMutation.isPending}
                onClick={() => markErroneousMutation.mutate(verifyModalFee.id)}
                className="w-full ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {markErroneousMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Rechazar cuota
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyModalFee(null)}
                className="ml-btn ml-btn-outline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Payment Methods Tab ----

const ADMIN_CI_PREFIXES = ["V", "E", "P", "R", "J", "G"] as const;

function PaymentMethodsTab() {
  const queryClient = useQueryClient();
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
      toast.success("Método de pago creado");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error al crear método de pago");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminTogglePaymentMethod(id),
    onSuccess: () => {
      toast.success("Método actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeletePaymentMethod(id),
    onSuccess: () => {
      toast.success("Método eliminado");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-methods"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? "Error");
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
      setFormError("La etiqueta es obligatoria");
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
      bank_transfer: "Transferencia Bancaria",
      mobile_payment: "Pago Móvil",
      cash: "Efectivo",
      zelle: "Zelle",
      zinli: "Zinli",
      BANK_TRANSFER: "Transferencia Bancaria",
      MOBILE_PAYMENT: "Pago Móvil",
      ZELLE: "Zelle",
      BINANCE: "Binance",
      OTHER: "Otro",
    };
    return map[type] ?? type;
  };

  const methodIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === "bank_transfer") return <Building2 className="h-5 w-5 text-primary" />;
    if (t === "mobile_payment") return <Smartphone className="h-5 w-5 text-primary" />;
    if (t === "zelle" || t === "zinli") return <Mail className="h-5 w-5 text-primary" />;
    if (t === "cash") return <CreditCard className="h-5 w-5 text-primary" />;
    return <CreditCard className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Registra los destinos de pago para moras y comisiones.
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo método
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Registrar método de pago</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Etiqueta</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Cuenta principal"
                  className="ml-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
                <select
                  value={methodType}
                  onChange={(e) => handleMethodTypeChange(e.target.value as any)}
                  className="ml-input"
                >
                  <option value="mobile_payment">Pago móvil</option>
                  <option value="bank_transfer">Transferencia bancaria</option>
                  <option value="cash">Efectivo</option>
                  <option value="zelle">Zelle</option>
                  <option value="zinli">Zinli</option>
                </select>
              </div>

              {methodType === "bank_transfer" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Banco</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="ml-input"
                    >
                      <option value="">Seleccionar banco</option>
                      {(banks ?? []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Número de cuenta</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="ml-input"
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Titular</label>
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="ml-input"
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Cédula del titular</label>
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
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Banco</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="ml-input"
                    >
                      <option value="">Seleccionar banco</option>
                      {(banks ?? []).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Teléfono</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="ml-input"
                      placeholder="04121234567 o +584121234567"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Cédula del titular</label>
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
                  Pago en efectivo al recibir el producto.
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
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Titular</label>
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="ml-input"
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pago en USD — no requiere equivalente en bolívares.
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
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                  className="ml-btn ml-btn-primary text-xs"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar
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
          No hay métodos de pago registrados
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
                  {m.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {m.bank_name && <p className="text-muted-foreground">Banco: <span className="text-foreground">{m.bank_name}</span></p>}
                {m.account_number && <p className="text-muted-foreground">{m.method_type.toLowerCase() === "mobile_payment" ? "Teléfono" : "Cuenta"}: <span className="text-foreground font-mono">{m.account_number}</span></p>}
                {m.holder_name && <p className="text-muted-foreground">Titular: <span className="text-foreground">{m.holder_name}</span></p>}
                {m.holder_ci && <p className="text-muted-foreground">CI: <span className="text-foreground">{m.holder_ci}</span></p>}
                {m.phone && <p className="text-muted-foreground">Tel: <span className="text-foreground">{m.phone}</span></p>}
                {m.email && <p className="text-muted-foreground">Email: <span className="text-foreground">{m.email}</span></p>}
              </div>
              <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
                <button
                  onClick={() => toggleMutation.mutate(m.id)}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-surface"
                >
                  {m.is_active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(m.id)}
                  className="flex items-center gap-1 rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
