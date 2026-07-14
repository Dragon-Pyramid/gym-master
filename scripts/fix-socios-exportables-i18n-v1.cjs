const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sociosPath = path.join(root, 'src', 'app', 'dashboard', 'socios', 'page.tsx');
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
  const backupPath = `${filePath}.bak_exportables_i18n_v1`;
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

function patchSociosPage() {
  let content = read(sociosPath).replace(/\r\n/g, '\n');
  backup(sociosPath);

  if (!content.includes('@/i18n/I18nProvider')) {
    content = content.replace(
      `import { buildSocioBaseRiskSummary, getSocioRiskToneClasses } from '@/utils/socioRiskAlerts';`,
      `import { buildSocioBaseRiskSummary, getSocioRiskToneClasses } from '@/utils/socioRiskAlerts';\nimport { useI18n } from '@/i18n/I18nProvider';\nimport type { GymMasterLocale } from '@/i18n/config';`
    );
  } else if (!content.includes("import type { GymMasterLocale } from '@/i18n/config';") && !content.includes('import type { GymMasterLocale } from "@/i18n/config";')) {
    content = content.replace(
      /import \{ useI18n \} from ['"]@\/i18n\/I18nProvider['"];?/, 
      (match) => `${match}\nimport type { GymMasterLocale } from '@/i18n/config';`
    );
  }

  if (!content.includes('function sociosExportTx(')) {
    content = content.replace(
      `const SOCIOS_PAGE_SIZE = 10;`,
      `const SOCIOS_PAGE_SIZE = 10;\n\nfunction sociosExportTx(locale: GymMasterLocale, es: string, en: string) {\n  return locale === 'en' ? en : es;\n}\n\nfunction socioSexExportLabel(locale: GymMasterLocale, value?: string | null) {\n  const normalized = String(value ?? '').trim().toLowerCase();\n  if (['m', 'masculino', 'male'].includes(normalized)) {\n    return sociosExportTx(locale, 'Masculino', 'Male');\n  }\n  if (['f', 'femenino', 'female'].includes(normalized)) {\n    return sociosExportTx(locale, 'Femenino', 'Female');\n  }\n  return '-';\n}\n\nfunction socioStatusExportLabel(locale: GymMasterLocale, active?: boolean | null) {\n  return active ? sociosExportTx(locale, 'Activo', 'Active') : sociosExportTx(locale, 'Inactivo', 'Inactive');\n}\n\nfunction sociosFilterExportLabel(locale: GymMasterLocale, filter: string) {\n  if (filter === 'activos') return sociosExportTx(locale, 'Activos', 'Active');\n  if (filter === 'inactivos') return sociosExportTx(locale, 'Inactivos', 'Inactive');\n  if (filter === 'riesgo_alto') return sociosExportTx(locale, 'Riesgo alto', 'High risk');\n  if (filter === 'riesgo_medio') return sociosExportTx(locale, 'Riesgo medio', 'Medium risk');\n  if (filter === 'seguimiento') return sociosExportTx(locale, 'Con alertas', 'With alerts');\n  return sociosExportTx(locale, 'Todos', 'All');\n}`
    );
  }

  if (!/const\s*\{\s*locale\s*\}\s*=\s*useI18n\(\)/.test(content)) {
    content = content.replace(
      `  const router = useRouter();`,
      `  const router = useRouter();\n  const { locale } = useI18n();`
    );
  }

  const replacements = [
    [`title: 'Listado de Socios',`, `title: sociosExportTx(locale, 'Listado de Socios', 'Members list'),`],
    [`subtitle: 'Reporte de socios con datos de contacto, estado y ubicación.',`, `subtitle: sociosExportTx(locale, 'Reporte de socios con datos de contacto, estado y ubicación.', 'Members report with contact details, status, and location.'),`],
    [`fileName: 'listado-socios-gym-master',`, `fileName: sociosExportTx(locale, 'listado-socios-gym-master', 'members-list-gym-master'),\n        locale: locale === 'en' ? 'en' : 'es',\n        footerText: sociosExportTx(locale, 'Documento generado por Gym Master.', 'Document generated by Gym Master.'),`],
    [`{ label: 'Socios filtrados', value: filteredSocios.length },`, `{ label: sociosExportTx(locale, 'Socios filtrados', 'Filtered members'), value: filteredSocios.length },`],
    [`{ label: 'Activos', value: filteredSocios.filter((s) => s.activo).length },`, `{ label: sociosExportTx(locale, 'Activos', 'Active'), value: filteredSocios.filter((s) => s.activo).length },`],
    [`{ label: 'Inactivos', value: filteredSocios.filter((s) => !s.activo).length },`, `{ label: sociosExportTx(locale, 'Inactivos', 'Inactive'), value: filteredSocios.filter((s) => !s.activo).length },`],
    ["filtersLabel: `Estado: ${filtroLabel}${searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ''}`,", "filtersLabel: `${sociosExportTx(locale, 'Estado', 'Status')}: ${sociosFilterExportLabel(locale, filtroActivo)}${searchTerm.trim() ? ` · ${sociosExportTx(locale, 'Búsqueda', 'Search')}: ${searchTerm.trim()}` : ''}`,"],
    [`{ header: 'Socio', width: 40, getValue: (s) => s.nombre_completo },`, `{ header: sociosExportTx(locale, 'Socio', 'Member'), width: 40, getValue: (s) => s.nombre_completo },`],
    [`{ header: 'Sexo', width: 18, getValue: (s) => (s.sexo === 'M' ? 'Masculino' : s.sexo === 'F' ? 'Femenino' : '-') },`, `{ header: sociosExportTx(locale, 'Sexo', 'Sex'), width: 18, getValue: (s) => socioSexExportLabel(locale, s.sexo) },`],
    [`{ header: 'Nacimiento', width: 24, getValue: (s) => s.fecnac || '-' },`, `{ header: sociosExportTx(locale, 'Nacimiento', 'Birth date'), width: 24, getValue: (s) => s.fecnac || '-' },`],
    [`{ header: 'Teléfono', width: 26, getValue: (s) => s.telefono || '-' },`, `{ header: sociosExportTx(locale, 'Teléfono', 'Phone'), width: 26, getValue: (s) => s.telefono || '-' },`],
    [`{ header: 'Ciudad', width: 26, getValue: (s) => s.ciudad || '-' },`, `{ header: sociosExportTx(locale, 'Ciudad', 'City'), width: 26, getValue: (s) => s.ciudad || '-' },`],
    [`{ header: 'Provincia', width: 28, getValue: (s) => s.provincia || '-' },`, `{ header: sociosExportTx(locale, 'Provincia', 'Province'), width: 28, getValue: (s) => s.provincia || '-' },`],
    [`{ header: 'Estado', width: 20, getValue: (s) => (s.activo ? 'Activo' : 'Inactivo') },`, `{ header: sociosExportTx(locale, 'Estado', 'Status'), width: 20, getValue: (s) => socioStatusExportLabel(locale, s.activo) },`],
    [`const worksheet = workbook.addWorksheet('Socios');`, `const worksheet = workbook.addWorksheet(sociosExportTx(locale, 'Socios', 'Members'));`],
    [`{ header: 'Nombre completo', key: 'nombre_completo', width: 30 },`, `{ header: sociosExportTx(locale, 'Nombre completo', 'Full name'), key: 'nombre_completo', width: 30 },`],
    [`{ header: 'Teléfono', key: 'telefono', width: 20 },`, `{ header: sociosExportTx(locale, 'Teléfono', 'Phone'), key: 'telefono', width: 20 },`],
    [`{ header: 'Dirección', key: 'direccion', width: 40 },`, `{ header: sociosExportTx(locale, 'Dirección', 'Address'), key: 'direccion', width: 40 },`],
    [`{ header: 'Fecha Alta', key: 'fecha_alta', width: 20 },`, `{ header: sociosExportTx(locale, 'Fecha Alta', 'Registration date'), key: 'fecha_alta', width: 20 },`],
    [`a.download = buildTimestampedDownloadFileName('listado-socios', 'xlsx');`, `a.download = buildTimestampedDownloadFileName(sociosExportTx(locale, 'listado-socios', 'members-list'), 'xlsx');`],
  ];

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replace(from, to);
    }
  }

  // Si la rama actual ya trae un export Excel más completo, cubrir headers/valores frecuentes sin depender del layout exacto.
  content = content.replace(/header:\s*'Sexo'/g, `header: sociosExportTx(locale, 'Sexo', 'Sex')`);
  content = content.replace(/header:\s*'Estado'/g, `header: sociosExportTx(locale, 'Estado', 'Status')`);
  content = content.replace(/header:\s*'Ciudad'/g, `header: sociosExportTx(locale, 'Ciudad', 'City')`);
  content = content.replace(/header:\s*'Provincia'/g, `header: sociosExportTx(locale, 'Provincia', 'Province')`);
  content = content.replace(/header:\s*'Nombre completo'/g, `header: sociosExportTx(locale, 'Nombre completo', 'Full name')`);
  content = content.replace(/header:\s*'Fecha Alta'/g, `header: sociosExportTx(locale, 'Fecha Alta', 'Registration date')`);
  content = content.replace(/header:\s*'Dirección'/g, `header: sociosExportTx(locale, 'Dirección', 'Address')`);
  content = content.replace(/header:\s*'Teléfono'/g, `header: sociosExportTx(locale, 'Teléfono', 'Phone')`);

  // Normalizar valores dinámicos si quedaron expresiones antiguas en exports.
  content = content.replace(/s\.sexo\s*===\s*['"]M['"]\s*\?\s*['"]Masculino['"]\s*:\s*s\.sexo\s*===\s*['"]F['"]\s*\?\s*['"]Femenino['"]\s*:\s*['"]-['"]/g, 'socioSexExportLabel(locale, s.sexo)');
  content = content.replace(/s\.activo\s*\?\s*['"]Activo['"]\s*:\s*['"]Inactivo['"]/g, 'socioStatusExportLabel(locale, s.activo)');

  ensureContains(content, 'function sociosExportTx(', 'No se pudieron insertar helpers de socios exportables.');
  ensureContains(content, 'locale: locale === \'en\' ? \'en\' : \'es\'', 'No se pudo pasar locale al PDF de socios.');
  ensureContains(content, "buildTimestampedDownloadFileName(sociosExportTx(locale, 'listado-socios', 'members-list'), 'xlsx')", 'No se pudo internacionalizar el nombre del Excel.');

  write(sociosPath, content);
  console.log('[OK] src/app/dashboard/socios/page.tsx actualizado.');
}

patchCommercialReportPdf();
patchSociosPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
