"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getHistorialRutinas } from "@/services/apiClient";
import { Rutina } from "@/interfaces/rutina.interface";
import Image from "next/image";
import { ArrowLeft, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { descargarRutinaPdf } from "@/utils/rutinaPdf";
import { formatFrontendDate } from '@/utils/dateFormat';

type EjerciciosPorDia = Record<string, any[]>;

const DIAS_NOMBRES = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

const isAdmin = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();

  return normalizedRol === "admin" || normalizedRol === "administrador";
};

const parseRutinaDesc = (rutinaDesc: any) => {
  if (!rutinaDesc) return null;

  if (typeof rutinaDesc === "string") {
    try {
      return JSON.parse(rutinaDesc);
    } catch (error) {
      console.warn("Error parsing rutina_desc JSON:", error);
      return null;
    }
  }

  return rutinaDesc;
};

const obtenerNombreDia = (diaData: any, index: number): string => {
  if (typeof diaData?.dia === "string") {
    return diaData.dia.toLowerCase();
  }

  if (typeof diaData?.nombre_dia === "string") {
    return diaData.nombre_dia.toLowerCase();
  }

  if (typeof diaData?.dia_semana === "string") {
    return diaData.dia_semana.toLowerCase();
  }

  if (typeof diaData?.dia === "number") {
    return DIAS_NOMBRES[diaData.dia - 1] ?? `día ${diaData.dia}`;
  }

  return DIAS_NOMBRES[index] ?? `día ${index + 1}`;
};

const obtenerEjerciciosDesdeDia = (diaData: any): any[] => {
  if (Array.isArray(diaData)) return diaData;

  if (Array.isArray(diaData?.ejercicios)) {
    return diaData.ejercicios;
  }

  if (Array.isArray(diaData?.items)) {
    return diaData.items;
  }

  if (Array.isArray(diaData?.grupos)) {
    return diaData.grupos.flatMap((grupo: any) => {
      if (Array.isArray(grupo?.ejercicios)) return grupo.ejercicios;
      return [];
    });
  }

  return [];
};

const normalizarRutinaPorDia = (rutina: Rutina): EjerciciosPorDia => {
  const rutinaDesc = parseRutinaDesc(rutina.rutina_desc ?? rutina.contenido);

  if (!rutinaDesc || typeof rutinaDesc !== "object") {
    return {};
  }

  // Formato nuevo: { dias: [{ dia, ejercicios }] }
  if (Array.isArray(rutinaDesc.dias)) {
    return rutinaDesc.dias.reduce((acc: EjerciciosPorDia, diaData: any, index: number) => {
      const nombreDia = obtenerNombreDia(diaData, index);
      acc[nombreDia] = obtenerEjerciciosDesdeDia(diaData);
      return acc;
    }, {});
  }

  // Formato intermedio: { semana: { lunes: [] } }
  if (rutinaDesc.semana && typeof rutinaDesc.semana === "object") {
    return Object.entries(rutinaDesc.semana).reduce(
      (acc: EjerciciosPorDia, [dia, value]) => {
        acc[dia.toLowerCase()] = obtenerEjerciciosDesdeDia(value);
        return acc;
      },
      {}
    );
  }

  // Formato viejo: { lunes: [], martes: [] }
  const tieneDiasDirectos = DIAS_NOMBRES.some((dia) =>
    Array.isArray(rutinaDesc[dia])
  );

  if (tieneDiasDirectos) {
    return DIAS_NOMBRES.reduce((acc: EjerciciosPorDia, dia) => {
      if (Array.isArray(rutinaDesc[dia])) {
        acc[dia] = rutinaDesc[dia];
      }

      return acc;
    }, {});
  }

  return {};
};

const obtenerNombreEjercicio = (ejercicio: any): string => {
  return (
    ejercicio?.nombre ||
    ejercicio?.ejercicio ||
    ejercicio?.nombre_ejercicio ||
    "Ejercicio"
  );
};

const obtenerSeries = (ejercicio: any): string | number => {
  return ejercicio?.series ?? ejercicio?.sets ?? "-";
};

const obtenerRepeticiones = (ejercicio: any): string | number => {
  return ejercicio?.reps ?? ejercicio?.repeticiones ?? "-";
};

const obtenerDescanso = (ejercicio: any): string => {
  if (ejercicio?.descanso_seg !== undefined && ejercicio?.descanso_seg !== null) {
    return `${ejercicio.descanso_seg}s`;
  }

  return ejercicio?.descanso ?? "-";
};

const obtenerImagen = (ejercicio: any): string | null => {
  return ejercicio?.imagen || ejercicio?.imagen_url || ejercicio?.gif_url || null;
};

const obtenerVideoYoutube = (ejercicio: any): string | null => {
  return (
    ejercicio?.video_youtube_url ||
    ejercicio?.youtube_url ||
    ejercicio?.videoUrl ||
    ejercicio?.video_url ||
    null
  );
};

const obtenerTituloRutina = (rutina: Rutina): string => {
  if (rutina.nombre) return rutina.nombre;

  if (rutina.semana) return `Rutina semana ${rutina.semana}`;

  return `Rutina #${rutina.id_rutina}`;
};

export default function RutinaEjercicios({
  refreshKey = 0,
  onView,
  onEdit,
  onDelete,
  singleRutinaId,
  singleMode = false,
  backLabel = "VOLVER",
  onBack,
}: {
  refreshKey?: number;
  onView?: (rutina: Rutina) => void;
  onEdit?: (rutina: Rutina) => void;
  onDelete?: (rutina: Rutina) => Promise<void> | void;
  singleRutinaId?: number | string;
  singleMode?: boolean;
  backLabel?: string;
  onBack?: () => void;
}) {
  const { user, token } = useAuthStore();
  const usuarioEsAdmin = isAdmin(user?.rol);

  const [viendoRutina, setViendoRutina] = useState<number | null>(null);
  const [diasExpandidos, setDiasExpandidos] = useState<{
    [key: string]: boolean;
  }>({});
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
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

      const rutinasData: Rutina[] = response.data ?? [];
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
  }, [fetchRutinas, refreshKey]);

  useEffect(() => {
    if (singleRutinaId === undefined || singleRutinaId === null) return;

    const parsedId = Number(singleRutinaId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) return;

    setViendoRutina(parsedId);
  }, [singleRutinaId]);

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

  const verRutina = (id: number) => {
    setViendoRutina(id);
    setDiasExpandidos({});
  };

  const volverALista = () => {
    if (onBack) {
      onBack();
      return;
    }

    setViendoRutina(null);
    setDiasExpandidos({});
  };

  const handleDelete = async (rutina: Rutina) => {
    if (!onDelete) return;

    setDeletingId(rutina.id_rutina);

    try {
      await onDelete(rutina);
      await fetchRutinas();

      if (viendoRutina === rutina.id_rutina) {
        volverALista();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDescargarPdf = async (rutina: Rutina, ejerciciosPorDia: EjerciciosPorDia) => {
    const socioNombre =
      rutina.socio?.nombre_completo ||
      user?.nombre ||
      user?.email ||
      "Socio";

    setExportingPdf(true);

    try {
      await descargarRutinaPdf({
        rutina,
        ejerciciosPorDia,
        socioNombre,
        logoUrl: "/gm_logo.svg",
      });
      toast.success("Rutina descargada correctamente");
    } catch (error) {
      console.error("Error al descargar rutina en PDF:", error);
      toast.error("No se pudo descargar la rutina");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Cargando rutinas...
      </div>
    );
  }

  if (!loading && rutinas.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay rutinas registradas aún.
      </div>
    );
  }

  if (viendoRutina !== null) {
    const rutina = rutinas.find((r) => r.id_rutina === viendoRutina);

    if (!rutina) {
      return (
        <div className="min-h-screen">
          <div className="max-w-3xl p-8 mx-auto bg-white border border-gray-200 shadow-xl rounded-2xl">
            <p className="mb-6 text-sm text-gray-600">
              No se encontró la rutina solicitada o no tenés permisos para verla.
            </p>
            <button
              onClick={volverALista}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white transition-colors bg-gray-900 rounded-full hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </button>
          </div>
        </div>
      );
    }

    const ejerciciosPorDia = normalizarRutinaPorDia(rutina);
    const diasDisponibles = Object.keys(ejerciciosPorDia);

    return (
      <div className="min-h-screen">
        <div className="mx-auto overflow-hidden bg-white shadow-xl max-w-7xl rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col gap-4 px-4 py-6 text-white bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
            <div className="flex-1">
              <h1 className="mb-2 text-xl font-light tracking-wide sm:text-2xl lg:text-3xl sm:tracking-widest">
                {obtenerTituloRutina(rutina)}
              </h1>

              {usuarioEsAdmin && rutina.socio && (
                <p className="mb-2 text-sm font-light opacity-80">
                  Socio: {rutina.socio.nombre_completo}
                  {rutina.socio.dni ? ` · DNI: ${rutina.socio.dni}` : ""}
                </p>
              )}

              <div className="flex flex-col gap-2 text-xs font-light sm:flex-row sm:gap-5 sm:text-sm opacity-70">
                <span>
                  CREADO{" "}
                  {rutina.creado_en
                    ? formatFrontendDate(rutina.creado_en)
                    : "-"}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  ACTUALIZADO{" "}
                  {rutina.actualizado_en
                    ? formatFrontendDate(rutina.actualizado_en)
                    : "-"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:self-auto">
              <button
                onClick={() => handleDescargarPdf(rutina, ejerciciosPorDia)}
                disabled={exportingPdf}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium tracking-wide text-gray-900 transition-colors bg-white border border-white rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-sm sm:tracking-wider hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                {exportingPdf ? "GENERANDO..." : "DESCARGAR RUTINA"}
              </button>

              <button
                onClick={volverALista}
                className="inline-flex items-center self-start gap-2 px-4 py-2 text-xs font-light tracking-wide text-white transition-colors bg-transparent border rounded-full cursor-pointer sm:px-6 sm:py-3 sm:text-sm sm:tracking-wider border-white/30 hover:bg-white/10 sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-10">
            {diasDisponibles.length === 0 ? (
              <div className="p-6 text-sm italic font-light text-center text-gray-400 sm:p-8 lg:p-10 sm:text-base">
                Esta rutina no tiene ejercicios cargados o usa un formato no reconocido.
              </div>
            ) : (
              diasDisponibles.map((dia) => (
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
                      {ejerciciosPorDia[dia]?.length > 0 ? (
                        ejerciciosPorDia[dia].map(
                          (ejercicio: any, idx: number) => {
                            const ejercicioKey = `${dia}-${idx}`;
                            const nombreEjercicio =
                              obtenerNombreEjercicio(ejercicio);
                            const series = obtenerSeries(ejercicio);
                            const repeticiones =
                              obtenerRepeticiones(ejercicio);
                            const descanso = obtenerDescanso(ejercicio);
                            const imagen = obtenerImagen(ejercicio);
                            const videoYoutube = obtenerVideoYoutube(ejercicio);

                            return (
                              <div
                                key={idx}
                                className="p-4 mt-4 bg-white border border-gray-200 sm:p-6 lg:p-8 sm:mt-6 rounded-xl sm:rounded-2xl"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:gap-3">
                                      <h3 className="m-0 text-lg font-semibold tracking-wide text-gray-900 break-words sm:text-xl lg:text-2xl">
                                        {nombreEjercicio}
                                      </h3>

                                      {imagen && (
                                        <button
                                          onClick={() =>
                                            toggleImagen(ejercicioKey)
                                          }
                                          className="self-start p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-900 sm:self-auto"
                                          title="Mostrar/ocultar imagen del ejercicio"
                                        >
                                          {imagenVisible[ejercicioKey] ? (
                                            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                                          ) : (
                                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    <div className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wide text-white bg-gray-900 rounded-full sm:px-4 sm:py-2 sm:mb-4 sm:text-sm">
                                      {series} × {repeticiones}
                                    </div>

                                    <p className="m-0 text-sm font-light tracking-wide text-gray-600 sm:text-base">
                                      Descanso: {descanso}
                                    </p>

                                    {videoYoutube && (
                                      <a
                                        href={videoYoutube}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 mt-3 text-xs font-semibold tracking-wide text-gray-900 transition-colors border border-gray-300 rounded-full hover:bg-gray-100"
                                      >
                                        ▶ Ver video
                                      </a>
                                    )}
                                  </div>

                                  {imagenVisible[ejercicioKey] && imagen && (
                                    <div className="w-full lg:w-64 xl:w-80">
                                      <div className="overflow-hidden rounded-lg bg-gray-50">
                                        <Image
                                          src={imagen}
                                          alt={`Demostración de ${nombreEjercicio}`}
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
                        )
                      ) : (
                        <div className="p-6 text-sm italic font-light text-center text-gray-400 sm:p-8 lg:p-10 sm:text-base">
                          Día de descanso
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (singleMode && viendoRutina === null) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Preparando detalle de rutina...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen px-2 py-4 sm:px-5 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-12 lg:mb-15">
            <h1 className="mb-3 text-3xl font-thin tracking-wide text-gray-900 sm:mb-4 sm:text-4xl lg:text-5xl sm:tracking-widest">
              {usuarioEsAdmin ? "RUTINAS ASIGNADAS" : "RUTINAS"}
            </h1>
            <p className="text-base font-light tracking-wide text-gray-600 sm:text-lg sm:tracking-widest">
              {usuarioEsAdmin
                ? "RUTINAS ASIGNADAS A SOCIOS"
                : "ENTRENA CON PROPÓSITO"}
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
                    {obtenerTituloRutina(rutina)}
                  </h2>

                  {usuarioEsAdmin && rutina.socio && (
                    <div className="mb-3 text-sm font-light tracking-wide text-gray-600">
                      <span className="font-medium">Socio:</span>{" "}
                      {rutina.socio.nombre_completo}
                      {rutina.socio.dni ? ` · DNI: ${rutina.socio.dni}` : ""}
                      {rutina.socio.email ? ` · ${rutina.socio.email}` : ""}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 text-xs font-light tracking-wide text-gray-600 sm:flex-row sm:gap-6 sm:text-sm">
                    <span>
                      CREADO{" "}
                      {rutina.creado_en
                        ? formatFrontendDate(rutina.creado_en)
                        : "-"}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      ACTUALIZADO{" "}
                      {rutina.actualizado_en
                        ? formatFrontendDate(rutina.actualizado_en)
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                  <button
                    onClick={() => {
                      onView?.(rutina);
                      verRutina(rutina.id_rutina);
                    }}
                    className="px-6 py-2 text-xs font-medium tracking-wide text-white transition-colors bg-gray-900 border-none rounded-full cursor-pointer sm:px-8 sm:py-3 sm:text-sm sm:tracking-widest hover:bg-gray-800"
                  >
                    VER
                  </button>

                  <button
                    onClick={() => onEdit?.(rutina)}
                    className="px-6 py-2 text-xs font-medium tracking-wide text-yellow-700 transition-colors bg-transparent border border-yellow-500 rounded-full cursor-pointer sm:px-8 sm:py-3 sm:text-sm sm:tracking-widest hover:bg-yellow-50"
                  >
                    EDITAR
                  </button>

                  <button
                    onClick={() => handleDelete(rutina)}
                    disabled={deletingId === rutina.id_rutina}
                    className="px-6 py-2 text-xs font-medium tracking-wide text-red-600 transition-colors bg-transparent border border-red-600 rounded-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-3 sm:text-sm sm:tracking-widest hover:bg-red-50"
                  >
                    {deletingId === rutina.id_rutina ? "ELIMINANDO..." : "ELIMINAR"}
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