"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  HeartPulse,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Socio } from "@/interfaces/socio.interface";
import { Socio360Perfil } from "@/interfaces/socio360.interface";
import { fetchSocio360Api } from "@/services/browser/socio360ApiClient";
import { formatFrontendDate, formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { getProfilePhotoOrDefault, isDefaultProfilePhoto } from '@/utils/profilePhoto';
import { buildSocio360RiskSummary, getSocioRiskToneClasses, SocioRiskAlert } from '@/utils/socioRiskAlerts';

function socio360Tx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

const sexoLabel = (value: string | null | undefined, locale: GymMasterLocale) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['m', 'masculino', 'male'].includes(normalized)) return socio360Tx(locale, 'Masculino', 'Male');
  if (['f', 'femenino', 'female'].includes(normalized)) return socio360Tx(locale, 'Femenino', 'Female');
  return '-';
};

const cuotaEstadoLabel = (estado: string | null | undefined, locale: GymMasterLocale) => {
  if (!estado) return socio360Tx(locale, 'Sin estado', 'No status');
  const normalized = estado.toLowerCase().replaceAll('_', ' ').trim();
  const knownLabels: Array<[string[], string, string]> = [
    [['venc', 'mor', 'deuda', 'overdue', 'late', 'debt'], 'Vencida', 'Overdue'],
    [['al día', 'al dia', 'activa', 'activo', 'active', 'current', 'paid'], 'Al día', 'Current'],
    [['pendiente', 'pending'], 'Pendiente', 'Pending'],
    [['inactiva', 'inactivo', 'inactive'], 'Inactiva', 'Inactive'],
  ];
  const match = knownLabels.find(([tokens]) => tokens.some((token) => normalized.includes(token)));
  if (match) return socio360Tx(locale, match[1], match[2]);
  return estado.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
};

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <div className="min-h-10 rounded-xl border bg-background/80 p-3 text-sm text-foreground shadow-sm dark:border-slate-700 dark:bg-slate-950/60">
        {value || "-"}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string | number;
  detail?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-100",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100",
    danger: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-100",
    info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-100",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-black/5 p-2 dark:bg-white/10">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-1 truncate text-lg font-black">{value}</p>
          {detail ? <p className="mt-1 line-clamp-2 text-xs opacity-80">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  total,
  status,
  detail,
  href,
  emptyStatus,
  openLabel,
}: {
  icon: typeof ShieldCheck;
  title: string;
  total: number;
  status?: string;
  detail?: string;
  href: string;
  emptyStatus: string;
  openLabel: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-sky-100 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{status || emptyStatus}</p>
          </div>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-bold dark:border-slate-700">
          {total}
        </span>
      </div>
      {detail ? <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{detail}</p> : null}
      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link href={href}>{openLabel}</Link>
      </Button>
    </div>
  );
}

function RiskAlertCard({ alert, locale }: { alert: SocioRiskAlert; locale: GymMasterLocale }) {
  const levelLabel = {
    alto: socio360Tx(locale, 'Alto', 'High'),
    medio: socio360Tx(locale, 'Medio', 'Medium'),
    bajo: socio360Tx(locale, 'Leve', 'Low'),
  }[alert.level];
  return (
    <div className={`rounded-2xl border p-3 text-sm shadow-sm ${getSocioRiskToneClasses(alert.level)}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-black/5 p-2 dark:bg-white/10">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black">{alert.title}</p>
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-white/10">
              {levelLabel}
            </span>
          </div>
          <p className="mt-1 opacity-85">{alert.description}</p>
          {alert.href && alert.actionLabel ? (
            <Button asChild variant="outline" size="sm" className="mt-3 w-full bg-white/70 dark:bg-slate-950/30">
              <Link href={alert.href}>{alert.actionLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SocioViewModal({
  open,
  onClose,
  socio,
}: {
  open: boolean;
  onClose: () => void;
  socio?: Socio | null;
}) {
  const { locale } = useI18n();
  const tx = (es: string, en: string) => socio360Tx(locale, es, en);
  const dateLocale = locale === 'en' ? 'en-US' : 'es-AR';
  const [perfil360, setPerfil360] = useState<Socio360Perfil | null>(null);
  const [loading360, setLoading360] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!open || !socio) {
      setPerfil360(null);
      setLoading360(false);
      return;
    }

    setLoading360(true);
    fetchSocio360Api(socio, locale)
      .then((data) => {
        if (mounted) setPerfil360(data);
      })
      .catch(() => {
        if (mounted) setPerfil360(null);
      })
      .finally(() => {
        if (mounted) setLoading360(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, socio, locale]);

  const edad = useMemo(() => {
    if (!socio?.fecnac) return null;
    const birth = new Date(socio.fecnac);
    if (Number.isNaN(birth.getTime())) return null;
    const diff = Date.now() - birth.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }, [socio?.fecnac]);

  const riskSummary = useMemo(
    () =>
      socio
        ? buildSocio360RiskSummary(socio, perfil360, locale)
        : {
            level: 'ok' as const,
            label: socio360Tx(locale, 'Sin alertas críticas', 'No critical alerts'),
            score: 0,
            alerts: [],
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
          },
    [socio, perfil360, locale]
  );

  if (!socio) return null;

  const fotoPerfil = getProfilePhotoOrDefault(socio.foto);
  const tieneFotoPropia = !isDefaultProfilePhoto(socio.foto);
  const cuotaRawEstado =
    (perfil360?.cuota?.estado_cuota as string | undefined) ||
    (perfil360?.cuota?.estado as string | undefined);
  const cuotaEstado = cuotaEstadoLabel(cuotaRawEstado, locale);
  const cuotaRawNormalized = String(cuotaRawEstado ?? '').toLowerCase();
  const cuotaTone =
    perfil360?.cuota?.cuota_al_dia === false ||
    Number(perfil360?.cuota?.dias_vencido ?? 0) > 0 ||
    ['venc', 'mor', 'deuda', 'overdue', 'late', 'debt'].some((token) => cuotaRawNormalized.includes(token))
      ? 'danger'
      : perfil360?.cuota?.cuota_al_dia === true ||
          ['día', 'dia', 'act', 'current', 'paid'].some((token) => cuotaRawNormalized.includes(token))
        ? 'success'
        : 'warning';
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!left-1/2 !top-1/2 !flex !h-[min(92dvh,860px)] !max-h-[92dvh] !w-[min(96vw,1120px)] !max-w-[1120px] !-translate-x-1/2 !-translate-y-1/2 flex-col overflow-hidden bg-background p-0 text-foreground sm:rounded-2xl">
        <QaFileNameBadge file="src/components/modal/SocioViewModal.tsx" />
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950 p-4 text-white md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
                  {tx('Vista 360 administrador', 'Administrator 360 view')}
                </p>
                <DialogTitle className="text-2xl font-black text-white">
                  {socio.nombre_completo}
                </DialogTitle>
                <p className="mt-1 text-sm text-slate-300">
                  {tx('Consolidado operativo del socio', 'Member operational overview')} · {formatFrontendDateTime(new Date(), dateLocale)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:flex-wrap">
                <Button asChild variant="secondary" size="sm" className="w-full md:w-auto">
                  <Link href="/dashboard/cuotas">{tx('Cuotas', 'Fees')}</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="w-full md:w-auto">
                  <Link href="/dashboard/ficha-medica">{tx('Ficha médica', 'Medical record')}</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="w-full md:w-auto">
                  <Link href="/dashboard/mensajes-admin">{tx('Mensajes', 'Messages')}</Link>
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-8 md:p-6 md:pb-10">
            <div className="space-y-6 pr-1">
              <section className="rounded-3xl border bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
                <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                    <img
                      src={fotoPerfil}
                      alt={`${tx('Foto de', 'Photo of')} ${socio.nombre_completo}`}
                      className="h-full w-full rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = '/gm_logo.svg';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <h3 className="text-2xl font-black text-foreground">{socio.nombre_completo}</h3>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                          socio.activo
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200'
                        }`}
                      >
                        {socio.activo ? tx('Socio activo', 'Active member') : tx('Socio inactivo', 'Inactive member')}
                      </span>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                          tieneFotoPropia
                            ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200'
                            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                        }`}
                      >
                        {tieneFotoPropia ? tx('Foto cargada', 'Photo uploaded') : tx('Foto pendiente', 'Photo pending')}
                      </span>
                      <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${getSocioRiskToneClasses(riskSummary.level)}`}>
                        {riskSummary.label}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> DNI {socio.dni || '-'}</span>
                      <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {socio.email || '-'}</span>
                      <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {socio.telefono || '-'}</span>
                      <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {[socio.ciudad, socio.provincia].filter(Boolean).join(', ') || '-'}</span>
                    </div>
                  </div>
                </div>
              </section>

              {loading360 ? (
                <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                  {tx('Cargando módulos 360 del socio...', 'Loading member 360 modules...')}
                </div>
              ) : null}

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={CreditCard} label={tx('Estado de cuota', 'Fee status')} value={cuotaEstado} tone={cuotaTone} detail={perfil360?.cuota?.proximo_vencimiento ? `${tx('Próximo vencimiento', 'Next due date')}: ${formatFrontendDate(String(perfil360.cuota.proximo_vencimiento), dateLocale)}` : undefined} />
                <MetricCard icon={HeartPulse} label={tx('Ficha médica', 'Medical record')} value={perfil360?.fichaMedica.ultimoEstado || tx('Sin datos', 'No data')} tone={perfil360?.fichaMedica.activo ? 'success' : 'warning'} detail={perfil360?.fichaMedica.ultimaFecha ? `${tx('Última revisión', 'Last review')}: ${perfil360.fichaMedica.ultimaFecha}` : undefined} />
                <MetricCard icon={Activity} label={tx('Actividad física', 'Physical activity')} value={`${perfil360?.rutinas.total ?? 0} ${tx('rutinas', 'routines')}`} tone={(perfil360?.rutinas.total ?? 0) > 0 ? 'success' : 'warning'} detail={`${perfil360?.evolucion.total ?? 0} ${tx('controles de evolución', 'progress assessments')}`} />
                <MetricCard icon={MessageSquare} label={tx('Mensajes', 'Messages')} value={perfil360?.mensajes.total ?? 0} tone={(perfil360?.mensajes.pendientes ?? 0) > 0 ? 'warning' : 'info'} detail={(perfil360?.mensajes.pendientes ?? 0) > 0 ? `${perfil360?.mensajes.pendientes} ${tx('pendientes', 'pending')}` : tx('Sin pendientes detectados', 'No pending items detected')} />
              </section>

              <section className={`rounded-3xl border p-4 shadow-sm ${getSocioRiskToneClasses(riskSummary.level)}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-black/5 p-2 dark:bg-white/10">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-75">{tx('Alertas de riesgo 360', '360 risk alerts')}</p>
                      <h3 className="mt-1 text-xl font-black">{riskSummary.label}</h3>
                      <p className="mt-1 text-sm opacity-85">
                        {riskSummary.alerts.length > 0
                          ? tx(`${riskSummary.alerts.length} señal(es) para priorizar atención administrativa.`, `${riskSummary.alerts.length} signal(s) requiring administrative attention.`)
                          : tx('No se detectan alertas relevantes con los datos consultados.', 'No relevant alerts were detected in the available data.')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold md:min-w-[220px]">
                    <div className="rounded-2xl bg-black/5 p-3 dark:bg-white/10"><p className="text-lg">{riskSummary.highCount}</p><p>{tx('Altas', 'High')}</p></div>
                    <div className="rounded-2xl bg-black/5 p-3 dark:bg-white/10"><p className="text-lg">{riskSummary.mediumCount}</p><p>{tx('Medias', 'Medium')}</p></div>
                    <div className="rounded-2xl bg-black/5 p-3 dark:bg-white/10"><p className="text-lg">{riskSummary.lowCount}</p><p>{tx('Leves', 'Low')}</p></div>
                  </div>
                </div>
                {riskSummary.alerts.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {riskSummary.alerts.slice(0, 6).map((alert) => (
                      <RiskAlertCard key={alert.id} alert={alert} locale={locale} />
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-3xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <div>
                    <h3 className="text-lg font-black">{tx('Módulos del socio', 'Member modules')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tx('Resumen transversal para evitar saltar entre pantallas durante soporte o atención administrativa.', 'Cross-module summary that avoids switching between screens during support or administrative service.')}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ModuleCard icon={Dumbbell} title={tx('Rutinas', 'Routines')} total={perfil360?.rutinas.total ?? 0} status={perfil360?.rutinas.ultimoTitulo || perfil360?.rutinas.ultimoEstado} detail={perfil360?.rutinas.ultimaFecha ? `${tx('Última actualización', 'Last update')}: ${perfil360.rutinas.ultimaFecha}` : undefined} href="/dashboard/gestor-rutinas" emptyStatus={tx('Sin novedades', 'No updates')} openLabel={tx('Abrir módulo', 'Open module')} />
                    <ModuleCard icon={Utensils} title={tx('Dietas', 'Diets')} total={perfil360?.dietas.total ?? 0} status={perfil360?.dietas.ultimoTitulo || perfil360?.dietas.ultimoEstado} detail={perfil360?.dietas.ultimaFecha ? `${tx('Última actualización', 'Last update')}: ${perfil360.dietas.ultimaFecha}` : undefined} href="/dashboard/gestor-dietas" emptyStatus={tx('Sin novedades', 'No updates')} openLabel={tx('Abrir módulo', 'Open module')} />
                    <ModuleCard icon={Scale} title={tx('Evolución física', 'Physical progress')} total={perfil360?.evolucion.total ?? 0} status={perfil360?.evolucion.ultimoTitulo || tx('Seguimiento corporal', 'Body tracking')} detail={perfil360?.evolucion.ultimaFecha ? `${tx('Último control', 'Last assessment')}: ${perfil360.evolucion.ultimaFecha}` : undefined} href="/dashboard/gestor-evolucion-fisica" emptyStatus={tx('Sin novedades', 'No updates')} openLabel={tx('Abrir módulo', 'Open module')} />
                    <ModuleCard icon={CalendarDays} title={tx('Actividades', 'Activities')} total={perfil360?.actividades.total ?? 0} status={perfil360?.actividades.ultimoEstado || tx('Sin inscripciones activas', 'No active registrations')} detail={`${perfil360?.actividades.pendientes ?? 0} ${tx('pendientes', 'pending')} · ${perfil360?.actividades.inscriptas ?? 0} ${tx('inscriptas', 'registered')}`} href="/dashboard/actividades" emptyStatus={tx('Sin novedades', 'No updates')} openLabel={tx('Abrir módulo', 'Open module')} />
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border bg-slate-950 p-4 text-white shadow-sm dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-5 w-5 text-sky-300" />
                    <div>
                      <h3 className="text-lg font-black">{tx('Lectura rápida 360', 'Quick 360 overview')}</h3>
                      <p className="text-sm text-slate-300">
                        {tx('Señales útiles para atención, retención y seguimiento administrativo.', 'Useful signals for service, retention, and administrative follow-up.')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-bold">{tx('Estado general', 'General status')}</p>
                      <p className="mt-1 text-slate-300">
                        {socio.activo ? tx('Puede operar normalmente como socio activo.', 'The member can operate normally as active.') : tx('Socio inactivo: revisar antes de asignar servicios nuevos.', 'Inactive member: review before assigning new services.')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-bold">{tx('Riesgo administrativo', 'Administrative risk')}</p>
                      <p className="mt-1 text-slate-300">
                        {riskSummary.alerts.length > 0
                          ? `${riskSummary.label}: ${tx('revisar las alertas 360 antes de cerrar la atención.', 'review the 360 alerts before closing the service interaction.')}`
                          : tx('No se detectan mensajes ni señales críticas en el resumen consultado.', 'No critical messages or signals were detected in the available summary.')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-bold">{tx('Seguimiento saludable', 'Health follow-up')}</p>
                      <p className="mt-1 text-slate-300">
                        {perfil360?.fichaMedica.activo
                          ? tx('Tiene ficha médica registrada para revisión administrativa.', 'A medical record is available for administrative review.')
                          : tx('Conviene solicitar o revisar ficha médica vigente.', 'Request or review a current medical record.')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {perfil360?.errores.length ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-1 h-5 w-5" />
                    <div>
                      <h3 className="font-bold">{tx('Resumen parcial', 'Partial summary')}</h3>
                      <p className="text-sm">
                        {tx('Algunos módulos no respondieron durante la consulta 360. El perfil base sigue disponible.', 'Some modules did not respond during the 360 request. The base profile remains available.')}
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-xs">
                        {perfil360.errores.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{tx('Datos personales', 'Personal details')}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DetailField label={tx('Nombre completo', 'Full name')} value={socio.nombre_completo} />
                  <DetailField label="DNI" value={socio.dni} />
                  <DetailField label={tx('Sexo', 'Sex')} value={sexoLabel(socio.sexo, locale)} />
                  <DetailField label={tx('Edad', 'Age')} value={edad ? `${edad} ${tx('años', 'years')}` : '-'} />
                  <DetailField label={tx('Fecha de nacimiento', 'Birth date')} value={formatFrontendDate(socio.fecnac, dateLocale)} />
                  <DetailField label={tx('Fecha alta', 'Registration date')} value={formatFrontendDate(socio.fecha_alta, dateLocale)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{tx('Contacto, ubicación y emergencia', 'Contact, location, and emergency')}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DetailField label={tx('Teléfono', 'Phone')} value={socio.telefono} />
                  <DetailField label="Email" value={socio.email} />
                  <DetailField label={tx('Dirección', 'Address')} value={socio.direccion} />
                  <DetailField label={tx('Ciudad', 'City')} value={socio.ciudad} />
                  <DetailField label={tx('Provincia', 'Province')} value={socio.provincia} />
                  <DetailField label={tx('País', 'Country')} value={socio.pais} />
                  <DetailField label={tx('Contacto emergencia', 'Emergency contact')} value={socio.contacto_emergencia_nombre} />
                  <DetailField label={tx('Teléfono emergencia', 'Emergency phone')} value={socio.contacto_emergencia_telefono} />
                  <DetailField label={tx('Descuento activo', 'Active discount')} value={socio.descuento_activo ? tx('Sí', 'Yes') : tx('No', 'No')} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
