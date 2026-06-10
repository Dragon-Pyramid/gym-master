import axios from "axios";
import { authHeader } from "@/services/storageService";
import {
  AforoAsistenciaResumen,
  RegistrarSalidaAsistenciaResponse,
} from "@/interfaces/asistenciaAforo.interface";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as {
    response?: {
      data?: {
        error?: string;
        message?: string;
      };
    };
  };

  return (
    axiosError.response?.data?.error ||
    axiosError.response?.data?.message ||
    fallback
  );
}

export const fetchAforoAsistencia =
  async (): Promise<AforoAsistenciaResumen> => {
    try {
      const response = await axios.get("/api/asistencias/aforo", {
        headers: {
          ...authHeader(),
        },
      });

      return response.data as AforoAsistenciaResumen;
    } catch (error: unknown) {
      throw new Error(
        getErrorMessage(error, "No se pudo obtener el aforo actual."),
      );
    }
  };

export const registrarSalidaAdministrativa = async (
  asistenciaId: string,
): Promise<RegistrarSalidaAsistenciaResponse> => {
  try {
    const response = await axios.post(
      `/api/asistencias/${asistenciaId}/salida`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      },
    );

    return response.data as RegistrarSalidaAsistenciaResponse;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "No se pudo registrar la salida."));
  }
};
