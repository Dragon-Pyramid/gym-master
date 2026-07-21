import {
  normalizeCoreSeedKey,
  translateCoreDietPlanName,
  translateCoreFoodItem,
  translateCoreMealHint,
  translateCoreMealTitle,
  translateCoreObjective,
} from "@/utils/coreSeedI18n";

export function normalizeDietI18nKey(value: string) {
  return normalizeCoreSeedKey(value);
}

export function translateDietGoal(value: string | null | undefined, isEnglish: boolean) {
  return translateCoreObjective(value, isEnglish);
}

export function translateDietPlanName(value: string | null | undefined, isEnglish: boolean) {
  return translateCoreDietPlanName(value, isEnglish);
}

export function translateMealTitle(value: string | null | undefined, isEnglish: boolean) {
  return translateCoreMealTitle(value, isEnglish);
}

export function translateMealHint(key: string | null | undefined, isEnglish: boolean) {
  return translateCoreMealHint(key, isEnglish);
}

export function translateFoodItem(value: string | null | undefined, isEnglish: boolean) {
  return translateCoreFoodItem(value, isEnglish);
}

export function translateDietProgressLabel(value: string | null | undefined, isEnglish: boolean) {
  const raw = String(value ?? "").trim();
  if (!isEnglish) return raw;

  switch (normalizeDietI18nKey(raw)) {
    case "seguimiento manual":
      return "Manual tracking";
    case "plan proximo":
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

  const translatedPlan = translateDietPlanName(raw, true);
  if (translatedPlan !== raw) return translatedPlan;

  const translatedGoal = translateDietGoal(raw, true);
  if (translatedGoal !== raw) return translatedGoal;

  const translatedMeal = translateMealTitle(raw, true);
  if (translatedMeal !== raw) return translatedMeal;

  const translatedFood = translateFoodItem(raw, true);
  if (translatedFood !== raw) return translatedFood;

  return raw;
}
