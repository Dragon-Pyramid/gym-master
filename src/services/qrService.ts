import axios from "axios";
import { authHeader } from "@/services/storageService";

export interface EstadoCuotaAccesoQR {
  estado_cuota?: string | null;
  dias_vencido?: number;
  periodo_hasta?: string | null;
  ultimo_vencimiento?: string | null;
}

export interface AsistenciaReciente {
  id: string;
  socio_id: string;
  fecha: string; // 'YYYY-MM-DD'
  hora_ingreso: string; // 'HH:MM:SS'
  hora_egreso?: string | null; // 'HH:MM:SS'
  access_status?: "al_dia" | "deuda" | "desactivado" | "salida" | string;
  alert_type?: RegistroAsistenciaAlertType;
  mensaje_acceso?: string | null;
  estado_cuota?: EstadoCuotaAccesoQR | null;
  tipo_movimiento?: RegistroAsistenciaMovimientoTipo;
  socio?: {
    id_socio: string;
    nombre_completo: string;
    foto: string | null;
  } | null;
}

export type RegistroAsistenciaAlertType =
  | "success"
  | "debt"
  | "inactive"
  | "error";
export type RegistroAsistenciaMovimientoTipo = "entrada" | "salida";

export interface RegistroAsistenciaQRResponse {
  valido?: boolean;
  message?: string;
  error?: string;
  access_status?:
    | "al_dia"
    | "deuda"
    | "desactivado"
    | "salida"
    | "qr_expirado"
    | "sin_socio"
    | string;
  alert_type?: RegistroAsistenciaAlertType;
  bloquea_ingreso?: boolean;
  mensaje_acceso?: string | null;
  estado_cuota?: EstadoCuotaAccesoQR | null;
  tipo_movimiento?: RegistroAsistenciaMovimientoTipo;
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

export interface TerminalSessionRefreshResponse {
  token: string;
  expires_at?: string | null;
}

export class TerminalSessionError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "TerminalSessionError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

function buildApiError(error: unknown, fallback: string): Error {
  const axiosError = error as {
    response?: {
      status?: number;
      data?: {
        error?: string;
        message?: string;
        error_code?: string;
      };
    };
  };

  const status = axiosError.response?.status;
  const data = axiosError.response?.data;
  const message = data?.error || data?.message || fallback;
  const code = data?.error_code;

  if (status === 401 || status === 403 || code?.includes("TERMINAL_SESSION")) {
    return new TerminalSessionError(message, { status, code });
  }

  return new Error(message);
}

export function isTerminalSessionError(
  error: unknown,
): error is TerminalSessionError {
  return error instanceof TerminalSessionError;
}

export const refreshTerminalSession =
  async (): Promise<TerminalSessionRefreshResponse> => {
    try {
      const response = await axios.post(
        "/api/auth/terminal-session/refresh",
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
        },
      );

      return response.data as TerminalSessionRefreshResponse;
    } catch (error: unknown) {
      throw buildApiError(error, "No se pudo renovar la sesión de Terminal.");
    }
  };

export const fetchQrDiario = async (): Promise<QrDiarioResponse> => {
  try {
    const response = await axios.get("/api/asistencias/qr-dia", {
      headers: {
        ...authHeader(),
      },
    });
    return response.data as QrDiarioResponse;
  } catch (error: unknown) {
    throw buildApiError(error, "No se pudo cargar el QR diario de asistencia.");
  }
};

export const fetchQrCode = async (): Promise<string> => {
  const data = await fetchQrDiario();
  return data.qrCode;
};

export const registrarAsistenciaQR = async (
  qr: string,
): Promise<RegistroAsistenciaQRResponse> => {
  let tokenAsistencia = qr;
  try {
    try {
      const url = new URL(qr);
      const queryToken = url.searchParams.get("tokenAsistencia");
      if (queryToken) tokenAsistencia = queryToken;
    } catch {}

    const response = await axios.post(
      "/api/asistencias/registro-qr",
      { qr: tokenAsistencia },
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      },
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
          "No se pudo registrar la asistencia.",
      };
    }

    return {
      valido: false,
      alert_type: "error",
      error: "Error de red. Intente nuevamente.",
    };
  }
};

export const fetchAsistenciasRecientes = async (): Promise<
  AsistenciaReciente[]
> => {
  try {
    const response = await axios.get("/api/asistencias/recientes", {
      headers: {
        ...authHeader(),
      },
    });
    return response.data as AsistenciaReciente[];
  } catch (error: unknown) {
    throw buildApiError(error, "Error al obtener asistencias recientes.");
  }
};

export const fetchTerminalNotificaciones = async (): Promise<
  TerminalNotificacion[]
> => {
  try {
    const response = await axios.get("/api/notificaciones/terminal", {
      headers: {
        ...authHeader(),
      },
    });
    return response.data as TerminalNotificacion[];
  } catch (error: unknown) {
    throw buildApiError(error, "Error de red al obtener avisos de Terminal.");
  }
};
