export interface Pago {
  id: string;
  socio_id: string;
  cuota_id: string;
  fecha_pago: string;
  fecha_vencimiento: string;
  monto_pagado: number;
  total: number;
  registrado_por: string;
  enviar_email: boolean; 
}

export interface CreatePagoDto {
  socio_id: string;
  registrado_por: string;
}


export interface UpdatePagoDto {
  socio_id?: string;
  cuota_id?: string;
  fecha_pago?: string;
  fecha_vencimiento?: string;
  monto_pagado?: number;
  registrado_por?: string;
  activo?: boolean;
  enviar_email?: boolean; // Indica si se debe enviar un email de notificación
}

export interface ResponsePago {
    id: string;
    fecha_pago: string;
    fecha_vencimiento: string;
    monto_pagado: number;
    total: number;
    enviar_email: boolean;
    registrado_por: {
        id: string;
        nombre: string;
    };
    socio: {
        id_socio: string;
        nombre_completo: string;
    };
    cuota: {
        id: string;
        descripcion: string;
    };
    
}
