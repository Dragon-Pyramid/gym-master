export type ComercialScannerSessionEstado = 'activa' | 'cerrada' | 'expirada';
export type ComercialScannerEventEstado = 'pendiente' | 'procesado' | 'ignorado';
export type ComercialScannerItemTipo = 'producto' | 'servicio' | 'pack' | 'infraestructura' | 'desconocido';

export interface ComercialScannerSession {
  id: string;
  token: string;
  canal: string;
  estado: ComercialScannerSessionEstado;
  usuario_id?: string | null;
  creado_en: string;
  expira_en: string;
  cerrado_en?: string | null;
  ultimo_evento_en?: string | null;
}

export interface ComercialScannerEvent {
  id: string;
  session_id: string;
  codigo: string;
  tipo_resuelto: ComercialScannerItemTipo;
  item_tipo?: 'producto' | 'servicio' | 'pack' | null;
  producto_id?: string | null;
  servicio_id?: string | null;
  pack_id?: string | null;
  item_nombre?: string | null;
  payload?: Record<string, unknown> | null;
  estado: ComercialScannerEventEstado;
  creado_en: string;
  procesado_en?: string | null;
}

export interface ComercialScannerState {
  session: ComercialScannerSession | null;
  pendingEvents: ComercialScannerEvent[];
  recentEvents: ComercialScannerEvent[];
}

export interface CreateComercialScannerSessionResponse {
  session: ComercialScannerSession;
}

export interface PublicComercialScannerSessionInfo {
  id: string;
  token: string;
  canal: string;
  estado: ComercialScannerSessionEstado;
  expira_en: string;
  puede_escanear: boolean;
}

export interface PublicComercialScannerScanResponse {
  event: ComercialScannerEvent;
  message: string;
}
