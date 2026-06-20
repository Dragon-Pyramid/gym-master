import type { ComercialPosVentaResumen } from './comercialPos.interface';

export type ComercialCajaEstado = 'abierta' | 'cerrada';
export type ComercialCajaMovimientoTipo = 'apertura' | 'ingreso' | 'retiro' | 'cierre' | 'ajuste';

export interface ComercialCajaSesion {
  id: string;
  codigo: string;
  estado: ComercialCajaEstado;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  monto_contado?: number | null;
  total_ventas: number;
  total_ingresos: number;
  total_retiros: number;
  total_esperado: number;
  diferencia?: number | null;
  observaciones_apertura?: string | null;
  observaciones_cierre?: string | null;
  usuario_apertura?: string | null;
  usuario_cierre?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
}

export interface ComercialCajaMovimiento {
  id: string;
  caja_sesion_id: string;
  tipo: ComercialCajaMovimientoTipo;
  monto: number;
  metodo_pago?: string | null;
  concepto: string;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
  creado_por?: string | null;
  creado_en?: string | null;
}

export interface ComercialCajaDashboard {
  cajaAbierta: ComercialCajaSesion | null;
  sesionesRecientes: ComercialCajaSesion[];
  movimientos: ComercialCajaMovimiento[];
  ventasTurno: ComercialPosVentaResumen[];
  ventasSinCaja: ComercialPosVentaResumen[];
  metricas: {
    cajaAbierta: boolean;
    ventasTurno: number;
    totalVentasTurno: number;
    totalIngresos: number;
    totalRetiros: number;
    totalEsperado: number;
    sesionesCerradas: number;
    ventasSinCaja: number;
  };
}

export interface AbrirCajaDTO {
  monto_inicial: number;
  observaciones_apertura?: string | null;
}

export interface RegistrarMovimientoCajaDTO {
  tipo: 'ingreso' | 'retiro';
  monto: number;
  concepto: string;
  metodo_pago?: string | null;
}

export interface CerrarCajaDTO {
  monto_contado: number;
  observaciones_cierre?: string | null;
}

export type ComercialCajaActionDTO =
  | ({ action: 'abrir' } & AbrirCajaDTO)
  | ({ action: 'movimiento' } & RegistrarMovimientoCajaDTO)
  | ({ action: 'cerrar' } & CerrarCajaDTO);
