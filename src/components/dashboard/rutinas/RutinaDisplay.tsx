"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getHistorialRutinas } from "@/services/apiClient";
import { Rutina } from "@/interfaces/rutina.interface";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function RutinaEjercicios({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: (rutina: Rutina) => void;
  onEdit?: (rutina: Rutina) => void;
  onDelete?: (rutina: Rutina) => void;
}) {
  const { user, token } = useAuthStore();
  const [viendoRutina, setViendoRutina] = useState<string | null>(null);
  const [diasExpandidos, setDiasExpandidos] = useState<{
    [key: string]: boolean;
  }>({});
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagenVisible, setImagenVisible] = useState<{
    [key: string]: boolean;
  }>({});

  const fetchRutinas = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await getHistorialRutinas();

      if (!response.ok) {
        throw new Error("Error al cargar rutinas");
      }

      const rutinasData: Rutina[] = response.data;
      setRutinas(rutinasData);
    } catch (error) {
      console.error("Error al cargar rutinas:", error);
      setRutinas([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchRutinas();
  }, [fetchRutinas]);

  const obtenerEjerciciosPorDia = (rutina: Rutina) => {
    try {
      let rutinaDesc = rutina.rutina_desc;

      if (typeof rutina.rutina_desc === "string") {
        try {
          rutinaDesc = JSON.parse(rutina.rutina_desc);
        } catch (e) {
          console.warn("Error parsing rutina_desc JSON:", e);
          return {};
        }
      }

      if (rutinaDesc && rutinaDesc.dias && Array.isArray(rutinaDesc.dias)) {
        const diasPorNombre: any = {};
        const diasNombres = [
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo",
        ];

        rutinaDesc.dias.forEach((diaData: any, index: number) => {
          const nombreDia = diasNombres[index] || `día${index + 1}`;
          diasPorNombre[nombreDia] = diaData.ejercicios || [];
        });

        return diasPorNombre;
      }

      return {};
    } catch (error) {
      console.error("Error en obtenerEjerciciosPorDia:", error);
      return {};
    }
  };

  const toggleDia = (dia: string) => {
    setDiasExpandidos((prev) => ({
      ...prev,
      [dia]: !prev[dia],
    }));
  };

  const toggleImagen = (ejercicioKey: string) => {
    setImagenVisible((prev) => ({
      ...prev,
      [ejercicioKey]: !prev[ejercicioKey],
    }));
  };

  const verRutina = (id: string) => {
    setViendoRutina(id);
    setDiasExpandidos({});
  };

  const volverALista = () => {
    setViendoRutina(null);
    setDiasExpandidos({});
  };

  if (viendoRutina) {
    const rutina = rutinas.find((r) => r.id_rutina === viendoRutina);
    if (!rutina) return null;

    const ejerciciosPorDia = obtenerEjerciciosPorDia(rutina);
    const diasDisponibles = Object.keys(ejerciciosPorDia);

    return (
      <div className="min-h-screen">
        <div className="mx-auto overflow-hidden bg-white shadow-xl max-w-7xl rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col gap-4 px-4 py-6 text-white bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
            <div className="flex-1">
              <h1 className="mb-2 text-xl font-light tracking-wide sm:text-2xl lg:text-3xl sm:tracking-widest">
                {rutina.nombre}
              </h1>
              <div className="flex flex-col gap-2 text-xs font-light sm:flex-row sm:gap-5 sm:text-sm opacity-70">
                <span>
                  CREADO{" "}
                  {rutina.creado_en
                    ? new Date(rutina.creado_en).toLocaleDateString()
                    : "-"}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  ACTUALIZADO{" "}
                  {rutina.actualizado_en
                    ? new Date(rutina.actualizado_en).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
            <button
              onClick={volverALista}
              className="self-start px-4 py-2 text-xs font-light tracking-wide text-white transition-colors bg-transparent border rounded-full cursor-pointer sm:px-6 sm:py-3 sm:text-sm sm:tracking-wider border-white/30 hover:bg-white/10 sm:self-auto"
            >
              ← VOLVER
            </button>
          </div>

          <div className="p-4 sm:p-6 lg:p-10">
            {diasDisponibles.map((dia) => (
              <div
                key={dia}
                className="mb-3 overflow-hidden bg-white border border-gray-200 sm:mb-4 rounded-xl sm:rounded-2xl"
              >
                <button
                  onClick={() => toggleDia(dia)}
                  className={`w-full px-4 py-4 sm:px-8 sm:py-6 border-none cursor-pointer text-sm sm:text-base font-medium tracking-wide sm:tracking-widest text-left flex justify-between items-center text-gray-700 transition-colors ${
                    diasExpandidos[dia] ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <span className="text-sm sm:text-base">
                    {dia.toUpperCase()}
                  </span>
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      diasExpandidos[dia]
                        ? "bg-gray-700 rotate-180"
                        : "bg-gray-200 rotate-0"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        diasExpandidos[dia] ? "text-white" : "text-gray-600"
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {diasExpandidos[dia] && (
                  <div className="px-4 pb-4 sm:px-8 sm:pb-8 bg-gray-50">
                    {ejerciciosPorDia[dia]?.map(
                      (ejercicio: any, idx: number) => {
                        const ejercicioKey = `${dia}-${idx}`;

                        return (
                          <div
                            key={idx}
                            className="p-4 mt-4 bg-white border border-gray-200 sm:p-6 lg:p-8 sm:mt-6 rounded-xl sm:rounded-2xl"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:gap-3">
                                  <h3 className="m-0 text-lg font-semibold tracking-wide text-gray-900 break-words sm:text-xl lg:text-2xl">
                                    {ejercicio.nombre}
                                  </h3>
                                  <button
                                    onClick={() => toggleImagen(ejercicioKey)}
                                    className="self-start p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-900 sm:self-auto"
                                    title="Mostrar/ocultar imagen del ejercicio"
                                  >
                                    {imagenVisible[ejercicioKey] ? (
                                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                  </button>
                                </div>
                                <div className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wide text-white bg-gray-900 rounded-full sm:px-4 sm:py-2 sm:mb-4 sm:text-sm">
                                  {ejercicio.series} × {ejercicio.reps}
                                </div>
                                <p className="m-0 text-sm font-light tracking-wide text-gray-600 sm:text-base">
                                  Descanso: {ejercicio.descanso_seg}s
                                </p>
                              </div>
                              {imagenVisible[ejercicioKey] &&
                                ejercicio.imagen && (
                                  <div className="w-full lg:w-64 xl:w-80">
                                    <div className="overflow-hidden rounded-lg bg-gray-50">
                                      <Image
                                        src={ejercicio.imagen}
                                        alt={`Demostración de ${ejercicio.nombre}`}
                                        width={320}
                                        height={500}
                                        className="object-cover w-full h-80 sm:h-72 lg:h-80 xl:h-72"
                                        unoptimized
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      }
                    ) || (
                      <div className="p-6 text-sm italic font-light text-center text-gray-400 sm:p-8 lg:p-10 sm:text-base">
                        Día de descanso
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen px-2 py-4 sm:px-5 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-12 lg:mb-15">
            <h1 className="mb-3 text-3xl font-thin tracking-wide text-gray-900 sm:mb-4 sm:text-4xl lg:text-5xl sm:tracking-widest">
              RUTINAS
            </h1>
            <p className="text-base font-light tracking-wide text-gray-600 sm:text-lg sm:tracking-widest">
              ENTRENA CON PROPÓSITO
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            {rutinas.map((rutina) => (
              <div
                key={rutina.id_rutina}
                className="p-6 bg-white border border-gray-200 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl"
              >
                <div className="mb-6 sm:mb-8">
                  <h2 className="mb-2 text-xl font-semibold tracking-wide text-gray-900 break-words sm:mb-3 sm:text-2xl lg:text-3xl sm:tracking-widest">
                    {rutina.nombre}
                  </h2>
                  <div className="flex flex-col gap-2 text-xs font-light tracking-wide text-gray-600 sm:flex-row sm:gap-6 sm:text-sm">
                    <span>
                      CREADO{" "}
                      {rutina.creado_en
                        ? new Date(rutina.creado_en).toLocaleDateString()
                        : "-"}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      ACTUALIZADO{" "}
                      {rutina.actualizado_en
                        ? new Date(rutina.actualizado_en).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                  <button
                    onClick={() => verRutina(rutina.id_rutina)}
                    className="px-6 py-2 text-xs font-medium tracking-wide text-white transition-colors bg-gray-900 border-none rounded-full cursor-pointer sm:px-8 sm:py-3 sm:text-sm sm:tracking-widest hover:bg-gray-800"
                  >
                    VER
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(rutina)}
                    className="px-6 py-2 text-xs font-medium tracking-wide text-yellow-700 transition-colors bg-transparent border border-yellow-500 rounded-full cursor-pointer sm:px-8 sm:py-3 sm:text-sm sm:tracking-widest hover:bg-yellow-50"
                  >
                    EDITAR
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(rutina)}
                    className="px-6 py-2 text-xs font-medium tracking-wide text-red-600 transition-colors bg-transparent border border-red-600 rounded-full cursor-pointer sm:px-8 sm:py-3 sm:text-sm sm:tracking-widest hover:bg-red-50"
                  >
                    ELIMINAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
