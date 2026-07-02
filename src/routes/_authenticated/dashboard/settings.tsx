import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Loader2,
  Shield,
  User,
  Phone,
  Lock,
  Save,
  Store,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../../lib/auth-context";
import { updateMe, changePassword, type UpdateProfileInput } from "../../../lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

const inputBase =
  "block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong";

function SettingsPage() {
  const { user, roles, updateProfile } = useAuth();
  const isWorkshopOwner = roles.includes("WORKSHOP_OWNER") || roles.includes("ADMIN");

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone);
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateMe(input),
    onSuccess: (profile) => {
      updateProfile(profile);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: (err: Error) => setProfileError(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      changePassword({ current_password: currentPassword, new_password: newPassword }),
    onSuccess: () => {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err: Error) => setPasswordError(err.message),
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const phoneClean = phone.replace(/\D/g, "");
    if (!/^(0)?4(12|14|16|24|26)\d{7}$/.test(phoneClean)) {
      setProfileError("Teléfono inválido. Usa formato 04141234567.");
      return;
    }

    const input: UpdateProfileInput = {};
    if (firstName.trim() !== user?.first_name) input.first_name = firstName.trim();
    if (lastName.trim() !== user?.last_name) input.last_name = lastName.trim();
    if (phone.trim() !== user?.phone) input.phone = phone.trim();

    if (Object.keys(input).length === 0) {
      setProfileError("No hay cambios para guardar.");
      return;
    }

    profileMutation.mutate(input);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    passwordMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa y actualiza tu información personal y credenciales.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Información Personal</h2>
            <p className="text-xs text-muted-foreground">Edita los datos de tu cuenta.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-5 border-t border-border pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Nombre
              </label>
              <input
                className={inputBase}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Apellido
              </label>
              <input
                className={inputBase}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Teléfono
              </label>
              <input
                className={inputBase}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="04141234567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
              <input className={inputBase} value={user?.email} disabled />
              <p className="mt-1 text-[10px] text-muted-foreground">El email no se puede editar.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cédula</label>
              <input className={inputBase} value={user?.ci} disabled />
              <p className="mt-1 text-[10px] text-muted-foreground">La cédula no se puede editar.</p>
            </div>
          </div>

          {profileError && <p className="mt-4 text-xs text-destructive">{profileError}</p>}
          {profileSuccess && (
            <p className="mt-4 flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Perfil actualizado correctamente.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {profileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Seguridad</h2>
            <p className="text-xs text-muted-foreground">Cambia tu contraseña.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-5 border-t border-border pt-5">
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Contraseña actual
              </label>
              <input
                type="password"
                className={inputBase}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nueva contraseña
              </label>
              <input
                type="password"
                className={inputBase}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                className={inputBase}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {passwordError && <p className="mt-4 text-xs text-destructive">{passwordError}</p>}
          {passwordSuccess && (
            <p className="mt-4 flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Contraseña actualizada correctamente.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {passwordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Cambiar contraseña
            </button>
          </div>
        </form>
      </section>

      {isWorkshopOwner && (
        <section className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background">
              <Store className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Mis Talleres</h2>
              <p className="text-xs text-muted-foreground">Gestiona tus talleres registrados.</p>
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-5">
            <Link
              to="/dashboard/my-workshops"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ir a Mis Talleres <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

