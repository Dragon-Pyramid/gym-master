import type { GymMasterLocale } from '@/i18n/config';

export type HelpManualRole = 'admin' | 'socio';

type LocalizedText = Record<GymMasterLocale, string>;

export type HelpManualEntry = {
  id: string;
  manualRole: HelpManualRole;
  category: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  keywords: LocalizedText;
  steps: Record<GymMasterLocale, string[]>;
  tips?: Record<GymMasterLocale, string[]>;
  relatedPaths?: string[];
};

export type LocalizedHelpManualEntry = {
  id: string;
  manualRole: HelpManualRole;
  category: string;
  title: string;
  summary: string;
  keywords: string;
  steps: string[];
  tips: string[];
  relatedPaths: string[];
};

export function resolveHelpManualRole(role?: string | null): HelpManualRole | null {
  if (role === 'socio') return 'socio';
  if (role === 'admin' || role === 'usuario') return 'admin';
  return null;
}

function localize(text: LocalizedText, locale: GymMasterLocale) {
  return text[locale] ?? text.es;
}

export function localizeHelpManualEntry(
  entry: HelpManualEntry,
  locale: GymMasterLocale,
): LocalizedHelpManualEntry {
  return {
    id: entry.id,
    manualRole: entry.manualRole,
    category: localize(entry.category, locale),
    title: localize(entry.title, locale),
    summary: localize(entry.summary, locale),
    keywords: localize(entry.keywords, locale),
    steps: entry.steps[locale] ?? entry.steps.es,
    tips: entry.tips ? entry.tips[locale] ?? entry.tips.es : [],
    relatedPaths: entry.relatedPaths ?? [],
  };
}

export function getHelpManualEntries(
  manualRole: HelpManualRole,
  locale: GymMasterLocale,
) {
  return HELP_MANUAL_ENTRIES
    .filter((entry) => entry.manualRole === manualRole)
    .map((entry) => localizeHelpManualEntry(entry, locale));
}

export function getHelpManualCategories(
  entries: LocalizedHelpManualEntry[],
) {
  return Array.from(new Set(entries.map((entry) => entry.category)));
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterHelpManualEntries({
  entries,
  query,
  category,
  allCategoryLabel,
}: {
  entries: LocalizedHelpManualEntry[];
  query: string;
  category: string;
  allCategoryLabel: string;
}) {
  const normalizedQuery = normalizeSearchText(query);

  return entries.filter((entry) => {
    const matchesCategory =
      category === allCategoryLabel || entry.category === category;

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const searchable = normalizeSearchText([
      entry.title,
      entry.summary,
      entry.category,
      entry.keywords,
      ...entry.steps,
      ...entry.tips,
      ...entry.relatedPaths,
    ].join(' '));

    return searchable.includes(normalizedQuery);
  });
}

export function getHelpCenterCopy(locale: GymMasterLocale, manualRole: HelpManualRole) {
  const isAdminManual = manualRole === 'admin';

  const copy = {
    es: {
      pageTitle: 'Centro de ayuda',
      eyebrow: isAdminManual ? 'Manual de administrador' : 'Manual de socio',
      title: isAdminManual ? 'Ayuda para administrar Gym Master' : 'Ayuda para socios de Gym Master',
      description: isAdminManual
        ? 'Consultá funcionalidades administrativas, operación comercial, socios, pagos, reportes y configuración del gimnasio.'
        : 'Consultá cómo usar tu cuenta, pagos, rutinas, dietas, actividades, ficha médica y mensajes del gimnasio.',
      searchPlaceholder: 'Buscar en tu manual...',
      all: 'Todo el manual',
      steps: 'Pasos recomendados',
      tips: 'Consejos rápidos',
      relatedPaths: 'Rutas relacionadas',
      noResultsTitle: 'Sin resultados para esa búsqueda',
      noResultsDescription: 'Probá con otra palabra clave o elegí otra sección del índice.',
      indexTitle: 'Índice del manual',
      accessNoticeTitle: 'Acceso protegido por rol',
      accessNoticeDescription: isAdminManual
        ? 'Estás viendo el manual administrativo. Los socios no pueden acceder a este contenido desde su cuenta.'
        : 'Estás viendo el manual de socios. Este manual no muestra contenido administrativo.',
      unavailableTitle: 'Manual no disponible',
      unavailableDescription: 'Tu rol actual no tiene un manual online asociado.',
      quickSearch: 'Búsqueda puntual',
      moduleCount: 'funcionalidades indexadas',
    },
    en: {
      pageTitle: 'Help Center',
      eyebrow: isAdminManual ? 'Administrator manual' : 'Member manual',
      title: isAdminManual ? 'Help for managing Gym Master' : 'Help for Gym Master members',
      description: isAdminManual
        ? 'Review administrative features, commercial operations, members, payments, reports and gym configuration.'
        : 'Review how to use your account, payments, routines, diets, activities, medical record and gym messages.',
      searchPlaceholder: 'Search your manual...',
      all: 'Full manual',
      steps: 'Recommended steps',
      tips: 'Quick tips',
      relatedPaths: 'Related routes',
      noResultsTitle: 'No results for that search',
      noResultsDescription: 'Try another keyword or choose another section from the index.',
      indexTitle: 'Manual index',
      accessNoticeTitle: 'Role-protected access',
      accessNoticeDescription: isAdminManual
        ? 'You are viewing the administrator manual. Members cannot access this content from their accounts.'
        : 'You are viewing the member manual. This manual does not show administrative content.',
      unavailableTitle: 'Manual unavailable',
      unavailableDescription: 'Your current role does not have an associated online manual.',
      quickSearch: 'Quick search',
      moduleCount: 'indexed features',
    },
  } as const;

  return copy[locale] ?? copy.es;
}

export const HELP_MANUAL_ENTRIES: HelpManualEntry[] = [
  {
    id: 'admin-dashboard-overview',
    manualRole: 'admin',
    category: { es: 'Inicio y operación diaria', en: 'Home and daily operations' },
    title: { es: 'Leer el dashboard administrativo', en: 'Read the administrator dashboard' },
    summary: {
      es: 'Usá el inicio como panel ejecutivo para revisar estado del gimnasio, alertas, actividad reciente y accesos rápidos.',
      en: 'Use Home as an executive panel to review gym status, alerts, recent activity and quick access cards.',
    },
    keywords: {
      es: 'inicio dashboard administrador alertas resumen indicadores',
      en: 'home dashboard administrator alerts summary indicators',
    },
    steps: {
      es: [
        'Entrá a Inicio desde el menú lateral.',
        'Revisá las tarjetas superiores para detectar alertas o métricas críticas.',
        'Usá los accesos rápidos para ir a socios, pagos, comercial o soporte según la necesidad.',
      ],
      en: [
        'Open Home from the sidebar.',
        'Review the top cards to detect alerts or critical metrics.',
        'Use quick access cards to open members, payments, commercial operations or support as needed.',
      ],
    },
    tips: {
      es: ['Si algo no carga, refrescá la página y verificá tu sesión antes de repetir operaciones.'],
      en: ['If something does not load, refresh the page and verify your session before repeating operations.'],
    },
    relatedPaths: ['/dashboard'],
  },
  {
    id: 'admin-members',
    manualRole: 'admin',
    category: { es: 'Socios', en: 'Members' },
    title: { es: 'Gestionar socios', en: 'Manage members' },
    summary: {
      es: 'Alta, consulta y mantenimiento de información de socios, estado de cuenta, actividad y datos de contacto.',
      en: 'Create, review and maintain member information, account status, activity and contact data.',
    },
    keywords: {
      es: 'socios miembros alta editar ficha contacto estado cuenta',
      en: 'members create edit profile contact account status',
    },
    steps: {
      es: [
        'Abrí Personal y Operaciones > Socios.',
        'Usá el buscador para localizar al socio por nombre, documento o email.',
        'Entrá en Ver o Editar para revisar datos, estado, pagos o información complementaria.',
      ],
      en: [
        'Open Personal and Operations > Members.',
        'Use search to find the member by name, document or email.',
        'Open View or Edit to review data, status, payments or additional information.',
      ],
    },
    relatedPaths: ['/dashboard/socios'],
  },
  {
    id: 'admin-payments-fees',
    manualRole: 'admin',
    category: { es: 'Pagos y cuotas', en: 'Payments and fees' },
    title: { es: 'Controlar cuotas y pagos', en: 'Control fees and payments' },
    summary: {
      es: 'Registrá pagos, revisá cuotas, morosidad, recibos y trazabilidad de cobros del gimnasio.',
      en: 'Register payments and review fees, overdue accounts, receipts and payment traceability.',
    },
    keywords: {
      es: 'pagos cuotas recibos deuda morosidad cobrar comprobante',
      en: 'payments fees receipts debt overdue charge receipt',
    },
    steps: {
      es: [
        'Entrá a Finanzas y BI > Pagos o Cuotas.',
        'Filtrá por socio, estado, fecha o medio de pago.',
        'Generá recibos o revisá comprobantes antes de confirmar cambios sensibles.',
      ],
      en: [
        'Open Finance and BI > Payments or Fees.',
        'Filter by member, status, date or payment method.',
        'Generate receipts or review supporting documents before confirming sensitive changes.',
      ],
    },
    relatedPaths: ['/dashboard/pagos', '/dashboard/cuotas'],
  },
  {
    id: 'admin-commercial-pos',
    manualRole: 'admin',
    category: { es: 'Comercial y stock', en: 'Commercial and stock' },
    title: { es: 'Usar POS/Kiosco', en: 'Use POS/Kiosk' },
    summary: {
      es: 'Vendé productos, servicios y packs desde el kiosco, validando stock, pagos y ticket imprimible.',
      en: 'Sell products, services and packs from the kiosk while validating stock, payments and printable tickets.',
    },
    keywords: {
      es: 'pos kiosco ventas productos servicios packs scanner ticket stock',
      en: 'pos kiosk sales products services packs scanner ticket stock',
    },
    steps: {
      es: [
        'Abrí Comercial y Stock > POS / Kiosco.',
        'Seleccioná ubicación de venta y buscá producto, servicio o pack.',
        'Agregá ítems al carrito, revisá descuentos y confirmá la venta.',
        'Imprimí el ticket o consultá la operación desde Ventas.',
      ],
      en: [
        'Open Commercial and Stock > POS / Kiosk.',
        'Select the sale location and search for a product, service or pack.',
        'Add items to the cart, review discounts and confirm the sale.',
        'Print the ticket or review the operation from Sales.',
      ],
    },
    tips: {
      es: ['Si usás scanner móvil, conectalo desde el QR del POS antes de escanear.'],
      en: ['When using the mobile scanner, connect it from the POS QR before scanning.'],
    },
    relatedPaths: ['/dashboard/comercial/kiosco', '/dashboard/ventas'],
  },
  {
    id: 'admin-stock-replenishment',
    manualRole: 'admin',
    category: { es: 'Comercial y stock', en: 'Commercial and stock' },
    title: { es: 'Revisar stock y reposición', en: 'Review stock and replenishment' },
    summary: {
      es: 'Controlá stock crítico, ubicaciones, movimientos, compras y recepción de cantidades.',
      en: 'Control critical stock, locations, movements, purchases and receiving quantities.',
    },
    keywords: {
      es: 'stock ledger compras reposicion proveedores movimientos ubicaciones recibir cantidades',
      en: 'stock ledger purchases replenishment suppliers movements locations receive quantities',
    },
    steps: {
      es: [
        'Entrá a Stock Ledger para ver alertas y movimientos.',
        'Abrí Compras / Reposición para generar o recibir órdenes.',
        'Usá Productos para revisar stock mínimo, costo, precio y proveedor.',
      ],
      en: [
        'Open Stock Ledger to review alerts and movements.',
        'Open Purchases / Replenishment to create or receive orders.',
        'Use Products to review minimum stock, cost, price and supplier.',
      ],
    },
    relatedPaths: ['/dashboard/comercial/stock-ledger', '/dashboard/comercial/compras-reposicion', '/dashboard/productos'],
  },
  {
    id: 'admin-training-health',
    manualRole: 'admin',
    category: { es: 'Entrenamiento y salud', en: 'Training and health' },
    title: { es: 'Gestionar rutinas, dietas y evolución física', en: 'Manage routines, diets and physical evolution' },
    summary: {
      es: 'Administrá planes de entrenamiento, dietas, mediciones físicas y seguimiento del socio.',
      en: 'Manage training plans, diets, physical measurements and member follow-up.',
    },
    keywords: {
      es: 'rutinas dietas evolucion fisica entrenador socio mediciones',
      en: 'routines diets physical evolution trainer member measurements',
    },
    steps: {
      es: [
        'Usá Gestión de Rutinas para crear o asignar planes.',
        'Usá Gestión de Dietas para preparar planes alimentarios.',
        'Entrá a Gestión Evolución Física para comparar mediciones y progreso.',
      ],
      en: [
        'Use Routine Management to create or assign plans.',
        'Use Diet Management to prepare food plans.',
        'Open Physical Evolution Management to compare measurements and progress.',
      ],
    },
    relatedPaths: ['/dashboard/gestor-rutinas', '/dashboard/gestor-dietas', '/dashboard/gestor-evolucion-fisica'],
  },
  {
    id: 'admin-communication-support',
    manualRole: 'admin',
    category: { es: 'Comunicación y soporte', en: 'Communication and support' },
    title: { es: 'Atender mensajes, avisos y soporte', en: 'Handle messages, notices and support' },
    summary: {
      es: 'Revisá mensajes de socios, enviá avisos y usá soporte Dragon Pyramid para consultas técnicas.',
      en: 'Review member messages, send notices and use Dragon Pyramid support for technical questions.',
    },
    keywords: {
      es: 'mensajes avisos notificaciones soporte dragon pyramid socios consultas',
      en: 'messages notices notifications support dragon pyramid members questions',
    },
    steps: {
      es: [
        'Entrá a Mensajes Socios para revisar consultas pendientes.',
        'Usá Avisos o Notificaciones para comunicar novedades.',
        'Abrí Soporte Dragon Pyramid para incidencias técnicas o dudas del sistema.',
      ],
      en: [
        'Open Member messages to review pending questions.',
        'Use Notices or Notifications to communicate updates.',
        'Open Dragon Pyramid support for technical issues or system questions.',
      ],
    },
    relatedPaths: ['/dashboard/mensajes-admin', '/dashboard/avisos', '/dashboard/notificaciones', '/dashboard/soporte-dragon-pyramid'],
  },
  {
    id: 'admin-settings-users',
    manualRole: 'admin',
    category: { es: 'Configuración', en: 'Configuration' },
    title: { es: 'Configurar gimnasio, usuarios y permisos', en: 'Configure gym, users and permissions' },
    summary: {
      es: 'Mantené datos del gimnasio, parametrización, usuarios internos y permisos de menú.',
      en: 'Maintain gym data, parametrization, internal users and menu permissions.',
    },
    keywords: {
      es: 'configuracion gimnasio usuarios permisos parametrizacion roles',
      en: 'configuration gym users permissions parametrization roles',
    },
    steps: {
      es: [
        'Entrá a Datos del Gimnasio para branding, datos legales y configuración base.',
        'Usá Usuarios para crear accesos internos y definir permisos.',
        'Usá Parametrización para catálogos y valores operativos.',
      ],
      en: [
        'Open Gym Data for branding, legal data and base configuration.',
        'Use Users to create internal access and define permissions.',
        'Use Parametrization for catalogs and operational values.',
      ],
    },
    relatedPaths: ['/dashboard/gimnasio-parametrizacion', '/dashboard/usuarios', '/dashboard/parametrizacion'],
  },
  {
    id: 'socio-home',
    manualRole: 'socio',
    category: { es: 'Inicio', en: 'Home' },
    title: { es: 'Usar tu inicio de socio', en: 'Use your member home' },
    summary: {
      es: 'Consultá estado de cuota, rutina, dieta, mensajes, actividades y accesos rápidos desde tu inicio.',
      en: 'Review fee status, routine, diet, messages, activities and quick access cards from your home.',
    },
    keywords: {
      es: 'inicio socio dashboard cuota rutina dieta mensajes actividades',
      en: 'member home dashboard fee routine diet messages activities',
    },
    steps: {
      es: [
        'Entrá a Inicio desde el menú.',
        'Revisá tus tarjetas principales y alertas.',
        'Abrí el módulo que necesitás desde los accesos rápidos.',
      ],
      en: [
        'Open Home from the menu.',
        'Review your main cards and alerts.',
        'Open the module you need from the quick access cards.',
      ],
    },
    relatedPaths: ['/dashboard'],
  },
  {
    id: 'socio-payments',
    manualRole: 'socio',
    category: { es: 'Pagos', en: 'Payments' },
    title: { es: 'Pagar cuota y consultar recibos', en: 'Pay fee and review receipts' },
    summary: {
      es: 'Consultá tu estado de cuenta, pagá cuotas y descargá recibos disponibles.',
      en: 'Review your account status, pay fees and download available receipts.',
    },
    keywords: {
      es: 'pagar cuota recibo historial deuda mi cuenta comprobante',
      en: 'pay fee receipt history debt my account proof',
    },
    steps: {
      es: [
        'Entrá a Mi Gimnasio > Pagar cuota para revisar opciones de pago.',
        'Usá Historial de pagos para consultar pagos anteriores y recibos.',
        'Conservá el comprobante cuando el sistema lo genere o lo solicite el gimnasio.',
      ],
      en: [
        'Open My Gym > Pay fee to review payment options.',
        'Use Payment history to review previous payments and receipts.',
        'Keep the receipt when the system generates it or the gym requests it.',
      ],
    },
    relatedPaths: ['/dashboard/mi-cuenta/pagar-cuota', '/dashboard/mi-cuenta/historial-pagos'],
  },
  {
    id: 'socio-routines-diets',
    manualRole: 'socio',
    category: { es: 'Rutinas y dietas', en: 'Routines and diets' },
    title: { es: 'Consultar rutina y dieta', en: 'Review routine and diet' },
    summary: {
      es: 'Accedé a tus planes asignados o usá los asistentes para consultar entrenamiento y alimentación.',
      en: 'Access your assigned plans or use assistants to review training and nutrition.',
    },
    keywords: {
      es: 'rutina dieta asistente coach entrenamiento alimentacion ejercicios',
      en: 'routine diet assistant coach training nutrition exercises',
    },
    steps: {
      es: [
        'Abrí Asistente de Rutinas para revisar o solicitar orientación de entrenamiento.',
        'Abrí Asistente de Dietas para consultar tu plan alimentario.',
        'Usá Coach IA para preguntas integradas sobre rutina, dieta o evolución.',
      ],
      en: [
        'Open Routine assistant to review or request training guidance.',
        'Open Diet assistant to review your food plan.',
        'Use AI Coach for integrated questions about routine, diet or evolution.',
      ],
    },
    relatedPaths: ['/dashboard/rutinas/asistente', '/dashboard/dietas', '/dashboard/coach'],
  },
  {
    id: 'socio-activities',
    manualRole: 'socio',
    category: { es: 'Actividades', en: 'Activities' },
    title: { es: 'Consultar e inscribirte a actividades', en: 'Review and enroll in activities' },
    summary: {
      es: 'Mirá clases disponibles, cupos, horarios y enviá solicitudes de inscripción.',
      en: 'Review available classes, capacity, schedules and send enrollment requests.',
    },
    keywords: {
      es: 'actividades clases turnos cupos inscripcion agenda',
      en: 'activities classes shifts slots enrollment agenda',
    },
    steps: {
      es: [
        'Entrá a Actividades desde el menú.',
        'Revisá días, horarios, cupos y estado de inscripción.',
        'Enviá la solicitud y esperá confirmación si la actividad requiere aprobación.',
      ],
      en: [
        'Open Activities from the menu.',
        'Review days, schedules, available slots and enrollment status.',
        'Send the request and wait for confirmation if the activity requires approval.',
      ],
    },
    relatedPaths: ['/dashboard/actividades'],
  },
  {
    id: 'socio-health',
    manualRole: 'socio',
    category: { es: 'Salud', en: 'Health' },
    title: { es: 'Completar ficha médica', en: 'Complete medical record' },
    summary: {
      es: 'Cargá datos preventivos, antecedentes, lesiones y adjuntos médicos si el gimnasio los solicita.',
      en: 'Load preventive data, background information, injuries and medical attachments if requested by the gym.',
    },
    keywords: {
      es: 'ficha medica salud antecedentes lesiones adjuntos apto medico',
      en: 'medical record health background injuries attachments medical clearance',
    },
    steps: {
      es: [
        'Entrá a Mi Salud > Ficha Médica.',
        'Completá los datos solicitados y revisá que estén actualizados.',
        'Adjuntá documentación si corresponde y guardá los cambios.',
      ],
      en: [
        'Open My Health > Medical record.',
        'Complete the requested data and verify it is up to date.',
        'Attach documents if needed and save changes.',
      ],
    },
    relatedPaths: ['/dashboard/ficha-medica'],
  },
  {
    id: 'socio-progress',
    manualRole: 'socio',
    category: { es: 'Progreso físico', en: 'Physical progress' },
    title: { es: 'Revisar evolución física', en: 'Review physical evolution' },
    summary: {
      es: 'Compará mediciones, fotos y cambios físicos para seguir tu progreso.',
      en: 'Compare measurements, photos and physical changes to track your progress.',
    },
    keywords: {
      es: 'evolucion fisica medidas fotos progreso comparacion cuerpo',
      en: 'physical evolution measurements photos progress comparison body',
    },
    steps: {
      es: [
        'Abrí Evolución Física desde Mi Coach.',
        'Seleccioná mediciones disponibles para comparar fechas.',
        'Revisá indicadores y observaciones registradas.',
      ],
      en: [
        'Open Physical evolution from My Coach.',
        'Select available measurements to compare dates.',
        'Review indicators and saved notes.',
      ],
    },
    relatedPaths: ['/dashboard/evolucion-fisica'],
  },
  {
    id: 'socio-messages-profile',
    manualRole: 'socio',
    category: { es: 'Cuenta y comunicación', en: 'Account and communication' },
    title: { es: 'Mensajes, perfil y preferencias', en: 'Messages, profile and preferences' },
    summary: {
      es: 'Enviá consultas al gimnasio, actualizá tu perfil y ajustá preferencias de idioma o visualización.',
      en: 'Send questions to the gym, update your profile and adjust language or display preferences.',
    },
    keywords: {
      es: 'mensajes perfil preferencias idioma soporte cuenta consulta',
      en: 'messages profile preferences language support account question',
    },
    steps: {
      es: [
        'Usá Mensajes para comunicar dudas o consultas al gimnasio.',
        'Entrá a Perfil para revisar tus datos personales.',
        'Entrá a Preferencias para ajustar idioma o experiencia visual.',
      ],
      en: [
        'Use Messages to send questions to the gym.',
        'Open Profile to review your personal data.',
        'Open Preferences to adjust language or display experience.',
      ],
    },
    relatedPaths: ['/dashboard/mensajes', '/dashboard/perfil', '/dashboard/settings/preferences'],
  },
];
