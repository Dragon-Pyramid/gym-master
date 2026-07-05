import { Socio } from '@/interfaces/socio.interface';

export type Socio360EstadoCarga = 'idle' | 'loading' | 'ready' | 'partial' | 'error';

export interface Socio360CuotaEstado {
  estado?: string | null;
  estado_cuota?: string | null;
  cuota_al_dia?: boolean | null;
  dias_vencido?: number | null;
  proximo_vencimiento?: string | null;
  ultimo_pago_fecha?: string | null;
  ultimo_pago_monto?: number | null;
  monto_pendiente?: number | null;
  [key: string]: unknown;
}

export interface Socio360ModuloResumen {
  total: number;
  activo?: boolean;
  ultimoTitulo?: string;
  ultimoEstado?: string;
  ultimaFecha?: string;
  detalle?: string;
}

export interface Socio360MensajeResumen {
  total: number;
  pendientes: number;
  respondidos: number;
  ultimoAsunto?: string;
  ultimoEstado?: string;
  ultimaFecha?: string;
}

export interface Socio360ActividadResumen {
  total: number;
  pendientes: number;
  inscriptas: number;
  asistencias: number;
  ultimoEstado?: string;
  ultimaFecha?: string;
}

export interface Socio360Perfil {
  socio: Socio;
  cuota?: Socio360CuotaEstado | null;
  fichaMedica: Socio360ModuloResumen;
  rutinas: Socio360ModuloResumen;
  dietas: Socio360ModuloResumen;
  evolucion: Socio360ModuloResumen;
  mensajes: Socio360MensajeResumen;
  actividades: Socio360ActividadResumen;
  errores: string[];
}
