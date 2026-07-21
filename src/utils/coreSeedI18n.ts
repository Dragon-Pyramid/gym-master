import type { GymMasterLocale } from "@/i18n/config";

export type CoreSeedLocale = GymMasterLocale | "es" | "en" | string | boolean | null | undefined;

export type LocalizedCoreSeedItem = {
  codigo?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
};

export function isCoreSeedEnglish(localeOrFlag: CoreSeedLocale): boolean {
  return localeOrFlag === true || localeOrFlag === "en";
}

export function normalizeCoreSeedKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9/ ]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function coreSeedTx(localeOrFlag: CoreSeedLocale, es: string, en: string): string {
  return isCoreSeedEnglish(localeOrFlag) ? en : es;
}

const CORE_OBJECTIVE_LABELS_EN: Record<string, string> = {
  volumen: "Volume",
  volume: "Volume",
  definicion: "Definition",
  definition: "Definition",
  "bajar de peso": "Lose weight",
  adelgazar: "Lose weight",
  "perder peso": "Lose weight",
  "perdida de peso": "Weight loss",
  fuerza: "Strength",
  "aumentar fuerza": "Increase strength",
  resistencia: "Endurance",
  "mejorar resistencia": "Improve endurance",
  rehabilitacion: "Rehabilitation",
  "rehabilitacion fisica": "Physical rehabilitation",
  salud: "Health",
  "salud general": "General health",
  "preparacion para competencia": "Competition preparation",
  "condicion fisica postparto": "Postpartum physical conditioning",
  "control del estres": "Stress management",
  hipertrofia: "Hypertrophy",
  "ganancia muscular": "Muscle gain",
  "ganar masa muscular": "Muscle gain",
  mantenimiento: "Maintenance",
  tonificacion: "Toning",
};

const CORE_LEVEL_LABELS_EN: Record<string, string> = {
  inicial: "Beginner",
  principiante: "Beginner",
  beginner: "Beginner",
  intermedio: "Intermediate",
  intermediate: "Intermediate",
  avanzado: "Advanced",
  advanced: "Advanced",
  experto: "Expert",
};

const CORE_DAY_LABELS_EN: Record<string, string> = {
  lunes: "Monday",
  martes: "Tuesday",
  miercoles: "Wednesday",
  jueves: "Thursday",
  viernes: "Friday",
  sabado: "Saturday",
  domingo: "Sunday",
};

const CORE_MUSCLE_GROUP_LABELS_EN: Record<string, string> = {
  pecho: "Chest",
  espalda: "Back",
  piernas: "Legs",
  pierna: "Legs",
  biceps: "Biceps",
  triceps: "Triceps",
  hombros: "Shoulders",
  hombro: "Shoulders",
  abdomen: "Core",
  abdominales: "Core",
  core: "Core",
  gluteos: "Glutes",
  gemelos: "Calves",
  pantorrillas: "Calves",
  cardio: "Cardio",
  "pecho y toque de hombros": "Chest and shoulder taps",
  "espalda y toque de hombros": "Back and shoulder taps",
  "biceps y triceps": "Biceps and triceps",
  "piernas y abdominales": "Legs and abs",
  "pecho y triceps": "Chest and triceps",
  "espalda y biceps": "Back and biceps",
  "hombros y abdominales": "Shoulders and abs",
};

const CORE_MEAL_TITLE_LABELS_EN: Record<string, string> = {
  desayuno: "Breakfast",
  "colacion media manana": "Mid-morning snack",
  almuerzo: "Lunch",
  "colacion siesta": "Afternoon snack",
  merienda: "Snack",
  "colacion tarde": "Late-afternoon snack",
  cena: "Dinner",
};

const CORE_MEAL_HINTS_EN: Record<string, string> = {
  desayuno: "First fuel of the day",
  "colacion media manana": "Keeps energy steady between meals",
  almuerzo: "Main meal of the day",
  "colacion siesta": "Light support for the afternoon",
  merienda: "Energy before or after training",
  "colacion tarde": "Helps control hunger and cravings",
  cena: "End the day without excess",
};

const CORE_DIET_PLAN_LABELS_EN: Record<string, string> = {
  "sin dieta asignada": "No diet assigned",
  "dieta sin nombre": "Untitled diet",
  "plan alimentario": "Meal plan",
  "plan automatico": "Automatic plan",
};

const CORE_FOOD_ITEM_LABELS_EN: Record<string, string> = {
  "tortilla de avena con banana 200gr avena 8 claras 2 yemas 1 banana edulcorante vainilla":
    "Oat and banana pancake: 200 g oats, 8 egg whites, 2 yolks, 1 banana, sweetener, vanilla",
  "1 scoop de proteina con 200ml de leche": "1 scoop of protein with 200 ml milk",
  "200gr carne magra arroz integral 30gr queso": "200 g lean meat, brown rice, 30 g cheese",
  "media porcion de tortilla de avena con banana": "Half portion of oat and banana pancake",
  "fruta banana punado de nueces": "Fruit (banana) + handful of nuts",
  "200gr carne magra arroz integral": "200 g lean meat, brown rice",
  "pan integral con mantequilla de mani 2 rebanadas 2 huevos revueltos": "Whole-wheat bread with peanut butter (2 slices) + 2 scrambled eggs",
  "batido con banana leche avena y proteina": "Shake with banana, milk, oats, and protein",
  "carne roja 200gr arroz integral ensalada verde": "Red meat (200 g) + brown rice + green salad",
  "1 sandwich integral de atun con verduras": "1 whole-wheat tuna sandwich with vegetables",
  "tostadas con queso port salut y jamon cocido": "Toast with Port Salut cheese and cooked ham",
  "1 scoop proteina nueces": "1 scoop of protein + walnuts",
  "pollo al horno 200gr pure de papas ensalada cruda": "Baked chicken (200 g) + mashed potatoes + raw salad",
  "claras revueltas 6 con espinaca 1 rodaja pan integral 1 kiwi": "Scrambled egg whites (6) with spinach + 1 slice whole-wheat bread + 1 kiwi",
  "1 yogurt descremado 10 almendras": "1 low-fat yogurt + 10 almonds",
  "150gr pechuga de pollo ensalada verde 1 batata 200gr": "150 g chicken breast + green salad + 1 sweet potato (200 g)",
  "1 manzana 1 huevo duro": "1 apple + 1 hard-boiled egg",
  "infusion 2 tostadas integrales con queso untable light": "Infusion + 2 whole-wheat toasts with light spreadable cheese",
  "proteina en agua 1 scoop": "Protein in water (1 scoop)",
  "pescado al horno 150gr ensalada cruda 1/2 taza arroz integral": "Baked fish (150 g) + raw salad + 1/2 cup brown rice",
  "infusion 1 tostada integral con palta 1 huevo duro": "Infusion + 1 whole-wheat toast with avocado + 1 hard-boiled egg",
  "1 manzana o fruta fresca 1 punado de semillas": "1 apple or fresh fruit + 1 handful of seeds",
  "ensalada mixta 120gr pechuga de pollo 1 huevo": "Mixed salad + 120 g chicken breast + 1 egg",
  "gelatina sin azucar 1 yogurt descremado": "Sugar-free gelatin + 1 low-fat yogurt",
  "te verde 1 tostada con queso untable light": "Green tea + 1 toast with light spreadable cheese",
  "1 scoop de proteina en agua": "1 scoop of protein in water",
  "pescado 150gr a la plancha ensalada cocida medio palta": "Grilled fish (150 g) + cooked salad + half an avocado",
};

const CORE_CATALOG_LABELS_EN: Record<string, { name: string; description?: string }> = {
  "medio_pago:efectivo": { name: "Cash" },
  "medio_pago:transferencia": { name: "Bank transfer" },
  "medio_pago:tarjeta_credito": { name: "Credit card" },
  "medio_pago:tarjeta_debito": { name: "Debit card" },
  "medio_pago:mercado_pago": { name: "Mercado Pago" },
  "medio_pago:stripe": { name: "Stripe" },

  "tipo_gasto:sueldos": { name: "Salaries" },
  "tipo_gasto:mantenimiento": { name: "Maintenance" },
  "tipo_gasto:servicios": { name: "Utilities" },
  "tipo_gasto:insumos": { name: "Supplies" },
  "tipo_gasto:alquiler": { name: "Rent" },
  "tipo_gasto:impuestos": { name: "Taxes" },
  "tipo_gasto:marketing": { name: "Marketing" },
  "tipo_gasto:equipamiento": { name: "Equipment" },
  "tipo_gasto:otros": { name: "Other" },

  "tipo_ingreso:cuotas": { name: "Membership fees" },
  "tipo_ingreso:ventas": { name: "Sales" },
  "tipo_ingreso:servicios": { name: "Services" },
  "tipo_ingreso:clases_especiales": { name: "Special classes" },
  "tipo_ingreso:promociones": { name: "Promotions" },
  "tipo_ingreso:otros": { name: "Other" },

  "categoria_producto:bebidas": { name: "Beverages" },
  "categoria_producto:suplementos": { name: "Supplements" },
  "categoria_producto:indumentaria": { name: "Apparel" },
  "categoria_producto:accesorios": { name: "Accessories" },
  "categoria_producto:snacks": { name: "Snacks" },
  "categoria_producto:higiene": { name: "Hygiene" },
  "categoria_producto:otros": { name: "Other" },

  "tipo_equipamiento:cardio": { name: "Cardio" },
  "tipo_equipamiento:fuerza": { name: "Strength" },
  "tipo_equipamiento:peso_libre": { name: "Free weights" },
  "tipo_equipamiento:accesorios": { name: "Accessories" },
  "tipo_equipamiento:funcional": { name: "Functional" },
  "tipo_equipamiento:otros": { name: "Other" },

  "tipo_mantenimiento:preventivo": { name: "Preventive" },
  "tipo_mantenimiento:correctivo": { name: "Corrective" },
  "tipo_mantenimiento:limpieza_profunda": { name: "Deep cleaning" },
  "tipo_mantenimiento:lubricacion": { name: "Lubrication" },
  "tipo_mantenimiento:calibracion": { name: "Calibration" },
  "tipo_mantenimiento:seguridad": { name: "Safety" },
  "tipo_mantenimiento:inspeccion_visual": { name: "Visual inspection" },
  "tipo_mantenimiento:otros": { name: "Other" },

  "empleado_area:recepcion": { name: "Front desk" },
  "empleado_area:administracion": { name: "Administration" },
  "empleado_area:entrenamiento": { name: "Training" },
  "empleado_area:mantenimiento": { name: "Maintenance" },
  "empleado_area:limpieza": { name: "Cleaning" },
  "empleado_area:bar_snack": { name: "Bar / snack" },
  "empleado_area:ventas": { name: "Sales" },

  "empleado_tipo_contratacion:mensual": { name: "Monthly" },
  "empleado_tipo_contratacion:por_hora": { name: "Hourly" },
  "empleado_tipo_contratacion:jornal": { name: "Daily wage" },
  "empleado_tipo_contratacion:eventual": { name: "Temporary" },
  "empleado_tipo_contratacion:pasantia": { name: "Internship" },
  "empleado_tipo_contratacion:monotributo_servicio": { name: "Contractor / external service" },
  "empleado_tipo_contratacion:otro": { name: "Other" },

  "empleado_puesto_responsabilidad:recepcion_caja": { name: "Front desk and cash register" },
  "empleado_puesto_responsabilidad:administracion": { name: "Administration" },
  "empleado_puesto_responsabilidad:entrenador_sala": { name: "Floor trainer" },
  "empleado_puesto_responsabilidad:personal_trainer": { name: "Personal trainer" },
  "empleado_puesto_responsabilidad:instructor_clases": { name: "Class instructor" },
  "empleado_puesto_responsabilidad:mantenimiento_preventivo": { name: "Preventive maintenance" },
  "empleado_puesto_responsabilidad:mantenimiento_correctivo": { name: "Corrective maintenance" },
  "empleado_puesto_responsabilidad:limpieza_general": { name: "General cleaning" },
  "empleado_puesto_responsabilidad:bar_snack": { name: "Bar / snack" },
  "empleado_puesto_responsabilidad:seguridad": { name: "Security / access control" },

  "empleado_turno:manana": { name: "Morning" },
  "empleado_turno:tarde": { name: "Afternoon" },
  "empleado_turno:noche": { name: "Night" },
  "empleado_turno:rotativo": { name: "Rotating" },
  "empleado_turno:fin_de_semana": { name: "Weekend" },
  "empleado_turno:a_convenir": { name: "To be agreed" },

  "comercial_canal_venta:admin": { name: "Administration" },
  "comercial_canal_venta:kiosco": { name: "POS / Kiosk" },
  "comercial_canal_venta:socio_web": { name: "Member web" },
  "comercial_canal_venta:app_mobile": { name: "Mobile app" },

  "comercial_grupo_cliente:general": { name: "General" },
  "comercial_grupo_cliente:socio_activo": { name: "Active member" },
  "comercial_grupo_cliente:socio_premium": { name: "Premium member" },
  "comercial_grupo_cliente:no_socio": { name: "Non-member / visitor" },
  "comercial_grupo_cliente:empleado": { name: "Employee / internal" },

  "comercial_ubicacion_stock:deposito": { name: "Storage" },
  "comercial_ubicacion_stock:kiosco": { name: "Kiosk" },
  "comercial_ubicacion_stock:recepcion": { name: "Front desk" },
  "comercial_ubicacion_stock:heladera": { name: "Fridge" },
  "comercial_ubicacion_stock:vitrina": { name: "Display case" },
  "comercial_ubicacion_stock:sala_profesores": { name: "Teachers' room" },

  "gimnasio_condicion_fiscal:responsable_inscripto": { name: "VAT registered" },
  "gimnasio_condicion_fiscal:monotributo": { name: "Monotributo" },
  "gimnasio_condicion_fiscal:consumidor_final": { name: "Final consumer" },
  "gimnasio_condicion_fiscal:exento": { name: "Tax exempt" },
  "gimnasio_condicion_fiscal:no_informado": { name: "Not informed" },
};

function translateFromMap(
  value: string | null | undefined,
  localeOrFlag: CoreSeedLocale,
  map: Record<string, string>,
  fallbackEs: string,
  fallbackEn = fallbackEs,
) {
  const raw = String(value ?? "").trim();
  if (!raw) return isCoreSeedEnglish(localeOrFlag) ? fallbackEn : fallbackEs;
  if (!isCoreSeedEnglish(localeOrFlag)) return raw;
  return map[normalizeCoreSeedKey(raw)] ?? raw;
}

export function translateCoreObjective(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  return translateFromMap(value, localeOrFlag, CORE_OBJECTIVE_LABELS_EN, "No definido", "Not defined");
}

export function translateCoreLevel(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  return translateFromMap(value, localeOrFlag, CORE_LEVEL_LABELS_EN, "No definido", "Not defined");
}

export function translateCoreDayLabel(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  return translateFromMap(value, localeOrFlag, CORE_DAY_LABELS_EN, "Día", "Day");
}

export function translateCoreMuscleGroup(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  return translateFromMap(value, localeOrFlag, CORE_MUSCLE_GROUP_LABELS_EN, "-");
}

export function translateCoreMealTitle(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  return translateFromMap(value, localeOrFlag, CORE_MEAL_TITLE_LABELS_EN, "Comida", "Meal");
}

export function translateCoreMealHint(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  const raw = String(value ?? "").trim();
  if (!raw || !isCoreSeedEnglish(localeOrFlag)) return "";
  return CORE_MEAL_HINTS_EN[normalizeCoreSeedKey(raw)] ?? "";
}

export function translateCoreDietPlanName(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  const raw = String(value ?? "").trim();
  if (!raw) return isCoreSeedEnglish(localeOrFlag) ? "Untitled diet" : "Dieta sin nombre";
  if (!isCoreSeedEnglish(localeOrFlag)) return raw;

  const key = normalizeCoreSeedKey(raw);
  if (CORE_DIET_PLAN_LABELS_EN[key]) return CORE_DIET_PLAN_LABELS_EN[key];

  if (key.startsWith("plan automatico")) {
    const suffix = raw.replace(/^Plan autom[aá]tico\s*-?\s*/i, "").trim();
    return suffix ? "Automatic plan - " + translateCoreObjective(suffix, true) : "Automatic plan";
  }

  return raw;
}

export function translateCoreWorkoutPlanName(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  const raw = String(value ?? "").trim();
  if (!raw) return isCoreSeedEnglish(localeOrFlag) ? "Untitled routine" : "Rutina sin nombre";
  if (!isCoreSeedEnglish(localeOrFlag)) return raw;

  if (/^Rutina auto\s+/i.test(raw)) return raw.replace(/^Rutina auto\s+/i, "Auto routine ");
  if (/^Rutina semana\s+/i.test(raw)) return raw.replace(/^Rutina semana\s+/i, "Routine week ");
  if (/^Rutina #/i.test(raw)) return raw.replace(/^Rutina #/i, "Routine #");

  return raw;
}

export function translateCoreFoodItem(value: string | null | undefined, localeOrFlag: CoreSeedLocale) {
  const raw = String(value ?? "").trim();
  if (!raw || !isCoreSeedEnglish(localeOrFlag)) return raw;
  return CORE_FOOD_ITEM_LABELS_EN[normalizeCoreSeedKey(raw)] ?? raw;
}

export function getCoreCatalogTranslation(catalogKey: string, itemOrCode: LocalizedCoreSeedItem | string | null | undefined) {
  const code = typeof itemOrCode === "string" ? itemOrCode : itemOrCode?.codigo;
  if (!code) return null;
  return CORE_CATALOG_LABELS_EN[`${catalogKey}:${normalizeCoreSeedKey(code).replace(/\s+/g, "_")}`] ?? null;
}

export function translateCoreCatalogName(
  catalogKey: string,
  itemOrCode: LocalizedCoreSeedItem | string | null | undefined,
  fallbackName: string | null | undefined,
  localeOrFlag: CoreSeedLocale,
) {
  const raw = String(fallbackName ?? "").trim();
  if (!isCoreSeedEnglish(localeOrFlag)) return raw;
  return getCoreCatalogTranslation(catalogKey, itemOrCode)?.name ?? raw;
}

export function translateCoreCatalogDescription(
  catalogKey: string,
  itemOrCode: LocalizedCoreSeedItem | string | null | undefined,
  fallbackDescription: string | null | undefined,
  localeOrFlag: CoreSeedLocale,
) {
  const raw = String(fallbackDescription ?? "").trim();
  if (!isCoreSeedEnglish(localeOrFlag)) return raw;
  return getCoreCatalogTranslation(catalogKey, itemOrCode)?.description ?? raw;
}
