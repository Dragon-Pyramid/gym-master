export type MetodoPago = 'efectivo' | 'stripe' | 'transferencia' | 'otro';
export type EstadoPago = 'pagado' | 'pendiente' | 'cancelado';

export interface Pago {
  id: string;
  socio_id: string;
  cuota_id: string;
  fecha_pago: string;
  fecha_vencimiento: string;
  monto_pagado: number;
  total: number | null;
  registrado_por: string | null;
  enviar_email: boolean;
  periodo_desde?: string | null;
  periodo_hasta?: string | null;
  meses_cubiertos?: number | null;
  metodo_pago?: MetodoPago | string | null;
  id_medio_pago?: string | null;
  estado?: EstadoPago | string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  observaciones?: string | null;
  activo?: boolean | null;
}

export interface CreatePagoDto {
  socio_id: string;
  cuota_id?: string;

  fecha_pago?: string;
  fecha_vencimiento?: string;

  periodo_desde?: string;
  periodo_hasta?: string;
  meses_cubiertos?: number;

  monto_pagado?: number;

  metodo_pago?: string;
  id_medio_pago?: string | null;
  estado?: string;

  registrado_por?: string | null;
  observaciones?: string | null;

  enviar_email?: boolean;

  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
}

export interface UpdatePagoDto {
  socio_id?: string;
  cuota_id?: string;
  fecha_pago?: string;
  fecha_vencimiento?: string;
  periodo_desde?: string;
  periodo_hasta?: string;
  meses_cubiertos?: number;
  monto_pagado?: number;
  registrado_por?: string;
  metodo_pago?: MetodoPago | string;
  id_medio_pago?: string | null;
  estado?: EstadoPago;
  observaciones?: string;
  activo?: boolean;
  enviar_email?: boolean;
}

export interface ResponsePago {
  id: string;

  fecha_pago: string;
  fecha_vencimiento: string;

  periodo_desde?: string | null;
  periodo_hasta?: string | null;
  meses_cubiertos?: number | null;

  monto_pagado: number;
  total: number | null;

  metodo_pago?: string | null;
  id_medio_pago?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  enviar_email: boolean;
  activo?: boolean | null;

  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;

  registrado_por: {
    id: string;
    nombre: string;
  } | null;

  socio: {
    id_socio: string;
    nombre_completo: string;
    email?: string | null;
  };

  cuota: {
    id: string;
    descripcion: string;
    monto?: number | null;
    periodo?: string | null;
  };
}

export interface PagoManualFormOptions {
  socios: Array<{
    id_socio: string;
    nombre_completo: string;
    email?: string | null;
    activo: boolean;
    descuento_activo?: boolean | null;
  }>;
  cuotas: Array<{
    id: string;
    descripcion: string;
    monto: number;
    periodo?: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    activo?: boolean | null;
  }>;
}


export interface PagoVerificationResponse {
  valid: boolean;
  codigo?: string;
  verificado_en?: string;
  error?: string;
  pago?: {
    id: string;
    fecha_pago: string;
    fecha_vencimiento: string;
    periodo_desde?: string | null;
    periodo_hasta?: string | null;
    meses_cubiertos?: number | null;
    monto_pagado: number;
    metodo_pago?: string | null;
    estado?: string | null;
    activo?: boolean | null;
    socio?: {
      id_socio: string;
      nombre_completo: string;
      email?: string | null;
    } | null;
    cuota?: {
      id: string;
      descripcion: string;
      monto?: number | null;
      periodo?: string | null;
    } | null;
  };
}
