export function normalizeDietI18nKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const GOAL_TRANSLATIONS: Record<string, string> = {
  volumen: "Volume",
  volume: "Volume",
  definicion: "Definition",
  definition: "Definition",
  "bajar de peso": "Lose weight",
  "perdida de peso": "Weight loss",
  "pérdida de peso": "Weight loss",
  mantenimiento: "Maintenance",
  "ganancia muscular": "Muscle gain",
  hipertrofia: "Hypertrophy",
  salud: "Health",
  "salud general": "General health",
};

const DIET_PLAN_NAME_TRANSLATIONS: Record<string, string> = {
  "sin dieta asignada": "No diet assigned",
  "dieta sin nombre": "Untitled diet",
  "plan alimentario": "Meal plan",
  "plan automatico": "Automatic plan",
  "plan automático": "Automatic plan",
};

const MEAL_TITLE_TRANSLATIONS: Record<string, string> = {
  desayuno: "Breakfast",
  "colacion media manana": "Mid-morning snack",
  "colación media mañana": "Mid-morning snack",
  almuerzo: "Lunch",
  "colacion siesta": "Afternoon snack",
  "colación siesta": "Afternoon snack",
  merienda: "Snack",
  "colacion tarde": "Late-afternoon snack",
  "colación tarde": "Late-afternoon snack",
  cena: "Dinner",
};

const MEAL_HINT_TRANSLATIONS: Record<string, string> = {
  desayuno: "First fuel of the day",
  "colacion media manana": "Keeps energy steady between meals",
  almuerzo: "Main meal of the day",
  "colacion siesta": "Light support for the afternoon",
  merienda: "Energy before or after training",
  "colacion tarde": "Helps control hunger and cravings",
  cena: "End the day without excess",
};

const FOOD_TRANSLATIONS: Record<string, string> = {
  "tortilla de avena con banana, 200gr avena, 8 claras, 2 yemas, 1 banana, edulcorante, vainilla":
    "Oat and banana pancake: 200 g oats, 8 egg whites, 2 yolks, 1 banana, sweetener, vanilla",
  "1 scoop de proteina con 200ml de leche": "1 scoop of protein with 200 ml milk",
  "1 scoop de proteína con 200ml de leche": "1 scoop of protein with 200 ml milk",
  "200gr carne magra, arroz integral, 30gr queso": "200 g lean meat, brown rice, 30 g cheese",
  "media porcion de tortilla de avena con banana": "Half portion of oat and banana pancake",
  "media porción de tortilla de avena con banana": "Half portion of oat and banana pancake",
  "fruta (banana) + punado de nueces": "Fruit (banana) + handful of nuts",
  "fruta (banana) + puñado de nueces": "Fruit (banana) + handful of nuts",
  "200gr carne magra, arroz integral": "200 g lean meat, brown rice",
};

export function translateDietGoal(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!raw) return isEnglish ? "Not defined" : "No definido";
  if (!isEnglish) return raw;
  return GOAL_TRANSLATIONS[normalizeDietI18nKey(raw)] ?? raw;
}

export function translateDietPlanName(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!raw) return isEnglish ? "Untitled diet" : "Dieta sin nombre";
  if (!isEnglish) return raw;

  const key = normalizeDietI18nKey(raw);
  if (DIET_PLAN_NAME_TRANSLATIONS[key]) return DIET_PLAN_NAME_TRANSLATIONS[key];

  if (key.startsWith("plan automatico") || key.startsWith("plan automático")) {
    const suffix = raw.replace(/^Plan autom[aá]tico\s*-?\s*/i, "").trim();
    return suffix ? `Automatic plan - ${translateDietGoal(suffix, true)}` : "Automatic plan";
  }

  return raw;
}

export function translateMealTitle(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!raw) return isEnglish ? "Meal" : "Comida";
  if (!isEnglish) return raw;
  return MEAL_TITLE_TRANSLATIONS[normalizeDietI18nKey(raw)] ?? raw;
}

export function translateMealHint(key: string | null | undefined, isEnglish: boolean) {
  const raw = String(key ?? "").trim();
  if (!raw) return "";
  if (!isEnglish) return "";
  return MEAL_HINT_TRANSLATIONS[normalizeDietI18nKey(raw)] ?? "";
}

export function translateFoodItem(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!raw || !isEnglish) return raw;
  const key = normalizeDietI18nKey(raw);
  return FOOD_TRANSLATIONS[key] ?? raw;
}

export function translateDietProgressLabel(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!isEnglish) return raw;
  switch (normalizeDietI18nKey(raw)) {
    case "seguimiento manual":
      return "Manual tracking";
    case "plan proximo":
      return "Upcoming plan";
    case "plan próximo":
      return "Upcoming plan";
    case "plan finalizado":
      return "Finished plan";
    case "plan vigente":
      return "Active plan";
    default:
      return raw;
  }
}

export function translateDietText(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!raw || !isEnglish) return raw;
  return (
    translateDietPlanName(raw, true) ||
    translateDietGoal(raw, true) ||
    translateMealTitle(raw, true) ||
    translateFoodItem(raw, true) ||
    raw
  );
}
