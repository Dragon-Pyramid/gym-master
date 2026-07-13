"use client";

import {
  CalendarDays,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import ProfileImage from "./ProfileImage";
import ProfileDetails from "./ProfileDetails";
import type { Usuario } from "@/interfaces/usuario.interface";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

function profileCardTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function roleLabel(locale: GymMasterLocale, rol?: string | null) {
  if (rol === "socio") return profileCardTx(locale, "Socio", "Member");
  if (rol === "admin")
    return profileCardTx(locale, "Administrador", "Administrator");
  if (rol === "usuario")
    return profileCardTx(locale, "Usuario interno", "Internal user");
  return profileCardTx(locale, "Usuario", "User");
}

export default function ProfileCard({
  user,
  size = 96,
}: {
  user?: Partial<Usuario> | null;
  size?: number;
}) {
  const updateUser = useAuthStore((state) => state.updateUser);
  const { locale } = useI18n();
  const c = (es: string, en: string) => profileCardTx(locale, es, en);

  const handlePhotoUpload = (data: any) => {
    const url = data?.url || data?.foto || data?.path || null;
    if (url) {
      updateUser({ foto: url });
    }
  };

  const userName = user?.nombre?.trim() || c("Usuario", "User");
  const userEmail =
    user?.email?.trim() || c("Email no disponible", "Email unavailable");

  return (
    <div className="w-full overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm dark:bg-slate-950/80">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950 p-5 text-white sm:p-6">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-4 text-center">
            <ProfileImage
              src={user?.foto ?? null}
              alt={userName}
              size={size}
              onUpload={handlePhotoUpload}
              tone="onDark"
            />

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-200">
                {c("Foto de perfil", "Profile photo")}
              </p>
              <h2 className="mt-2 break-words text-2xl font-black leading-tight sm:text-3xl">
                {userName}
              </h2>
              <p className="mt-2 break-words text-sm text-slate-100/95">
                {userEmail}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 text-left">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-sky-100">
                  <UserRound className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                    {c("Rol", "Role")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {roleLabel(locale, user?.rol)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                    {c("Estado", "Status")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {c("Activo", "Active")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/70 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                <Mail className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  {c("Contacto", "Contact")}
                </span>
              </div>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                {userEmail}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/70 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  {c("Cuenta", "Account")}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {c(
                  "Datos principales y seguridad",
                  "Main details and security",
                )}
              </p>
            </div>
          </div>

          <ProfileDetails user={user} />

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                {c(
                  "Mantené tu foto y datos actualizados para que el gimnasio pueda identificarte mejor en asistencia, rutinas, dietas y evolución física.",
                  "Keep your photo and details updated so the gym can identify you better for attendance, routines, diets, and physical evolution.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
