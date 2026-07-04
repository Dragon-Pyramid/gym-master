export type RutinaTrainingSessionStatus = 'in_progress' | 'completed' | 'cancelled';

export interface RutinaTrainingSessionExerciseInput {
  exercise_key: string;
  day_name: string;
  exercise_index: number;
  exercise_name: string;
  muscle_group?: string | null;
  series?: string | number | null;
  repetitions?: string | number | null;
  rest?: string | number | null;
  payload?: Record<string, unknown> | null;
}

export interface RutinaTrainingSessionExercise {
  id: string;
  session_id: string;
  exercise_key: string;
  day_name: string;
  exercise_index: number;
  exercise_name: string;
  muscle_group: string | null;
  series: string | null;
  repetitions: string | null;
  rest: string | null;
  completed: boolean;
  completed_at: string | null;
  payload: Record<string, unknown> | null;
  creado_en: string;
  actualizado_en: string;
}

export interface RutinaTrainingSession {
  id: string;
  id_socio: string;
  id_rutina: number;
  started_at: string;
  finished_at: string | null;
  status: RutinaTrainingSessionStatus;
  total_exercises: number;
  completed_exercises: number;
  progress_percent: number;
  duration_minutes: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  creado_en: string;
  actualizado_en: string;
  exercises?: RutinaTrainingSessionExercise[];
}

export interface RutinaTrainingSessionStartInput {
  id_rutina: number;
  exercises: RutinaTrainingSessionExerciseInput[];
  notes?: string | null;
}

export interface RutinaTrainingSessionExerciseUpdateInput {
  exercise_key: string;
  completed: boolean;
  exercise?: RutinaTrainingSessionExerciseInput | null;
}
