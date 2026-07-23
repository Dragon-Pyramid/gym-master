import { Socio } from '@/interfaces/socio.interface';
import { Socio360Perfil } from '@/interfaces/socio360.interface';
import type { GymMasterLocale } from '@/i18n/config';

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

function riskTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

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
    estado.includes('deuda') ||
    estado.includes('overdue') ||
    estado.includes('late') ||
    estado.includes('debt')
  );
}

function summarize(alerts: SocioRiskAlert[], locale: GymMasterLocale): SocioRiskSummary {
  const highCount = alerts.filter((alert) => alert.level === 'alto').length;
  const mediumCount = alerts.filter((alert) => alert.level === 'medio').length;
  const lowCount = alerts.filter((alert) => alert.level === 'bajo').length;
  const score = alerts.reduce((total, alert) => total + levelWeight[alert.level], 0);
  const level: SocioRiskLevel = highCount > 0 ? 'alto' : mediumCount > 0 ? 'medio' : lowCount > 0 ? 'bajo' : 'ok';
  const label = {
    alto: riskTx(locale, 'Riesgo alto', 'High risk'),
    medio: riskTx(locale, 'Riesgo medio', 'Medium risk'),
    bajo: riskTx(locale, 'Seguimiento leve', 'Light follow-up'),
    ok: riskTx(locale, 'Sin alertas críticas', 'No critical alerts'),
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

export function buildSocioBaseRiskSummary(socio: Socio, locale: GymMasterLocale = 'es'): SocioRiskSummary {
  const alerts: SocioRiskAlert[] = [];

  if (!socio.activo) {
    alerts.push({
      id: 'inactive-member',
      level: 'alto',
      title: riskTx(locale, 'Socio inactivo', 'Inactive member'),
      description: riskTx(
        locale,
        'El socio figura inactivo. Revisar el motivo antes de asignar servicios o tomar contacto comercial.',
        'The member is inactive. Review the reason before assigning services or initiating commercial contact.'
      ),
      source: 'operativo',
    });
  }

  if (!hasValue(socio.telefono) && !hasValue(socio.email)) {
    alerts.push({
      id: 'missing-contact',
      level: 'medio',
      title: riskTx(locale, 'Sin canal de contacto', 'No contact channel'),
      description: riskTx(
        locale,
        'No hay teléfono ni email disponibles para seguimiento administrativo.',
        'No phone number or email is available for administrative follow-up.'
      ),
      source: 'contacto',
    });
  }

  if (!hasValue(socio.contacto_emergencia_nombre) && !hasValue(socio.contacto_emergencia_telefono)) {
    alerts.push({
      id: 'missing-emergency-contact',
      level: 'bajo',
      title: riskTx(locale, 'Contacto de emergencia pendiente', 'Emergency contact pending'),
      description: riskTx(
        locale,
        'Conviene completar contacto de emergencia para respaldo operativo y de salud.',
        'Add an emergency contact for operational and health support.'
      ),
      source: 'salud',
    });
  }

  if (!hasValue(socio.foto)) {
    alerts.push({
      id: 'missing-photo',
      level: 'bajo',
      title: riskTx(locale, 'Foto de perfil pendiente', 'Profile photo pending'),
      description: riskTx(
        locale,
        'La foto ayuda a validar identidad en recepción, asistencia y atención administrativa.',
        'A photo helps verify identity at reception, attendance check-in, and administrative support.'
      ),
      source: 'operativo',
    });
  }

  return summarize(alerts, locale);
}

export function buildSocio360RiskSummary(
  socio: Socio,
  perfil?: Socio360Perfil | null,
  locale: GymMasterLocale = 'es'
): SocioRiskSummary {
  const baseAlerts = buildSocioBaseRiskSummary(socio, locale).alerts;
  const alerts: SocioRiskAlert[] = [...baseAlerts];

  if (!perfil) return summarize(alerts, locale);

  if (isOverdueCuota(perfil)) {
    alerts.push({
      id: 'overdue-fee',
      level: 'alto',
      title: riskTx(locale, 'Cuota vencida o con deuda', 'Overdue fee or outstanding debt'),
      description: riskTx(
        locale,
        'El resumen de cuota indica vencimiento, mora o pago no regularizado. Priorizar contacto administrativo.',
        'The fee summary indicates an overdue, late, or unsettled payment. Prioritize administrative contact.'
      ),
      source: 'cuota',
      href: '/dashboard/cuotas',
      actionLabel: riskTx(locale, 'Ver cuotas', 'View fees'),
    });
  }

  const medicalStatus = normalize(perfil.fichaMedica.ultimoEstado);
  if (
    !perfil.fichaMedica.activo ||
    medicalStatus.includes('pendiente') ||
    medicalStatus.includes('pending')
  ) {
    alerts.push({
      id: 'medical-record-pending',
      level: 'medio',
      title: riskTx(locale, 'Ficha médica pendiente de revisión', 'Medical record pending review'),
      description: riskTx(
        locale,
        'Solicitar o revisar ficha médica antes de sostener actividades de mayor exigencia.',
        'Request or review the medical record before maintaining higher-intensity activities.'
      ),
      source: 'salud',
      href: '/dashboard/ficha-medica',
      actionLabel: riskTx(locale, 'Ver ficha', 'View record'),
    });
  }

  if ((perfil.rutinas.total ?? 0) === 0) {
    alerts.push({
      id: 'no-routine',
      level: 'medio',
      title: riskTx(locale, 'Sin rutina asignada', 'No routine assigned'),
      description: riskTx(
        locale,
        'El socio no tiene rutina detectada. Puede requerir atención del entrenador para mejorar adherencia.',
        'No routine was detected. Trainer follow-up may help improve adherence.'
      ),
      source: 'retencion',
      href: '/dashboard/gestor-rutinas',
      actionLabel: riskTx(locale, 'Gestionar rutina', 'Manage routine'),
    });
  }

  if ((perfil.dietas.total ?? 0) === 0) {
    alerts.push({
      id: 'no-diet',
      level: 'bajo',
      title: riskTx(locale, 'Sin dieta o plan nutricional', 'No diet or nutrition plan'),
      description: riskTx(
        locale,
        'No se detecta dieta asociada. Puede ser oportunidad de seguimiento o servicio complementario.',
        'No associated diet was detected. This may be an opportunity for follow-up or a complementary service.'
      ),
      source: 'retencion',
      href: '/dashboard/gestor-dietas',
      actionLabel: riskTx(locale, 'Gestionar dieta', 'Manage diet'),
    });
  }

  if ((perfil.evolucion.total ?? 0) === 0) {
    alerts.push({
      id: 'no-evolution',
      level: 'bajo',
      title: riskTx(locale, 'Sin controles de evolución', 'No progress assessments'),
      description: riskTx(
        locale,
        'No hay registros de evolución física. Conviene invitar al socio a cargar una medición inicial.',
        'There are no physical-progress records. Invite the member to complete an initial assessment.'
      ),
      source: 'retencion',
      href: '/dashboard/gestor-evolucion-fisica',
      actionLabel: riskTx(locale, 'Ver evolución', 'View progress'),
    });
  }

  if ((perfil.mensajes.pendientes ?? 0) > 0) {
    const pending = perfil.mensajes.pendientes;
    alerts.push({
      id: 'pending-messages',
      level: 'medio',
      title: riskTx(locale, 'Mensajes pendientes', 'Pending messages'),
      description: riskTx(
        locale,
        `Hay ${pending} mensaje(s) pendientes de respuesta administrativa.`,
        `There ${pending === 1 ? 'is' : 'are'} ${pending} message${pending === 1 ? '' : 's'} awaiting an administrative response.`
      ),
      source: 'operativo',
      href: '/dashboard/mensajes-admin',
      actionLabel: riskTx(locale, 'Responder mensajes', 'Reply to messages'),
    });
  }

  if ((perfil.actividades.pendientes ?? 0) > 0) {
    const pending = perfil.actividades.pendientes;
    alerts.push({
      id: 'pending-activities',
      level: 'bajo',
      title: riskTx(locale, 'Solicitudes de actividad pendientes', 'Pending activity requests'),
      description: riskTx(
        locale,
        `Hay ${pending} solicitud(es) en lista de espera o pendiente(s) de revisión.`,
        `There ${pending === 1 ? 'is' : 'are'} ${pending} request${pending === 1 ? '' : 's'} on the waitlist or pending review.`
      ),
      source: 'actividad',
      href: '/dashboard/actividades',
      actionLabel: riskTx(locale, 'Ver actividades', 'View activities'),
    });
  }

  return summarize(Array.from(new Map(alerts.map((alert) => [alert.id, alert])).values()), locale);
}
