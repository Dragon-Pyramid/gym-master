import axios from 'axios';
import { authHeader } from '@/services/storageService';

export interface EstadoCuotaAccesoQR {
  estado_cuota?: string | null;
  dias_vencido?: number;
  periodo_hasta?: string | null;
  ultimo_vencimiento?: string | null;
}

export interface AsistenciaReciente {
  id: string;
  socio_id: string;
  fecha: string;           // 'YYYY-MM-DD'
  hora_ingreso: string;    // 'HH:MM:SS'
  access_status?: 'al_dia' | 'deuda' | 'desactivado' | string;
  alert_type?: RegistroAsistenciaAlertType;
  mensaje_acceso?: string | null;
  estado_cuota?: EstadoCuotaAccesoQR | null;
  socio?: {
    id_socio: string;
    nombre_completo: string;
    foto: string | null;
  } | null;
}

export type RegistroAsistenciaAlertType = 'success' | 'debt' | 'inactive' | 'error';

export interface RegistroAsistenciaQRResponse {
  valido?: boolean;
  message?: string;
  error?: string;
  access_status?: 'al_dia' | 'deuda' | 'desactivado' | 'qr_expirado' | 'sin_socio' | string;
  alert_type?: RegistroAsistenciaAlertType;
  bloquea_ingreso?: boolean;
  mensaje_acceso?: string | null;
  estado_cuota?: EstadoCuotaAccesoQR | null;
  asistencia?: {
    socio?: {
      id_socio?: string;
      nombre_completo?: string;
      usuario_id?: {
        foto?: string | null;
        nombre?: string | null;
      } | null;
    } | null;
  };
  socio?: {
    id_socio?: string;
    nombre_completo?: string;
    foto?: string | null;
  } | null;
}


export interface TerminalNotificacion {
  id: string;
  titulo: string;
  asunto: string;
  cuerpo: string;
  tipo: string;
  canal: string;
  estado: string;
  fecha_programada?: string | null;
  fecha_vigencia_hasta?: string | null;
  terminal_imagen_url?: string | null;
  terminal_color_neon?: string | null;
  terminal_duracion_segundos: number;
  terminal_frecuencia_segundos: number;
}

export interface QrDiarioResponse {
  qrCode: string;
  url: string;
  token: string;
}

export const fetchQrDiario = async (): Promise<QrDiarioResponse> => {
  const response = await axios.get('/api/asistencias/qr-dia', {
    headers: {
      ...authHeader(),
    },
  });
  return response.data as QrDiarioResponse;
};

export const fetchQrCode = async (): Promise<string> => {
  const data = await fetchQrDiario();
  return data.qrCode;
};

export const registrarAsistenciaQR = async (
  qr: string
): Promise<RegistroAsistenciaQRResponse> => {
  let tokenAsistencia = qr;
  try {
    try {
      const url = new URL(qr);
      const queryToken = url.searchParams.get('tokenAsistencia');
      if (queryToken) tokenAsistencia = queryToken;
    } catch {}

    const response = await axios.post(
      '/api/asistencias/registro-qr',
      { qr: tokenAsistencia },
      {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    const axiosError = error as {
      response?: {
        data?: RegistroAsistenciaQRResponse;
      };
    };

    if (axiosError.response?.data) {
      return {
        ...axiosError.response.data,
        error:
          axiosError.response.data.error ||
          'No se pudo registrar la asistencia.',
      };
    }

    return {
      valido: false,
      alert_type: 'error',
      error: 'Error de red. Intente nuevamente.',
    };
  }
};

export const fetchAsistenciasRecientes = async (): Promise<
  AsistenciaReciente[]
> => {
  try {
    const response = await axios.get('/api/asistencias/recientes', {
      headers: {
        ...authHeader(),
      },
    });
    return response.data as AsistenciaReciente[];
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    if (axiosError.response && axiosError.response.data) {
      throw new Error(
        axiosError.response.data.error ||
          'Error al obtener asistencias recientes.'
      );
    }
    throw new Error('Error de red. Intente nuevamente.');
  }
};


export const fetchTerminalNotificaciones = async (): Promise<TerminalNotificacion[]> => {
  try {
    const response = await axios.get('/api/notificaciones/terminal', {
      headers: {
        ...authHeader(),
      },
    });
    return response.data as TerminalNotificacion[];
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    if (axiosError.response && axiosError.response.data) {
      throw new Error(
        axiosError.response.data.error ||
          'Error al obtener avisos de Terminal.'
      );
    }
    throw new Error('Error de red al obtener avisos de Terminal.');
  }
};

