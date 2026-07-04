import 'server-only';

import { JwtUser } from '@/interfaces/jwtUser.interface';
import {
  RutinaTrainingSession,
  RutinaTrainingSessionExerciseInput,
  RutinaTrainingSessionExerciseUpdateInput,
  RutinaTrainingSessionStartInput,
  RutinaTrainingSessionStatus,
} from '@/interfaces/rutinaTrainingSession.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

const ACTIVE_SESSION_STATUS: RutinaTrainingSessionStatus = 'in_progress';
const isAdmin = (rol?: string | null): boolean => {
  const normalizedRol = rol?.trim().toLowerCase();
  return normalizedRol === 'admin' || normalizedRol === 'administrador';
};

const isValidUUID = (value?: string | null): value is string => {
  if (typeof value !== 'string') return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
};

const normalizeRutinaId = (idRutina: string | number): number => {
  const parsed = Number(idRutina);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('El id de rutina no es válido');
  }

  return parsed;
};

const cleanText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const resolveIdSocioForAuthenticatedUser = async (
  user: JwtUser,
): Promise<string | null> => {
  if (isValidUUID(user.id_socio)) {
    return user.id_socio.trim();
  }

  if (!isAdmin(user.rol) && isValidUUID(user.id)) {
    const supabase = getSupabaseServerClient();
    const { data: socio, error } = await supabase
      .from('socio')
      .select('id_socio')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('No se pudo resolver socio para sesión de entrenamiento:', error.message);
    }

    if (isValidUUID(socio?.id_socio)) {
      return socio.id_socio.trim();
    }
  }

  return null;
};

type RutinaAccess = {
  id_rutina: number;
  id_socio: string;
};

const assertRutinaAccess = async (
  user: JwtUser,
  idRutina: string | number,
): Promise<RutinaAccess> => {
  const supabase = getSupabaseServerClient();
  const rutinaId = normalizeRutinaId(idRutina);

  const { data: rutina, error } = await supabase
    .from('rutina')
    .select('id_rutina, id_socio')
    .eq('id_rutina', rutinaId)
    .maybeSingle();

  if (error) {
    console.error('Error al validar acceso a rutina:', error.message);
    throw new Error('Error al validar la rutina');
  }

  if (!rutina) {
    throw new Error('No se encontró la rutina');
  }

  if (!isAdmin(user.rol)) {
    const idSocio = await resolveIdSocioForAuthenticatedUser(user);

    if (!idSocio || rutina.id_socio !== idSocio) {
      throw new Error('No tenés permisos para registrar sesiones de esta rutina');
    }
  }

  return {
    id_rutina: Number(rutina.id_rutina),
    id_socio: String(rutina.id_socio),
  };
};

const assertSessionAccess = async (
  user: JwtUser,
  sessionId: string,
): Promise<RutinaTrainingSession> => {
  if (!isValidUUID(sessionId)) {
    throw new Error('El id de sesión no es válido');
  }

  const session = await getTrainingSessionById(sessionId);

  if (!session) {
    throw new Error('No se encontró la sesión de entrenamiento');
  }

  if (!isAdmin(user.rol)) {
    const idSocio = await resolveIdSocioForAuthenticatedUser(user);

    if (!idSocio || session.id_socio !== idSocio) {
      throw new Error('No tenés permisos para modificar esta sesión de entrenamiento');
    }
  }

  return session;
};

const normalizeExerciseInput = (
  exercise: RutinaTrainingSessionExerciseInput,
  indexFallback = 0,
) => ({
  exercise_key: cleanText(exercise.exercise_key) ?? `exercise-${indexFallback}`,
  day_name: cleanText(exercise.day_name) ?? 'día',
  exercise_index: Number.isInteger(Number(exercise.exercise_index))
    ? Number(exercise.exercise_index)
    : indexFallback,
  exercise_name: cleanText(exercise.exercise_name) ?? 'Ejercicio',
  muscle_group: cleanText(exercise.muscle_group),
  series: cleanText(exercise.series),
  repetitions: cleanText(exercise.repetitions),
  rest: cleanText(exercise.rest),
  payload: exercise.payload && typeof exercise.payload === 'object' ? exercise.payload : {},
});

const sortSessionExercises = (session: RutinaTrainingSession): RutinaTrainingSession => ({
  ...session,
  exercises: [...(session.exercises ?? [])].sort((a, b) => {
    const dayCompare = a.day_name.localeCompare(b.day_name, 'es');
    if (dayCompare !== 0) return dayCompare;
    return a.exercise_index - b.exercise_index;
  }),
});

const calculateProgressPercent = (completed: number, total: number): number => {
  if (total <= 0) return 0;
  return Number(((completed / total) * 100).toFixed(2));
};

const calculateDurationMinutes = (startedAt: string | null): number | null => {
  if (!startedAt) return null;

  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return null;

  return Math.max(0, Math.round((Date.now() - started) / 60000));
};

export const getTrainingSessionById = async (
  sessionId: string,
): Promise<RutinaTrainingSession | null> => {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('rutina_training_session')
    .select('*, exercises:rutina_training_session_exercise(*)')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener sesión de entrenamiento:', error.message);
    throw new Error('Error al obtener la sesión de entrenamiento');
  }

  return data ? sortSessionExercises(data as RutinaTrainingSession) : null;
};

export const listTrainingSessions = async (
  user: JwtUser,
  idRutina: string | number,
): Promise<RutinaTrainingSession[]> => {
  const supabase = getSupabaseServerClient();
  const rutinaAccess = await assertRutinaAccess(user, idRutina);

  const { data, error } = await supabase
    .from('rutina_training_session')
    .select('*, exercises:rutina_training_session_exercise(*)')
    .eq('id_rutina', rutinaAccess.id_rutina)
    .eq('id_socio', rutinaAccess.id_socio)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error al listar sesiones de entrenamiento:', error.message);
    throw new Error('Error al obtener historial de sesiones de entrenamiento');
  }

  return ((data ?? []) as RutinaTrainingSession[]).map(sortSessionExercises);
};

export const startTrainingSession = async (
  user: JwtUser,
  input: RutinaTrainingSessionStartInput,
): Promise<RutinaTrainingSession> => {
  const supabase = getSupabaseServerClient();
  const rutinaAccess = await assertRutinaAccess(user, input.id_rutina);
  const exercises = Array.isArray(input.exercises) ? input.exercises : [];

  const { data: existingSession, error: existingError } = await supabase
    .from('rutina_training_session')
    .select('id')
    .eq('id_rutina', rutinaAccess.id_rutina)
    .eq('id_socio', rutinaAccess.id_socio)
    .eq('status', ACTIVE_SESSION_STATUS)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error('Error al consultar sesión activa:', existingError.message);
    throw new Error('Error al consultar sesión activa');
  }

  if (existingSession?.id) {
    const session = await getTrainingSessionById(String(existingSession.id));
    if (session) return session;
  }

  const totalExercises = exercises.length;

  const { data: session, error: sessionError } = await supabase
    .from('rutina_training_session')
    .insert({
      id_socio: rutinaAccess.id_socio,
      id_rutina: rutinaAccess.id_rutina,
      total_exercises: totalExercises,
      completed_exercises: 0,
      progress_percent: 0,
      notes: cleanText(input.notes),
      metadata: {
        source: 'gym-master-member-routine-detail',
        version: 'rutinas-training-session-history-v1',
      },
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    console.error('Error al crear sesión de entrenamiento:', sessionError?.message);
    throw new Error('Error al iniciar la sesión de entrenamiento');
  }

  if (totalExercises > 0) {
    const rows = exercises.map((exercise, index) => ({
      session_id: session.id,
      ...normalizeExerciseInput(exercise, index),
    }));

    const { error: exerciseError } = await supabase
      .from('rutina_training_session_exercise')
      .insert(rows);

    if (exerciseError) {
      console.error('Error al crear snapshot de ejercicios:', exerciseError.message);
      throw new Error('Error al preparar los ejercicios de la sesión');
    }
  }

  const createdSession = await getTrainingSessionById(String(session.id));

  if (!createdSession) {
    throw new Error('No se pudo recuperar la sesión creada');
  }

  return createdSession;
};

const syncSessionCounters = async (
  sessionId: string,
): Promise<RutinaTrainingSession> => {
  const supabase = getSupabaseServerClient();

  const { data: exercises, error: exercisesError } = await supabase
    .from('rutina_training_session_exercise')
    .select('completed')
    .eq('session_id', sessionId);

  if (exercisesError) {
    console.error('Error al recalcular progreso:', exercisesError.message);
    throw new Error('Error al recalcular progreso de sesión');
  }

  const total = exercises?.length ?? 0;
  const completed = (exercises ?? []).filter((exercise) => Boolean(exercise.completed)).length;
  const progress = calculateProgressPercent(completed, total);

  const { error: updateError } = await supabase
    .from('rutina_training_session')
    .update({
      total_exercises: total,
      completed_exercises: completed,
      progress_percent: progress,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('Error al actualizar progreso de sesión:', updateError.message);
    throw new Error('Error al actualizar progreso de sesión');
  }

  const session = await getTrainingSessionById(sessionId);

  if (!session) {
    throw new Error('No se pudo recuperar la sesión actualizada');
  }

  return session;
};

export const updateTrainingSessionExercise = async (
  user: JwtUser,
  sessionId: string,
  input: RutinaTrainingSessionExerciseUpdateInput,
): Promise<RutinaTrainingSession> => {
  const supabase = getSupabaseServerClient();
  const session = await assertSessionAccess(user, sessionId);

  if (session.status !== ACTIVE_SESSION_STATUS) {
    throw new Error('Solo se pueden modificar ejercicios de una sesión activa');
  }

  const exerciseKey = cleanText(input.exercise_key);

  if (!exerciseKey) {
    throw new Error('El ejercicio es obligatorio');
  }

  const normalizedExercise = input.exercise
    ? normalizeExerciseInput({ ...input.exercise, exercise_key: exerciseKey })
    : null;

  if (normalizedExercise) {
    const { error } = await supabase
      .from('rutina_training_session_exercise')
      .upsert(
        {
          session_id: sessionId,
          ...normalizedExercise,
          completed: Boolean(input.completed),
          completed_at: input.completed ? new Date().toISOString() : null,
        },
        { onConflict: 'session_id,exercise_key' },
      );

    if (error) {
      console.error('Error al actualizar ejercicio de sesión:', error.message);
      throw new Error('Error al actualizar el ejercicio de la sesión');
    }
  } else {
    const { data: updated, error } = await supabase
      .from('rutina_training_session_exercise')
      .update({
        completed: Boolean(input.completed),
        completed_at: input.completed ? new Date().toISOString() : null,
      })
      .eq('session_id', sessionId)
      .eq('exercise_key', exerciseKey)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Error al actualizar ejercicio de sesión:', error.message);
      throw new Error('Error al actualizar el ejercicio de la sesión');
    }

    if (!updated) {
      throw new Error('No se encontró el ejercicio dentro de la sesión');
    }
  }

  return syncSessionCounters(sessionId);
};

export const finishTrainingSession = async (
  user: JwtUser,
  sessionId: string,
): Promise<RutinaTrainingSession> => {
  const supabase = getSupabaseServerClient();
  const session = await assertSessionAccess(user, sessionId);

  if (session.status !== ACTIVE_SESSION_STATUS) {
    throw new Error('La sesión ya no está activa');
  }

  const { error } = await supabase
    .from('rutina_training_session')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      duration_minutes: calculateDurationMinutes(session.started_at),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error al finalizar sesión:', error.message);
    throw new Error('Error al finalizar la sesión de entrenamiento');
  }

  return syncSessionCounters(sessionId);
};

export const cancelTrainingSession = async (
  user: JwtUser,
  sessionId: string,
): Promise<RutinaTrainingSession> => {
  const supabase = getSupabaseServerClient();
  const session = await assertSessionAccess(user, sessionId);

  if (session.status !== ACTIVE_SESSION_STATUS) {
    throw new Error('La sesión ya no está activa');
  }

  const { error } = await supabase
    .from('rutina_training_session')
    .update({
      status: 'cancelled',
      finished_at: new Date().toISOString(),
      duration_minutes: calculateDurationMinutes(session.started_at),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error al cancelar sesión:', error.message);
    throw new Error('Error al cancelar la sesión de entrenamiento');
  }

  const updatedSession = await getTrainingSessionById(sessionId);

  if (!updatedSession) {
    throw new Error('No se pudo recuperar la sesión cancelada');
  }

  return updatedSession;
};
