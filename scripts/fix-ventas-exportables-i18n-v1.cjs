const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'ventas', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');
const BACKUP_SUFFIX = '.bak_exportables_i18n_ventas_v1';
const VENTA_FILTER_MARKER = "const VENTA_FILTER_LABELS: Record<VentaFilter, string> = {\n  todas: 'Todas',\n  socio: 'Socios',\n  consumidor_final: 'Consumidor final',\n  visitante: 'Visitantes',\n  anuladas: 'Anuladas',\n};\n";
const VENTA_EXPORT_HELPERS = "function ventaExportTx(locale: string, es: string, en: string) {\n  return locale === 'en' ? en : es;\n}\n\nfunction normalizeVentaExportText(value?: string | null) {\n  return String(value ?? '')\n    .trim()\n    .normalize('NFD')\n    .replace(/[\u0300-\u036f]/g, '')\n    .toLowerCase()\n    .replace(/[\\s-]+/g, '_');\n}\n\nconst VENTA_EXPORT_TEXTS: Record<string, string> = {\n  socio: 'Member',\n  socios: 'Members',\n  miembro: 'Member',\n  member: 'Member',\n  consumidor_final: 'Final consumer',\n  consumidor: 'Consumer',\n  consumidor_final_label: 'Final consumer',\n  visitante: 'Visitor',\n  visitantes: 'Visitors',\n  efectivo: 'Cash',\n  cash: 'Cash',\n  debito: 'Debit card',\n  credito: 'Credit card',\n  tarjeta_de_debito: 'Debit card',\n  tarjeta_de_credito: 'Credit card',\n  transferencia: 'Bank transfer',\n  mercado_pago: 'Mercado Pago',\n  stripe: 'Stripe',\n  pagada: 'Paid',\n  pagado: 'Paid',\n  paid: 'Paid',\n  anulada: 'Cancelled',\n  anulado: 'Cancelled',\n  cancelada: 'Cancelled',\n  cancelled: 'Cancelled',\n  sin_detalle: 'No details',\n  producto: 'Product',\n  servicio: 'Service',\n  todos: 'All',\n  todas: 'All',\n  sin_busqueda: 'no search',\n  final_consumer: 'Final consumer',\n};\n\nfunction translateVentaExportText(locale: string, value?: string | null, fallback = '') {\n  const original = String(value ?? fallback ?? '').trim();\n  if (!original) return '';\n  if (locale !== 'en') return original;\n\n  const normalized = normalizeVentaExportText(original);\n  if (normalized === 'consumidor_final') return 'Final consumer';\n  if (normalized === 'consumidor_final_label') return 'Final consumer';\n\n  return VENTA_EXPORT_TEXTS[normalized] ?? original;\n}\n\nfunction getVentaClienteExportLabel(locale: string, venta: Venta) {\n  const label = getVentaClienteLabel(venta);\n  return translateVentaExportText(locale, label);\n}\n\nfunction getVentaItemsExportLabel(locale: string, venta: Venta) {\n  const detalles = venta.venta_detalle ?? venta.detalles ?? [];\n  if (!detalles.length) return ventaExportTx(locale, 'Sin detalle', 'No details');\n\n  return detalles\n    .map((detalle) => {\n      const nombre =\n        detalle.item_tipo === 'servicio'\n          ? detalle.servicio?.nombre ?? ventaExportTx(locale, 'Servicio', 'Service')\n          : detalle.producto?.nombre ?? ventaExportTx(locale, 'Producto', 'Product');\n      return `${detalle.cantidad} x ${nombre}`;\n    })\n    .join(' | ');\n}\n\nfunction ventaFilterExportLabel(locale: string, filter: VentaFilter) {\n  return translateVentaExportText(locale, VENTA_FILTER_LABELS[filter] ?? filter);\n}\n\nfunction formatVentaExportDate(locale: string, value?: string | null) {\n  const raw = String(value ?? '').trim();\n  if (!raw) return '';\n  const date = new Date(raw);\n  if (Number.isNaN(date.getTime())) return formatFrontendDate(raw);\n\n  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR').format(date);\n}\n\nfunction getVentaDateRangeExportLabel(locale: string, from: string, to: string) {\n  if (from && to) {\n    return `${ventaExportTx(locale, 'Per\u00edodo', 'Period')}: ${formatVentaExportDate(locale, from)} ${ventaExportTx(locale, 'a', 'to')} ${formatVentaExportDate(locale, to)}`;\n  }\n\n  if (from) return `${ventaExportTx(locale, 'Desde', 'From')}: ${formatVentaExportDate(locale, from)}`;\n  if (to) return `${ventaExportTx(locale, 'Hasta', 'To')}: ${formatVentaExportDate(locale, to)}`;\n  return `${ventaExportTx(locale, 'Per\u00edodo', 'Period')}: ${ventaExportTx(locale, 'todos', 'all')}`;\n}\n\nfunction getVentasExportFiltersLabel(\n  locale: string,\n  ventaFilter: VentaFilter,\n  dateFrom: string,\n  dateTo: string,\n  searchTerm: string,\n) {\n  const search = searchTerm.trim();\n  return `${ventaExportTx(locale, 'Filtro', 'Filter')}: ${ventaFilterExportLabel(locale, ventaFilter)} \u00b7 ${getVentaDateRangeExportLabel(locale, dateFrom, dateTo)}${search ? ` \u00b7 ${ventaExportTx(locale, 'B\u00fasqueda', 'Search')}: ${search}` : ''}`;\n}\n";
const VENTA_EXPORT_EXCEL_BLOCK = "  const handleExportExcel = async () => {\n    const workbook = new ExcelJS.Workbook();\n    const worksheet = workbook.addWorksheet(ventaExportTx(locale, \"Ventas\", \"Sales\"));\n\n    worksheet.columns = [\n      { header: ventaExportTx(locale, \"Cliente\", \"Customer\"), key: \"cliente\", width: 30 },\n      { header: ventaExportTx(locale, \"Tipo cliente\", \"Customer type\"), key: \"cliente_tipo\", width: 18 },\n      { header: ventaExportTx(locale, \"Documento\", \"Document\"), key: \"cliente_documento\", width: 18 },\n      { header: ventaExportTx(locale, \"\u00cdtems\", \"Items\"), key: \"items\", width: 60 },\n      { header: ventaExportTx(locale, \"M\u00e9todo de pago\", \"Payment method\"), key: \"metodo_pago\", width: 18 },\n      { header: ventaExportTx(locale, \"Estado\", \"Status\"), key: \"estado\", width: 14 },\n      { header: \"Total\", key: \"total\", width: 15 },\n      { header: ventaExportTx(locale, \"Fecha\", \"Date\"), key: \"fecha\", width: 16 },\n      { header: ventaExportTx(locale, \"Comprobante\", \"Receipt\"), key: \"comprobante\", width: 24 },\n    ];\n\n    filteredVentas.forEach((venta) => {\n      const estado = venta.estado ?? (venta.activo === false ? \"anulada\" : \"pagada\");\n\n      worksheet.addRow({\n        cliente: getVentaClienteExportLabel(locale, venta),\n        cliente_tipo: translateVentaExportText(locale, venta.cliente_tipo ?? \"consumidor_final\"),\n        cliente_documento: venta.cliente_documento ?? \"\",\n        items: getVentaItemsExportLabel(locale, venta),\n        metodo_pago: translateVentaExportText(locale, venta.metodo_pago ?? \"efectivo\"),\n        estado: translateVentaExportText(locale, estado),\n        total: venta.total,\n        fecha: formatVentaExportDate(locale, venta.fecha),\n        comprobante: venta.comprobante_codigo ?? \"\",\n      });\n    });\n\n    worksheet.getRow(1).font = { bold: true };\n    worksheet.views = [{ state: \"frozen\", ySplit: 1 }];\n\n    const buffer = await workbook.xlsx.writeBuffer();\n    const blob = new Blob([buffer], {\n      type: \"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\n    });\n    const url = window.URL.createObjectURL(blob);\n    const a = document.createElement(\"a\");\n    a.href = url;\n    a.download = buildTimestampedDownloadFileName(\n      ventaExportTx(locale, \"listado-ventas-kiosco\", \"kiosk-sales-list\"),\n      \"xlsx\",\n    );\n    a.click();\n    window.URL.revokeObjectURL(url);\n  };\n\n\n";
const VENTA_EXPORT_PDF_BLOCK = "  const handleDownloadPdf = async () => {\n    try {\n      await downloadCommercialReportPdf({\n        title: ventaExportTx(locale, \"Listado de Ventas\", \"Sales list\"),\n        subtitle: ventaExportTx(\n          locale,\n          \"Ventas de kiosco a socios, visitantes y consumidores finales.\",\n          \"Kiosk sales to members, visitors, and final consumers.\",\n        ),\n        fileName: ventaExportTx(locale, \"listado-ventas-kiosco\", \"kiosk-sales-list\"),\n        locale,\n        footerText: ventaExportTx(\n          locale,\n          \"Documento generado por Gym Master.\",\n          \"Document generated by Gym Master.\",\n        ),\n        labels: {\n          generated: ventaExportTx(locale, \"Generado\", \"Generated\"),\n          page: ventaExportTx(locale, \"P\u00e1gina\", \"Page\"),\n          of: ventaExportTx(locale, \"de\", \"of\"),\n          detail: ventaExportTx(locale, \"Detalle\", \"Details\"),\n          records: ventaExportTx(locale, \"registros\", \"records\"),\n          empty: ventaExportTx(\n            locale,\n            \"No hay registros para el filtro seleccionado.\",\n            \"No records found for the selected filter.\",\n          ),\n        },\n        rows: filteredVentas,\n        metrics: [\n          { label: ventaExportTx(locale, \"Ventas activas\", \"Active sales\"), value: metrics.activas },\n          { label: ventaExportTx(locale, \"Total vendido\", \"Total sold\"), value: formatCurrencyARS(metrics.totalVendido) },\n          { label: ventaExportTx(locale, \"\u00cdtems vendidos\", \"Items sold\"), value: metrics.itemsVendidos },\n          { label: ventaExportTx(locale, \"Anuladas\", \"Cancelled\"), value: metrics.anuladas },\n        ],\n        filtersLabel: getVentasExportFiltersLabel(locale, ventaFilter, dateFrom, dateTo, searchTerm),\n        columns: [\n          { header: ventaExportTx(locale, \"Cliente\", \"Customer\"), width: 34, getValue: (venta) => getVentaClienteExportLabel(locale, venta) },\n          { header: ventaExportTx(locale, \"Tipo\", \"Type\"), width: 20, getValue: (venta) => translateVentaExportText(locale, venta.cliente_tipo ?? \"consumidor_final\") },\n          { header: ventaExportTx(locale, \"Detalle\", \"Detail\"), width: 72, getValue: (venta) => getVentaItemsExportLabel(locale, venta) },\n          { header: ventaExportTx(locale, \"M\u00e9todo\", \"Method\"), width: 20, getValue: (venta) => translateVentaExportText(locale, venta.metodo_pago ?? \"efectivo\") },\n          { header: \"Total\", width: 22, getValue: (venta) => formatCurrencyARS(venta.total), align: \"right\" },\n          { header: ventaExportTx(locale, \"Fecha\", \"Date\"), width: 18, getValue: (venta) => formatVentaExportDate(locale, venta.fecha) },\n          { header: ventaExportTx(locale, \"Estado\", \"Status\"), width: 18, getValue: (venta) => translateVentaExportText(locale, venta.estado ?? (venta.activo === false ? \"anulada\" : \"pagada\")) },\n        ],\n      });\n    } catch {\n      toast.error(ventaExportTx(locale, \"No se pudo generar el PDF de ventas\", \"Could not generate the sales PDF\"));\n    }\n  };";

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

function patchVentasPage() {
  let content = read(pagePath).replace(/\r\n/g, '\n');
  backup(pagePath);

  if (
    content.includes('function getVentaClienteExportLabel(') &&
    content.includes('workbook.addWorksheet(ventaExportTx(locale, "Ventas", "Sales"))') &&
    content.includes('title: ventaExportTx(locale, "Listado de Ventas", "Sales list")') &&
    content.includes('filtersLabel: getVentasExportFiltersLabel(locale, ventaFilter, dateFrom, dateTo, searchTerm)')
  ) {
    console.log('[OK] ventas/page.tsx ya tiene exportables ES/EN.');
    return;
  }

  if (!content.includes('function getVentaClienteExportLabel(')) {
    if (!content.includes(VENTA_FILTER_MARKER)) {
      throw new Error('No se pudo ubicar VENTA_FILTER_LABELS para insertar helpers de exportación.');
    }
    content = content.replace(VENTA_FILTER_MARKER, `${VENTA_FILTER_MARKER}
${VENTA_EXPORT_HELPERS}`);
  }

  const startExcel = content.indexOf('  const handleExportExcel = async () => {');
  const startPdf = content.indexOf('  const handleDownloadPdf = async () => {');
  if (startExcel === -1 || startPdf === -1 || startPdf <= startExcel) {
    throw new Error('No se pudo ubicar handleExportExcel/handleDownloadPdf en ventas/page.tsx.');
  }

  content = content.slice(0, startExcel) + VENTA_EXPORT_EXCEL_BLOCK + content.slice(startPdf);

  const startPdf2 = content.indexOf('  const handleDownloadPdf = async () => {');
  const endPdf = content.indexOf('\n\n  useEffect(() => {\n    if (isInitialized && isAuthenticated)', startPdf2);
  if (startPdf2 === -1 || endPdf === -1 || endPdf <= startPdf2) {
    throw new Error('No se pudo ubicar el final de handleDownloadPdf en ventas/page.tsx.');
  }

  content = content.slice(0, startPdf2) + VENTA_EXPORT_PDF_BLOCK + content.slice(endPdf);

  ensureContains(content, 'function getVentaClienteExportLabel(', 'No se insertaron helpers de ventas exportables.');
  ensureContains(content, 'workbook.addWorksheet(ventaExportTx(locale, "Ventas", "Sales"))', 'No se internacionalizó la hoja Excel.');
  ensureContains(content, 'title: ventaExportTx(locale, "Listado de Ventas", "Sales list")', 'No se internacionalizó título PDF.');
  ensureContains(content, 'filtersLabel: getVentasExportFiltersLabel(locale, ventaFilter, dateFrom, dateTo, searchTerm)', 'No se internacionalizaron filtros PDF.');
  ensureContains(content, 'ventaExportTx(locale, "listado-ventas-kiosco", "kiosk-sales-list")', 'No se internacionalizó nombre de archivo Excel.');

  write(pagePath, content);
  console.log('[OK] src/app/dashboard/ventas/page.tsx actualizado.');
}

patchCommercialReportPdfLocaleSupport();
patchVentasPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
