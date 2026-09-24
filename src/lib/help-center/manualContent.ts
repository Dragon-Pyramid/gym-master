import type { GymMasterLocale } from '@/i18n/config';
import { canAccessDashboardPath } from '@/lib/permissions/menuPermissions';

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
  stepsByPath?: Record<string, Record<GymMasterLocale, string[]>>;
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

const PARTIAL_MANUAL_ROUTE_LABELS: Record<string, LocalizedText> = {
  "/dashboard/finanzas": {
    es: "Finanzas / BI",
    en: "Finance / BI",
  },
  "/dashboard/otros-gastos": {
    es: "Gastos / Egresos",
    en: "Expenses / Outgoings",
  },
  "/dashboard/equipamientos": {
    es: "Equipamientos",
    en: "Equipment",
  },
  "/dashboard/infraestructura/equipamientos/preventivos": {
    es: "Preventivos Equipos",
    en: "Equipment Preventive Maintenance",
  },
  "/dashboard/infraestructura/etiquetas-qr": {
    es: "Etiquetas QR",
    en: "QR Labels",
  },
  "/dashboard/infraestructura/lector-qr-barra": {
    es: "Lector QR/barra",
    en: "QR/Barcode Reader",
  },
  "/dashboard/proveedores": {
    es: "Proveedores",
    en: "Suppliers",
  },
  "/dashboard/compras": {
    es: "Compras",
    en: "Purchases",
  },
  "/dashboard/comercial/stock-ledger": {
    es: "Stock Ledger",
    en: "Stock Ledger",
  },
  "/dashboard/comercial/compras-reposicion": {
    es: "Compras / Reposición",
    en: "Purchases / Replenishment",
  },
  "/dashboard/productos": {
    es: "Productos",
    en: "Products",
  },
  "/dashboard/comercial/kiosco": {
    es: "POS / Kiosco",
    en: "POS / Kiosk",
  },
  "/dashboard/ventas": {
    es: "Ventas",
    en: "Sales",
  },
  "/dashboard/asistencias": {
    es: "Asistencias",
    en: "Attendance",
  },
  "/dashboard/asistencias/aforo": {
    es: "Salida / Aforo",
    en: "Exit / Capacity",
  },
  "/dashboard/empleados": {
    es: "Empleados",
    en: "Employees",
  },
  "/dashboard/empleados-sueldos": {
    es: "Sueldos",
    en: "Salaries",
  },
  "/dashboard/gestor-rutinas": {
    es: "Gestión de Rutinas",
    en: "Routine Management",
  },
  "/dashboard/gestor-dietas": {
    es: "Gestión de Dietas",
    en: "Diet Management",
  },
  "/dashboard/gestor-evolucion-fisica": {
    es: "Gestión Evolución Física",
    en: "Physical Evolution Management",
  },
  "/dashboard/pagos": {
    "es": "Pagos",
    "en": "Payments"
  },
  "/dashboard/cuotas": {
    "es": "Cuotas",
    "en": "Fees"
  },
  "/dashboard/comercial/servicios-promociones": {
    "es": "Servicios, packs y promociones",
    "en": "Services, packs and promotions"
  },
  "/dashboard/comercial/codigos-etiquetas": {
    "es": "Códigos y etiquetas",
    "en": "Codes and labels"
  },
  "/dashboard/comercial/pack-analytics": {
    "es": "Analítica de packs",
    "en": "Pack analytics"
  },
  "/dashboard/comercial": {
    "es": "Panel comercial",
    "en": "Commercial dashboard"
  },
  "/dashboard/servicios": {
    "es": "Servicios",
    "en": "Services"
  },
  "/dashboard/bi-socios-demografia-promociones": {
    "es": "BI de socios",
    "en": "Member BI"
  },
  "/dashboard/socios-ranking-bonificacion": {
    "es": "Ranking y bonificación",
    "en": "Ranking and bonuses"
  },
  "/dashboard/mensajes-admin": {
    "es": "Mensajes de socios",
    "en": "Member messages"
  },
  "/dashboard/avisos": {
    "es": "Avisos",
    "en": "Notices"
  },
  "/dashboard/notificaciones": {
    "es": "Notificaciones",
    "en": "Notifications"
  },
  "/dashboard/soporte-dragon-pyramid": {
    "es": "Soporte Dragon Pyramid",
    "en": "Dragon Pyramid support"
  }
};

export function getHelpManualEntries(
  manualRole: HelpManualRole,
  locale: GymMasterLocale,
  access?: {
    userRole?: string | null;
    menuPermissions?: string[] | null;
  },
): LocalizedHelpManualEntry[] {
  const isInternalUser =
    manualRole === 'admin' && access?.userRole === 'usuario';

  return HELP_MANUAL_ENTRIES
    .filter((entry) => entry.manualRole === manualRole)
    .flatMap((entry): LocalizedHelpManualEntry[] => {
      if (!isInternalUser) {
        return [localizeHelpManualEntry(entry, locale)];
      }

      const articlePaths = entry.relatedPaths ?? [];
      const visiblePaths = articlePaths.filter((path) =>
        canAccessDashboardPath(
          'usuario',
          access?.menuPermissions ?? null,
          path,
        ),
      );

      if (!visiblePaths.length) return [];

      if (visiblePaths.length === articlePaths.length) {
        return [localizeHelpManualEntry(entry, locale)];
      }

      // A partially accessible article is shown only when all
      // visible routes have separately authored localized steps.
      const scopedSteps = entry.stepsByPath;

      if (!scopedSteps) return [];

      const segments = visiblePaths.map(
        (path) => scopedSteps[path]?.[locale],
      );

      if (
        segments.some(
          (steps) => !Array.isArray(steps) || steps.length === 0,
        ) ||
        visiblePaths.some(
          (path) => !PARTIAL_MANUAL_ROUTE_LABELS[path],
        )
      ) {
        return [];
      }

      const localized = localizeHelpManualEntry(entry, locale);
      const visibleLabels = visiblePaths.map((path) =>
        localize(PARTIAL_MANUAL_ROUTE_LABELS[path], locale),
      );

      return [{
        ...localized,
        title: (locale === 'en' ? 'Guide: ' : 'Guía: ') +
          visibleLabels.join(' / '),
        summary: locale === 'en'
          ? 'Review the procedures available to your account.'
          : 'Consultá los procedimientos habilitados para tu cuenta.',
        keywords: visibleLabels.join(' '),
        steps: segments.flatMap((steps) => steps ?? []),
        tips: [],
        relatedPaths: visiblePaths,
      }];
    });
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

export function getHelpCenterCopy(
  locale: GymMasterLocale,
  manualRole: HelpManualRole,
  userRole?: string | null,
) {
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

  if (manualRole === 'admin' && userRole === 'usuario') {
    const selected = copy[locale] ?? copy.es;

    return {
      ...selected,
      eyebrow: locale === 'en'
        ? 'Internal user manual'
        : 'Manual de usuario interno',
      title: locale === 'en'
        ? 'Help for your Gym Master operations'
        : 'Ayuda para tus operaciones en Gym Master',
      description: locale === 'en'
        ? 'Review instructions for the gym modules available to your account.'
        : 'Consultá instrucciones de los módulos del gimnasio habilitados para tu cuenta.',
      accessNoticeDescription: locale === 'en'
        ? 'This guide is tailored to your menu permissions. Actual operations remain subject to application access controls.'
        : 'Esta guía se adapta a tus permisos de menú. Las operaciones siguen sujetas a los controles de acceso de la aplicación.',
    };
  }

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
    stepsByPath: {
      "/dashboard/pagos": {
        "es": [
          "Entrá a Finanzas y BI > Pagos.",
          "Filtrá los pagos por socio, estado, fecha o medio de pago.",
          "Generá recibos o revisá comprobantes antes de confirmar cambios sensibles."
        ],
        "en": [
          "Open Finance and BI > Payments.",
          "Filter payments by member, status, date or payment method.",
          "Generate receipts or review supporting documents before confirming sensitive changes."
        ]
      },
      "/dashboard/cuotas": {
        "es": [
          "Entrá a Finanzas y BI > Cuotas para consultar las cuotas registradas.",
          "Revisá los datos y el estado de la cuota que necesitás consultar."
        ],
        "en": [
          "Open Finance and BI > Fees to review recorded fees.",
          "Review the details and status of the fee you need to check."
        ]
      }
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
    stepsByPath: {
      "/dashboard/comercial/kiosco": {
        "es": [
          "Entrá a Comercial y Stock > POS / Kiosco.",
          "Seleccioná la ubicación de venta y buscá el producto, servicio o pack que necesitás.",
          "Agregá los ítems al carrito, revisá cantidades, descuentos y disponibilidad antes de confirmar la venta.",
          "Si utilizás el escáner móvil, conectalo mediante el QR del POS antes de escanear."
        ],
        "en": [
          "Open Commercial and Stock > POS / Kiosk.",
          "Select the sale location and find the product, service or pack you need.",
          "Add items to the cart, review quantities, discounts and availability before confirming the sale.",
          "If you use the mobile scanner, connect it through the POS QR before scanning."
        ]
      },
      "/dashboard/ventas": {
        "es": [
          "Entrá a Comercial y Stock > Ventas para consultar las operaciones registradas.",
          "Utilizá la búsqueda y los filtros disponibles para localizar la venta que necesitás revisar.",
          "Abrí el detalle de la operación y verificá sus datos antes de realizar cualquier acción sobre el registro.",
          "Si necesitás conservar el listado, utilizá las opciones de exportación disponibles en Ventas."
        ],
        "en": [
          "Open Commercial and Stock > Sales to review recorded transactions.",
          "Use the available search and filters to find the sale you need to review.",
          "Open the transaction details and verify the information before taking any action on the record.",
          "If you need to keep the list, use the export options available in Sales."
        ]
      }
    },
    relatedPaths: ['/dashboard/comercial/kiosco', '/dashboard/ventas'],
  },
  {
    id: 'admin-commercial-cashup',
    manualRole: 'admin',
    category: {
      es: 'Comercial y stock',
      en: 'Commercial and stock',
    },
    title: {
      es: 'Abrir, controlar y cerrar la caja',
      en: 'Open, monitor and close the cash register',
    },
    summary: {
      es: 'Administrá las sesiones de caja, los ingresos y retiros de efectivo y la conciliación del cierre.',
      en: 'Manage cash register sessions, cash deposits and withdrawals, and closing reconciliation.',
    },
    keywords: {
      es: 'caja apertura cierre cashup efectivo ingresos retiros diferencia reporte',
      en: 'cash register cashup opening closing cash deposits withdrawals difference report',
    },
    steps: {
      es: [
        'Entrá a Comercial y Stock > Caja / Cashup y revisá si existe una sesión de caja abierta.',
        'Para abrir una nueva sesión, indicá el monto inicial y revisá los datos antes de confirmar.',
        'Durante el turno, registrá los ingresos o retiros de efectivo indicando el importe y el concepto correspondiente.',
        'Antes de cerrar, compará el monto contado con el importe esperado y revisá cualquier diferencia.',
        'Confirmá el cierre cuando los importes estén verificados y consultá el reporte de caja cuando lo necesites.',
      ],
      en: [
        'Open Commercial and Stock > Cash Register / Cashup and check whether a cash register session is open.',
        'To open a new session, enter the initial amount and review the details before confirming.',
        'During the shift, record cash deposits or withdrawals with the corresponding amount and description.',
        'Before closing, compare the counted amount with the expected amount and review any difference.',
        'Confirm the closing after verifying the amounts and review the cash register report when needed.',
      ],
    },
    tips: {
      es: [
        'Comprobá los importes y la sesión seleccionada antes de confirmar movimientos o cerrar la caja.',
      ],
      en: [
        'Verify the amounts and selected session before confirming movements or closing the cash register.',
      ],
    },
    relatedPaths: ['/dashboard/comercial/caja'],
  },
  {
    id: 'admin-commercial-packs-labels',
    manualRole: 'admin',
    category: {
      es: 'Comercial y stock',
      en: 'Commercial and stock',
    },
    title: {
      es: 'Gestionar packs, promociones, códigos y etiquetas',
      en: 'Manage packs, promotions, codes and labels',
    },
    summary: {
      es: 'Configurá ofertas comerciales, generá etiquetas para productos y servicios y consultá la analítica de packs.',
      en: 'Configure commercial offers, generate labels for products and services, and review pack analytics.',
    },
    keywords: {
      es: 'servicios packs promociones cupones qr codigos etiquetas precios ventas analitica',
      en: 'services packs promotions coupons qr codes labels prices sales analytics',
    },
    steps: {
      es: [
        'Entrá a Comercial y Stock > Servicios / Packs / Promos para revisar las ofertas existentes.',
        'Al crear un pack, comprobá los productos o servicios incluidos, sus cantidades y el precio antes de guardar.',
        'Al configurar una promoción o cupón, revisá el beneficio, las fechas y los límites de uso que correspondan.',
        'Abrí Códigos / Etiquetas para localizar productos, servicios o packs, generar códigos QR e imprimir las etiquetas necesarias.',
        'Usá BI Packs / Promos para seleccionar un período y consultar ventas, packs vendidos y uso de cupones.',
      ],
      en: [
        'Open Commercial and Stock > Services / Packs / Promotions to review existing offers.',
        'When creating a pack, check its products or services, quantities and price before saving.',
        'When configuring a promotion or coupon, review the benefit, dates and applicable usage limits.',
        'Open Codes / Labels to find products, services or packs, generate QR codes and print the required labels.',
        'Use BI Packs / Promotions to select a period and review sales, packs sold and coupon usage.',
      ],
    },
    tips: {
      es: [
        'Verificá precios, condiciones comerciales y códigos antes de publicar una oferta o imprimir etiquetas.',
      ],
      en: [
        'Verify prices, offer conditions and codes before publishing an offer or printing labels.',
      ],
    },
    stepsByPath: {
      "/dashboard/comercial/servicios-promociones": {
        "es": [
          "Entrá a Comercial y Stock > Servicios / Packs / Promos para revisar las ofertas existentes.",
          "Al crear un pack, comprobá los productos o servicios incluidos, sus cantidades y el precio antes de guardar.",
          "Al configurar una promoción o cupón, revisá el beneficio, las fechas y los límites de uso que correspondan."
        ],
        "en": [
          "Open Commercial and Stock > Services / Packs / Promotions to review existing offers.",
          "When creating a pack, check its products or services, quantities and price before saving.",
          "When configuring a promotion or coupon, review the benefit, dates and applicable usage limits."
        ]
      },
      "/dashboard/comercial/codigos-etiquetas": {
        "es": [
          "Abrí Comercial y Stock > Códigos / Etiquetas para localizar los elementos disponibles.",
          "Generá los códigos QR y revisá su identificación antes de imprimir las etiquetas necesarias."
        ],
        "en": [
          "Open Commercial and Stock > Codes / Labels to find available items.",
          "Generate QR codes and verify their identification before printing the required labels."
        ]
      },
      "/dashboard/comercial/pack-analytics": {
        "es": [
          "Abrí Comercial y Stock > BI Packs / Promos.",
          "Seleccioná un período y consultá las ventas, los packs vendidos y el uso de cupones."
        ],
        "en": [
          "Open Commercial and Stock > BI Packs / Promotions.",
          "Select a period and review sales, packs sold and coupon usage."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/comercial/servicios-promociones',
      '/dashboard/comercial/codigos-etiquetas',
      '/dashboard/comercial/pack-analytics',
    ],
  },
  {
    id: 'admin-purchases-suppliers',
    manualRole: 'admin',
    category: {
      es: 'Comercial y stock',
      en: 'Commercial and stock',
    },
    title: {
      es: 'Gestionar compras y proveedores',
      en: 'Manage purchases and suppliers',
    },
    summary: {
      es: 'Consultá proveedores, registrá compras y revisá sus productos, importes y estados.',
      en: 'Review suppliers, register purchases and check their products, amounts and status.',
    },
    keywords: {
      es: 'compras proveedores abastecimiento productos importes pagos estados',
      en: 'purchases suppliers procurement products amounts payments status',
    },
    steps: {
      es: [
        'Entrá a Comercial y Stock > Proveedores para consultar los proveedores disponibles.',
        'Antes de registrar una compra, verificá los datos del proveedor y el estado de su ficha.',
        'Abrí Comercial y Stock > Compras y revisá las compras existentes con los filtros disponibles.',
        'Al registrar una compra, comprobá el proveedor, los productos, las cantidades y los importes antes de guardar.',
        'Consultá el detalle y el estado de la compra antes de realizar otra operación sobre ella.',
      ],
      en: [
        'Open Commercial and Stock > Suppliers to review available suppliers.',
        'Before registering a purchase, verify the supplier details and the status of its record.',
        'Open Commercial and Stock > Purchases and review existing purchases using the available filters.',
        'When registering a purchase, verify the supplier, products, quantities and amounts before saving.',
        'Review the purchase details and status before performing another operation on it.',
      ],
    },
    tips: {
      es: [
        'Si necesitás revisar existencias o reposición, consultá también los artículos de stock y compras de reposición.',
      ],
      en: [
        'If you need to review inventory or replenishment, also consult the stock and replenishment articles.',
      ],
    },
    stepsByPath: {
      "/dashboard/proveedores": {
        "es": [
          "Entrá a Comercial y Stock > Proveedores para consultar el listado de proveedores.",
          "Usá la búsqueda y los filtros de estado para localizar el proveedor que necesitás revisar.",
          "Abrí su ficha para comprobar los datos disponibles y su estado.",
          "Antes de crear, editar o cambiar el estado de un proveedor, verificá que hayas seleccionado el registro correcto y revisá sus datos."
        ],
        "en": [
          "Open Commercial and Stock > Suppliers to review the supplier list.",
          "Use search and status filters to find the supplier you need to review.",
          "Open the supplier record to check the available details and its status.",
          "Before creating, editing or changing a supplier's status, verify that you selected the correct record and review its details."
        ]
      },
      "/dashboard/compras": {
        "es": [
          "Entrá a Comercial y Stock > Compras para consultar las compras registradas.",
          "Usá la búsqueda y los filtros disponibles para localizar la compra que necesitás revisar.",
          "Abrí su detalle y comprobá el proveedor, los productos, las cantidades, los importes y el estado.",
          "Antes de registrar o modificar una compra, verificá los datos de la operación y confirmá que corresponda al registro correcto."
        ],
        "en": [
          "Open Commercial and Stock > Purchases to review recorded purchases.",
          "Use search and the available filters to find the purchase you need to review.",
          "Open its details and check the supplier, products, quantities, amounts and status.",
          "Before recording or modifying a purchase, verify the transaction details and confirm that you are working with the correct record."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/proveedores',
      '/dashboard/compras',
    ],
  },
  {
    id: 'admin-commercial-overview-services',
    manualRole: 'admin',
    category: {
      es: 'Comercial y stock',
      en: 'Commercial and stock',
    },
    title: {
      es: 'Consultar el panel comercial y administrar servicios',
      en: 'Review the commercial dashboard and manage services',
    },
    summary: {
      es: 'Revisá los indicadores comerciales del gimnasio y mantené actualizado el catálogo de servicios.',
      en: 'Review the gym commercial indicators and keep the service catalog up to date.',
    },
    keywords: {
      es: 'comercial kiosco panel indicadores ventas servicios catalogo precio categoria',
      en: 'commercial kiosk dashboard indicators sales services catalog price category',
    },
    steps: {
      es: [
        'Entrá a Comercial y Stock > Comercial / Kiosco para consultar el resumen de ventas, inventario y servicios.',
        'Usá los accesos del panel para ir al POS, la caja u otros módulos comerciales cuando lo necesites.',
        'Abrí Comercial y Stock > Servicios para consultar el catálogo y localizar un servicio mediante la búsqueda o los filtros.',
        'Al crear o editar un servicio, revisá su nombre, categoría, precio y demás condiciones antes de guardar.',
        'Comprobá el estado y los datos del servicio antes de utilizarlo en una operación comercial.',
      ],
      en: [
        'Open Commercial and Stock > Commercial / Kiosk to review the sales, inventory and services overview.',
        'Use the dashboard shortcuts to open POS, the cash register or other commercial modules when needed.',
        'Open Commercial and Stock > Services to review the catalog and find a service using search or filters.',
        'When creating or editing a service, review its name, category, price and other conditions before saving.',
        'Verify the service status and details before using it in a commercial operation.',
      ],
    },
    tips: {
      es: [
        'El panel comercial ofrece un resumen; para registrar ventas utilizá el módulo POS / Kiosco.',
      ],
      en: [
        'The commercial dashboard provides an overview; use POS / Kiosk to register sales.',
      ],
    },
    stepsByPath: {
      "/dashboard/comercial": {
        "es": [
          "Entrá a Comercial y Stock > Comercial / Kiosco para consultar el resumen de ventas, inventario y servicios.",
          "Usá los accesos del panel para abrir los módulos comerciales que tengas habilitados."
        ],
        "en": [
          "Open Commercial and Stock > Commercial / Kiosk to review the sales, inventory and services overview.",
          "Use dashboard shortcuts to open the commercial modules available to your account."
        ]
      },
      "/dashboard/servicios": {
        "es": [
          "Abrí Comercial y Stock > Servicios para consultar el catálogo y localizar un servicio mediante la búsqueda o los filtros.",
          "Al crear o editar un servicio, revisá su nombre, categoría, precio y demás condiciones antes de guardar.",
          "Comprobá el estado y los datos del servicio antes de utilizarlo en una operación comercial."
        ],
        "en": [
          "Open Commercial and Stock > Services to review the catalog and find a service using search or filters.",
          "When creating or editing a service, review its name, category, price and other conditions before saving.",
          "Verify the service status and details before using it in a commercial operation."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/comercial',
      '/dashboard/servicios',
    ],
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
    stepsByPath: {
      "/dashboard/comercial/stock-ledger": {
        "es": [
          "Entrá a Comercial y Stock > Stock Ledger para consultar el estado del inventario.",
          "Revisá las alertas de productos sin stock, con stock crítico o por debajo del mínimo.",
          "Consultá las existencias por ubicación y los movimientos registrados antes de realizar un ajuste.",
          "Si necesitás registrar un movimiento, verificá el producto, el tipo de operación, la ubicación y las cantidades antes de confirmar."
        ],
        "en": [
          "Open Commercial and Stock > Stock Ledger to review inventory status.",
          "Review alerts for out-of-stock, critical-stock and below-minimum products.",
          "Check stock by location and recorded movements before making an adjustment.",
          "If you need to record a movement, verify the product, operation type, location and quantities before confirming."
        ]
      },
      "/dashboard/comercial/compras-reposicion": {
        "es": [
          "Entrá a Comercial y Stock > Compras / Reposición.",
          "Revisá los productos que requieren reposición y las cantidades sugeridas.",
          "Antes de crear una orden de compra, verificá el proveedor, los productos, las cantidades y los costos.",
          "Cuando recibas una orden, comprobá las cantidades efectivamente recibidas antes de confirmar la recepción."
        ],
        "en": [
          "Open Commercial and Stock > Purchases / Replenishment.",
          "Review products requiring replenishment and their suggested quantities.",
          "Before creating a purchase order, verify the supplier, products, quantities and costs.",
          "When receiving an order, check the quantities actually received before confirming receipt."
        ]
      },
      "/dashboard/productos": {
        "es": [
          "Entrá a Comercial y Stock > Productos para consultar el catálogo.",
          "Usá la búsqueda y los filtros de estado o stock para localizar el producto que necesitás revisar.",
          "Abrí la ficha del producto para comprobar sus datos, precio y condiciones de stock.",
          "Antes de crear, editar o modificar el estado de un producto, verificá que hayas seleccionado el registro correcto y revisá sus datos."
        ],
        "en": [
          "Open Commercial and Stock > Products to review the catalog.",
          "Use search and status or stock filters to find the product you need to review.",
          "Open the product record to check its details, price and stock conditions.",
          "Before creating, editing or changing a product's status, verify that you selected the correct record and review its details."
        ]
      }
    },
    relatedPaths: ['/dashboard/comercial/stock-ledger', '/dashboard/comercial/compras-reposicion', '/dashboard/productos'],
  },
  {
    id: 'admin-equipment-preventive-maintenance',
    manualRole: 'admin',
    category: {
      es: 'Infraestructura',
      en: 'Infrastructure',
    },
    title: {
      es: 'Gestionar equipamientos y mantenimiento preventivo',
      en: 'Manage equipment and preventive maintenance',
    },
    summary: {
      es: 'Consultá el inventario de equipamientos, sus alertas y los planes y órdenes de mantenimiento preventivo.',
      en: 'Review the equipment inventory, its alerts, and preventive maintenance plans and work orders.',
    },
    keywords: {
      es: 'equipamientos maquinas mantenimiento preventivo alertas planes ordenes tecnicas',
      en: 'equipment machines maintenance preventive alerts plans technical work orders',
    },
    steps: {
      es: [
        'Entrá a Infraestructura > Equipamientos para consultar el inventario y localizar la máquina que necesitás revisar.',
        'Revisá el estado del equipamiento, sus datos y las alertas de mantenimiento antes de realizar cambios.',
        'Abrí Infraestructura > Preventivos Equipos para consultar los planes preventivos y las órdenes técnicas.',
        'Al crear un plan preventivo, verificá el equipamiento y las tareas previstas antes de guardarlo.',
        'Al registrar una orden técnica, revisá sus datos y consultá el listado de órdenes abiertas para seguir su estado.',
        'Cuando una orden esté efectivamente realizada, comprobá que corresponda al equipo correcto antes de marcarla como completada.',
      ],
      en: [
        'Open Infrastructure > Equipment to review the inventory and find the machine you need to inspect.',
        'Review the equipment status, details and maintenance alerts before making changes.',
        'Open Infrastructure > Equipment preventive tasks to review preventive plans and technical work orders.',
        'When creating a preventive plan, verify the equipment and planned tasks before saving it.',
        'When recording a technical work order, review its details and consult the open-order list to track its status.',
        'Once a work order has actually been completed, verify that it belongs to the correct equipment before marking it as complete.',
      ],
    },
    tips: {
      es: [
        'No marques una orden como completada hasta verificar que el trabajo correspondiente se haya realizado.',
      ],
      en: [
        'Do not mark a work order as complete until the corresponding work has been carried out.',
      ],
    },
    stepsByPath: {
      "/dashboard/equipamientos": {
        "es": [
          "Entrá a Infraestructura > Equipamientos para consultar el inventario.",
          "Usá la búsqueda y los filtros disponibles para localizar el equipo que necesitás revisar.",
          "Abrí su ficha para comprobar los datos, el estado y las alertas de mantenimiento disponibles.",
          "Antes de crear, editar o cambiar el estado de un equipamiento, verificá que hayas seleccionado el registro correcto y revisá sus datos."
        ],
        "en": [
          "Open Infrastructure > Equipment to review the inventory.",
          "Use the available search and filters to find the equipment you need to review.",
          "Open its record to check its details, status and available maintenance alerts.",
          "Before creating, editing or changing an equipment item's status, verify that you selected the correct record and review its details."
        ]
      },
      "/dashboard/infraestructura/equipamientos/preventivos": {
        "es": [
          "Entrá a Infraestructura > Preventivos Equipos para consultar los planes preventivos y las órdenes técnicas.",
          "Antes de crear un plan preventivo, verificá el tipo de equipamiento, la frecuencia y las tareas previstas.",
          "Al registrar una orden técnica, comprobá el equipo seleccionado, las tareas, las fechas y los demás datos antes de guardar.",
          "Consultá las órdenes abiertas para revisar su estado y realizar el seguimiento correspondiente.",
          "Marcá una orden como completada únicamente después de verificar que el trabajo se realizó y que corresponde al equipo correcto."
        ],
        "en": [
          "Open Infrastructure > Equipment Preventive Maintenance to review preventive plans and technical work orders.",
          "Before creating a preventive plan, verify the equipment type, frequency and planned tasks.",
          "When recording a technical work order, check the selected equipment, tasks, dates and other details before saving.",
          "Review open work orders to check their status and follow up as needed.",
          "Mark a work order as complete only after verifying that the work was performed and that it belongs to the correct equipment."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/equipamientos',
      '/dashboard/infraestructura/equipamientos/preventivos',
    ],
  },
  {
    id: 'admin-building-maintenance',
    manualRole: 'admin',
    category: {
      es: 'Infraestructura',
      en: 'Infrastructure',
    },
    title: {
      es: 'Gestionar sectores y mantenimiento edilicio',
      en: 'Manage building areas and maintenance',
    },
    summary: {
      es: 'Registrá sectores, activos edilicios, órdenes de trabajo y listas de verificación del gimnasio.',
      en: 'Register building areas, facility assets, work orders and gym inspection checklists.',
    },
    keywords: {
      es: 'mantenimiento edilicio sectores activos instalaciones ordenes inspeccion checklist',
      en: 'building maintenance areas assets facilities work orders inspection checklist',
    },
    steps: {
      es: [
        'Entrá a Infraestructura > Mantenimiento Edilicio para consultar los sectores, activos y alertas disponibles.',
        'Si necesitás registrar un sector nuevo, completá sus datos y verificá la información antes de guardarlo.',
        'Registrá los activos edilicios que correspondan al sector, revisando su identificación y los datos de mantenimiento.',
        'Cuando detectes un trabajo pendiente, utilizá la opción de nueva orden y comprobá sus datos antes de registrarla.',
        'Usá Ejecutar checklist para registrar una inspección y revisar el resultado de los puntos evaluados.',
        'Consultá las órdenes, los checklists recientes y las alertas para dar seguimiento al mantenimiento del edificio.',
      ],
      en: [
        'Open Infrastructure > Building Maintenance to review available areas, assets and alerts.',
        'If you need to register a new area, complete its details and verify the information before saving.',
        'Register the building assets associated with the area, reviewing their identification and maintenance details.',
        'When you identify pending work, use the new work order option and check its details before recording it.',
        'Use Run checklist to record an inspection and review the results of the evaluated items.',
        'Review work orders, recent checklists and alerts to follow up on building maintenance.',
      ],
    },
    tips: {
      es: [
        'Verificá el sector y el activo seleccionados antes de registrar una orden o una inspección.',
      ],
      en: [
        'Verify the selected area and asset before recording a work order or an inspection.',
      ],
    },
    relatedPaths: [
      '/dashboard/infraestructura/mantenimiento-edilicio',
    ],
  },
  {
    id: 'admin-infrastructure-qr-labels-reader',
    manualRole: 'admin',
    category: {
      es: 'Infraestructura',
      en: 'Infrastructure',
    },
    title: {
      es: 'Generar etiquetas y leer códigos QR de Infraestructura',
      en: 'Generate labels and scan Infrastructure QR codes',
    },
    summary: {
      es: 'Generá etiquetas para elementos de infraestructura y consultá los elementos vinculados mediante el lector QR/barra.',
      en: 'Generate labels for infrastructure items and look up linked items using the QR/barcode reader.',
    },
    keywords: {
      es: 'infraestructura qr codigo barra etiquetas lector camara equipamientos sectores activos',
      en: 'infrastructure qr barcode labels scanner camera equipment areas assets',
    },
    steps: {
      es: [
        'Entrá a Infraestructura > Etiquetas QR y seleccioná el tipo de elemento y el destino que necesitás identificar.',
        'Generá el código para el elemento seleccionado y comprobá sus datos antes de imprimirlo.',
        'Seleccioná las etiquetas disponibles que quieras incluir en la hoja A4 y utilizá la opción de impresión.',
        'Para consultar un elemento identificado, abrí Infraestructura > Lector QR/barra.',
        'Escaneá el código con la cámara, si está disponible y autorizada, o ingresalo en el campo correspondiente.',
        'Revisá el resultado y el tipo de elemento reconocido antes de abrir su pantalla vinculada.',
      ],
      en: [
        'Open Infrastructure > QR Labels and select the item type and target you need to identify.',
        'Generate the code for the selected item and check its details before printing.',
        'Select the available labels you want to include on the A4 sheet and use the print option.',
        'To look up an identified item, open Infrastructure > QR/Barcode Reader.',
        'Scan the code using the camera, if available and permitted, or enter it in the corresponding field.',
        'Review the result and recognized item type before opening its linked screen.',
      ],
    },
    tips: {
      es: [
        'Las etiquetas de Infraestructura identifican elementos vinculados al gimnasio; para etiquetar productos, servicios o packs, utilizá Códigos / Etiquetas del módulo Comercial y Stock.',
      ],
      en: [
        'Infrastructure labels identify items linked to gym facilities; to label products, services or packs, use Codes / Labels in the Commercial and Stock module.',
      ],
    },
    stepsByPath: {
      "/dashboard/infraestructura/etiquetas-qr": {
        "es": [
          "Entrá a Infraestructura > Etiquetas QR para consultar los elementos que podés identificar.",
          "Seleccioná el tipo de elemento y el destino correspondiente antes de generar un código.",
          "Comprobá los datos del elemento y del código generado.",
          "Seleccioná las etiquetas que necesitás incluir en la hoja A4 y revisalas antes de imprimir o guardar el PDF."
        ],
        "en": [
          "Open Infrastructure > QR Labels to review the items you can identify.",
          "Select the item type and corresponding target before generating a code.",
          "Check the item details and generated code.",
          "Select the labels you need on the A4 sheet and review them before printing or saving the PDF."
        ]
      },
      "/dashboard/infraestructura/lector-qr-barra": {
        "es": [
          "Entrá a Infraestructura > Lector QR/barra.",
          "Ingresá un código en el campo correspondiente o utilizá la cámara si el navegador lo permite y autorizaste su acceso.",
          "Consultá el resultado y comprobá el código y el tipo de elemento reconocido.",
          "Si el elemento tiene una pantalla vinculada, verificá que sea el correcto antes de abrirla."
        ],
        "en": [
          "Open Infrastructure > QR/Barcode Reader.",
          "Enter a code in the corresponding field or use the camera if the browser supports it and you have allowed access.",
          "Review the result and verify the code and recognized item type.",
          "If the item has a linked screen, verify that it is the correct one before opening it."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/infraestructura/etiquetas-qr',
      '/dashboard/infraestructura/lector-qr-barra',
    ],
  },
  {
    id: 'admin-exercise-media',
    manualRole: 'admin',
    category: {
      es: 'Entrenamiento y salud',
      en: 'Training and health',
    },
    title: {
      es: 'Administrar imágenes y videos de ejercicios',
      en: 'Manage exercise images and videos',
    },
    summary: {
      es: 'Consultá el catálogo de media de ejercicios y revisá las imágenes, GIF y referencias de video asociadas.',
      en: 'Review the exercise media catalog and manage its associated images, GIFs and video references.',
    },
    keywords: {
      es: 'media ejercicios administrador imagen gif video youtube catalogo cloudinary',
      en: 'exercise media administrator image gif video youtube catalog cloudinary',
    },
    steps: {
      es: [
        'Con una cuenta administradora, entrá a Entrenamiento y Salud > Media de Ejercicios.',
        'Buscá el ejercicio que necesitás revisar y consultá su material multimedia y los indicadores disponibles.',
        'Antes de asociar una imagen o un GIF, comprobá que represente correctamente el ejercicio seleccionado.',
        'Si utilizás una referencia de YouTube, revisá el enlace y el idioma correspondiente antes de guardarlo.',
        'Comprobá la vista previa y los datos guardados del ejercicio antes de continuar con otro elemento del catálogo.',
      ],
      en: [
        'Using an administrator account, open Training and Health > Exercise Media.',
        'Find the exercise you need to review and check its media and available indicators.',
        'Before associating an image or GIF, verify that it correctly represents the selected exercise.',
        'If you use a YouTube reference, review its link and corresponding language before saving it.',
        'Check the exercise preview and saved details before continuing with another catalog item.',
      ],
    },
    tips: {
      es: [
        'Esta pantalla está destinada al administrador. La consulta personal de rutinas del socio se realiza desde sus propios módulos.',
      ],
      en: [
        'This screen is intended for the administrator. Members review their personal routines through their own modules.',
      ],
    },
    relatedPaths: [
      '/dashboard/rutinas/media',
    ],
  },
  {
    id: 'admin-coach-ai',
    manualRole: 'admin',
    category: {
      es: 'IA y RAG',
      en: 'AI and RAG',
    },
    title: {
      es: 'Utilizar Coach IA con un socio seleccionado',
      en: 'Use AI Coach with a selected member',
    },
    summary: {
      es: 'Consultá el Coach IA y seleccioná un socio antes de solicitar acciones que puedan generar o guardar datos en sus módulos.',
      en: 'Consult AI Coach and select a member before requesting actions that may generate or save data in their modules.',
    },
    keywords: {
      es: 'coach ia administrador socio seleccionado chat contexto rutina dieta evolucion',
      en: 'ai coach administrator selected member chat context routine diet evolution',
    },
    steps: {
      es: [
        'Con una cuenta administradora, entrá a Mi Coach > Coach IA.',
        'Si necesitás trabajar sobre la información de un socio, buscalo y seleccionalo en Socio operativo del Coach IA.',
        'Comprobá que el socio seleccionado sea el correcto antes de pedir rutinas, dietas o análisis que puedan generar o guardar información.',
        'Escribí tu consulta y revisá la respuesta, el contexto aplicado y los resultados de las acciones antes de continuar.',
        'Si solo necesitás orientación general, podés consultar sin seleccionar un socio; en ese estado, el Coach bloquea las acciones automáticas sobre sus datos.',
      ],
      en: [
        'Using an administrator account, open My Coach > AI Coach.',
        'If you need to work with a member’s information, find and select that member under Operational member for AI Coach.',
        'Verify that the selected member is correct before requesting routines, diets or analyses that may generate or save information.',
        'Enter your question and review the response, applied context and action results before proceeding.',
        'If you only need general guidance, you can ask without selecting a member; in that state, the Coach blocks automatic actions on member data.',
      ],
    },
    tips: {
      es: [
        'Las respuestas generadas deben revisarse antes de utilizarlas en decisiones sobre entrenamiento o alimentación. No selecciones un socio distinto para evitar asociar acciones con la cuenta equivocada.',
      ],
      en: [
        'Review generated responses before using them for training or nutrition decisions. Do not select a different member, to avoid associating actions with the wrong account.',
      ],
    },
    relatedPaths: ['/dashboard/coach'],
  },
  {
    id: 'admin-routine-assistant',
    manualRole: 'admin',
    category: {
      es: 'Entrenamiento y salud',
      en: 'Training and health',
    },
    title: {
      es: 'Consultar el Asistente de Rutinas desde administración',
      en: 'Review the Routine Assistant from administration',
    },
    summary: {
      es: 'Conocé el alcance de la pantalla personal del socio y utilizá Gestión de Rutinas para administrar planes de entrenamiento.',
      en: 'Understand the member-facing screen and use Routine Management to administer training plans.',
    },
    keywords: {
      es: 'asistente rutinas administrador socio generacion deshabilitada gestor rutinas',
      en: 'routine assistant administrator member generation disabled routine manager',
    },
    steps: {
      es: [
        'Con una cuenta administradora, abrí Mi Coach > Asistente de Rutinas para consultar la experiencia orientada al socio.',
        'Revisá la ayuda y los campos del pedido, como objetivo, días disponibles, nivel y restricciones, si necesitás conocer qué información solicita el asistente.',
        'Tené en cuenta que el botón de generación está deshabilitado en esta pantalla para la sesión administradora.',
        'Para crear o asignar planes de entrenamiento desde administración, utilizá Entrenamiento y Salud > Gestión de Rutinas.',
      ],
      en: [
        'Using an administrator account, open My Coach > Routine Assistant to review the member-facing experience.',
        'Review the help and request fields, such as goal, available days, level and restrictions, if you need to understand what information the assistant requests.',
        'Note that the generation button is disabled on this screen for an administrator session.',
        'To create or assign training plans from administration, use Training and Health > Routine Management.',
      ],
    },
    tips: {
      es: [
        'No confundas el Asistente de Rutinas personal del socio con el módulo administrativo Gestión de Rutinas.',
      ],
      en: [
        'Do not confuse the member’s personal Routine Assistant with the administrative Routine Management module.',
      ],
    },
    relatedPaths: ['/dashboard/rutinas/asistente'],
  },
  {
    id: 'admin-diets-assistant',
    manualRole: 'admin',
    category: {
      es: 'Entrenamiento y salud',
      en: 'Training and health',
    },
    title: {
      es: 'Consultar el Asistente de Dietas desde administración',
      en: 'Review the Diet Assistant from administration',
    },
    summary: {
      es: 'Conocé la vista de dietas del socio y utilizá Gestión de Dietas para administrar sus planes alimentarios.',
      en: 'Understand the member-facing diet view and use Diet Management to administer meal plans.',
    },
    keywords: {
      es: 'asistente dietas administrador historial nueva dieta gestor planes socios',
      en: 'diet assistant administrator history new diet management member plans',
    },
    steps: {
      es: [
        'Con una cuenta administradora, abrí Mi Coach > Asistente de Dietas.',
        'Revisá la pantalla Dietas de socios y las opciones disponibles, incluida Nueva dieta.',
        'Tené en cuenta que esta pantalla está orientada a la vista del socio: el historial personal depende de que la cuenta tenga un socio asociado.',
        'Para consultar y administrar planes alimentarios por socio desde administración, utilizá Entrenamiento y Salud > Gestión de Dietas.',
      ],
      en: [
        'Using an administrator account, open My Coach > Diet Assistant.',
        'Review the Member diets screen and its available options, including New diet.',
        'Note that this screen is oriented toward the member view: personal history depends on the account having an associated member.',
        'To review and administer meal plans by member from administration, use Training and Health > Diet Management.',
      ],
    },
    tips: {
      es: [
        'No confundas el Asistente de Dietas con Gestión de Dietas. Antes de generar o modificar un plan, comprobá a qué socio corresponde y revisá su contenido.',
      ],
      en: [
        'Do not confuse the Diet Assistant with Diet Management. Before generating or changing a plan, verify which member it belongs to and review its content.',
      ],
    },
    relatedPaths: ['/dashboard/dietas'],
  },
  {
    id: 'admin-medical-record-review',
    manualRole: 'admin',
    category: {
      es: 'Entrenamiento y salud',
      en: 'Training and health',
    },
    title: {
      es: 'Revisar la ficha médica de un socio',
      en: 'Review a member medical record',
    },
    summary: {
      es: 'Utilizá la vista operativa de Ficha Médica para seleccionar un socio y revisar sus datos, adjuntos e historial según tus permisos.',
      en: 'Use the operational Medical Record view to select a member and review their data, attachments and history according to your permissions.',
    },
    keywords: {
      es: 'ficha medica revision socios apto adjuntos historial administrador usuario',
      en: 'medical record review members clearance attachments history administrator staff',
    },
    steps: {
      es: [
        'Si tenés habilitada la sección, entrá a Mi Salud > Ficha Médica.',
        'En el panel de revisión, buscá al socio por sus datos identificatorios y seleccionalo.',
        'Comprobá el nombre del socio seleccionado antes de abrir su ficha actual, historial o una nueva carga.',
        'Revisá los datos y la documentación disponible únicamente para la finalidad operativa autorizada.',
        'Si necesitás registrar una actualización, verificá primero que corresponda al socio seleccionado y revisá los datos antes de guardarlos.',
      ],
      en: [
        'If the section is enabled for your account, open My Health > Medical Record.',
        'In the review panel, search for the member using their identifying details and select them.',
        'Verify the selected member’s name before opening their current record, history or a new entry.',
        'Review available data and documentation only for the authorized operational purpose.',
        'If you need to record an update, first verify that it belongs to the selected member and review the details before saving.',
      ],
    },
    tips: {
      es: [
        'La ficha médica contiene información sensible. Respetá los permisos de acceso y no la utilices para emitir diagnósticos ni reemplazar la indicación de un profesional de salud.',
      ],
      en: [
        'Medical records contain sensitive information. Respect access permissions and do not use this screen to diagnose conditions or replace advice from a healthcare professional.',
      ],
    },
    relatedPaths: ['/dashboard/ficha-medica'],
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
    stepsByPath: {
      "/dashboard/gestor-rutinas": {
        "es": [
          "Entrá a Entrenamiento y Salud > Gestión de Rutinas.",
          "Buscá al socio por nombre o DNI en la pantalla Rutinas de Socios.",
          "Localizá al socio en el listado y revisá las opciones de su tarjeta antes de continuar con la gestión de sus rutinas."
        ],
        "en": [
          "Open Training and Health > Routine Management.",
          "Search for the member by name or ID on the Member routines screen.",
          "Find the member in the list and review the options on their card before proceeding with their routines."
        ]
      },
      "/dashboard/gestor-dietas": {
        "es": [
          "Entrá a Entrenamiento y Salud > Gestión de Dietas.",
          "Buscá al socio por nombre o DNI en la pantalla Dietas de Socios.",
          "Localizá al socio en el listado y revisá las opciones de su tarjeta antes de continuar con la gestión de sus dietas."
        ],
        "en": [
          "Open Training and Health > Diet Management.",
          "Search for the member by name or ID on the Member diets screen.",
          "Find the member in the list and review the options on their card before proceeding with their diets."
        ]
      },
      "/dashboard/gestor-evolucion-fisica": {
        "es": [
          "Con una cuenta administradora, entrá a Entrenamiento y Salud > Gestión Evolución Física.",
          "Revisá los indicadores generales y buscá al socio por nombre, DNI o email.",
          "Abrí la tarjeta del socio para consultar su seguimiento físico en la vista administrativa de solo lectura."
        ],
        "en": [
          "Using an administrator account, open Training and Health > Physical Evolution Management.",
          "Review the general indicators and search for the member by name, ID or email.",
          "Open the member's card to review their physical progress in the read-only administrative view."
        ]
      }
    },
    relatedPaths: ['/dashboard/gestor-rutinas', '/dashboard/gestor-dietas', '/dashboard/gestor-evolucion-fisica'],
  },
  {
    id: 'admin-activities-turnos',
    manualRole: 'admin',
    category: {
      es: 'Actividades y turnos',
      en: 'Activities and schedules',
    },
    title: {
      es: 'Administrar actividades, turnos e inscripciones',
      en: 'Manage activities, schedules and enrollments',
    },
    summary: {
      es: 'Consultá las actividades del gimnasio, organizá sus turnos y revisá las solicitudes de inscripción de los socios.',
      en: 'Review gym activities, organize their schedules and manage member enrollment requests.',
    },
    keywords: {
      es: 'actividades clases turnos horarios cupos inscripciones solicitudes socios',
      en: 'activities classes schedules capacity enrollments requests members',
    },
    steps: {
      es: [
        'Entrá a Personal y Operaciones > Actividades para consultar las actividades disponibles.',
        'Revisá los turnos y sus horarios, cupos y estados antes de realizar cambios.',
        'Al crear o editar un turno, comprobá que la actividad, el horario y la capacidad correspondan a lo planificado.',
        'Revisá las solicitudes de inscripción y su estado antes de confirmar una plaza para un socio.',
      ],
      en: [
        'Open Staff and Operations > Activities to review available activities.',
        'Review schedules, times, capacity and status before making changes.',
        'When creating or editing a schedule, verify that the activity, time and capacity match the plan.',
        'Review enrollment requests and their status before confirming a place for a member.',
      ],
    },
    tips: {
      es: [
        'Antes de confirmar una inscripción, verificá el cupo disponible y que estés trabajando sobre el turno correcto.',
      ],
      en: [
        'Before confirming an enrollment, verify available capacity and make sure you selected the correct schedule.',
      ],
    },
    relatedPaths: ['/dashboard/actividades'],
  },
  {
    id: 'admin-employees-salaries',
    manualRole: 'admin',
    category: {
      es: 'Personal y Operaciones',
      en: 'Staff and Operations',
    },
    title: {
      es: 'Gestionar empleados y registros de sueldo',
      en: 'Manage employees and salary records',
    },
    summary: {
      es: 'Consultá y mantené los registros del personal y revisá los sueldos asociados a los empleados.',
      en: 'Review and maintain staff records and manage salary records associated with employees.',
    },
    keywords: {
      es: 'empleados personal sueldos salarios pagos periodo estado exportar',
      en: 'employees staff salaries payments period status export',
    },
    steps: {
      es: [
        'Entrá a Personal y Operaciones > Empleados para consultar el listado del personal.',
        'Usá la búsqueda y los filtros disponibles para localizar un empleado y revisar su ficha.',
        'Si necesitás incorporar un empleado, abrí Añadir Empleado, completá los datos solicitados y verificá la información antes de guardar.',
        'Abrí Personal y Operaciones > Sueldos para consultar los registros de sueldo y sus estados.',
        'Al registrar un sueldo, comprobá el empleado, el período, los importes y los demás datos antes de confirmar.',
        'Si necesitás revisar un registro existente, abrí su detalle; utilizá las opciones de exportación cuando corresponda.',
      ],
      en: [
        'Open Staff and Operations > Employees to review the staff list.',
        'Use the available search and filters to find an employee and review their record.',
        'If you need to add an employee, open Add Employee, complete the requested details and verify the information before saving.',
        'Open Staff and Operations > Salaries to review salary records and their status.',
        'When recording a salary, verify the employee, period, amounts and other details before confirming.',
        'If you need to review an existing record, open its details; use the export options when appropriate.',
      ],
    },
    tips: {
      es: [
        'Antes de modificar el estado de un empleado o anular un registro de sueldo, verificá que hayas seleccionado el registro correcto.',
      ],
      en: [
        'Before changing an employee status or voiding a salary record, verify that you selected the correct record.',
      ],
    },
    stepsByPath: {
      "/dashboard/empleados": {
        "es": [
          "Entrá a Personal y Operaciones > Empleados para consultar el listado del personal.",
          "Usá la búsqueda y los filtros disponibles para localizar un empleado y revisar su ficha.",
          "Si necesitás incorporar un empleado, abrí Añadir Empleado, completá los datos solicitados y verificá la información antes de guardar.",
          "Antes de modificar el estado de un empleado, verificá que hayas seleccionado el registro correcto."
        ],
        "en": [
          "Open Staff and Operations > Employees to review the staff list.",
          "Use the available search and filters to find an employee and review their record.",
          "If you need to add an employee, open Add Employee, complete the requested details and verify the information before saving.",
          "Before changing an employee's status, verify that you selected the correct record."
        ]
      },
      "/dashboard/empleados-sueldos": {
        "es": [
          "Entrá a Personal y Operaciones > Sueldos para consultar los registros de sueldo y sus estados.",
          "Al registrar un sueldo, comprobá el empleado, el período, los importes y los demás datos antes de confirmar.",
          "Si necesitás revisar un registro existente, abrí su detalle; utilizá las opciones de exportación cuando corresponda.",
          "Antes de anular un registro de sueldo, verificá que hayas seleccionado el registro correcto."
        ],
        "en": [
          "Open Staff and Operations > Salaries to review salary records and their status.",
          "When recording a salary, verify the employee, period, amounts and other details before confirming.",
          "If you need to review an existing record, open its details; use the export options when appropriate.",
          "Before voiding a salary record, verify that you selected the correct record."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/empleados',
      '/dashboard/empleados-sueldos',
    ],
  },
  {
    id: 'admin-attendance-occupancy',
    manualRole: 'admin',
    category: {
      es: 'Asistencias y aforo',
      en: 'Attendance and capacity',
    },
    title: {
      es: 'Consultar asistencias y controlar salidas',
      en: 'Review attendance and manage check-outs',
    },
    summary: {
      es: 'Consultá ingresos y salidas, revisá la ocupación del gimnasio y registrá salidas administrativas cuando corresponda.',
      en: 'Review check-ins and check-outs, monitor gym occupancy and record administrative check-outs when needed.',
    },
    keywords: {
      es: 'asistencias ingresos egresos salida aforo ocupacion control socios',
      en: 'attendance check-in check-out exit capacity occupancy members',
    },
    steps: {
      es: [
        'Entrá a Personal y Operaciones > Asistencias para consultar los registros de ingreso y salida.',
        'Usá los filtros disponibles para localizar registros y revisar el período que necesitás.',
        'Abrí Salida / Aforo para consultar la ocupación actual del gimnasio.',
        'Si necesitás registrar una salida administrativa, identificá al socio y confirmá la operación antes de continuar.',
      ],
      en: [
        'Open Staff and Operations > Attendance to review check-in and check-out records.',
        'Use the available filters to find records and review the required period.',
        'Open Exit / Capacity to check current gym occupancy.',
        'If an administrative check-out is needed, identify the member and confirm the operation before proceeding.',
      ],
    },
    tips: {
      es: [
        'Antes de registrar una salida, verificá que corresponda al socio correcto.',
      ],
      en: [
        'Before recording a check-out, verify that you selected the correct member.',
      ],
    },
    stepsByPath: {
      "/dashboard/asistencias": {
        "es": [
          "Entrá a Personal y Operaciones > Asistencias para consultar los registros de ingreso y salida.",
          "Usá la búsqueda y los filtros de período para localizar los registros que necesitás revisar.",
          "Comprobá los datos del socio y las fechas del registro antes de continuar con cualquier operación."
        ],
        "en": [
          "Open Staff and Operations > Attendance to review check-in and check-out records.",
          "Use search and period filters to find the records you need to review.",
          "Check the member details and record dates before proceeding with any operation."
        ]
      },
      "/dashboard/asistencias/aforo": {
        "es": [
          "Entrá a Personal y Operaciones > Salida / Aforo para consultar la ocupación actual del gimnasio.",
          "Revisá los movimientos de ingreso y salida y localizá al socio correspondiente antes de realizar una operación.",
          "Si necesitás registrar una salida administrativa, verificá la identidad del socio y confirmá la operación solo cuando corresponda."
        ],
        "en": [
          "Open Staff and Operations > Exit / Capacity to check current gym occupancy.",
          "Review check-in and check-out movements and locate the relevant member before performing an operation.",
          "If an administrative check-out is required, verify the member's identity and confirm the operation only when appropriate."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/asistencias',
      '/dashboard/asistencias/aforo',
    ],
  },
  {
    id: 'admin-finance-expenses',
    manualRole: 'admin',
    category: {
      es: 'Finanzas y BI',
      en: 'Finance and BI',
    },
    title: {
      es: 'Consultar finanzas y registrar gastos',
      en: 'Review finances and record expenses',
    },
    summary: {
      es: 'Consultá los indicadores financieros del gimnasio y administrá los registros de gastos y egresos.',
      en: 'Review the gym financial indicators and manage expense and outgoing-payment records.',
    },
    keywords: {
      es: 'finanzas ingresos egresos gastos balances indicadores periodo exportar',
      en: 'finance income expenses outgoings balances indicators period export',
    },
    steps: {
      es: [
        'Entrá a Finanzas y BI > Finanzas / BI para consultar el resumen financiero.',
        'Seleccioná el período que necesitás y revisá los indicadores de ingresos y egresos.',
        'Si necesitás conservar un informe, utilizá las opciones de exportación disponibles.',
        'Abrí Finanzas y BI > Gastos / Egresos para consultar los gastos registrados y aplicar los filtros correspondientes.',
        'Antes de registrar un gasto nuevo, verificá sus datos, importe y comprobantes disponibles; revisá el registro después de guardarlo.',
      ],
      en: [
        'Open Finance and BI > Finance / BI to review the financial overview.',
        'Select the required period and review the income and expense indicators.',
        'If you need to keep a report, use the available export options.',
        'Open Finance and BI > Expenses / Outgoings to review recorded expenses and apply the relevant filters.',
        'Before recording a new expense, verify its details, amount and available supporting documents; review the record after saving.',
      ],
    },
    tips: {
      es: [
        'Comprobá el período seleccionado antes de comparar importes o exportar un informe.',
      ],
      en: [
        'Check the selected period before comparing amounts or exporting a report.',
      ],
    },
    stepsByPath: {
      "/dashboard/finanzas": {
        "es": [
          "Entrá a Finanzas y BI > Finanzas / BI para consultar el resumen financiero del gimnasio.",
          "Seleccioná el período que necesitás analizar y verificá las fechas antes de comparar importes.",
          "Revisá los indicadores de ingresos, egresos y resultado financiero correspondientes al período seleccionado.",
          "Si necesitás conservar un informe, comprobá los filtros y utilizá las opciones de exportación disponibles."
        ],
        "en": [
          "Open Finance and BI > Finance / BI to review the gym's financial overview.",
          "Select the period you need to analyze and verify the dates before comparing amounts.",
          "Review the income, outflow and financial result indicators for the selected period.",
          "If you need to keep a report, check the filters and use the available export options."
        ]
      },
      "/dashboard/otros-gastos": {
        "es": [
          "Entrá a Finanzas y BI > Gastos / Egresos para consultar los gastos registrados.",
          "Utilizá la búsqueda y los filtros de estado y fechas para localizar el gasto que necesitás revisar.",
          "Abrí el registro y verificá su descripción, importe, fecha, estado y demás datos disponibles.",
          "Antes de registrar o editar un gasto, comprobá los datos de la operación y los comprobantes disponibles; revisá el registro después de guardar."
        ],
        "en": [
          "Open Finance and BI > Expenses / Outgoings to review recorded expenses.",
          "Use search, status filters and date filters to find the expense you need to review.",
          "Open the record and check its description, amount, date, status and other available details.",
          "Before recording or editing an expense, verify the transaction details and available supporting documents; review the record after saving."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/finanzas',
      '/dashboard/otros-gastos',
    ],
  },
  {
    id: 'admin-members-bi-ranking',
    manualRole: 'admin',
    category: {
      es: 'Finanzas y BI',
      en: 'Finance and BI',
    },
    title: {
      es: 'Consultar BI de socios, promociones y ranking',
      en: 'Review member BI, promotions and ranking',
    },
    summary: {
      es: 'Analizá los indicadores de socios y consultá el ranking y las bonificaciones desde sus pantallas específicas.',
      en: 'Analyze member indicators and review ranking and bonuses in their dedicated screens.',
    },
    keywords: {
      es: 'bi socios demografia promociones ranking bonificacion indicadores periodo',
      en: 'bi members demographics promotions ranking bonuses indicators period',
    },
    steps: {
      es: [
        'Entrá a Finanzas y BI > BI Socios / Promociones y seleccioná el período de análisis.',
        'Revisá los indicadores y gráficos disponibles antes de sacar conclusiones sobre los socios o las promociones.',
        'Utilizá las opciones de exportación si necesitás conservar los resultados del período.',
        'Abrí Finanzas y BI > Ranking / Bonificación para consultar las posiciones y las bonificaciones registradas.',
        'Antes de confirmar cualquier bonificación, revisá el socio seleccionado y las condiciones aplicables.',
      ],
      en: [
        'Open Finance and BI > Member BI / Promotions and select the analysis period.',
        'Review the available indicators and charts before drawing conclusions about members or promotions.',
        'Use the export options if you need to keep the results for the selected period.',
        'Open Finance and BI > Ranking / Bonuses to review positions and recorded bonuses.',
        'Before confirming any bonus, verify the selected member and applicable conditions.',
      ],
    },
    tips: {
      es: [
        'Los indicadores ayudan a revisar la operación; verificá los datos concretos antes de aplicar una bonificación.',
      ],
      en: [
        'Indicators help you review operations; verify the underlying details before applying a bonus.',
      ],
    },
    stepsByPath: {
      "/dashboard/bi-socios-demografia-promociones": {
        "es": [
          "Entrá a Finanzas y BI > BI Socios / Promociones y seleccioná el período de análisis.",
          "Revisá los indicadores y gráficos disponibles antes de sacar conclusiones sobre los socios o las promociones.",
          "Utilizá las opciones de exportación si necesitás conservar los resultados del período."
        ],
        "en": [
          "Open Finance and BI > Member BI / Promotions and select the analysis period.",
          "Review the available indicators and charts before drawing conclusions about members or promotions.",
          "Use the export options if you need to keep the results for the selected period."
        ]
      },
      "/dashboard/socios-ranking-bonificacion": {
        "es": [
          "Abrí Finanzas y BI > Ranking / Bonificación para consultar las posiciones y las bonificaciones registradas.",
          "Antes de confirmar cualquier bonificación, revisá el socio seleccionado y las condiciones aplicables."
        ],
        "en": [
          "Open Finance and BI > Ranking / Bonuses to review positions and recorded bonuses.",
          "Before confirming any bonus, verify the selected member and applicable conditions."
        ]
      }
    },
    relatedPaths: [
      '/dashboard/bi-socios-demografia-promociones',
      '/dashboard/socios-ranking-bonificacion',
    ],
  },
  {
    id: 'admin-rag-corpus',
    manualRole: 'admin',
    category: {
      es: 'IA y RAG',
      en: 'AI and RAG',
    },
    title: {
      es: 'Consultar y actualizar el corpus RAG',
      en: 'Review and update the RAG corpus',
    },
    summary: {
      es: 'Revisá la cobertura del corpus del Coach IA y, cuando tengas autorización operativa, ejecutá tandas controladas de ingesta o vectorización.',
      en: 'Review AI Coach corpus coverage and, when operationally authorized, run controlled ingestion or vectorization batches.',
    },
    keywords: {
      es: 'rag corpus coach ia ingesta ejercicios dietas vectorizar pendientes limites',
      en: 'rag corpus ai coach ingestion exercises diets vectorize pending limits',
    },
    steps: {
      es: [
        'Si la sección está disponible para tu cuenta, entrá a IA y RAG > RAG Corpus.',
        'Consultá el estado del corpus y revisá la cobertura de ejercicios, dietas y los dominios disponibles.',
        'Antes de ejecutar una tanda, verificá el límite de elementos y la demora configurada entre operaciones.',
        'Elegí la acción necesaria: ingestar ejercicios, ingestar dietas, vectorizar pendientes o ejecutar una tanda completa.',
        'Revisá el resultado de la última ejecución y los mensajes de error antes de iniciar otra tanda.',
      ],
      en: [
        'If the section is available to your account, open AI and RAG > RAG Corpus.',
        'Review corpus status and check coverage for exercises, diets and available domains.',
        'Before running a batch, verify the item limit and configured delay between operations.',
        'Choose the required action: ingest exercises, ingest diets, vectorize pending items or run a full batch.',
        'Review the latest run result and any error messages before starting another batch.',
      ],
    },
    tips: {
      es: [
        'La ejecución de tandas modifica el corpus: realizala únicamente cuando esté autorizada y revisá los resultados antes de continuar.',
      ],
      en: [
        'Running batches changes the corpus: perform this operation only when authorized and review the results before proceeding.',
      ],
    },
    relatedPaths: ['/dashboard/rag-corpus'],
  },
  {
    id: 'admin-business-export',
    manualRole: 'admin',
    category: {
      es: 'Comunicación y soporte',
      en: 'Communication and support',
    },
    title: {
      es: 'Exportar los datos operativos del gimnasio',
      en: 'Export gym operational data',
    },
    summary: {
      es: 'Seleccioná los módulos del negocio que necesitás exportar, descargá un archivo Excel o JSON y consultá el historial disponible.',
      en: 'Select the business modules you need to export, download an Excel or JSON file, and review the available history.',
    },
    keywords: {
      es: 'respaldo exportacion negocio excel json modulos historial descarga',
      en: 'backup business export excel json modules history download',
    },
    steps: {
      es: [
        'Si la sección está disponible para tu cuenta, entrá a Comunicación y Soporte > Respaldo / Exportación.',
        'Revisá la lista de módulos exportables y seleccioná únicamente los datos operativos que necesitás.',
        'Elegí Excel o JSON y esperá a que finalice la generación y descarga del archivo.',
        'Comprobá que el archivo descargado corresponda a la selección solicitada y guardalo en una ubicación autorizada.',
        'Consultá el historial reciente para revisar las exportaciones registradas.',
      ],
      en: [
        'If the section is available to your account, open Communication and Support > Backup / Export.',
        'Review the exportable modules and select only the operational data you need.',
        'Choose Excel or JSON and wait for file generation and download to finish.',
        'Check that the downloaded file matches your selection and store it in an authorized location.',
        'Review recent history to inspect recorded exports.',
      ],
    },
    tips: {
      es: [
        'Una exportación descargada puede contener datos del gimnasio y de sus socios. Compartila únicamente con personas autorizadas. Esta pantalla documenta la exportación, no un procedimiento de restauración.',
      ],
      en: [
        'A downloaded export may contain gym and member data. Share it only with authorized people. This screen documents exporting, not a restoration procedure.',
      ],
    },
    relatedPaths: ['/dashboard/respaldo-negocio'],
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
    stepsByPath: {
      "/dashboard/mensajes-admin": {
        "es": [
          "Entrá a Mensajes Socios para revisar las consultas pendientes."
        ],
        "en": [
          "Open Member Messages to review pending questions."
        ]
      },
      "/dashboard/avisos": {
        "es": [
          "Abrí Avisos para comunicar novedades mediante esa sección."
        ],
        "en": [
          "Open Notices to communicate updates through that section."
        ]
      },
      "/dashboard/notificaciones": {
        "es": [
          "Abrí Notificaciones para comunicar novedades mediante esa sección."
        ],
        "en": [
          "Open Notifications to communicate updates through that section."
        ]
      },
      "/dashboard/soporte-dragon-pyramid": {
        "es": [
          "Abrí Soporte Dragon Pyramid para incidencias técnicas o dudas del sistema."
        ],
        "en": [
          "Open Dragon Pyramid Support for technical issues or system questions."
        ]
      }
    },
    relatedPaths: ['/dashboard/mensajes-admin', '/dashboard/avisos', '/dashboard/notificaciones', '/dashboard/soporte-dragon-pyramid'],
  },
  {
    id: 'admin-personal-profile',
    manualRole: 'admin',
    category: {
      es: 'Configuración personal',
      en: 'Personal settings',
    },
    title: {
      es: 'Consultar tu perfil de personal',
      en: 'Review your staff profile',
    },
    summary: {
      es: 'Revisá los datos de tu cuenta, tu foto de perfil y los accesos rápidos disponibles para tu rol.',
      en: 'Review your account details, profile photo and quick links available to your role.',
    },
    keywords: {
      es: 'perfil personal cuenta administrador usuario interno foto accesos rapidos',
      en: 'staff profile account administrator internal user photo quick links',
    },
    steps: {
      es: [
        'Entrá a Configuración personal > Perfil.',
        'Revisá los datos principales de tu cuenta y el rol que figura en la pantalla.',
        'Consultá tu foto de perfil y utilizá sus opciones de actualización si necesitás cambiarla.',
        'Usá los accesos rápidos que correspondan a los módulos habilitados para tu cuenta.',
      ],
      en: [
        'Open Personal settings > Profile.',
        'Review your main account details and the role displayed on the screen.',
        'Check your profile photo and use its update options if you need to change it.',
        'Use quick links for modules available to your account.',
      ],
    },
    tips: {
      es: [
        'Tu perfil personal no es la pantalla para cambiar los permisos de otros usuarios ni la configuración general del gimnasio.',
      ],
      en: [
        'Your personal profile is not the screen for changing other users’ permissions or the gym’s general settings.',
      ],
    },
    relatedPaths: ['/dashboard/perfil'],
  },
  {
    id: 'admin-personal-preferences',
    manualRole: 'admin',
    category: {
      es: 'Configuración personal',
      en: 'Personal settings',
    },
    title: {
      es: 'Ajustar tus preferencias personales',
      en: 'Adjust your personal preferences',
    },
    summary: {
      es: 'Revisá las opciones de experiencia de tu cuenta, cambiá el idioma o accedé al cambio de contraseña.',
      en: 'Review your account experience options, change the language or open the password change screen.',
    },
    keywords: {
      es: 'preferencias personales idioma notificaciones resumen recordatorios apariencia contraseña',
      en: 'personal preferences language notifications summary reminders appearance password',
    },
    steps: {
      es: [
        'Entrá a Configuración personal > Preferencias.',
        'Revisá las opciones disponibles de notificaciones, resúmenes, recordatorios y apariencia.',
        'Usá el selector de idioma si necesitás cambiar el idioma de la interfaz.',
        'Elegí Guardar preferencias para conservar los ajustes de esa pantalla en el navegador.',
        'Si necesitás actualizar tu contraseña, utilizá el acceso a Cambiar contraseña.',
      ],
      en: [
        'Open Personal settings > Preferences.',
        'Review the available notification, summary, reminder and appearance options.',
        'Use the language selector if you need to change the interface language.',
        'Choose Save preferences to keep that screen’s settings in the browser.',
        'If you need to update your password, use the Change password link.',
      ],
    },
    tips: {
      es: [
        'Estas preferencias de experiencia se guardan localmente en el navegador; no equivalen a cambiar la parametrización general del gimnasio.',
      ],
      en: [
        'These experience preferences are stored locally in the browser; they do not change the gym’s general configuration.',
      ],
    },
    relatedPaths: ['/dashboard/settings/preferences'],
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
    id: 'socio-attendance-control',
    manualRole: 'socio',
    category: {
      es: 'Asistencia',
      en: 'Attendance',
    },
    title: {
      es: 'Registrar tu asistencia mediante QR',
      en: 'Register your attendance using QR',
    },
    summary: {
      es: 'Usá el lector QR del Control de Asistencia y revisá el resultado del registro.',
      en: 'Use the Attendance Control QR scanner and review the registration result.',
    },
    keywords: {
      es: 'asistencia ingreso salida qr camara acceso gimnasio',
      en: 'attendance check-in check-out qr camera gym access',
    },
    steps: {
      es: [
        'Entrá a Mi Gimnasio > Control de Asistencia.',
        'Permití el acceso a la cámara cuando el navegador lo solicite y enfocá el código QR habilitado para el registro.',
        'Revisá el mensaje en pantalla para conocer el resultado del ingreso o la salida.',
        'Si aparece un aviso de deuda, cuenta desactivada o problema con la cámara, consultá con la administración del gimnasio.',
      ],
      en: [
        'Open My Gym > Attendance Control.',
        'Allow camera access when requested by the browser and scan the QR code provided for attendance registration.',
        'Review the on-screen message to check the result of your check-in or check-out.',
        'If a payment alert, deactivated-account notice or camera problem appears, contact gym administration.',
      ],
    },
    relatedPaths: ['/dashboard/control-asistencia'],
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
