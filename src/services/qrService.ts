import axios from 'axios';
import { authHeader } from '@/services/storageService';

export interface AsistenciaReciente {
  id: string;
  socio_id: string;
  fecha: string;           // 'YYYY-MM-DD'
  hora_ingreso: string;    // 'HH:MM:SS'
  socio?: {
    id_socio: string;
    nombre_completo: string;
    foto: string | null;
  } | null;
}

export const fetchQrCode = async (): Promise<string> => {
  const response = await axios.get('api/asistencias/qr-dia', {
    headers: {
      ...authHeader(),
    },
  });
  return response.data.qrCode;
};

export const registrarAsistenciaQR = async (
  qr: string
): Promise<{ message?: string; error?: string }> => {
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
    const axiosError = error as { response?: { data?: { error?: string } } };
    if (axiosError.response && axiosError.response.data) {
      return {
        error:
          axiosError.response.data.error ||
          'No se pudo registrar la asistencia.',
      };
    }
    return { error: 'Error de red. Intente nuevamente.' };
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
