import { Socio } from '@/interfaces/socio.interface';
import { Socio360Perfil } from '@/interfaces/socio360.interface';

export type SocioRiskLevel = 'alto' | 'medio' | 'bajo' | 'ok';

export interface SocioRiskAlert {
  id: string;
  level: Exclude<SocioRiskLevel, 'ok'>;
  title: string;
  description: string;
  source: 'cuota' | 'actividad' | 'salud' | 'retencion' | 'contacto' | 'operativo';
  href?: string;
  actionLabel?: string;
}

export interface SocioRiskSummary {
  level: SocioRiskLevel;
  label: string;
  score: number;
  alerts: SocioRiskAlert[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

const levelWeight: Record<Exclude<SocioRiskLevel, 'ok'>, number> = {
  alto: 3,
  medio: 2,
  bajo: 1,
};

function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function normalize(value?: string | null) {
  return String(value ?? '').toLowerCase();
}

function isOverdueCuota(perfil?: Socio360Perfil | null) {
  const cuota = perfil?.cuota;
  const estado = normalize(cuota?.estado_cuota || cuota?.estado || '');

  return (
    cuota?.cuota_al_dia === false ||
    Number(cuota?.dias_vencido ?? 0) > 0 ||
    estado.includes('venc') ||
    estado.includes('mor') ||
    estado.includes('deuda')
  );
}

function summarize(alerts: SocioRiskAlert[]): SocioRiskSummary {
  const highCount = alerts.filter((alert) => alert.level === 'alto').length;
  const mediumCount = alerts.filter((alert) => alert.level === 'medio').length;
  const lowCount = alerts.filter((alert) => alert.level === 'bajo').length;
  const score = alerts.reduce((total, alert) => total + levelWeight[alert.level], 0);
  const level: SocioRiskLevel = highCount > 0 ? 'alto' : mediumCount > 0 ? 'medio' : lowCount > 0 ? 'bajo' : 'ok';
  const label = {
    alto: 'Riesgo alto',
    medio: 'Riesgo medio',
    bajo: 'Seguimiento leve',
    ok: 'Sin alertas críticas',
  }[level];

  return {
    level,
    label,
    score,
    alerts,
    highCount,
    mediumCount,
    lowCount,
  };
}

export function getSocioRiskToneClasses(level: SocioRiskLevel) {
  return {
    alto: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-100',
    medio: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100',
    bajo: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-100',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-100',
  }[level];
}

export function buildSocioBaseRiskSummary(socio: Socio): SocioRiskSummary {
  const alerts: SocioRiskAlert[] = [];

  if (!socio.activo) {
    alerts.push({
      id: 'inactive-member',
      level: 'alto',
      title: 'Socio inactivo',
      description: 'El socio figura inactivo. Revisar el motivo antes de asignar servicios o tomar contacto comercial.',
      source: 'operativo',
    });
  }

  if (!hasValue(socio.telefono) && !hasValue(socio.email)) {
    alerts.push({
      id: 'missing-contact',
      level: 'medio',
      title: 'Sin canal de contacto',
      description: 'No hay teléfono ni email disponibles para seguimiento administrativo.',
      source: 'contacto',
    });
  }

  if (!hasValue(socio.contacto_emergencia_nombre) && !hasValue(socio.contacto_emergencia_telefono)) {
    alerts.push({
      id: 'missing-emergency-contact',
      level: 'bajo',
      title: 'Contacto de emergencia pendiente',
      description: 'Conviene completar contacto de emergencia para respaldo operativo y de salud.',
      source: 'salud',
    });
  }

  if (!hasValue(socio.foto)) {
    alerts.push({
      id: 'missing-photo',
      level: 'bajo',
      title: 'Foto de perfil pendiente',
      description: 'La foto ayuda a validar identidad en recepción, asistencia y atención administrativa.',
      source: 'operativo',
    });
  }

  return summarize(alerts);
}

export function buildSocio360RiskSummary(socio: Socio, perfil?: Socio360Perfil | null): SocioRiskSummary {
  const baseAlerts = buildSocioBaseRiskSummary(socio).alerts;
  const alerts: SocioRiskAlert[] = [...baseAlerts];

  if (!perfil) return summarize(alerts);

  if (isOverdueCuota(perfil)) {
    alerts.push({
      id: 'overdue-fee',
      level: 'alto',
      title: 'Cuota vencida o con deuda',
      description: 'El resumen de cuota indica vencimiento, mora o pago no regularizado. Priorizar contacto administrativo.',
      source: 'cuota',
      href: '/dashboard/cuotas',
      actionLabel: 'Ver cuotas',
    });
  }

  if (!perfil.fichaMedica.activo || normalize(perfil.fichaMedica.ultimoEstado).includes('pendiente')) {
    alerts.push({
      id: 'medical-record-pending',
      level: 'medio',
      title: 'Ficha médica pendiente de revisión',
      description: 'Solicitar o revisar ficha médica antes de sostener actividades de mayor exigencia.',
      source: 'salud',
      href: '/dashboard/ficha-medica',
      actionLabel: 'Ver ficha',
    });
  }

  if ((perfil.rutinas.total ?? 0) === 0) {
    alerts.push({
      id: 'no-routine',
      level: 'medio',
      title: 'Sin rutina asignada',
      description: 'El socio no tiene rutina detectada. Puede requerir atención del entrenador para mejorar adherencia.',
      source: 'retencion',
      href: '/dashboard/gestor-rutinas',
      actionLabel: 'Gestionar rutina',
    });
  }

  if ((perfil.dietas.total ?? 0) === 0) {
    alerts.push({
      id: 'no-diet',
      level: 'bajo',
      title: 'Sin dieta o plan nutricional',
      description: 'No se detecta dieta asociada. Puede ser oportunidad de seguimiento o servicio complementario.',
      source: 'retencion',
      href: '/dashboard/gestor-dietas',
      actionLabel: 'Gestionar dieta',
    });
  }

  if ((perfil.evolucion.total ?? 0) === 0) {
    alerts.push({
      id: 'no-evolution',
      level: 'bajo',
      title: 'Sin controles de evolución',
      description: 'No hay registros de evolución física. Conviene invitar al socio a cargar una medición inicial.',
      source: 'retencion',
      href: '/dashboard/gestor-evolucion-fisica',
      actionLabel: 'Ver evolución',
    });
  }

  if ((perfil.mensajes.pendientes ?? 0) > 0) {
    alerts.push({
      id: 'pending-messages',
      level: 'medio',
      title: 'Mensajes pendientes',
      description: `Hay ${perfil.mensajes.pendientes} mensaje(s) pendientes de respuesta administrativa.`,
      source: 'operativo',
      href: '/dashboard/mensajes-admin',
      actionLabel: 'Responder mensajes',
    });
  }

  if ((perfil.actividades.pendientes ?? 0) > 0) {
    alerts.push({
      id: 'pending-activities',
      level: 'bajo',
      title: 'Solicitudes de actividad pendientes',
      description: `Hay ${perfil.actividades.pendientes} solicitud(es) en lista de espera o pendiente(s) de revisión.`,
      source: 'actividad',
      href: '/dashboard/actividades',
      actionLabel: 'Ver actividades',
    });
  }

  return summarize(Array.from(new Map(alerts.map((alert) => [alert.id, alert])).values()));
}
