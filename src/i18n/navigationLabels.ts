export type NavigationTranslator = (key: string) => string;

export const NAVIGATION_GROUP_KEYS: Record<string, string> = {
  General: 'sidebar.groups.general',
  'Mi Gimnasio': 'sidebar.groups.myGym',
  'Mi Coach': 'sidebar.groups.myCoach',
  'Mi Salud': 'sidebar.groups.myHealth',
  Comunicación: 'sidebar.groups.communication',
  'Personal y Operaciones': 'sidebar.groups.personalOperations',
  Infraestructura: 'sidebar.groups.infrastructure',
  'Entrenamiento y Salud': 'sidebar.groups.trainingHealth',
  'Comercial y Stock': 'sidebar.groups.commercialStock',
  'Finanzas y BI': 'sidebar.groups.financeBi',
  'IA y RAG': 'sidebar.groups.aiRag',
  'Comunicación y Soporte': 'sidebar.groups.communicationSupport',
  'Administración del Sistema': 'sidebar.groups.systemAdministration',
  'Configuración Personal': 'sidebar.groups.personalSettings',
  'Configuración personal': 'sidebar.groups.personalSettings',
};

export const NAVIGATION_ITEM_KEYS: Record<string, string> = {
  Inicio: 'sidebar.items.home',
  Home: 'sidebar.items.home',
  'Control de Asistencia': 'sidebar.items.attendanceControl',
  'Pagar cuota': 'sidebar.items.payFee',
  'Historial de pagos': 'sidebar.items.paymentHistory',
  'Cuota - Precio': 'sidebar.items.feePrice',
  Rutina: 'sidebar.items.routine',
  Rutinas: 'navigationTitles.routines',
  Dieta: 'sidebar.items.diet',
  Dietas: 'navigationTitles.diets',
  'Coach IA': 'sidebar.items.aiCoach',
  'Asistente de Rutinas': 'sidebar.items.routineAssistant',
  'Asistente de Dietas': 'sidebar.items.dietAssistant',
  'Evolución Física': 'sidebar.items.physicalEvolution',
  'Evolución física': 'sidebar.items.physicalEvolution',
  'Ficha Médica': 'sidebar.items.medicalRecord',
  'Ficha médica': 'sidebar.items.medicalRecord',
  Mensajes: 'sidebar.items.messages',
  Socios: 'sidebar.items.members',
  Actividades: 'sidebar.items.activities',
  Empleados: 'sidebar.items.employees',
  Sueldos: 'sidebar.items.salaries',
  Asistencias: 'sidebar.items.attendances',
  'Salida / Aforo': 'sidebar.items.exitCapacity',
  'Mantenimiento Edilicio': 'sidebar.items.buildingMaintenance',
  'Lector QR/barra': 'sidebar.items.qrBarcodeReader',
  'Etiquetas QR': 'sidebar.items.qrLabels',
  Equipamientos: 'sidebar.items.equipment',
  'Preventivos Equipos': 'sidebar.items.equipmentPreventive',
  'Preventivos de Equipamientos': 'navigationTitles.equipmentPreventiveDetail',
  'Gestión de Rutinas': 'sidebar.items.routineManagement',
  'Gestor de Rutinas': 'navigationTitles.routineManager',
  'Gestión de Dietas': 'sidebar.items.dietManagement',
  'Gestor de Dietas': 'navigationTitles.dietManager',
  'Gestión Evolución Física': 'sidebar.items.physicalEvolutionManagement',
  'Gestor de Evolución Física': 'navigationTitles.physicalEvolutionManager',
  'Media de Ejercicios': 'sidebar.items.exerciseMedia',
  'Comercial / Kiosco': 'sidebar.items.commercialKiosk',
  'POS / Kiosco': 'sidebar.items.posKiosk',
  'Caja / Cashup': 'sidebar.items.cashup',
  'Compras / Reposición': 'sidebar.items.purchasesReplenishment',
  Ventas: 'sidebar.items.sales',
  Compras: 'sidebar.items.purchases',
  Productos: 'sidebar.items.products',
  'Stock Ledger': 'sidebar.items.stockLedger',
  'Códigos / Etiquetas': 'sidebar.items.codesLabels',
  'Códigos y etiquetas comerciales': 'navigationTitles.commercialCodesLabels',
  'BI Packs / Promos': 'sidebar.items.packPromosBi',
  Proveedores: 'sidebar.items.suppliers',
  Servicios: 'sidebar.items.services',
  'Servicios / Packs / Promos': 'sidebar.items.servicesPacksPromos',
  'Servicios / Packs / Promociones': 'sidebar.items.servicesPacksPromos',
  Pagos: 'sidebar.items.payments',
  Cuotas: 'sidebar.items.fees',
  'Gastos / Egresos': 'sidebar.items.expenses',
  'Finanzas / BI': 'sidebar.items.financeBi',
  'BI Socios / Promociones': 'sidebar.items.membersPromotionsBi',
  'Ranking / Bonificación': 'sidebar.items.rankingBonus',
  'Ranking y bonificación mensual': 'navigationTitles.monthlyRankingBonus',
  'RAG Corpus': 'sidebar.items.ragCorpus',
  Notificaciones: 'sidebar.items.notifications',
  'Mensajes Socios': 'sidebar.items.memberMessages',
  'Mensajes de socios': 'sidebar.items.memberMessages',
  Avisos: 'sidebar.items.notices',
  'Ayuda / Manuales': 'sidebar.items.helpManuals',
  'Soporte Dragon Pyramid': 'sidebar.items.dragonSupport',
  'Respaldo / Exportación': 'sidebar.items.backupExport',
  Usuarios: 'sidebar.items.users',
  'Datos del Gimnasio': 'sidebar.items.gymData',
  Parametrización: 'sidebar.items.parametrization',
  Perfil: 'sidebar.items.profile',
  'Mi perfil': 'header.profile',
  Preferencias: 'sidebar.items.preferences',
  'Mis actividades': 'navigationTitles.myActivities',
  'Detalles de Venta': 'navigationTitles.saleDetails',
  'Detalle de Rutina': 'navigationTitles.routineDetail',
  'Detalle de Evolución Física': 'navigationTitles.physicalEvolutionDetail',
  'Detalle de Dieta': 'navigationTitles.dietDetail',
  'Alertas de stock comercial': 'navigationTitles.commercialStockAlerts',
};

export const NAVIGATION_TITLE_KEYS: Record<string, string> = {
  ...NAVIGATION_GROUP_KEYS,
  ...NAVIGATION_ITEM_KEYS,
};

function normalizeNavigationLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNormalizedMap(source: Record<string, string>) {
  return Object.entries(source).reduce<Record<string, string>>((acc, [label, key]) => {
    acc[normalizeNavigationLabel(label)] = key;
    return acc;
  }, {});
}

const NORMALIZED_GROUP_KEYS = buildNormalizedMap(NAVIGATION_GROUP_KEYS);
const NORMALIZED_ITEM_KEYS = buildNormalizedMap(NAVIGATION_ITEM_KEYS);
const NORMALIZED_TITLE_KEYS = buildNormalizedMap(NAVIGATION_TITLE_KEYS);

export function translateNavigationLabel(
  value: string,
  keys: Record<string, string>,
  normalizedKeys: Record<string, string>,
  t: NavigationTranslator,
) {
  const key = keys[value] ?? normalizedKeys[normalizeNavigationLabel(value)];
  return key ? t(key) : value;
}

export function translateNavigationGroup(value: string, t: NavigationTranslator) {
  return translateNavigationLabel(value, NAVIGATION_GROUP_KEYS, NORMALIZED_GROUP_KEYS, t);
}

export function translateNavigationItem(value: string, t: NavigationTranslator) {
  return translateNavigationLabel(value, NAVIGATION_ITEM_KEYS, NORMALIZED_ITEM_KEYS, t);
}

export function translateNavigationTitle(value: string, t: NavigationTranslator) {
  return translateNavigationLabel(value, NAVIGATION_TITLE_KEYS, NORMALIZED_TITLE_KEYS, t);
}
