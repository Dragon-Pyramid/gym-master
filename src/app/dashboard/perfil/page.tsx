"use client";

import { useEffect, useMemo, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ClipboardList,
  CreditCard,
  HeartPulse,
  KeyRound,
  MessageCircle,
  Settings,
  ShieldCheck,
  Utensils,
  Dumbbell,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ProfileCard from "@/components/perfil/ProfileCard";
import type { Usuario } from "@/interfaces/usuario.interface";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

type QuickAction = {
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
};

const socioActions: QuickAction[] = [
  {
    titleEs: "Ficha médica",
    titleEn: "Medical record",
    descriptionEs: "Actualizá salud, apto y antecedentes.",
    descriptionEn: "Update health status, clearance, and background.",
    href: "/dashboard/ficha-medica",
    icon: HeartPulse,
    tone:
      "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-700/70",
  },
  {
    titleEs: "Rutinas",
    titleEn: "Routines",
    descriptionEs: "Revisá tu plan de entrenamiento.",
    descriptionEn: "Review your training plan.",
    href: "/dashboard/rutinas",
    icon: Dumbbell,
    tone:
      "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-700/60",
  },
  {
    titleEs: "Dietas",
    titleEn: "Diets",
    descriptionEs: "Consultá tu alimentación asignada.",
    descriptionEn: "Check your assigned nutrition plan.",
    href: "/dashboard/dietas",
    icon: Utensils,
    tone:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-700/60",
  },
  {
    titleEs: "Evolución",
    titleEn: "Physical evolution",
    descriptionEs: "Mirá tus cambios físicos.",
    descriptionEn: "Review your physical progress.",
    href: "/dashboard/evolucion-fisica",
    icon: TrendingUp,
    tone:
      "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-700/70",
  },
  {
    titleEs: "Pagos",
    titleEn: "Payments",
    descriptionEs: "Estado de cuota y recibos.",
    descriptionEn: "Fee status and receipts.",
    href: "/dashboard/mi-cuenta/historial-pagos",
    icon: CreditCard,
    tone:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-700/60",
  },
  {
    titleEs: "Mensajes",
    titleEn: "Messages",
    descriptionEs: "Contactá a administración.",
    descriptionEn: "Contact administration.",
    href: "/dashboard/mensajes",
    icon: MessageCircle,
    tone:
      "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-700/60",
  },
];

const staffActions: QuickAction[] = [
  {
    titleEs: "Preferencias",
    titleEn: "Preferences",
    descriptionEs: "Ajustes personales del panel.",
    descriptionEn: "Personal dashboard settings.",
    href: "/dashboard/settings/preferences",
    icon: Settings,
    tone:
      "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-700/60",
  },
  {
    titleEs: "Contraseña",
    titleEn: "Password",
    descriptionEs: "Cambiá tu clave de acceso.",
    descriptionEn: "Change your access password.",
    href: "/auth/change-password",
    icon: KeyRound,
    tone:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-700/60",
  },
  {
    titleEs: "Notificaciones",
    titleEn: "Notifications",
    descriptionEs: "Revisá novedades del sistema.",
    descriptionEn: "Review system updates.",
    href: "/dashboard/notificaciones",
    icon: Bell,
    tone:
      "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/60 dark:text-violet-100 dark:border-violet-700/70",
  },
  {
    titleEs: "Dashboard",
    titleEn: "Dashboard",
    descriptionEs: "Volver al inicio operativo.",
    descriptionEn: "Return to the operational home.",
    href: "/dashboard",
    icon: ClipboardList,
    tone:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-700/60",
  },
];

function profileTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
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
    return profileTx(locale, "Socio", "Member");
  }

  if (["admin", "administrador", "administrator"].includes(normalized)) {
    return profileTx(locale, "Administrador", "Administrator");
  }

  if (["usuario", "usuario_interno", "internal_user", "staff"].includes(normalized)) {
    return profileTx(locale, "Usuario interno", "Internal user");
  }

  return profileTx(locale, "Usuario", "User");
}

function QuickActionCard({
  action,
  locale,
}: {
  action: QuickAction;
  locale: GymMasterLocale;
}) {
  const Icon = action.icon;
  const title = profileTx(locale, action.titleEs, action.titleEn);
  const description = profileTx(
    locale,
    action.descriptionEs,
    action.descriptionEn,
  );

  return (
    <a
      href={action.href}
      className={`group flex min-h-[116px] flex-col justify-between rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${action.tone}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-black/5 dark:bg-slate-950/40">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-current/90">
          {profileTx(locale, "Abrir", "Open")}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-base font-black leading-tight">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-current/90">{description}</p>
      </div>
    </a>
  );
}

export default function PerfilPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } =
    useAuthStore() as any;
  const router = useRouter();
  const { locale } = useI18n();
  const c = (es: string, en: string) => profileTx(locale, es, en);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  const profileUser: Partial<Usuario> = useMemo(
    () => ({
      id: user?.id || user?.sub || "",
      nombre: user?.nombre || user?.nombre_completo || "",
      email: user?.email || user?.correo || "",
      creado_en: user?.creado_en || user?.created_at || user?.createdAt || "",
      foto: user?.foto || user?.avatar || user?.image || null,
      rol: user?.rol || user?.role || "",
      dni: user?.dni ?? null,
      must_change_password: Boolean(user?.must_change_password),
      password_actualizado_en: user?.password_actualizado_en ?? null,
      ultimo_login_en: user?.ultimo_login_en ?? null,
    }),
    [user],
  );

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const isSocio = ["socio", "member", "miembro"].includes(
    normalizeRole(profileUser.rol),
  );
  const actions = isSocio ? socioActions : staffActions;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="!grid !min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
          <AppHeader title={c("Mi perfil", "My profile")} />
          <section className="min-h-0 space-y-5 bg-gradient-to-b from-sky-50/70 via-background to-background px-4 py-4 sm:px-6 md:space-y-6 md:p-6 dark:from-sky-950/10">
            <div className="mx-auto w-full max-w-5xl space-y-5 md:space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm dark:border-sky-900/60 dark:bg-slate-950/80">
                <div className="relative isolate p-5 sm:p-6 md:p-8">
                  <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/20" />
                  <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-700/15" />
                  <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/70">
                        <UserRound className="h-3.5 w-3.5" />
                        {c("Perfil personal", "Personal profile")}
                      </p>
                      <h1 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl dark:text-white">
                        {profileUser.nombre || c("Mi cuenta", "My account")}
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {c(
                          "Revisá tus datos principales, actualizá tu foto y accedé rápido a las secciones más importantes de tu cuenta.",
                          "Review your main details, update your photo, and quickly access the most important sections of your account.",
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-200">
                      <ShieldCheck className="h-4 w-4" />
                      {c("Cuenta activa", "Active account")} ·{" "}
                      {roleLabel(locale, profileUser.rol)}
                    </div>
                  </div>
                </div>
              </div>

              <ProfileCard user={profileUser} size={128} />

              <div className="rounded-[2rem] border border-border bg-white p-4 shadow-sm dark:bg-slate-950/80 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">
                      {c("Accesos rápidos", "Quick access")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c(
                        "Atajos útiles para completar tu perfil y continuar usando Gym Master desde el celular.",
                        "Useful shortcuts to complete your profile and keep using Gym Master from your phone.",
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  {actions.map((action) => (
                    <QuickActionCard
                      key={action.href}
                      action={action}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100 sm:p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">
                      {c(
                        "Recomendación de seguridad",
                        "Security recommendation",
                      )}
                    </p>
                    <p className="mt-1">
                      {c(
                        "Si compartís este dispositivo o cambiaste tu clave inicial recientemente, usá “Cambiar contraseña” desde Preferencias o desde el engranaje superior.",
                        "If you share this device or recently changed your initial password, use “Change password” from Preferences or from the top gear menu.",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}