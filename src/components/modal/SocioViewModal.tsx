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
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { getProfilePhotoOrDefault, isDefaultProfilePhoto } from '@/utils/profilePhoto';

const sexoLabel = (value?: string | null) => {
  if (value === "M") return "Masculino";
  if (value === "F") return "Femenino";
  return "-";
};

const cuotaEstadoLabel = (estado?: string | null) => {
  if (!estado) return "Sin estado";
  return estado
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
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
}: {
  icon: typeof ShieldCheck;
  title: string;
  total: number;
  status?: string;
  detail?: string;
  href: string;
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
            <p className="text-xs text-muted-foreground">{status || 'Sin novedades'}</p>
          </div>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-bold dark:border-slate-700">
          {total}
        </span>
      </div>
      {detail ? <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{detail}</p> : null}
      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link href={href}>Abrir módulo</Link>
      </Button>
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
    fetchSocio360Api(socio)
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
  }, [open, socio]);

  const edad = useMemo(() => {
    if (!socio?.fecnac) return null;
    const birth = new Date(socio.fecnac);
    if (Number.isNaN(birth.getTime())) return null;
    const diff = Date.now() - birth.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }, [socio?.fecnac]);

  if (!socio) return null;

  const fotoPerfil = getProfilePhotoOrDefault(socio.foto);
  const tieneFotoPropia = !isDefaultProfilePhoto(socio.foto);
  const cuotaRawEstado =
    (perfil360?.cuota?.estado_cuota as string | undefined) ||
    (perfil360?.cuota?.estado as string | undefined);
  const cuotaEstado = cuotaEstadoLabel(cuotaRawEstado);
  const cuotaTone = cuotaEstado.toLowerCase().includes('venc') || cuotaEstado.toLowerCase().includes('mor')
    ? 'danger'
    : cuotaEstado.toLowerCase().includes('día') || cuotaEstado.toLowerCase().includes('act')
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
                  Vista 360 administrador
                </p>
                <DialogTitle className="text-2xl font-black text-white">
                  {socio.nombre_completo}
                </DialogTitle>
                <p className="mt-1 text-sm text-slate-300">
                  Consolidado operativo del socio · {formatFrontendDateTime(new Date())}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:flex md:flex-wrap">
                <Button asChild variant="secondary" size="sm" className="w-full md:w-auto">
                  <Link href="/dashboard/cuotas">Cuotas</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="w-full md:w-auto">
                  <Link href="/dashboard/ficha-medica">Ficha médica</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="w-full md:w-auto">
                  <Link href="/dashboard/mensajes-admin">Mensajes</Link>
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
                      alt={`Foto de ${socio.nombre_completo}`}
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
                        {socio.activo ? 'Socio activo' : 'Socio inactivo'}
                      </span>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                          tieneFotoPropia
                            ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200'
                            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                        }`}
                      >
                        {tieneFotoPropia ? 'Foto cargada' : 'Foto pendiente'}
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
                  Cargando módulos 360 del socio...
                </div>
              ) : null}

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={CreditCard} label="Estado de cuota" value={cuotaEstado} tone={cuotaTone} detail={perfil360?.cuota?.proximo_vencimiento ? `Próximo vencimiento: ${String(perfil360.cuota.proximo_vencimiento)}` : undefined} />
                <MetricCard icon={HeartPulse} label="Ficha médica" value={perfil360?.fichaMedica.ultimoEstado || 'Sin datos'} tone={perfil360?.fichaMedica.activo ? 'success' : 'warning'} detail={perfil360?.fichaMedica.ultimaFecha ? `Última revisión: ${perfil360.fichaMedica.ultimaFecha}` : undefined} />
                <MetricCard icon={Activity} label="Actividad física" value={`${perfil360?.rutinas.total ?? 0} rutinas`} tone={(perfil360?.rutinas.total ?? 0) > 0 ? 'success' : 'warning'} detail={`${perfil360?.evolucion.total ?? 0} controles de evolución`} />
                <MetricCard icon={MessageSquare} label="Mensajes" value={perfil360?.mensajes.total ?? 0} tone={(perfil360?.mensajes.pendientes ?? 0) > 0 ? 'warning' : 'info'} detail={(perfil360?.mensajes.pendientes ?? 0) > 0 ? `${perfil360?.mensajes.pendientes} pendientes` : 'Sin pendientes detectados'} />
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 rounded-3xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                  <div>
                    <h3 className="text-lg font-black">Módulos del socio</h3>
                    <p className="text-sm text-muted-foreground">
                      Resumen transversal para evitar saltar entre pantallas durante soporte o atención administrativa.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ModuleCard icon={Dumbbell} title="Rutinas" total={perfil360?.rutinas.total ?? 0} status={perfil360?.rutinas.ultimoTitulo || perfil360?.rutinas.ultimoEstado} detail={perfil360?.rutinas.ultimaFecha ? `Última actualización: ${perfil360.rutinas.ultimaFecha}` : undefined} href="/dashboard/gestor-rutinas" />
                    <ModuleCard icon={Utensils} title="Dietas" total={perfil360?.dietas.total ?? 0} status={perfil360?.dietas.ultimoTitulo || perfil360?.dietas.ultimoEstado} detail={perfil360?.dietas.ultimaFecha ? `Última actualización: ${perfil360.dietas.ultimaFecha}` : undefined} href="/dashboard/gestor-dietas" />
                    <ModuleCard icon={Scale} title="Evolución física" total={perfil360?.evolucion.total ?? 0} status={perfil360?.evolucion.ultimoTitulo || 'Seguimiento corporal'} detail={perfil360?.evolucion.ultimaFecha ? `Último control: ${perfil360.evolucion.ultimaFecha}` : undefined} href="/dashboard/gestor-evolucion-fisica" />
                    <ModuleCard icon={CalendarDays} title="Actividades" total={perfil360?.actividades.total ?? 0} status={perfil360?.actividades.ultimoEstado || 'Sin inscripciones activas'} detail={`${perfil360?.actividades.pendientes ?? 0} pendientes · ${perfil360?.actividades.inscriptas ?? 0} inscriptas`} href="/dashboard/actividades" />
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border bg-slate-950 p-4 text-white shadow-sm dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-5 w-5 text-sky-300" />
                    <div>
                      <h3 className="text-lg font-black">Lectura rápida 360</h3>
                      <p className="text-sm text-slate-300">
                        Señales útiles para atención, retención y seguimiento administrativo.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-bold">Estado general</p>
                      <p className="mt-1 text-slate-300">
                        {socio.activo ? 'Puede operar normalmente como socio activo.' : 'Socio inactivo: revisar antes de asignar servicios nuevos.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-bold">Riesgo administrativo</p>
                      <p className="mt-1 text-slate-300">
                        {(perfil360?.mensajes.pendientes ?? 0) > 0
                          ? 'Tiene mensajes pendientes de respuesta administrativa.'
                          : 'No se detectan mensajes pendientes en el resumen consultado.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="font-bold">Seguimiento saludable</p>
                      <p className="mt-1 text-slate-300">
                        {perfil360?.fichaMedica.activo
                          ? 'Tiene ficha médica registrada para revisión administrativa.'
                          : 'Conviene solicitar o revisar ficha médica vigente.'}
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
                      <h3 className="font-bold">Resumen parcial</h3>
                      <p className="text-sm">
                        Algunos módulos no respondieron durante la consulta 360. El perfil base sigue disponible.
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
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Datos personales</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DetailField label="Nombre completo" value={socio.nombre_completo} />
                  <DetailField label="DNI" value={socio.dni} />
                  <DetailField label="Sexo" value={sexoLabel(socio.sexo)} />
                  <DetailField label="Edad" value={edad ? `${edad} años` : '-'} />
                  <DetailField label="Fecha de nacimiento" value={socio.fecnac} />
                  <DetailField label="Fecha alta" value={socio.fecha_alta} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Contacto, ubicación y emergencia</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DetailField label="Teléfono" value={socio.telefono} />
                  <DetailField label="Email" value={socio.email} />
                  <DetailField label="Dirección" value={socio.direccion} />
                  <DetailField label="Ciudad" value={socio.ciudad} />
                  <DetailField label="Provincia" value={socio.provincia} />
                  <DetailField label="País" value={socio.pais} />
                  <DetailField label="Contacto emergencia" value={socio.contacto_emergencia_nombre} />
                  <DetailField label="Teléfono emergencia" value={socio.contacto_emergencia_telefono} />
                  <DetailField label="Descuento activo" value={socio.descuento_activo ? 'Sí' : 'No'} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
