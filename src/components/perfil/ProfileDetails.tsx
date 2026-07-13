"use client";

import type { ComponentType } from "react";
import {
  CalendarClock,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Usuario } from "@/interfaces/usuario.interface";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";
import { formatFrontendDate } from "@/utils/dateFormat";

function profileDetailsTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function formatDate(locale: GymMasterLocale, d?: string | Date | null) {
  const fallback = profileDetailsTx(locale, "No registrado", "Not registered");
  if (!d) return fallback;
  const date = typeof d === "string" ? new Date(d) : d;
  if (!date || isNaN(date.getTime())) return fallback;
  return formatFrontendDate(date);
}

function normalizeRole(rol?: string | null) {
  return String(rol ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "_");
}

function roleLabel(locale: GymMasterLocale, rol?: string | null) {
  const normalized = normalizeRole(rol);

  if (["socio", "member", "miembro"].includes(normalized)) {
    return profileDetailsTx(locale, "Socio", "Member");
  }

  if (["admin", "administrador", "administrator"].includes(normalized)) {
    return profileDetailsTx(locale, "Administrador", "Administrator");
  }

  if (["usuario", "usuario_interno", "internal_user", "staff"].includes(normalized)) {
    return profileDetailsTx(locale, "Usuario interno", "Internal user");
  }

  return profileDetailsTx(locale, "Usuario", "User");
}

function DetailItem({
  icon: Icon,
  label,
  value,
  fallback,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string | number | null;
  fallback: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-foreground">
        {value || fallback}
      </p>
    </div>
  );
}

export default function ProfileDetails({
  user,
}: {
  user?: Partial<Usuario> | null;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => profileDetailsTx(locale, es, en);
  const notRegistered = c("No registrado", "Not registered");

  const passwordStatus = user?.must_change_password
    ? c("Cambio pendiente", "Change pending")
    : user?.password_actualizado_en
      ? `${c("Actualizada", "Updated")}: ${formatDate(locale, user.password_actualizado_en)}`
      : c("Sin cambio reciente registrado", "No recent change registered");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-foreground">
          {c("Datos de cuenta", "Account details")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {c(
            "Información principal de tu usuario dentro de Gym Master.",
            "Main information for your Gym Master user account.",
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailItem
          icon={UserRound}
          label={c("Nombre", "Name")}
          value={user?.nombre}
          fallback={notRegistered}
        />
        <DetailItem
          icon={Mail}
          label="Email"
          value={user?.email}
          fallback={notRegistered}
        />
        <DetailItem
          icon={ShieldCheck}
          label={c("Rol", "Role")}
          value={roleLabel(locale, user?.rol)}
          fallback={notRegistered}
        />
        <DetailItem
          icon={Fingerprint}
          label="ID"
          value={user?.dni ?? null}
          fallback={notRegistered}
        />
        <DetailItem
          icon={CalendarClock}
          label={c("Alta de cuenta", "Account registration")}
          value={formatDate(locale, user?.creado_en)}
          fallback={notRegistered}
        />
        <DetailItem
          icon={KeyRound}
          label={c("Contraseña", "Password")}
          value={passwordStatus}
          fallback={notRegistered}
        />
      </div>
    </div>
  );
}