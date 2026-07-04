"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  getHistorialRutinas,
  getRutinaTrainingSessions,
  startRutinaTrainingSession,
  updateRutinaTrainingSession,
} from "@/services/apiClient";
import { Rutina } from "@/interfaces/rutina.interface";
import {
  RutinaTrainingSession,
  RutinaTrainingSessionExerciseInput,
} from "@/interfaces/rutinaTrainingSession.interface";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Download,
  Dumbbell,
  Eye,
  EyeOff,
  Clock,
  Flag,
  History,
  Info,
  PlayCircle,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
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

const normalizarValorRutina = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "-";

  return String(value)
    .replace(/×/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
};

const extraerNumerosEnteros = (value: string): number[] => {
  return Array.from(value.matchAll(/\d+/g))
    .map((match) => Number(match[0]))
    .filter((number) => Number.isFinite(number));
};

const formatearCantidad = (cantidad: number, singular: string, plural: string): string => {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
};

const construirFraseSeries = (seriesText: string, seriesNumbers: number[]): string => {
  if (seriesNumbers.length >= 2 && seriesText.includes("-")) {
    return `entre ${seriesNumbers[0]} a ${seriesNumbers[1]} series`;
  }

  if (seriesNumbers.length >= 1) {
    return formatearCantidad(seriesNumbers[0], "serie", "series");
  }

  if (seriesText && seriesText !== "-") {
    return `${seriesText} series`;
  }

  return "las series indicadas";
};

const contieneIndicacionDeTiempo = (value: string): boolean => {
  return /\b(seg|segundo|segundos|s|min|minuto|minutos)\b/i.test(value);
};

const contieneIndicacionPorLado = (value: string): boolean => {
  return /por\s+lado/i.test(value);
};

const construirUnidadRepeticiones = (repeticionesText: string): string => {
  if (contieneIndicacionPorLado(repeticionesText)) {
    return "repeticiones por lado";
  }

  return "repeticiones";
};

const construirAyudaSeriesRepeticiones = (
  series: string | number,
  repeticiones: string | number
): string => {
  const seriesText = normalizarValorRutina(series);
  const repeticionesText = normalizarValorRutina(repeticiones);
  const seriesNumbers = extraerNumerosEnteros(seriesText);
  const repeticionesNumbers = extraerNumerosEnteros(repeticionesText);
  const seriesPhrase = construirFraseSeries(seriesText, seriesNumbers);
  const esPorTiempo = contieneIndicacionDeTiempo(repeticionesText);
  const unidadRepeticiones = construirUnidadRepeticiones(repeticionesText);

  if (esPorTiempo && repeticionesNumbers.length >= 2 && repeticionesText.includes("-")) {
    return `Debes hacer ${seriesPhrase}, manteniendo el ejercicio entre ${repeticionesNumbers[0]} a ${repeticionesNumbers[1]} segundos por serie. Controlá la postura y no sacrifiques técnica por sostener más tiempo.`;
  }

  if (esPorTiempo && repeticionesNumbers.length >= 1) {
    return `Debes hacer ${seriesPhrase}, manteniendo el ejercicio durante ${repeticionesNumbers[0]} segundos por serie. Controlá la postura durante todo el tiempo indicado.`;
  }

  if (repeticionesNumbers.length >= 3 && seriesNumbers.length >= 1) {
    const repeticionesPorSerie = repeticionesNumbers
      .map((rep, index) => {
        const ordinales = ["primera", "segunda", "tercera", "cuarta", "quinta", "sexta"];
        const serieLabel = ordinales[index] ?? `serie ${index + 1}`;
        return `${serieLabel}: ${rep} ${unidadRepeticiones}`;
      })
      .join(", ");

    const esPiramidalDescendente = repeticionesNumbers.every(
      (rep, index, reps) => index === 0 || rep < reps[index - 1]
    );

    return `Debes hacer ${seriesPhrase}. Distribuí las repeticiones así: ${repeticionesPorSerie}.${
      esPiramidalDescendente
        ? " Como las repeticiones bajan en cada serie, subí el peso de forma progresiva manteniendo buena técnica."
        : " Mantené buena técnica en todas las series."
    }`;
  }

  if (repeticionesNumbers.length >= 2 && repeticionesText.includes("-")) {
    return `Debes hacer ${seriesPhrase} de entre ${repeticionesNumbers[0]} a ${repeticionesNumbers[1]} ${unidadRepeticiones} por serie.`;
  }

  if (repeticionesNumbers.length >= 1) {
    return `Debes hacer ${seriesPhrase} de ${formatearCantidad(
      repeticionesNumbers[0],
      "repetición",
      "repeticiones"
    )}${contieneIndicacionPorLado(repeticionesText) ? " por lado" : ""} por serie.`;
  }

  if (repeticionesText && repeticionesText !== "-") {
    return `Debes hacer ${seriesPhrase}. La indicación de repeticiones es: ${repeticionesText}.`;
  }

  return `Debes hacer ${seriesPhrase}. Si tenés dudas, consultá al entrenador antes de comenzar el ejercicio.`;
};

const DIAS_DESDE_JS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const capitalizarTexto = (value: string): string => {
  if (!value) return "-";

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const normalizarDiaKey = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const esDiaActual = (dia: string): boolean => {
  const hoy = DIAS_DESDE_JS[new Date().getDay()];
  return normalizarDiaKey(dia) === normalizarDiaKey(hoy);
};

const contarEjercicios = (ejercicios?: any[]): number =>
  Array.isArray(ejercicios) ? ejercicios.length : 0;

const obtenerTotalEjercicios = (ejerciciosPorDia: EjerciciosPorDia): number =>
  Object.values(ejerciciosPorDia).reduce(
    (total, ejercicios) => total + contarEjercicios(ejercicios),
    0
  );

type EjerciciosCompletadosState = Record<string, boolean>;

const construirEjercicioKey = (idRutina: number | string, dia: string, index: number): string =>
  `${idRutina}:${normalizarDiaKey(dia)}:${index}`;

const contarEjerciciosCompletados = (
  ejerciciosPorDia: EjerciciosPorDia,
  completados: EjerciciosCompletadosState,
  idRutina: number | string
): number =>
  Object.entries(ejerciciosPorDia).reduce((total, [dia, ejercicios]) => {
    if (!Array.isArray(ejercicios)) return total;

    return (
      total +
      ejercicios.filter((_, index) => completados[construirEjercicioKey(idRutina, dia, index)]).length
    );
  }, 0);

const contarCompletadosPorDia = (
  ejercicios: any[] | undefined,
  completados: EjerciciosCompletadosState,
  idRutina: number | string,
  dia: string
): number =>
  Array.isArray(ejercicios)
    ? ejercicios.filter((_, index) => completados[construirEjercicioKey(idRutina, dia, index)]).length
    : 0;

const construirProgressStorageKey = (userId: string, rutinaId: number | string): string =>
  `gym-master:rutina-progress:${userId}:${rutinaId}`;

const construirCompletadosDesdeSesion = (
  session?: RutinaTrainingSession | null
): EjerciciosCompletadosState => {
  if (!session?.exercises?.length) return {};

  return session.exercises.reduce((acc: EjerciciosCompletadosState, exercise) => {
    if (exercise.completed) {
      acc[exercise.exercise_key] = true;
    }

    return acc;
  }, {});
};

const obtenerSesionesFinalizadas = (
  sessions: RutinaTrainingSession[]
): RutinaTrainingSession[] =>
  sessions.filter((session) => session.status !== 'in_progress');

const obtenerSesionActiva = (
  sessions: RutinaTrainingSession[]
): RutinaTrainingSession | null =>
  sessions.find((session) => session.status === 'in_progress') ?? null;

const formatearFechaHoraSesion = (value?: string | null): string => {
  if (!value) return '-';

  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatearDuracionSesion = (minutes?: number | null): string => {
  if (minutes === null || minutes === undefined) return 'Sin cerrar';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
};

const obtenerEstadoSesionLabel = (status: RutinaTrainingSession['status']): string => {
  if (status === 'completed') return 'Finalizada';
  if (status === 'cancelled') return 'Cancelada';
  return 'En curso';
};

const obtenerEstadoSesionClasses = (status: RutinaTrainingSession['status']): string => {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'cancelled') return 'border-gray-200 bg-gray-50 text-gray-600';
  return 'border-sky-200 bg-sky-50 text-sky-800';
};

const obtenerDiaSugerido = (ejerciciosPorDia: EjerciciosPorDia): string | null => {
  const dias = Object.keys(ejerciciosPorDia);
  if (dias.length === 0) return null;

  return dias.find((dia) => esDiaActual(dia)) ?? dias[0];
};

const obtenerGrupoMuscular = (ejercicio: any): string | null => {
  return (
    ejercicio?.grupo_muscular ||
    ejercicio?.musculo ||
    ejercicio?.zona ||
    ejercicio?.categoria ||
    null
  );
};

const obtenerIndicacionTecnica = (ejercicio: any): string | null => {
  return (
    ejercicio?.indicaciones ||
    ejercicio?.indicacion ||
    ejercicio?.observaciones ||
    ejercicio?.descripcion ||
    ejercicio?.detalle ||
    null
  );
};

const construirEjercicioSesionInput = (
  rutina: Rutina,
  dia: string,
  ejercicio: any,
  index: number
): RutinaTrainingSessionExerciseInput => ({
  exercise_key: construirEjercicioKey(rutina.id_rutina, dia, index),
  day_name: dia,
  exercise_index: index,
  exercise_name: obtenerNombreEjercicio(ejercicio),
  muscle_group: obtenerGrupoMuscular(ejercicio),
  series: obtenerSeries(ejercicio),
  repetitions: obtenerRepeticiones(ejercicio),
  rest: obtenerDescanso(ejercicio),
  payload: ejercicio && typeof ejercicio === 'object' ? ejercicio : {},
});

const construirEjerciciosSesionInputs = (
  rutina: Rutina,
  ejerciciosPorDia: EjerciciosPorDia
): RutinaTrainingSessionExerciseInput[] =>
  Object.entries(ejerciciosPorDia).flatMap(([dia, ejercicios]) =>
    Array.isArray(ejercicios)
      ? ejercicios.map((ejercicio, index) =>
          construirEjercicioSesionInput(rutina, dia, ejercicio, index)
        )
      : []
  );


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
  const puedeGestionarRutinas = usuarioEsAdmin;

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
  const [ayudaSeries, setAyudaSeries] = useState<{
    titulo: string;
    badge: string;
    descripcion: string;
  } | null>(null);
  const [ejerciciosCompletados, setEjerciciosCompletados] =
    useState<EjerciciosCompletadosState>({});
  const [trainingSessions, setTrainingSessions] = useState<RutinaTrainingSession[]>([]);
  const [trainingSessionsLoading, setTrainingSessionsLoading] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState<string | null>(null);

  const puedeMarcarEjercicios = !usuarioEsAdmin;
  const progressUserId = String(
    user?.id ?? user?.id_socio ?? user?.email ?? 'anonymous'
  );

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

  const progressStorageKey = useMemo(() => {
    if (!viendoRutina || !puedeMarcarEjercicios) return null;

    return construirProgressStorageKey(progressUserId, viendoRutina);
  }, [progressUserId, puedeMarcarEjercicios, viendoRutina]);

  const activeTrainingSession = useMemo(
    () => obtenerSesionActiva(trainingSessions),
    [trainingSessions]
  );

  const completedExercisesFromSession = useMemo(
    () => construirCompletadosDesdeSesion(activeTrainingSession),
    [activeTrainingSession]
  );

  const finishedTrainingSessions = useMemo(
    () => obtenerSesionesFinalizadas(trainingSessions),
    [trainingSessions]
  );

  useEffect(() => {
    if (!progressStorageKey || typeof window === 'undefined') {
      setEjerciciosCompletados({});
      return;
    }

    try {
      const storedProgress = window.localStorage.getItem(progressStorageKey);
      setEjerciciosCompletados(storedProgress ? JSON.parse(storedProgress) : {});
    } catch (error) {
      console.warn('No se pudo recuperar progreso local de rutina:', error);
      setEjerciciosCompletados({});
    }
  }, [progressStorageKey]);

  const fetchTrainingSessions = useCallback(
    async (rutinaId: number | string) => {
      if (!puedeMarcarEjercicios || !token) {
        setTrainingSessions([]);
        return;
      }

      setTrainingSessionsLoading(true);

      try {
        const response = await getRutinaTrainingSessions(rutinaId);

        if (!response.ok) {
          throw new Error(response.error || 'Error al cargar sesiones de entrenamiento');
        }

        setTrainingSessions(response.data ?? []);
      } catch (error) {
        console.error('Error al cargar sesiones de entrenamiento:', error);
        setTrainingSessions([]);
      } finally {
        setTrainingSessionsLoading(false);
      }
    },
    [puedeMarcarEjercicios, token]
  );

  useEffect(() => {
    if (!viendoRutina || !puedeMarcarEjercicios) {
      setTrainingSessions([]);
      return;
    }

    void fetchTrainingSessions(viendoRutina);
  }, [viendoRutina, puedeMarcarEjercicios, fetchTrainingSessions]);

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

  const persistirProgreso = (nextProgress: EjerciciosCompletadosState) => {
    if (!progressStorageKey || typeof window === 'undefined') return;

    window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
  };

  const toggleEjercicioCompletado = async (
    ejercicioKey: string,
    exerciseInput?: RutinaTrainingSessionExerciseInput
  ) => {
    if (!puedeMarcarEjercicios) return;

    if (activeTrainingSession) {
      const currentCompleted = Boolean(completedExercisesFromSession[ejercicioKey]);
      const nextCompleted = !currentCompleted;

      setSessionActionLoading(ejercicioKey);

      try {
        const response = await updateRutinaTrainingSession(activeTrainingSession.id, {
          action: 'update_exercise',
          exercise_key: ejercicioKey,
          completed: nextCompleted,
          exercise: exerciseInput ?? null,
        });

        if (!response.ok) {
          throw new Error(response.error || 'Error al actualizar ejercicio');
        }

        const updatedSession = response.data as RutinaTrainingSession;
        setTrainingSessions((prev) =>
          prev.map((session) =>
            session.id === updatedSession.id ? updatedSession : session
          )
        );
      } catch (error) {
        console.error('Error al actualizar ejercicio de sesión:', error);
        toast.error('No se pudo guardar el avance de la sesión');
      } finally {
        setSessionActionLoading(null);
      }

      return;
    }

    setEjerciciosCompletados((prev) => {
      const nextProgress = { ...prev, [ejercicioKey]: !prev[ejercicioKey] };

      if (!nextProgress[ejercicioKey]) {
        delete nextProgress[ejercicioKey];
      }

      persistirProgreso(nextProgress);
      return nextProgress;
    });
  };

  const resetearProgresoRutina = () => {
    if (!puedeMarcarEjercicios) return;

    const confirmar = window.confirm('¿Querés reiniciar el progreso marcado para esta rutina?');
    if (!confirmar) return;

    setEjerciciosCompletados({});

    if (progressStorageKey && typeof window !== 'undefined') {
      window.localStorage.removeItem(progressStorageKey);
    }

    toast.success('Progreso local de rutina reiniciado');
  };

  const iniciarSesionEntrenamiento = async (
    rutina: Rutina,
    ejerciciosPorDia: EjerciciosPorDia
  ) => {
    if (!puedeMarcarEjercicios) return;

    const exercises = construirEjerciciosSesionInputs(rutina, ejerciciosPorDia);
    if (exercises.length === 0) {
      toast.error('La rutina no tiene ejercicios para iniciar una sesión');
      return;
    }

    setSessionActionLoading('start-session');

    try {
      const response = await startRutinaTrainingSession({
        id_rutina: rutina.id_rutina,
        exercises,
      });

      if (!response.ok) {
        throw new Error(response.error || 'Error al iniciar sesión');
      }

      const session = response.data as RutinaTrainingSession;
      setTrainingSessions((prev) => {
        const withoutSame = prev.filter((item) => item.id !== session.id);
        return [session, ...withoutSame];
      });
      toast.success('Sesión de entrenamiento iniciada');
    } catch (error) {
      console.error('Error al iniciar sesión de entrenamiento:', error);
      toast.error('No se pudo iniciar la sesión de entrenamiento');
    } finally {
      setSessionActionLoading(null);
    }
  };

  const finalizarSesionEntrenamiento = async () => {
    if (!activeTrainingSession) return;

    setSessionActionLoading('finish-session');

    try {
      const response = await updateRutinaTrainingSession(activeTrainingSession.id, {
        action: 'finish',
      });

      if (!response.ok) {
        throw new Error(response.error || 'Error al finalizar sesión');
      }

      const session = response.data as RutinaTrainingSession;
      const completedSnapshot = construirCompletadosDesdeSesion(session);
      setTrainingSessions((prev) =>
        prev.map((item) => (item.id === session.id ? session : item))
      );
      setEjerciciosCompletados(completedSnapshot);
      persistirProgreso(completedSnapshot);
      toast.success('Sesión de entrenamiento finalizada');
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
      toast.error('No se pudo finalizar la sesión');
    } finally {
      setSessionActionLoading(null);
    }
  };

  const cancelarSesionEntrenamiento = async () => {
    if (!activeTrainingSession) return;

    const confirmar = window.confirm('¿Querés cancelar esta sesión de entrenamiento?');
    if (!confirmar) return;

    setSessionActionLoading('cancel-session');

    try {
      const response = await updateRutinaTrainingSession(activeTrainingSession.id, {
        action: 'cancel',
      });

      if (!response.ok) {
        throw new Error(response.error || 'Error al cancelar sesión');
      }

      const session = response.data as RutinaTrainingSession;
      setTrainingSessions((prev) =>
        prev.map((item) => (item.id === session.id ? session : item))
      );
      toast.success('Sesión de entrenamiento cancelada');
    } catch (error) {
      console.error('Error al cancelar sesión:', error);
      toast.error('No se pudo cancelar la sesión');
    } finally {
      setSessionActionLoading(null);
    }
  };

  const verRutina = (id: number) => {
    const rutina = rutinas.find((item) => item.id_rutina === id);
    const ejerciciosPorDia = rutina ? normalizarRutinaPorDia(rutina) : {};
    const diaSugerido = obtenerDiaSugerido(ejerciciosPorDia);

    setViendoRutina(id);
    setDiasExpandidos(diaSugerido ? { [diaSugerido]: true } : {});
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
    const totalEjercicios = obtenerTotalEjercicios(ejerciciosPorDia);
    const ejerciciosCompletadosFuente = activeTrainingSession
      ? completedExercisesFromSession
      : ejerciciosCompletados;
    const ejerciciosCompletadosCount = contarEjerciciosCompletados(
      ejerciciosPorDia,
      ejerciciosCompletadosFuente,
      rutina.id_rutina
    );
    const porcentajeProgreso =
      totalEjercicios > 0 ? Math.round((ejerciciosCompletadosCount / totalEjercicios) * 100) : 0;
    const diaSugerido = obtenerDiaSugerido(ejerciciosPorDia);

    return (
      <>
        <div className="min-h-screen bg-slate-50/70 px-0 py-0 sm:px-4 sm:py-6">
          <div className="mx-auto overflow-hidden bg-white shadow-xl max-w-7xl rounded-none sm:rounded-3xl">
          <div className="flex flex-col gap-4 px-4 py-5 text-white bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
            <div className="flex-1 min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                <Dumbbell className="h-3.5 w-3.5" />
                Detalle de rutina
              </div>
              <h1 className="mb-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl sm:tracking-wide">
                {obtenerTituloRutina(rutina)}
              </h1>

              {usuarioEsAdmin && rutina.socio && (
                <p className="mb-2 text-sm font-light opacity-80">
                  Socio: {rutina.socio.nombre_completo}
                  {rutina.socio.dni ? ` · DNI: ${rutina.socio.dni}` : ""}
                </p>
              )}

              <div className="flex flex-col gap-2 text-xs font-light sm:flex-row sm:gap-5 sm:text-sm text-white/70">
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white bg-white px-4 py-2 text-xs font-semibold tracking-wide text-gray-950 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-sm hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                {exportingPdf ? "Generando..." : "Descargar PDF"}
              </button>

              {puedeMarcarEjercicios && totalEjercicios > 0 && (
                activeTrainingSession ? (
                  <>
                    <button
                      type="button"
                      onClick={finalizarSesionEntrenamiento}
                      disabled={sessionActionLoading === 'finish-session'}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-400 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-950 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-sm hover:bg-emerald-300"
                    >
                      <Flag className="w-4 h-4" />
                      {sessionActionLoading === 'finish-session' ? 'Finalizando...' : 'Finalizar sesión'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarSesionEntrenamiento}
                      disabled={sessionActionLoading === 'cancel-session'}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-4 py-2 text-xs font-medium tracking-wide text-white transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-sm hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                      {sessionActionLoading === 'cancel-session' ? 'Cancelando...' : 'Cancelar sesión'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => iniciarSesionEntrenamiento(rutina, ejerciciosPorDia)}
                      disabled={sessionActionLoading === 'start-session'}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-400 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-950 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-3 sm:text-sm hover:bg-emerald-300"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {sessionActionLoading === 'start-session' ? 'Iniciando...' : 'Iniciar sesión'}
                    </button>
                    <button
                      type="button"
                      onClick={resetearProgresoRutina}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-4 py-2 text-xs font-medium tracking-wide text-white transition-colors cursor-pointer sm:px-6 sm:py-3 sm:text-sm hover:bg-white/10"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reiniciar local
                    </button>
                  </>
                )
              )}

              <button
                onClick={volverALista}
                className="inline-flex min-h-11 items-center justify-center self-start gap-2 rounded-full border border-white/30 bg-transparent px-4 py-2 text-xs font-medium tracking-wide text-white transition-colors cursor-pointer sm:px-6 sm:py-3 sm:text-sm hover:bg-white/10 sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-white px-4 py-4 sm:px-8 sm:py-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <CalendarDays className="h-4 w-4" />
                  Días
                </div>
                <p className="text-2xl font-semibold text-gray-950">{diasDisponibles.length}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <Dumbbell className="h-4 w-4" />
                  Ejercicios
                </div>
                <p className="text-2xl font-semibold text-gray-950">{totalEjercicios}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Hoy
                </div>
                <p className="truncate text-lg font-semibold text-gray-950">
                  {diaSugerido ? capitalizarTexto(diaSugerido) : "Sin día"}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <Trophy className="h-4 w-4" />
                  Progreso
                </div>
                <p className="text-lg font-semibold text-gray-950">
                  {puedeMarcarEjercicios ? `${porcentajeProgreso}%` : 'Solo socio'}
                </p>
              </div>
            </div>

            {puedeMarcarEjercicios && totalEjercicios > 0 && (
              <div className={`mt-4 rounded-2xl border p-4 ${
                activeTrainingSession
                  ? 'border-sky-100 bg-sky-50'
                  : 'border-emerald-100 bg-emerald-50'
              }`}>
                <div className={`mb-2 flex items-center justify-between gap-3 text-sm font-semibold ${
                  activeTrainingSession ? 'text-sky-950' : 'text-emerald-950'
                }`}>
                  <span>{activeTrainingSession ? 'Sesión activa' : 'Avance personal'}</span>
                  <span>{ejerciciosCompletadosCount}/{totalEjercicios} ejercicios</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeTrainingSession ? 'bg-sky-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${porcentajeProgreso}%` }}
                  />
                </div>
                <p className={`mt-2 text-xs leading-5 ${
                  activeTrainingSession ? 'text-sky-800' : 'text-emerald-800'
                }`}>
                  {activeTrainingSession
                    ? 'Esta sesión se guarda en el historial formal de entrenamiento. Al finalizar, quedará disponible para seguimiento posterior.'
                    : 'Podés marcar avance local o iniciar una sesión para guardar el entrenamiento en el historial.'}
                </p>
              </div>
            )}

            {puedeMarcarEjercicios && totalEjercicios > 0 && (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                      <History className="h-3.5 w-3.5" />
                      Historial de sesiones
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-gray-950">
                      Entrenamientos registrados
                    </h3>
                  </div>
                  {trainingSessionsLoading && (
                    <span className="text-xs font-medium text-gray-500">Cargando historial...</span>
                  )}
                </div>

                {activeTrainingSession && (
                  <div className="mb-3 rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-950">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Clock className="h-4 w-4" />
                        Sesión iniciada {formatearFechaHoraSesion(activeTrainingSession.started_at)}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800">
                        {activeTrainingSession.progress_percent}% completado
                      </span>
                    </div>
                  </div>
                )}

                {finishedTrainingSessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    Todavía no hay sesiones finalizadas para esta rutina. Iniciá una sesión, marcá ejercicios y finalizala para construir historial real.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {finishedTrainingSessions.slice(0, 6).map((session) => (
                      <div
                        key={session.id}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${obtenerEstadoSesionClasses(session.status)}`}>
                            {obtenerEstadoSesionLabel(session.status)}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            {session.progress_percent}%
                          </span>
                        </div>
                        <p className="font-semibold text-gray-950">
                          {formatearFechaHoraSesion(session.started_at)}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <span className="rounded-xl bg-white px-2 py-1">
                            {session.completed_exercises}/{session.total_exercises} ejercicios
                          </span>
                          <span className="rounded-xl bg-white px-2 py-1">
                            {formatearDuracionSesion(session.duration_minutes)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {diasDisponibles.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                {diasDisponibles.map((dia) => (
                  <button
                    key={`chip-${dia}`}
                    type="button"
                    onClick={() =>
                      setDiasExpandidos((prev) => ({
                        ...prev,
                        [dia]: true,
                      }))
                    }
                    className={`flex min-w-max items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      diasExpandidos[dia]
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {capitalizarTexto(dia)}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        diasExpandidos[dia]
                          ? "bg-white/15 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {puedeMarcarEjercicios
                        ? `${contarCompletadosPorDia(ejerciciosPorDia[dia], ejerciciosCompletadosFuente, rutina.id_rutina, dia)}/${contarEjercicios(ejerciciosPorDia[dia])}`
                        : contarEjercicios(ejerciciosPorDia[dia])}
                    </span>
                    {esDiaActual(dia) && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                        Hoy
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 sm:p-6 lg:p-10">
            {diasDisponibles.length === 0 ? (
              <div className="p-6 text-sm italic font-light text-center text-gray-400 sm:p-8 lg:p-10 sm:text-base">
                Esta rutina no tiene ejercicios cargados o usa un formato no reconocido.
              </div>
            ) : (
              diasDisponibles.map((dia) => (
                <div
                  key={dia}
                  className="mb-3 overflow-hidden border border-gray-200 bg-white shadow-sm sm:mb-4 rounded-2xl"
                >
                  <button
                    onClick={() => toggleDia(dia)}
                    className={`w-full px-4 py-4 sm:px-8 sm:py-6 border-none cursor-pointer text-left flex justify-between items-center text-gray-800 transition-colors ${
                      diasExpandidos[dia] ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                        {capitalizarTexto(dia)}
                        {esDiaActual(dia) && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            Hoy
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-normal text-gray-500">
                        {puedeMarcarEjercicios
                          ? `${contarCompletadosPorDia(ejerciciosPorDia[dia], ejerciciosCompletadosFuente, rutina.id_rutina, dia)} de ${contarEjercicios(ejerciciosPorDia[dia])} ejercicios completados`
                          : `${contarEjercicios(ejerciciosPorDia[dia])} ejercicios programados`}
                      </span>
                    </span>
                    <div
                      className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-9 sm:w-9 ${
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
                    <div className="px-3 pb-4 sm:px-8 sm:pb-8 bg-gray-50">
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
                            const completionKey = construirEjercicioKey(rutina.id_rutina, dia, idx);
                            const ejercicioCompletado = Boolean(ejerciciosCompletadosFuente[completionKey]);
                            const ejercicioSessionInput = construirEjercicioSesionInput(rutina, dia, ejercicio, idx);

                            return (
                              <div
                                key={idx}
                                className={`mt-3 overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors sm:mt-5 ${
                                  ejercicioCompletado
                                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-start lg:gap-8">
                                  <div className="flex-1 min-w-0">
                                    <div className="mb-3 flex items-start gap-3">
                                      <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                          ejercicioCompletado
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-900 text-white'
                                        }`}
                                      >
                                        {ejercicioCompletado ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                          <h3 className={`m-0 text-base font-semibold leading-snug tracking-tight break-words sm:text-xl lg:text-2xl ${
                                            ejercicioCompletado ? 'text-emerald-950' : 'text-gray-950'
                                          }`}>
                                            {nombreEjercicio}
                                          </h3>
                                          {puedeMarcarEjercicios && ejercicioCompletado && (
                                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                              Completado
                                            </span>
                                          )}
                                        </div>
                                        {obtenerGrupoMuscular(ejercicio) && (
                                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
                                            {obtenerGrupoMuscular(ejercicio)}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:max-w-xl">
                                      <div className="rounded-2xl bg-gray-50 p-3 text-center">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Series</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-950 sm:text-base">{series}</p>
                                      </div>
                                      <div className="rounded-2xl bg-gray-50 p-3 text-center">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Reps</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-950 sm:text-base">{repeticiones}</p>
                                      </div>
                                      <div className="rounded-2xl bg-gray-50 p-3 text-center">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Descanso</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-950 sm:text-base">{descanso}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                                      <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wide text-white bg-gray-900 rounded-full sm:px-4 sm:py-2 sm:text-sm">
                                        {series} × {repeticiones}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setAyudaSeries({
                                            titulo: nombreEjercicio,
                                            badge: `${series} × ${repeticiones}`,
                                            descripcion:
                                              construirAyudaSeriesRepeticiones(
                                                series,
                                                repeticiones
                                              ),
                                          })
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                        title="Explicar series y repeticiones"
                                        aria-label={`Explicar series y repeticiones de ${nombreEjercicio}`}
                                      >
                                        <Info className="h-4 w-4" />
                                      </button>
                                    </div>

                                    {obtenerIndicacionTecnica(ejercicio) && (
                                      <p className="mb-3 rounded-2xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">
                                        {obtenerIndicacionTecnica(ejercicio)}
                                      </p>
                                    )}

                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                      {puedeMarcarEjercicios && (
                                        <button
                                          type="button"
                                          onClick={() => void toggleEjercicioCompletado(completionKey, ejercicioSessionInput)}
                                          disabled={sessionActionLoading === completionKey}
                                          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                                            ejercicioCompletado
                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                              : 'border-gray-300 text-gray-900 hover:bg-gray-100'
                                          }`}
                                        >
                                          {ejercicioCompletado ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                          ) : (
                                            <Circle className="h-4 w-4" />
                                          )}
                                          {sessionActionLoading === completionKey
                                            ? 'Guardando...'
                                            : ejercicioCompletado
                                              ? 'Reabrir ejercicio'
                                              : 'Marcar completado'}
                                        </button>
                                      )}
                                      {videoYoutube && (
                                        <a
                                          href={videoYoutube}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
                                        >
                                          <PlayCircle className="h-4 w-4" />
                                          Ver video
                                        </a>
                                      )}
                                      {imagen && (
                                        <button
                                          type="button"
                                          onClick={() => toggleImagen(ejercicioKey)}
                                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
                                        >
                                          {imagenVisible[ejercicioKey] ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                          {imagenVisible[ejercicioKey] ? "Ocultar imagen" : "Ver imagen"}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {imagenVisible[ejercicioKey] && imagen && (
                                    <div className="w-full lg:w-64 xl:w-80">
                                      <div className="overflow-hidden rounded-2xl bg-gray-50">
                                        <Image
                                          src={imagen}
                                          alt={`Demostración de ${nombreEjercicio}`}
                                          width={320}
                                          height={500}
                                          className="object-cover w-full h-64 sm:h-72 lg:h-80 xl:h-72"
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

        {ayudaSeries && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onClick={() => setAyudaSeries(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 text-gray-900 shadow-2xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="series-reps-help-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Ayuda para principiantes
                  </p>
                  <h2
                    id="series-reps-help-title"
                    className="text-lg font-semibold tracking-wide text-gray-950"
                  >
                    Series y repeticiones
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setAyudaSeries(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Cerrar ayuda"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-3 text-sm font-medium text-gray-800">
                {ayudaSeries.titulo}
              </p>

              <div className="mb-4 inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold tracking-wide text-white">
                {ayudaSeries.badge}
              </div>

              <p className="text-sm leading-6 text-gray-700 sm:text-base">
                {ayudaSeries.descripcion}
              </p>

              <p className="mt-4 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-500">
                Consejo: priorizá la técnica. Si no podés completar el rango indicado, bajá un poco el peso y consultá al entrenador.
              </p>
            </div>
          </div>
        )}
      </>
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
      <div className="min-h-screen bg-slate-50/60 px-2 py-4 sm:px-5 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-12 lg:mb-15">
            <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900 sm:mb-4 sm:text-4xl lg:text-5xl sm:tracking-wide">
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
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="p-5 sm:p-8 lg:p-10">
                  <h2 className="mb-2 text-xl font-semibold tracking-tight text-gray-950 break-words sm:mb-3 sm:text-2xl lg:text-3xl sm:tracking-wide">
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

                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 p-4 sm:flex-row sm:flex-wrap sm:gap-4 sm:p-5">
                  <button
                    onClick={() => {
                      onView?.(rutina);
                      verRutina(rutina.id_rutina);
                    }}
                    className="min-h-11 rounded-full border-none bg-gray-900 px-6 py-2 text-xs font-semibold tracking-wide text-white transition-colors cursor-pointer sm:px-8 sm:py-3 sm:text-sm hover:bg-gray-800"
                  >
                    Ver rutina
                  </button>

                  {puedeGestionarRutinas && onEdit && (
                    <button
                      onClick={() => onEdit(rutina)}
                      className="min-h-11 rounded-full border border-yellow-500 bg-transparent px-6 py-2 text-xs font-semibold tracking-wide text-yellow-700 transition-colors cursor-pointer sm:px-8 sm:py-3 sm:text-sm hover:bg-yellow-50"
                    >
                      Editar
                    </button>
                  )}

                  {puedeGestionarRutinas && onDelete && (
                    <button
                      onClick={() => handleDelete(rutina)}
                      disabled={deletingId === rutina.id_rutina}
                      className="min-h-11 rounded-full border border-red-600 bg-transparent px-6 py-2 text-xs font-semibold tracking-wide text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-3 sm:text-sm hover:bg-red-50"
                    >
                      {deletingId === rutina.id_rutina ? "Eliminando..." : "Eliminar"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}