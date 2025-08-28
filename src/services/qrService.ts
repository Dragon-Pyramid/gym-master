import axios from "axios";
import { authHeader } from "@/services/storageService";

export const fetchQrCode = async (): Promise<string> => {
  const response = await axios.get("api/asistencias/qr-dia", {
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
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        error:
          error.response.data.error || "No se pudo registrar la asistencia.",
      };
    }
    return { error: "Error de red. Intente nuevamente." };
  }
};
