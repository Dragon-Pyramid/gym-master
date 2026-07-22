export type AiGeneratedContentLocale = 'es' | 'en';

export type AiGeneratedContentLocaleInput = unknown;

export function normalizeAiGeneratedContentLocale(value: AiGeneratedContentLocaleInput): AiGeneratedContentLocale {
  return value === true || value === 'en' ? 'en' : 'es';
}

export function aiGeneratedContentTx(
  localeOrFlag: AiGeneratedContentLocaleInput,
  es: string,
  en: string,
): string {
  return normalizeAiGeneratedContentLocale(localeOrFlag) === 'en' ? en : es;
}

export function isAiGeneratedContentEnglish(localeOrFlag: AiGeneratedContentLocaleInput): boolean {
  return normalizeAiGeneratedContentLocale(localeOrFlag) === 'en';
}

const EXACT_TRANSLATIONS_EN: Record<string, string> = {
  'Unauthorized': 'Unauthorized',
  'Error inesperado': 'Unexpected error',
  'Error desconocido': 'Unknown error',
  'Error desconocido.': 'Unknown error.',
  'Debe enviar socio_id, objetivo, fecha_inicio y fecha_fin.': 'You must send socio_id, goal, start date, and end date.',
  'RAG Coach no configurado': 'RAG Coach is not configured',
  'RAG_ENABLED=false.': 'RAG_ENABLED=false.',
  'Falta GITHUB_TOKEN.': 'Missing GITHUB_TOKEN.',
  'Falta OPENAI_API_KEY.': 'Missing OPENAI_API_KEY.',
  'RAG desactivado. Se usa generación local segura.': 'RAG is disabled. Safe local generation is used.',
  'RAG configurado parcialmente. Se usa generación local segura.': 'RAG is partially configured. Safe local generation is used.',
  'No se pudo consultar el RAG. Se usa generación local segura.': 'The RAG service could not be queried. Safe local generation is used.',
  'No se recuperaron ejercicios desde el RAG. Se usó el generador formal de Gym Master con fallback seguro.': 'No exercises were retrieved from RAG. Gym Master\'s formal generator was used with a safe fallback.',
  'No se pudo recuperar contexto RAG de rutinas. Se usa generación formal segura.': 'Routine RAG context could not be retrieved. Safe formal generation is used.',
  'Error desconocido al consultar RAG interno': 'Unknown error while querying internal RAG',
  'Error desconocido del RAG Coach': 'Unknown RAG Coach error',
  'Error desconocido al consultar RAG de rutinas.': 'Unknown error while querying routine RAG.',
  'Error desconocido al consultar RAG de rutinas': 'Unknown error while querying routine RAG',
  'No se recuperaron reglas nutricionales desde el RAG. Se usó el generador formal de Gym Master con fallback seguro.': 'No nutrition rules were retrieved from RAG. Gym Master\'s formal generator was used with a safe fallback.',
  'No se pudo consultar el RAG de dietas. Se usa generación local segura.': 'The diet RAG service could not be queried. Safe local generation is used.',
  'No se pudo recuperar contexto RAG de dietas. Se usa generación formal segura.': 'Diet RAG context could not be retrieved. Safe formal generation is used.',
  'Error desconocido al consultar RAG de dietas.': 'Unknown error while querying diet RAG.',
  'Error desconocido al consultar RAG de dietas': 'Unknown error while querying diet RAG',
  'Error desconocido al consultar RAG de evolución física': 'Unknown error while querying physical evolution RAG',
  'RAG desactivado. Se usa análisis local seguro.': 'RAG is disabled. Safe local analysis is used.',
  'RAG configurado parcialmente. Se usa análisis local seguro.': 'RAG is partially configured. Safe local analysis is used.',
  'No se pudo consultar el RAG de evolución física. Se usa análisis local seguro.': 'The physical evolution RAG service could not be queried. Safe local analysis is used.',
  'No se recuperaron referencias desde el RAG. Se utilizó análisis local seguro sobre la evolución física registrada.': 'No references were retrieved from RAG. Safe local analysis was used on the recorded physical evolution.',
  'Debe indicar socio_id o usar un usuario socio autenticado.': 'You must provide socio_id or use an authenticated member user.',
  'Hay un solo registro disponible. Se necesita al menos una segunda medición para analizar tendencia.': 'There is only one available record. At least a second measurement is needed to analyze the trend.',
  'La tendencia principal muestra mejora de composición corporal, especialmente por reducción de cintura/grasa.': 'The main trend shows body composition improvement, especially through waist/body fat reduction.',
  'La tendencia principal sugiere ganancia de masa muscular con control de perímetro abdominal.': 'The main trend suggests muscle mass gain with controlled abdominal circumference.',
  'La tendencia principal muestra aumento de peso y cintura. Conviene revisar alimentación, adherencia y estímulo de entrenamiento.': 'The main trend shows increased weight and waist size. Nutrition, adherence, and training stimulus should be reviewed.',
  'La tendencia muestra descenso de peso con posible pérdida de masa muscular. Conviene revisar ingesta proteica y entrenamiento de fuerza.': 'The trend shows weight loss with possible muscle mass loss. Protein intake and strength training should be reviewed.',
  'La evolución es mixta o estable. Conviene sostener mediciones periódicas y ajustar según objetivo.': 'Evolution is mixed or stable. Keep periodic measurements and adjust according to the member\'s goal.',
  'Registrar al menos una segunda medición en 2 a 4 semanas para poder comparar tendencia real.': 'Record at least a second measurement in 2 to 4 weeks to compare a real trend.',
  'Mantener el plan actual si el objetivo incluye recomposición o reducción de grasa, porque la cintura viene bajando.': 'Keep the current plan if the goal includes recomposition or fat reduction, because waist measurements are decreasing.',
  'Sostener entrenamiento de fuerza progresivo y descanso, ya que la masa muscular muestra mejora.': 'Maintain progressive strength training and recovery, since muscle mass shows improvement.',
  'Revisar exceso calórico, calidad de alimentos y volumen semanal de actividad, porque subieron peso y cintura.': 'Review calorie surplus, food quality, and weekly activity volume, because weight and waist measurements increased.',
  'Evitar recortes agresivos de calorías y reforzar proteína/entrenamiento de fuerza para proteger masa muscular.': 'Avoid aggressive calorie cuts and reinforce protein intake/strength training to protect muscle mass.',
  'Continuar con mediciones periódicas, adherencia a rutina y ajustes moderados según el objetivo del socio.': 'Continue with periodic measurements, routine adherence, and moderate adjustments according to the member\'s goal.',
  'Validar cambios importantes de dieta o entrenamiento con profesional si existen lesiones, dolor o antecedentes clínicos.': 'Validate major diet or training changes with a professional if there are injuries, pain, or clinical history.',
  'Se detectó posible lesión/dolor. Evitar progresiones agresivas y validar con profesional.': 'Possible injury/pain detected. Avoid aggressive progressions and validate with a professional.',
  'Se detectó posible señal cardiovascular o síntoma sensible. Requiere evaluación profesional antes de intensificar entrenamiento.': 'Possible cardiovascular signal or sensitive symptom detected. Professional evaluation is required before intensifying training.',
  'Cambio de peso brusco en pocos días. Revisar medición, hidratación y salud general.': 'Abrupt weight change in a few days. Review the measurement, hydration, and general health.',
  'La dieta generada es orientativa y no reemplaza la evaluación de un nutricionista matriculado.': 'The generated diet is for guidance only and does not replace evaluation by a licensed nutritionist.',
  'Ante enfermedades, embarazo, medicación, diabetes, hipertensión, trastornos alimentarios o condiciones clínicas, consultar con un profesional de salud antes de aplicar cambios alimentarios.': 'In case of illness, pregnancy, medication, diabetes, hypertension, eating disorders, or clinical conditions, consult a healthcare professional before applying dietary changes.',
  'No se deben prometer resultados físicos o médicos garantizados desde el sistema.': 'The system must not promise guaranteed physical or medical results.',
  'El análisis de evolución física es orientativo y no reemplaza la evaluación de un médico, nutricionista o entrenador profesional.': 'The physical evolution analysis is for guidance only and does not replace evaluation by a doctor, nutritionist, or professional trainer.',
  'Los cambios bruscos de peso, dolor, mareos, fatiga extrema o síntomas físicos deben ser evaluados por un profesional de salud.': 'Abrupt weight changes, pain, dizziness, extreme fatigue, or physical symptoms should be evaluated by a healthcare professional.',
  'Las sugerencias del RAG Coach deben aplicarse de forma progresiva y con supervisión cuando existan antecedentes clínicos o lesiones.': 'RAG Coach suggestions should be applied progressively and with supervision when there is clinical history or injury.',
  'Condición relacionada con diabetes/glucemia informada. Requiere revisión profesional.': 'Diabetes/glucose-related condition reported. Professional review is required.',
  'Condición cardiovascular o presión alta informada. Requiere revisión profesional.': 'Cardiovascular condition or high blood pressure reported. Professional review is required.',
  'Embarazo o lactancia informado. Requiere indicación profesional específica.': 'Pregnancy or breastfeeding reported. Specific professional guidance is required.',
  'Condición renal/hepática informada. Requiere revisión profesional.': 'Kidney/liver condition reported. Professional review is required.',
  'Posible trastorno de la conducta alimentaria informado. No generar indicaciones restrictivas sin profesional.': 'Possible eating disorder reported. Do not generate restrictive guidance without a professional.',
};

export function translateAiGeneratedTechnicalText(
  text: unknown,
  localeOrFlag: AiGeneratedContentLocaleInput,
): string {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (!value || !isAiGeneratedContentEnglish(localeOrFlag)) return value;

  const exact = EXACT_TRANSLATIONS_EN[value];
  if (exact) return exact;

  if (value.startsWith('match_rag_chunks falló:')) {
    return value.replace('match_rag_chunks falló:', 'match_rag_chunks failed:');
  }

  if (value.startsWith('Advertencias técnicas:')) {
    return value.replace('Advertencias técnicas:', 'Technical warnings:');
  }

  return value;
}

export function translateAiGeneratedTechnicalList<T extends unknown[] | undefined>(
  values: T,
  localeOrFlag: AiGeneratedContentLocaleInput,
): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => translateAiGeneratedTechnicalText(value, localeOrFlag)).filter(Boolean);
}

export function buildAiDietBaseDisclaimers(localeOrFlag: AiGeneratedContentLocaleInput): string[] {
  return [
    aiGeneratedContentTx(
      localeOrFlag,
      'La dieta generada es orientativa y no reemplaza la evaluación de un nutricionista matriculado.',
      'The generated diet is for guidance only and does not replace evaluation by a licensed nutritionist.',
    ),
    aiGeneratedContentTx(
      localeOrFlag,
      'Ante enfermedades, embarazo, medicación, diabetes, hipertensión, trastornos alimentarios o condiciones clínicas, consultar con un profesional de salud antes de aplicar cambios alimentarios.',
      'In case of illness, pregnancy, medication, diabetes, hypertension, eating disorders, or clinical conditions, consult a healthcare professional before applying dietary changes.',
    ),
    aiGeneratedContentTx(
      localeOrFlag,
      'No se deben prometer resultados físicos o médicos garantizados desde el sistema.',
      'The system must not promise guaranteed physical or medical results.',
    ),
  ];
}

export function buildAiEvolutionBaseDisclaimers(localeOrFlag: AiGeneratedContentLocaleInput): string[] {
  return [
    aiGeneratedContentTx(
      localeOrFlag,
      'El análisis de evolución física es orientativo y no reemplaza la evaluación de un médico, nutricionista o entrenador profesional.',
      'The physical evolution analysis is for guidance only and does not replace evaluation by a doctor, nutritionist, or professional trainer.',
    ),
    aiGeneratedContentTx(
      localeOrFlag,
      'Los cambios bruscos de peso, dolor, mareos, fatiga extrema o síntomas físicos deben ser evaluados por un profesional de salud.',
      'Abrupt weight changes, pain, dizziness, extreme fatigue, or physical symptoms should be evaluated by a healthcare professional.',
    ),
    aiGeneratedContentTx(
      localeOrFlag,
      'Las sugerencias del RAG Coach deben aplicarse de forma progresiva y con supervisión cuando existan antecedentes clínicos o lesiones.',
      'RAG Coach suggestions should be applied progressively and with supervision when there is clinical history or injury.',
    ),
  ];
}
