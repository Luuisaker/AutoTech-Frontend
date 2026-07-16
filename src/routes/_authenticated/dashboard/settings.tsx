import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import type { AxiosError } from "axios";
import {
  Loader2,
  Shield,
  ShieldCheck,
  User,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  Camera,
  Trash2,
  Pencil,
  X,
  Sun,
  Moon,
  Languages,
} from "lucide-react";

import { useAuth } from "../../../lib/auth-context";
import { useLocale } from "../../../lib/locale-context";
import {
  updateMe,
  changePassword,
  uploadProfilePhoto,
  deleteProfilePhoto,
  setup2FA,
  verify2FA,
  disable2FA,
  type UpdateProfileInput,
} from "../../../lib/auth";
import { getPhotoUrl } from "../../../lib/api";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  component: SettingsPage,
});

const inputBase =
  "block w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-border-strong";

function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return "dark";
  });

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(newTheme);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("autotech.theme", newTheme);
    }
  };

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

  const [photoUploading, setPhotoUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [twoFAUri, setTwoFAUri] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [twoFAMode, setTwoFAMode] = useState<"setup" | "disable">("setup");

  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [pendingPhotoRemoved, setPendingPhotoRemoved] = useState(false);

  function revokePendingPhotoUrl() {
    if (pendingPhotoUrl) {
      URL.revokeObjectURL(pendingPhotoUrl);
      setPendingPhotoUrl(null);
    }
  }

  function resetPendingPhoto() {
    revokePendingPhotoUrl();
    setPendingPhoto(null);
    setPendingPhotoRemoved(false);
  }

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone);
    }
  }, [user]);

  function extractErrorMsg(err: unknown) {
    const axiosErr = err as AxiosError<{ detail?: unknown; message?: string }>;
    const detail = axiosErr.response?.data?.detail;
    let msg = axiosErr.response?.data?.message ?? axiosErr.message;
    if (axiosErr.response?.status === 422 && detail) {
      if (Array.isArray(detail)) {
        const first = detail[0] as { loc?: string[]; msg?: string } | undefined;
        msg = first?.msg ?? "Datos inválidos. Revisa los campos.";
      } else if (typeof detail === "string") {
        msg = detail;
      }
    }
    return msg ?? "Error al guardar";
  }

  const passwordMutation = useMutation({
    mutationFn: () =>
      changePassword({ current_password: currentPassword, new_password: newPassword }),
    onSuccess: () => {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
      }, 1500);
    },
    onError: (err: AxiosError<{ detail?: unknown; message?: string }>) => {
      const detail = err.response?.data?.detail;
      let msg = err.response?.data?.message ?? err.message;
      if (err.response?.status === 422 && detail) {
        if (Array.isArray(detail)) {
          const first = detail[0] as { loc?: string[]; msg?: string } | undefined;
          msg = first?.msg ?? "Datos inválidos. Revisa los campos.";
        } else if (typeof detail === "string") {
          msg = detail;
        }
      }
      setPasswordError(msg ?? "Error al cambiar contraseña");
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: () => setup2FA(),
    onSuccess: (data) => {
      setTwoFASecret(data.secret);
      setTwoFAUri(data.otpauth_uri);
    },
    onError: (err: AxiosError<{ detail?: unknown; message?: string }>) => {
      const detail = err.response?.data?.detail;
      let msg = err.response?.data?.message ?? err.message;
      if (typeof detail === "string") msg = detail;
      setTwoFAError(msg ?? "Error al configurar 2FA");
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: () => verify2FA(twoFACode),
    onSuccess: () => {
      setShow2FAModal(false);
      setTwoFASecret(null);
      setTwoFAUri(null);
      setTwoFACode("");
      setTwoFAError(null);
      if (user) updateProfile({ ...user, is_2fa_enabled: 1 });
    },
    onError: (err: AxiosError<{ detail?: unknown; message?: string }>) => {
      const detail = err.response?.data?.detail;
      let msg = err.response?.data?.message ?? err.message;
      if (typeof detail === "string") msg = detail;
      setTwoFAError(msg ?? "Código incorrecto");
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: () => disable2FA(twoFACode),
    onSuccess: () => {
      setShow2FAModal(false);
      setTwoFACode("");
      setTwoFAError(null);
      if (user) updateProfile({ ...user, is_2fa_enabled: 0 });
    },
    onError: (err: AxiosError<{ detail?: unknown; message?: string }>) => {
      const detail = err.response?.data?.detail;
      let msg = err.response?.data?.message ?? err.message;
      if (typeof detail === "string") msg = detail;
      setTwoFAError(msg ?? "Código incorrecto");
    },
  });

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    revokePendingPhotoUrl();
    setPendingPhoto(file);
    setPendingPhotoUrl(URL.createObjectURL(file));
    setPendingPhotoRemoved(false);
  }

  function handleDeletePhoto() {
    setPendingPhotoRemoved(true);
    setPendingPhoto(null);
    revokePendingPhotoUrl();
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    const input: UpdateProfileInput = {};
    let hasChanges = false;

    if (firstName.trim() !== user?.first_name) {
      if (firstName.trim().length < 2) {
        setProfileError("El nombre debe tener al menos 2 caracteres.");
        return;
      }
      input.first_name = firstName.trim();
      hasChanges = true;
    }
    if (lastName.trim() !== user?.last_name) {
      if (lastName.trim().length < 2) {
        setProfileError("El apellido debe tener al menos 2 caracteres.");
        return;
      }
      input.last_name = lastName.trim();
      hasChanges = true;
    }
    if (phone.trim() !== user?.phone) {
      const phoneClean = phone.replace(/\D/g, "");
      if (!/^(0|58)?4(12|14|16|24|26)\d{7}$/.test(phoneClean)) {
        setProfileError("Teléfono inválido. Usa formato 04141234567 o +584141234567.");
        return;
      }
      let normalizedPhone = phoneClean;
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+58" + normalizedPhone.slice(1);
      } else if (normalizedPhone.startsWith("58")) {
        normalizedPhone = "+58" + normalizedPhone.slice(2);
      } else if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = "+58" + normalizedPhone;
      }
      input.phone = normalizedPhone;
      hasChanges = true;
    }

    if (!hasChanges && !pendingPhoto && !pendingPhotoRemoved) {
      setProfileError("No hay cambios para guardar.");
      return;
    }

    setPhotoUploading(true);
    try {
      let profile = hasChanges ? await updateMe(input) : null;

      if (pendingPhoto) {
        profile = await uploadProfilePhoto(pendingPhoto);
      } else if (pendingPhotoRemoved) {
        profile = await deleteProfilePhoto();
      }

      if (profile) {
        updateProfile(profile);
      }

      resetPendingPhoto();

      setProfileSuccess(true);
      setTimeout(() => {
        setProfileSuccess(false);
        setShowEditModal(false);
      }, 1500);
    } catch (err: unknown) {
      setProfileError(
        (err as AxiosError<{ message?: string }>)?.response?.data?.message ??
          extractErrorMsg(err) ??
          "Error al guardar",
      );
    } finally {
      setPhotoUploading(false);
    }
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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <section className="ml-card p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t("settings.personalInfo")}</h2>
            <p className="text-xs text-muted-foreground">{t("settings.personalInfoDesc")}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full">
              {user?.photo_url ? (
                <img
                  src={getPhotoUrl(user.photo_url)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <User className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
            </div>

            <div className="grid flex-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("settings.nameAndLastname")}
                </p>
                <p className="text-sm text-foreground">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("settings.phone")}
                </p>
                <p className="text-sm text-foreground">{user?.phone}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("settings.ci")}
                </p>
                <p className="text-sm text-foreground">{user?.ci}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t("settings.ciNotEditable")}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("settings.email")}
                </p>
                <p className="text-sm text-foreground">{user?.email}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t("settings.emailNotEditable")}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                setPasswordError(null);
                setPasswordSuccess(false);
                setShowPasswordModal(true);
              }}
              className="ml-btn ml-btn-outline"
            >
              <Lock className="h-4 w-4" />
              {t("settings.changePassword")}
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileError(null);
                setProfileSuccess(false);
                resetPendingPhoto();
                setShowEditModal(true);
              }}
              className="ml-btn ml-btn-primary"
            >
              <Pencil className="h-4 w-4" />
              {t("settings.editInfo")}
            </button>
          </div>
        </div>
      </section>

      <section className="ml-card p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background">
            <Sun className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t("settings.appearance")}</h2>
            <p className="text-xs text-muted-foreground">{t("settings.appearanceDesc")}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium">{t("settings.theme")}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">{t("settings.dark")}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span className="text-sm font-medium">{t("settings.light")}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">{t("settings.language")}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocale("es");
                  updateMe({ language_preference: "es" }).catch(() => {});
                }}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  locale === "es"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Languages className="h-4 w-4" />
                <span className="text-sm font-medium">{t("settings.spanish")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocale("en");
                  updateMe({ language_preference: "en" }).catch(() => {});
                }}
                className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                  locale === "en"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Languages className="h-4 w-4" />
                <span className="text-sm font-medium">{t("settings.english")}</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("settings.languageNote")}</p>
          </div>
        </div>
      </section>

      <section className="ml-card p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{t("settings.twoFactorAuth")}</h2>
              <p className="text-xs text-muted-foreground">{t("settings.twoFactorAuthDesc")}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {t("settings.status")}:{" "}
                  {user?.is_2fa_enabled ? (
                    <span className="text-emerald-500">{t("settings.enabled")}</span>
                  ) : (
                    <span className="text-muted-foreground">{t("settings.disabled")}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user?.is_2fa_enabled
                    ? t("settings.twoFactorEnabledDesc")
                    : t("settings.twoFactorDisabledDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTwoFAError(null);
                  setTwoFACode("");
                  setTwoFASecret(null);
                  setTwoFAUri(null);
                  if (user?.is_2fa_enabled) {
                    setTwoFAMode("disable");
                    setShow2FAModal(true);
                  } else {
                    setTwoFAMode("setup");
                    setShow2FAModal(true);
                    setup2FAMutation.mutate();
                  }
                }}
                className={user?.is_2fa_enabled ? "ml-btn ml-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10" : "ml-btn ml-btn-primary"}
              >
                <ShieldCheck className="h-4 w-4" />
                {user?.is_2fa_enabled ? t("settings.disable2FA") : t("settings.enable2FA")}
              </button>
            </div>
          </div>
        </section>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">{t("settings.editModalTitle")}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setProfileError(null);
                  setProfileSuccess(false);
                  resetPendingPhoto();
                }}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-full">
                  {pendingPhotoUrl ? (
                    <img src={pendingPhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : pendingPhotoRemoved || !user?.photo_url ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <User className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  ) : (
                    <img
                      src={getPhotoUrl(user.photo_url)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                {photoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="ml-btn ml-btn-outline text-xs"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {pendingPhoto || (user?.photo_url && !pendingPhotoRemoved)
                    ? t("settings.changePhoto")
                    : t("settings.uploadPhoto")}
                </button>
                {!pendingPhotoRemoved && user?.photo_url && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={photoUploading}
                    className="ml-btn border border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("common.delete")}
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <User className="h-3.5 w-3.5" /> {t("settings.firstName")}
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
                    <User className="h-3.5 w-3.5" /> {t("settings.lastName")}
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
                    <Phone className="h-3.5 w-3.5" /> {t("settings.phoneLabel")}
                  </label>
                  <input
                    className={inputBase}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder={t("settings.phonePlaceholder")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("settings.email")}
                  </label>
                  <input className={inputBase} value={user?.email} disabled />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {t("settings.emailNotEditable")}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("settings.ci")}
                  </label>
                  <input className={inputBase} value={user?.ci} disabled />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {t("settings.ciNotEditableLabel")}
                  </p>
                </div>
              </div>

              {profileError && <p className="mt-4 text-xs text-destructive">{profileError}</p>}
              {profileSuccess && (
                <p className="mt-4 flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t("settings.profileUpdated")}
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button type="submit" disabled={photoUploading} className="ml-btn ml-btn-primary">
                  {photoUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">{t("settings.changePasswordModalTitle")}</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setPasswordSuccess(false);
                }}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="grid gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("settings.currentPassword")}
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
                    {t("settings.newPassword")}
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
                    {t("settings.confirmNewPassword")}
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
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t("settings.passwordUpdated")}
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="ml-btn ml-btn-primary"
                >
                  {passwordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {t("settings.savePassword")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">
                {twoFAMode === "setup" ? t("settings.setup2FATitle") : t("settings.disable2FATitle")}
              </h2>
              <button
                onClick={() => {
                  setShow2FAModal(false);
                  setTwoFASecret(null);
                  setTwoFAUri(null);
                  setTwoFACode("");
                  setTwoFAError(null);
                }}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {twoFAMode === "setup" && (
              <>
                {setup2FAMutation.isPending && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {twoFASecret && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t("settings.scanQR")}
                    </p>
                    <div className="flex justify-center rounded-lg border border-border bg-background p-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFAUri ?? "")}`}
                        alt="QR Code"
                        className="h-48 w-48"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("settings.orEnterManually")}</p>
                      <code className="block rounded-md border border-border bg-background px-3 py-2 text-xs font-mono break-all">
                        {twoFASecret}
                      </code>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        {t("settings.verificationCode")}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={twoFACode}
                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                        className={`${inputBase} tracking-[0.3em] text-center font-mono`}
                        placeholder={t("settings.verificationCodePlaceholder")}
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {twoFAMode === "disable" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("settings.enterCodeToDisable")}
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                    className={`${inputBase} tracking-[0.3em] text-center font-mono`}
                    placeholder="000000"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {twoFAError && (
              <p className="mt-4 text-xs text-destructive">{twoFAError}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShow2FAModal(false);
                  setTwoFASecret(null);
                  setTwoFAUri(null);
                  setTwoFACode("");
                  setTwoFAError(null);
                }}
                className="ml-btn ml-btn-outline"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={
                  twoFACode.length !== 6 ||
                  (twoFAMode === "setup" ? verify2FAMutation.isPending : disable2FAMutation.isPending)
                }
                onClick={() => {
                  setTwoFAError(null);
                  if (twoFAMode === "setup") {
                    verify2FAMutation.mutate();
                  } else {
                    disable2FAMutation.mutate();
                  }
                }}
                className="ml-btn ml-btn-primary"
              >
                {(twoFAMode === "setup" ? verify2FAMutation.isPending : disable2FAMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {twoFAMode === "setup" ? t("settings.verifyAndActivate") : t("settings.deactivate")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
