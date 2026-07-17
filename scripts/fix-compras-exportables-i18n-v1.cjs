const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'compras', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');
const BACKUP_SUFFIX = '.bak_exportables_i18n_compras_v1';
const COMPRA_FILTER_MARKER = "const COMPRA_FILTER_LABELS: Record<CompraFilter, string> = {\n  todas: 'Todas',\n  pendiente: 'Pendientes',\n  pagada: 'Pagadas',\n  anulada: 'Anuladas',\n};\n";
const COMPRA_EXPORT_HELPERS = "function compraExportTx(locale: string, es: string, en: string) {\n  return locale === 'en' ? en : es;\n}\n\nfunction normalizeCompraExportText(value?: string | null) {\n  return String(value ?? '')\n    .trim()\n    .normalize('NFD')\n    .replace(/[\\u0300-\\u036f]/g, '')\n    .toLowerCase()\n    .replace(/[\\s-]+/g, '_');\n}\n\nconst COMPRA_EXPORT_TEXTS: Record<string, string> = {\n  todas: 'All',\n  todos: 'All',\n  pendiente: 'Pending',\n  pendientes: 'Pending',\n  pagada: 'Paid',\n  pagadas: 'Paid',\n  paid: 'Paid',\n  anulada: 'Canceled',\n  anuladas: 'Canceled',\n  cancelada: 'Canceled',\n  canceled: 'Canceled',\n  cancelled: 'Canceled',\n  efectivo: 'Cash',\n  cash: 'Cash',\n  debito: 'Debit card',\n  credito: 'Credit card',\n  tarjeta_de_debito: 'Debit card',\n  tarjeta_de_credito: 'Credit card',\n  transferencia: 'Transfer',\n  transfer: 'Transfer',\n  mercado_pago: 'Mercado Pago',\n  stripe: 'Stripe',\n  otro: 'Other',\n  otros: 'Other',\n  other: 'Other',\n  proveedor_no_encontrado: 'Supplier not found',\n  sin_detalle: 'No details',\n  producto: 'Product',\n  productos: 'Products',\n};\n\nfunction translateCompraExportText(locale: string, value?: string | null, fallback = '') {\n  const original = String(value ?? fallback ?? '').trim();\n  if (!original) return '';\n  if (locale !== 'en') return original;\n\n  const normalized = normalizeCompraExportText(original);\n  return COMPRA_EXPORT_TEXTS[normalized] ?? original;\n}\n\nfunction getCompraItemsExportLabel(locale: string, compra: Compra) {\n  const detalles = compra.compra_detalle ?? compra.detalles ?? [];\n  if (!detalles.length) return compraExportTx(locale, 'Sin detalle', 'No details');\n  return detalles\n    .map((detalle) => `${detalle.cantidad} x ${detalle.producto?.nombre ?? compraExportTx(locale, 'Producto', 'Product')}`)\n    .join(' | ');\n}\n\nfunction compraFilterExportLabel(locale: string, filter: CompraFilter) {\n  return translateCompraExportText(locale, COMPRA_FILTER_LABELS[filter] ?? filter);\n}\n\nfunction formatCompraExportDate(locale: string, value?: string | null) {\n  const raw = String(value ?? '').trim();\n  if (!raw) return '';\n  const date = new Date(raw);\n  if (Number.isNaN(date.getTime())) return formatFrontendDate(raw);\n\n  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR').format(date);\n}\n\nfunction getCompraDateRangeExportLabel(locale: string, from: string, to: string) {\n  if (from && to) {\n    return `${compraExportTx(locale, 'Período', 'Period')}: ${formatCompraExportDate(locale, from)} ${compraExportTx(locale, 'a', 'to')} ${formatCompraExportDate(locale, to)}`;\n  }\n\n  if (from) return `${compraExportTx(locale, 'Desde', 'From')}: ${formatCompraExportDate(locale, from)}`;\n  if (to) return `${compraExportTx(locale, 'Hasta', 'To')}: ${formatCompraExportDate(locale, to)}`;\n  return `${compraExportTx(locale, 'Período', 'Period')}: ${compraExportTx(locale, 'todos', 'all')}`;\n}\n\nfunction getComprasExportFiltersLabel(\n  locale: string,\n  filter: CompraFilter,\n  dateFrom: string,\n  dateTo: string,\n  searchTerm: string,\n) {\n  const search = searchTerm.trim();\n  return `${compraExportTx(locale, 'Filtro', 'Filter')}: ${compraFilterExportLabel(locale, filter)} · ${getCompraDateRangeExportLabel(locale, dateFrom, dateTo)}${search ? ` · ${compraExportTx(locale, 'Búsqueda', 'Search')}: ${search}` : ''}`;\n}\n";
const COMPRA_EXPORT_EXCEL_BLOCK = "  const handleExportExcel = async () => {\n    const workbook = new ExcelJS.Workbook();\n    const worksheet = workbook.addWorksheet(compraExportTx(locale, 'Compras', 'Purchases'));\n    worksheet.columns = [\n      { header: compraExportTx(locale, 'Proveedor', 'Supplier'), key: 'proveedor', width: 30 },\n      { header: compraExportTx(locale, 'Fecha', 'Date'), key: 'fecha', width: 16 },\n      { header: compraExportTx(locale, 'Comprobante', 'Receipt'), key: 'comprobante', width: 24 },\n      { header: compraExportTx(locale, 'Estado', 'Status'), key: 'estado', width: 14 },\n      { header: compraExportTx(locale, 'Medio de pago', 'Payment method'), key: 'medio_pago', width: 18 },\n      { header: compraExportTx(locale, 'Productos', 'Products'), key: 'productos', width: 60 },\n      { header: 'Total', key: 'total', width: 15 },\n    ];\n    filteredCompras.forEach((compra) => {\n      worksheet.addRow({\n        proveedor: compra.proveedor?.nombre ?? compraExportTx(locale, 'Proveedor no encontrado', 'Supplier not found'),\n        fecha: formatCompraExportDate(locale, compra.fecha),\n        comprobante: compra.numero_comprobante ?? '',\n        estado: translateCompraExportText(locale, compra.estado),\n        medio_pago: translateCompraExportText(locale, compra.medio_pago),\n        productos: getCompraItemsExportLabel(locale, compra),\n        total: compra.total,\n      });\n    });\n    worksheet.getRow(1).font = { bold: true };\n    worksheet.views = [{ state: 'frozen', ySplit: 1 }];\n\n    const buffer = await workbook.xlsx.writeBuffer();\n    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });\n    const url = window.URL.createObjectURL(blob);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = buildTimestampedDownloadFileName(\n      compraExportTx(locale, 'listado-compras-proveedores', 'supplier-purchases-list'),\n      'xlsx',\n    );\n    a.click();\n    window.URL.revokeObjectURL(url);\n  };\n\n";
const COMPRA_EXPORT_PDF_BLOCK = "  const handleDownloadPdf = async () => {\n    try {\n      await downloadCommercialReportPdf({\n        title: compraExportTx(locale, 'Listado de Compras', 'Purchases list'),\n        subtitle: compraExportTx(\n          locale,\n          'Compras a proveedores, reposición de stock y trazabilidad comercial.',\n          'Supplier purchases, stock replenishment and commercial traceability.',\n        ),\n        fileName: compraExportTx(locale, 'listado-compras-gym-master', 'gym-master-purchases-list'),\n        locale,\n        footerText: compraExportTx(\n          locale,\n          'Documento generado por Gym Master.',\n          'Document generated by Gym Master.',\n        ),\n        labels: {\n          generated: compraExportTx(locale, 'Generado', 'Generated'),\n          page: compraExportTx(locale, 'Página', 'Page'),\n          of: compraExportTx(locale, 'de', 'of'),\n          detail: compraExportTx(locale, 'Detalle', 'Details'),\n          records: compraExportTx(locale, 'registros', 'records'),\n          empty: compraExportTx(\n            locale,\n            'No hay registros para el filtro seleccionado.',\n            'No records found for the selected filter.',\n          ),\n        },\n        rows: filteredCompras,\n        metrics: [\n          { label: compraExportTx(locale, 'Compras activas', 'Active purchases'), value: metrics.activas },\n          { label: compraExportTx(locale, 'Pendientes', 'Pending'), value: metrics.pendientes },\n          { label: compraExportTx(locale, 'Anuladas', 'Canceled'), value: metrics.anuladas },\n          { label: compraExportTx(locale, 'Total comprado', 'Total purchased'), value: formatCurrencyARS(metrics.totalComprado) },\n        ],\n        filtersLabel: getComprasExportFiltersLabel(locale, filter, dateFrom, dateTo, searchTerm),\n        columns: [\n          { header: compraExportTx(locale, 'Proveedor', 'Supplier'), width: 34, getValue: (compra) => compra.proveedor?.nombre ?? '-' },\n          { header: compraExportTx(locale, 'Fecha', 'Date'), width: 18, getValue: (compra) => formatCompraExportDate(locale, compra.fecha) },\n          { header: compraExportTx(locale, 'Comprobante', 'Receipt'), width: 24, getValue: (compra) => compra.numero_comprobante ?? '-' },\n          { header: compraExportTx(locale, 'Estado', 'Status'), width: 18, getValue: (compra) => translateCompraExportText(locale, compra.estado) },\n          { header: compraExportTx(locale, 'Productos', 'Products'), width: 70, getValue: (compra) => getCompraItemsExportLabel(locale, compra) },\n          { header: 'Total', width: 22, getValue: (compra) => formatCurrencyARS(compra.total), align: 'right' },\n        ],\n      });\n    } catch {\n      toast.error(compraExportTx(locale, 'No se pudo generar el PDF de compras', 'Could not generate the purchases PDF'));\n    }\n  };";

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
  const backupPath = `${filePath}${BACKUP_SUFFIX}`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function ensureContains(content, marker, message) {
  if (!content.includes(marker)) {
    throw new Error(message);
  }
}

function patchCommercialReportPdfLocaleSupport() {
  let content = read(pdfPath).replace(/\r\n/g, '\n');

  if (content.includes('CommercialReportLocale') && content.includes('getCommercialReportPdfLabel')) {
    console.log('[OK] commercialReportPdf.ts ya tiene soporte de locale.');
    return;
  }

  backup(pdfPath);

  content = content.replace(
    `export interface CommercialReportMetric {`,
    `export type CommercialReportLocale = "es" | "en";

export interface CommercialReportLabels {
  generated: string;
  page: string;
  of: string;
  detail: string;
  records: string;
  empty: string;
}

const DEFAULT_COMMERCIAL_REPORT_LABELS: Record<CommercialReportLocale, CommercialReportLabels> = {
  es: {
    generated: "Generado",
    page: "Página",
    of: "de",
    detail: "Detalle",
    records: "registros",
    empty: "No hay registros para el filtro seleccionado.",
  },
  en: {
    generated: "Generated",
    page: "Page",
    of: "of",
    detail: "Details",
    records: "records",
    empty: "No records found for the selected filter.",
  },
};

const getCommercialReportPdfLabel = (
  locale: CommercialReportLocale,
  labels: Partial<CommercialReportLabels> | undefined,
  key: keyof CommercialReportLabels
): string => labels?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS[locale]?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS.es[key];

export interface CommercialReportMetric {`
  );

  content = content.replace(
    `  footerText?: string;
}`,
    `  footerText?: string;
  locale?: CommercialReportLocale;
  labels?: Partial<CommercialReportLabels>;
}`
  );

  content = content.replace(
    `const formatDateTime = (): string => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
};`,
    `const formatDateTime = (locale: CommercialReportLocale = "es"): string => {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
};`
  );

  content = content.replace(
    `  brandName: string,
  brandSubtitle: string
) => {`,
    `  brandName: string,
  brandSubtitle: string,
  locale: CommercialReportLocale,
  labels?: Partial<CommercialReportLabels>
) => {`
  );

  content = content.replace(
    'doc.text(`Generado: ${formatDateTime()}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "generated")}: ${formatDateTime(locale)}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {'
  );

  content = content.replace(
    `  footerText: string,
  currentPage: number,
  totalPages: number
) => {`,
    `  footerText: string,
  currentPage: number,
  totalPages: number,
  locale: CommercialReportLocale,
  labels?: Partial<CommercialReportLabels>
) => {`
  );

  content = content.replace(
    'doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "page")} ${currentPage} ${getCommercialReportPdfLabel(locale, labels, "of")} ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {'
  );

  content = content.replace(
    `  brandName,
  brandSubtitle,
  footerText,
}: DownloadCommercialReportPdfParams<T>): Promise<void> {`,
    `  brandName,
  brandSubtitle,
  footerText,
  locale = "es",
  labels,
}: DownloadCommercialReportPdfParams<T>): Promise<void> {`
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

function patchComprasPage() {
  let content = read(pagePath).replace(/\r\n/g, '\n');
  backup(pagePath);

  if (!content.includes('function getCompraItemsExportLabel(')) {
    if (!content.includes(COMPRA_FILTER_MARKER)) {
      throw new Error('No se pudo ubicar COMPRA_FILTER_LABELS para insertar helpers de exportación.');
    }
    content = content.replace(COMPRA_FILTER_MARKER, `${COMPRA_FILTER_MARKER}\n${COMPRA_EXPORT_HELPERS}`);
  }

  const startExcel = content.indexOf('  const handleExportExcel = async () => {');
  const startPdf = content.indexOf('  const handleDownloadPdf = async () => {');
  if (startExcel === -1 || startPdf === -1 || startPdf <= startExcel) {
    throw new Error('No se pudo ubicar handleExportExcel/handleDownloadPdf en compras/page.tsx.');
  }

  content = content.slice(0, startExcel) + COMPRA_EXPORT_EXCEL_BLOCK + content.slice(startPdf);

  const startPdf2 = content.indexOf('  const handleDownloadPdf = async () => {');
  const endPdfCandidates = [
    '\n\n  if (!isInitialized)',
    '\n\n  const handleCancel',
    '\n\n  return (',
  ];
  let endPdf = -1;
  for (const marker of endPdfCandidates) {
    const idx = content.indexOf(marker, startPdf2);
    if (idx !== -1 && (endPdf === -1 || idx < endPdf)) endPdf = idx;
  }
  if (startPdf2 === -1 || endPdf === -1 || endPdf <= startPdf2) {
    throw new Error('No se pudo ubicar el final de handleDownloadPdf en compras/page.tsx.');
  }

  content = content.slice(0, startPdf2) + COMPRA_EXPORT_PDF_BLOCK + content.slice(endPdf);

  ensureContains(content, 'function getCompraItemsExportLabel(', 'No se insertaron helpers de compras exportables.');
  ensureContains(content, "workbook.addWorksheet(compraExportTx(locale, 'Compras', 'Purchases'))", 'No se internacionalizó la hoja Excel.');
  ensureContains(content, "title: compraExportTx(locale, 'Listado de Compras', 'Purchases list')", 'No se internacionalizó título PDF.');
  ensureContains(content, 'filtersLabel: getComprasExportFiltersLabel(locale, filter, dateFrom, dateTo, searchTerm)', 'No se internacionalizaron filtros PDF.');
  ensureContains(content, "page: compraExportTx(locale, 'Página', 'Page')", 'No se internacionalizó footer PDF.');

  write(pagePath, content);
  console.log('[OK] src/app/dashboard/compras/page.tsx actualizado.');
}

patchCommercialReportPdfLocaleSupport();
patchComprasPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
