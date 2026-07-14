const fs = require('fs');
const path = require('path');

const root = process.cwd();
const empleadosPath = path.join(root, 'src', 'app', 'dashboard', 'empleados', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo esperado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function backup(filePath) {
  const backupPath = `${filePath}.bak_exportables_empleados_i18n_v1`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function ensureContains(content, marker, message) {
  if (!content.includes(marker)) {
    throw new Error(message);
  }
}

function patchCommercialReportPdf() {
  if (!fs.existsSync(pdfPath)) {
    console.log('[WARN] No existe commercialReportPdf.ts. Se omite patch compartido de PDF.');
    return;
  }

  let content = read(pdfPath).replace(/\r\n/g, '\n');
  backup(pdfPath);

  if (content.includes('CommercialReportLocale') && content.includes('getCommercialReportPdfLabel')) {
    console.log('[OK] commercialReportPdf.ts ya tiene soporte de locale.');
    return;
  }

  content = content.replace(
    `export interface CommercialReportMetric {`,
    `export type CommercialReportLocale = "es" | "en";\n\nexport interface CommercialReportLabels {\n  generated: string;\n  page: string;\n  of: string;\n  detail: string;\n  records: string;\n  empty: string;\n}\n\nconst DEFAULT_COMMERCIAL_REPORT_LABELS: Record<CommercialReportLocale, CommercialReportLabels> = {\n  es: {\n    generated: "Generado",\n    page: "Página",\n    of: "de",\n    detail: "Detalle",\n    records: "registros",\n    empty: "No hay registros para el filtro seleccionado.",\n  },\n  en: {\n    generated: "Generated",\n    page: "Page",\n    of: "of",\n    detail: "Details",\n    records: "records",\n    empty: "No records found for the selected filter.",\n  },\n};\n\nconst getCommercialReportPdfLabel = (\n  locale: CommercialReportLocale,\n  labels: Partial<CommercialReportLabels> | undefined,\n  key: keyof CommercialReportLabels\n): string => labels?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS[locale]?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS.es[key];\n\nexport interface CommercialReportMetric {`
  );

  content = content.replace(
    `  footerText?: string;\n}`,
    `  footerText?: string;\n  locale?: CommercialReportLocale;\n  labels?: Partial<CommercialReportLabels>;\n}`
  );

  content = content.replace(
    `const formatDateTime = (): string => {\n  return new Intl.DateTimeFormat("es-AR", {\n    dateStyle: "short",\n    timeStyle: "short",\n  }).format(new Date());\n};`,
    `const formatDateTime = (locale: CommercialReportLocale = "es"): string => {\n  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {\n    dateStyle: "short",\n    timeStyle: "short",\n  }).format(new Date());\n};`
  );

  content = content.replace(
    `  brandName: string,\n  brandSubtitle: string\n) => {`,
    `  brandName: string,\n  brandSubtitle: string,\n  locale: CommercialReportLocale,\n  labels?: Partial<CommercialReportLabels>\n) => {`
  );

  content = content.replace(
    'doc.text(`Generado: ${formatDateTime()}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "generated")}: ${formatDateTime(locale)}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {'
  );

  content = content.replace(
    `  footerText: string,\n  currentPage: number,\n  totalPages: number\n) => {`,
    `  footerText: string,\n  currentPage: number,\n  totalPages: number,\n  locale: CommercialReportLocale,\n  labels?: Partial<CommercialReportLabels>\n) => {`
  );

  content = content.replace(
    'doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "page")} ${currentPage} ${getCommercialReportPdfLabel(locale, labels, "of")} ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {'
  );

  content = content.replace(
    `  brandName,\n  brandSubtitle,\n  footerText,\n}: DownloadCommercialReportPdfParams<T>): Promise<void> {`,
    `  brandName,\n  brandSubtitle,\n  footerText,\n  locale = "es",\n  labels,\n}: DownloadCommercialReportPdfParams<T>): Promise<void> {`
  );

  content = content.replaceAll(
    'addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle);',
    'addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle, locale, labels);'
  );

  content = content.replace(
    'doc.text(`Detalle (${rows.length} registros)`, PAGE_MARGIN, y);',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "detail")} (${rows.length} ${getCommercialReportPdfLabel(locale, labels, "records")})`, PAGE_MARGIN, y);'
  );

  content = content.replace(
    'doc.text("No hay registros para el filtro seleccionado.", PAGE_MARGIN, y + 8);',
    'doc.text(getCommercialReportPdfLabel(locale, labels, "empty"), PAGE_MARGIN, y + 8);'
  );

  content = content.replace(
    'addFooter(doc, pageWidth, pageHeight, resolvedFooterText, page, pages);',
    'addFooter(doc, pageWidth, pageHeight, resolvedFooterText, page, pages, locale, labels);'
  );

  ensureContains(content, 'locale?: CommercialReportLocale;', 'No se pudo insertar locale en DownloadCommercialReportPdfParams.');
  ensureContains(content, 'getCommercialReportPdfLabel(locale, labels, "page")', 'No se pudo internacionalizar footer del PDF.');
  write(pdfPath, content);
  console.log('[OK] src/utils/commercialReportPdf.ts actualizado.');
}

function ensureI18nImports(content) {
  if (!content.includes('useI18n') || !content.includes('@/i18n/I18nProvider')) {
    content = content.replace(
      /import \{ toast \} from ["']sonner["'];?\n/,
      (match) => `${match}import { useI18n } from "@/i18n/I18nProvider";\n`
    );
  }

  if (!content.includes('GymMasterLocale')) {
    const markerDouble = `import { useI18n } from "@/i18n/I18nProvider";`;
    const markerSingle = `import { useI18n } from '@/i18n/I18nProvider';`;
    if (content.includes(markerDouble)) {
      content = content.replace(markerDouble, `${markerDouble}\nimport type { GymMasterLocale } from "@/i18n/config";`);
    } else if (content.includes(markerSingle)) {
      content = content.replace(markerSingle, `${markerSingle}\nimport type { GymMasterLocale } from '@/i18n/config';`);
    } else {
      content = content.replace(
        /import \{ toast \} from ["']sonner["'];?\n/,
        (match) => `${match}import type { GymMasterLocale } from "@/i18n/config";\n`
      );
    }
  }

  return content;
}

const helperBlock = `
function empleadosExportTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeEmpleadoExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[\\s_-]+/g, " ")
    .replace(/\\s*\\/\\s*/g, " / ");
}

const EMPLEADO_EXPORT_DYNAMIC_TRANSLATIONS: Record<string, string> = {
  "administrativo": "Administrative",
  "administracion": "Administration",
  "administracion y caja": "Administration and cash desk",
  "recepcion y administracion": "Reception and administration",
  "caja y atencion al socio": "Cash desk and member service",
  "entrenador": "Trainer",
  "entrenadora sala musculacion": "Weight room trainer",
  "entrenamiento": "Training",
  "personal trainer": "Personal trainer",
  "mantenimiento": "Maintenance",
  "mantenimiento correctivo": "Corrective maintenance",
  "mantenimiento preventivo": "Preventive maintenance",
  "limpieza": "Cleaning",
  "limpieza tarde": "Afternoon cleaning",
  "limpieza general": "General cleaning",
  "bar / snack": "Bar / Snack",
  "atencion bar/snack": "Bar/snack service",
  "atencion bar / snack": "Bar/snack service",
  "caja bar/snack": "Bar/snack cash desk",
  "caja bar / snack": "Bar/snack cash desk",
};

function translateEmpleadoExportText(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (locale !== "en") return raw;
  return EMPLEADO_EXPORT_DYNAMIC_TRANSLATIONS[normalizeEmpleadoExportText(raw)] ?? raw;
}

function empleadoStatusExportLabel(locale: GymMasterLocale, active?: boolean | null) {
  return active === false
    ? empleadosExportTx(locale, "Inactivo", "Inactive")
    : empleadosExportTx(locale, "Activo", "Active");
}

function empleadoStatusFilterExportLabel(locale: GymMasterLocale, filter: EstadoFilter) {
  if (filter === "activos") return empleadosExportTx(locale, "Activos", "Active");
  if (filter === "inactivos") return empleadosExportTx(locale, "Inactivos", "Inactive");
  return empleadosExportTx(locale, "Todos", "All");
}
`;

function patchEmpleadosPage() {
  let content = read(empleadosPath).replace(/\r\n/g, '\n');
  backup(empleadosPath);

  content = ensureI18nImports(content);

  if (!content.includes('function empleadosExportTx(')) {
    content = content.replace(
      `type EstadoFilter = "todos" | "activos" | "inactivos";`,
      `type EstadoFilter = "todos" | "activos" | "inactivos";\n${helperBlock}`
    );
  }

  if (!/const\s*\{\s*locale\s*\}\s*=\s*useI18n\(\)/.test(content)) {
    content = content.replace(
      `  const router = useRouter();`,
      `  const router = useRouter();\n  const { locale } = useI18n();`
    );
  }

  // Excel: hoja, headers, valores y nombre del archivo.
  content = content.replace(/const worksheet = workbook\.addWorksheet\(["']Empleados["']\);/g,
    `const worksheet = workbook.addWorksheet(empleadosExportTx(locale, "Empleados", "Employees"));`
  );

  const headerReplacements = [
    ['Nombre completo', 'Full name'],
    ['Tipo', 'Type'],
    ['Puesto', 'Position'],
    ['Área', 'Area'],
    ['Teléfono', 'Phone'],
    ['Fecha alta', 'Hire date'],
    ['Sueldo base', 'Base salary'],
    ['Estado', 'Status'],
  ];

  for (const [es, en] of headerReplacements) {
    const escaped = es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    content = content.replace(new RegExp(`header:\\s*["']${escaped}["']`, 'g'),
      `header: empleadosExportTx(locale, "${es}", "${en}")`
    );
  }

  content = content.replace(/tipo:\s*empleado\.tipo_empleado\?\.nombre\s*\|\|\s*["']Sin tipo["'],/g,
    `tipo: translateEmpleadoExportText(locale, empleado.tipo_empleado?.nombre) || empleadosExportTx(locale, "Sin tipo", "No type"),`
  );
  content = content.replace(/puesto:\s*empleado\.puesto\s*\|\|\s*["']-["'],/g,
    `puesto: translateEmpleadoExportText(locale, empleado.puesto) || "-",`
  );
  content = content.replace(/area:\s*empleado\.area\s*\|\|\s*["']-["'],/g,
    `area: translateEmpleadoExportText(locale, empleado.area) || "-",`
  );
  content = content.replace(/estado:\s*empleado\.activo\s*===\s*false\s*\?\s*["']Inactivo["']\s*:\s*["']Activo["'],/g,
    `estado: empleadoStatusExportLabel(locale, empleado.activo),`
  );
  content = content.replace(/a\.download\s*=\s*buildTimestampedDownloadFileName\(["']listado-empleados["'],\s*["']xlsx["']\);/g,
    `a.download = buildTimestampedDownloadFileName(empleadosExportTx(locale, "listado-empleados", "employee-roster"), "xlsx");`
  );

  // PDF: título, subtitle, locale, métricas, filtros, columnas y valores dinámicos.
  content = content.replace(/title:\s*["']Listado de Empleados["'],/g,
    `title: empleadosExportTx(locale, "Listado de Empleados", "Employee roster"),`
  );
  content = content.replace(/subtitle:\s*["']Base operativa de empleados del gimnasio, tipos, responsabilidades y preparación para sueldos\/RBAC\.["'],/g,
    `subtitle: empleadosExportTx(locale, "Base operativa de empleados del gimnasio, tipos, responsabilidades y preparación para sueldos/RBAC.", "Operational employee base, types, responsibilities, and payroll/RBAC readiness."),`
  );
  content = content.replace(/fileName:\s*["']listado-empleados-gym-master["'],/g,
    `fileName: empleadosExportTx(locale, "listado-empleados-gym-master", "employee-roster-gym-master"),\n        locale: locale === "en" ? "en" : "es",\n        footerText: empleadosExportTx(locale, "Documento generado por Gym Master.", "Document generated by Gym Master."),`
  );

  content = content.replace(/\{\s*label:\s*["']Total["'],\s*value:\s*metrics\.total\s*\}/g,
    `{ label: empleadosExportTx(locale, "Total", "Total"), value: metrics.total }`
  );
  content = content.replace(/\{\s*label:\s*["']Activos["'],\s*value:\s*metrics\.activos\s*\}/g,
    `{ label: empleadosExportTx(locale, "Activos", "Active"), value: metrics.activos }`
  );
  content = content.replace(/\{\s*label:\s*["']Administrativos["'],\s*value:\s*metrics\.administrativos\s*\}/g,
    `{ label: empleadosExportTx(locale, "Administrativos", "Administrative"), value: metrics.administrativos }`
  );
  content = content.replace(/\{\s*label:\s*["']Nómina estimada["'],\s*value:\s*formatCurrencyARS\(metrics\.nominaEstimada\)\s*\}/g,
    `{ label: empleadosExportTx(locale, "Nómina estimada", "Estimated payroll"), value: formatCurrencyARS(metrics.nominaEstimada) }`
  );

  const filtersLabelReplacement = 'filtersLabel: `${empleadosExportTx(locale, "Estado", "Status")}: ${empleadoStatusFilterExportLabel(locale, estadoFilter)} · ${empleadosExportTx(locale, "Tipo", "Type")}: ${tipoFilter === "todos" ? empleadosExportTx(locale, "Todos", "All") : translateEmpleadoExportText(locale, tipos.find((tipo) => tipo.id === tipoFilter)?.nombre || tipoFilter)}${searchTerm.trim() ? ` · ${empleadosExportTx(locale, "Búsqueda", "Search")}: ${searchTerm.trim()}` : ""}`,';

  content = content.replace(
    /filtersLabel:\s*`Estado:\s*\$\{estadoFilter\}\s*·\s*Tipo:\s*\$\{tipoFilter\s*===\s*["']todos["']\s*\?\s*["']Todos["']\s*:\s*tipos\.find\(\(tipo\)\s*=>\s*tipo\.id\s*===\s*tipoFilter\)\?\.nombre\s*\|\|\s*tipoFilter\}\$\{searchTerm\.trim\(\)\s*\?\s*`\s*·\s*Búsqueda:\s*\$\{searchTerm\.trim\(\)\}`\s*:\s*["']{2}\}`\s*,/g,
    filtersLabelReplacement
  );

  // Fallback menos estricto para la línea de filtros si la rama actual difiere un poco.
  content = content.replace(
    /filtersLabel:\s*`Estado:[^`]+`,/g,
    filtersLabelReplacement
  );

  const pdfHeaders = [
    ['Empleado', 'Employee'],
    ['Tipo', 'Type'],
    ['Puesto', 'Position'],
    ['Área', 'Area'],
    ['Teléfono', 'Phone'],
    ['Sueldo', 'Salary'],
    ['Estado', 'Status'],
  ];

  for (const [es, en] of pdfHeaders) {
    const escaped = es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    content = content.replace(new RegExp(`header:\\s*["']${escaped}["']`, 'g'),
      `header: empleadosExportTx(locale, "${es}", "${en}")`
    );
  }

  content = content.replace(/getValue:\s*\(e\)\s*=>\s*e\.tipo_empleado\?\.nombre\s*\|\|\s*["']Sin tipo["']/g,
    `getValue: (e) => translateEmpleadoExportText(locale, e.tipo_empleado?.nombre) || empleadosExportTx(locale, "Sin tipo", "No type")`
  );
  content = content.replace(/getValue:\s*\(e\)\s*=>\s*e\.puesto\s*\|\|\s*["']-["']/g,
    `getValue: (e) => translateEmpleadoExportText(locale, e.puesto) || "-"`
  );
  content = content.replace(/getValue:\s*\(e\)\s*=>\s*e\.area\s*\|\|\s*["']-["']/g,
    `getValue: (e) => translateEmpleadoExportText(locale, e.area) || "-"`
  );
  content = content.replace(/getValue:\s*\(e\)\s*=>\s*\(e\.activo\s*===\s*false\s*\?\s*["']Inactivo["']\s*:\s*["']Activo["']\)/g,
    `getValue: (e) => empleadoStatusExportLabel(locale, e.activo)`
  );

  // Toast de PDF.
  content = content.replace(/toast\.error\(["']No se pudo generar el PDF de empleados["']\);/g,
    `toast.error(empleadosExportTx(locale, "No se pudo generar el PDF de empleados", "Could not generate the employee PDF"));`
  );

  ensureContains(content, 'function empleadosExportTx(', 'No se pudieron insertar helpers de exportables empleados.');
  ensureContains(content, 'employee-roster-gym-master', 'No se pudo internacionalizar fileName del PDF de empleados.');
  ensureContains(content, 'empleadoStatusExportLabel(locale, empleado.activo)', 'No se pudo internacionalizar estado del Excel.');
  ensureContains(content, 'translateEmpleadoExportText(locale, e.tipo_empleado?.nombre)', 'No se pudo internacionalizar tipo dinámico del PDF.');

  write(empleadosPath, content);
  console.log('[OK] src/app/dashboard/empleados/page.tsx actualizado.');
}

patchCommercialReportPdf();
patchEmpleadosPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
