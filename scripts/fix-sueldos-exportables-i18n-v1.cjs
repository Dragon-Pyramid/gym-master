const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sueldosPath = path.join(root, 'src', 'app', 'dashboard', 'empleados-sueldos', 'page.tsx');
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
  const backupPath = `${filePath}.bak_exportables_sueldos_i18n_v1`;
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

const helperBlock = `
function salaryExportTx(locale: string, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeSalaryExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[\\s_-]+/g, " ")
    .replace(/\\s*\\/\\s*/g, " / ");
}

const SALARY_EXPORT_DYNAMIC_TRANSLATIONS: Record<string, string> = {
  "sueldo mensual demo": "Demo monthly salary",
  "sueldo mensual": "Monthly salary",
  "liquidacion mensual": "Monthly payroll settlement",
  "ajuste sueldo": "Salary adjustment",
  "bono productividad": "Productivity bonus",
  "bono asistencia": "Attendance bonus",
  "descuento anticipo": "Advance discount",
};

const SALARY_PAYMENT_METHOD_EXPORT_TRANSLATIONS: Record<string, string> = {
  "efectivo": "Cash",
  "transferencia": "Bank transfer",
  "mercado pago": "Mercado Pago",
  "mercado_pago": "Mercado Pago",
  "stripe": "Stripe",
  "tarjeta debito": "Debit card",
  "tarjeta de debito": "Debit card",
  "tarjeta credito": "Credit card",
  "tarjeta de credito": "Credit card",
};

function translateSalaryExportText(locale: string, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (locale !== "en") return raw;
  return SALARY_EXPORT_DYNAMIC_TRANSLATIONS[normalizeSalaryExportText(raw)] ?? raw;
}

function salaryStatusExportLabel(locale: string, estado?: string | null) {
  const normalized = normalizeSalaryExportText(estado);

  if (["pagado", "paid"].includes(normalized)) {
    return salaryExportTx(locale, "Pagado", "Paid");
  }

  if (["pendiente", "pending"].includes(normalized)) {
    return salaryExportTx(locale, "Pendiente", "Pending");
  }

  if (["anulado", "cancelado", "void", "voided", "cancelled"].includes(normalized)) {
    return salaryExportTx(locale, "Anulado", "Voided");
  }

  return String(estado ?? "-");
}

function salaryPaymentMethodLabel(locale: string, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";
  if (locale !== "en") return raw;
  return SALARY_PAYMENT_METHOD_EXPORT_TRANSLATIONS[normalizeSalaryExportText(raw)] ?? raw;
}

function salaryConceptLabel(locale: string, value?: string | null) {
  return translateSalaryExportText(locale, value) || "-";
}
`;

function patchSueldosPage() {
  let content = read(sueldosPath).replace(/\r\n/g, '\n');
  backup(sueldosPath);

  if (!content.includes('function salaryExportTx(')) {
    content = content.replace(
      `type EstadoFilter = "todos" | EmpleadoSueldoEstado;`,
      `type EstadoFilter = "todos" | EmpleadoSueldoEstado;\n${helperBlock}`
    );
  }

  content = content.replace(
    /function estadoLabel\(estado: EstadoFilter\) \{[\s\S]*?\n\}/,
    `function estadoLabel(estado: EstadoFilter, locale = "es") {\n  if (estado === "todos") return salaryExportTx(locale, "Todos", "All");\n  return salaryStatusExportLabel(locale, estado);\n}`
  );

  content = content.replace(/estadoLabel\(estadoFilter\)/g, 'estadoLabel(estadoFilter, locale)');

  // Excel: nombre de hoja, headers, valores dinámicos y file name.
  content = content.replace(/const sheet = workbook\.addWorksheet\(["']Sueldos empleados["']\);/g,
    `const sheet = workbook.addWorksheet(salaryExportTx(locale, "Sueldos empleados", "Employee salaries"));`
  );

  const excelAndPdfHeaders = [
    ["Empleado", "Employee"],
    ["Periodo", "Period"],
    ["Concepto", "Concept"],
    ["Base", "Base"],
    ["Bonos", "Bonuses"],
    ["Descuentos", "Discounts"],
    ["Neto", "Net"],
    ["Estado", "Status"],
    ["Medio de pago", "Payment method"],
    ["Fecha de pago", "Payment date"],
    ["Pago", "Payment"],
    ["Medio", "Method"],
    ["Desc.", "Disc."],
  ];

  for (const [es, en] of excelAndPdfHeaders) {
    const escaped = es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    content = content.replace(new RegExp(`header:\\s*["']${escaped}["']`, 'g'),
      `header: salaryExportTx(locale, "${es}", "${en}")`
    );
  }

  content = content.replace(/concepto:\s*sueldo\.concepto,/g,
    `concepto: salaryConceptLabel(locale, sueldo.concepto),`
  );
  content = content.replace(/estado:\s*sueldo\.estado,/g,
    `estado: salaryStatusExportLabel(locale, sueldo.estado),`
  );
  content = content.replace(/medio:\s*sueldo\.medio_pago\s*\?\?\s*["'][^"']*["'],/g,
    `medio: salaryPaymentMethodLabel(locale, sueldo.medio_pago),`
  );
  content = content.replace(/link\.download\s*=\s*buildTimestampedDownloadFileName\(["']listado-sueldos-empleados["'],\s*["']xlsx["']\);/g,
    `link.download = buildTimestampedDownloadFileName(salaryExportTx(locale, "listado-sueldos-empleados", "employee-salaries-list"), "xlsx");`
  );

  // PDF listado general.
  content = content.replace(/title:\s*["']Sueldos de empleados["'],/g,
    `title: salaryExportTx(locale, "Sueldos de empleados", "Employee salaries"),`
  );
  content = content.replace(/subtitle:\s*["']Liquidaciones, pagos y recibos del personal\.["'],/g,
    `subtitle: salaryExportTx(locale, "Liquidaciones, pagos y recibos del personal.", "Payroll settlements, payments, and staff receipts."),`
  );
  content = content.replace(/fileName:\s*buildTimestampedDownloadFileName\(["']listado-sueldos-empleados["'],\s*["']pdf["']\),/g,
    `fileName: buildTimestampedDownloadFileName(salaryExportTx(locale, "listado-sueldos-empleados", "employee-salaries-list"), "pdf"),\n      locale: locale === "en" ? "en" : "es",\n      footerText: salaryExportTx(locale, "Documento generado por Gym Master.", "Document generated by Gym Master."),`
  );

  const metricReplacements = [
    [/\{\s*label:\s*["']Registros["'],\s*value:\s*totals\.total\s*\}/g, `{ label: salaryExportTx(locale, "Registros", "Records"), value: totals.total }`],
    [/\{\s*label:\s*["']Total neto["'],\s*value:\s*formatCurrencyARS\(totals\.neto\)\s*\}/g, `{ label: salaryExportTx(locale, "Total neto", "Total net"), value: formatCurrencyARS(totals.neto) }`],
    [/\{\s*label:\s*["']Pagado["'],\s*value:\s*formatCurrencyARS\(totals\.pagado\)\s*\}/g, `{ label: salaryExportTx(locale, "Pagado", "Paid"), value: formatCurrencyARS(totals.pagado) }`],
    [/\{\s*label:\s*["']Pendiente["'],\s*value:\s*formatCurrencyARS\(totals\.pendiente\)\s*\}/g, `{ label: salaryExportTx(locale, "Pendiente", "Pending"), value: formatCurrencyARS(totals.pendiente) }`],
  ];
  for (const [regex, replacement] of metricReplacements) {
    content = content.replace(regex, replacement);
  }

  const filtersLabelGeneralReplacement = 'filtersLabel: `${salaryExportTx(locale, "Estado", "Status")}: ${estadoLabel(estadoFilter, locale)} · ${salaryExportTx(locale, "Desde", "From")}: ${periodoDesde || salaryExportTx(locale, "sin filtro", "no filter")} · ${salaryExportTx(locale, "Hasta", "To")}: ${periodoHasta || salaryExportTx(locale, "sin filtro", "no filter")} · ${salaryExportTx(locale, "Búsqueda", "Search")}: ${searchTerm || salaryExportTx(locale, "sin búsqueda", "no search")}`,';

  content = content.replace(
    /filtersLabel:\s*`Estado:\s*\$\{estadoLabel\(estadoFilter, locale\)\}\s*·\s*Desde:\s*\$\{periodoDesde \|\| ["']sin filtro["']\}\s*·\s*Hasta:\s*\$\{periodoHasta \|\| ["']sin filtro["']\}\s*·\s*Búsqueda:\s*\$\{searchTerm \|\| ["']sin búsqueda["']\}`\s*,/g,
    filtersLabelGeneralReplacement
  );

  content = content.replace(/getValue:\s*\(row\)\s*=>\s*row\.estado/g,
    `getValue: (row) => salaryStatusExportLabel(locale, row.estado)`
  );
  content = content.replace(/getValue:\s*\(row\)\s*=>\s*row\.medio_pago \?\? ["']-["']/g,
    `getValue: (row) => salaryPaymentMethodLabel(locale, row.medio_pago)`
  );
  content = content.replace(/getValue:\s*\(row\)\s*=>\s*row\.concepto/g,
    `getValue: (row) => salaryConceptLabel(locale, row.concepto)`
  );

  // PDF recibo individual.
  content = content.replace(/title:\s*["']Recibo de sueldo["'],/g,
    `title: salaryExportTx(locale, "Recibo de sueldo", "Salary receipt"),`
  );
  content = content.replace(/subtitle:\s*["']Comprobante interno de liquidación de haberes del gimnasio\.["'],/g,
    `subtitle: salaryExportTx(locale, "Comprobante interno de liquidación de haberes del gimnasio.", "Internal payroll settlement receipt for the gym."),`
  );
  const receiptFileNameReplacement = 'fileName: buildTimestampedDownloadFileName(salaryExportTx(locale, `recibo-sueldo-${sueldo.empleado?.dni ?? sueldo.id}`, `salary-receipt-${sueldo.empleado?.dni ?? sueldo.id}`), "pdf"),\n      locale: locale === "en" ? "en" : "es",';

  content = content.replace(/fileName:\s*buildTimestampedDownloadFileName\(`recibo-sueldo-\$\{sueldo\.empleado\?\.dni \?\? sueldo\.id\}`,\s*["']pdf["']\),/g,
    receiptFileNameReplacement
  );
  content = content.replace(/brandName:\s*["']Gimnasio["'],/g,
    `brandName: salaryExportTx(locale, "Gimnasio", "Gym"),`
  );
  content = content.replace(/brandSubtitle:\s*["']Recibo emitido por el gimnasio contratante["'],/g,
    `brandSubtitle: salaryExportTx(locale, "Recibo emitido por el gimnasio contratante", "Receipt issued by the contracting gym"),`
  );
  content = content.replace(/footerText:\s*["']Recibo emitido por el gimnasio contratante["'],/g,
    `footerText: salaryExportTx(locale, "Recibo emitido por el gimnasio contratante", "Receipt issued by the contracting gym"),`
  );
  content = content.replace(/\{\s*label:\s*["']Sueldo base["'],\s*value:\s*formatCurrencyARS\(sueldo\.sueldo_base\)\s*\}/g,
    `{ label: salaryExportTx(locale, "Sueldo base", "Base salary"), value: formatCurrencyARS(sueldo.sueldo_base) }`
  );
  content = content.replace(/\{\s*label:\s*["']Bonos["'],\s*value:\s*formatCurrencyARS\(sueldo\.bonos\)\s*\}/g,
    `{ label: salaryExportTx(locale, "Bonos", "Bonuses"), value: formatCurrencyARS(sueldo.bonos) }`
  );
  content = content.replace(/\{\s*label:\s*["']Descuentos["'],\s*value:\s*formatCurrencyARS\(sueldo\.descuentos\)\s*\}/g,
    `{ label: salaryExportTx(locale, "Descuentos", "Discounts"), value: formatCurrencyARS(sueldo.descuentos) }`
  );
  content = content.replace(/\{\s*label:\s*["']Neto["'],\s*value:\s*formatCurrencyARS\(sueldo\.monto_neto\)\s*\}/g,
    `{ label: salaryExportTx(locale, "Neto", "Net"), value: formatCurrencyARS(sueldo.monto_neto) }`
  );
  const filtersLabelReceiptReplacement = 'filtersLabel: `${salaryExportTx(locale, "Empleado", "Employee")}: ${sueldo.empleado?.nombre_completo ?? "-"} · DNI: ${sueldo.empleado?.dni ?? "-"} · ${salaryExportTx(locale, "Período", "Period")}: ${formatFrontendDate(sueldo.periodo)} · ${salaryExportTx(locale, "Estado", "Status")}: ${salaryStatusExportLabel(locale, sueldo.estado)}`,';

  content = content.replace(
    /filtersLabel:\s*`Empleado:\s*\$\{sueldo\.empleado\?\.nombre_completo \?\? ["']-["']\}\s*·\s*DNI:\s*\$\{sueldo\.empleado\?\.dni \?\? ["']-["']\}\s*·\s*Período:\s*\$\{formatFrontendDate\(sueldo\.periodo\)\}\s*·\s*Estado:\s*\$\{sueldo\.estado\}`\s*,/g,
    filtersLabelReceiptReplacement
  );

  ensureContains(content, 'function salaryExportTx(', 'No se pudieron insertar helpers de exportables sueldos.');
  ensureContains(content, 'Employee salaries', 'No se pudo internacionalizar título PDF/Excel de sueldos.');
  ensureContains(content, 'salaryStatusExportLabel(locale, row.estado)', 'No se pudo internacionalizar estados del PDF de sueldos.');
  ensureContains(content, 'salaryPaymentMethodLabel(locale, sueldo.medio_pago)', 'No se pudo internacionalizar medio de pago del Excel.');
  ensureContains(content, 'salary-receipt', 'No se pudo internacionalizar nombre de archivo del recibo.');

  write(sueldosPath, content);
  console.log('[OK] src/app/dashboard/empleados-sueldos/page.tsx actualizado.');
}

patchCommercialReportPdf();
patchSueldosPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
