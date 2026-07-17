const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'otros-gastos', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');
const BACKUP_SUFFIX = '.bak_exportables_i18n_otros_gastos_v2';

function fail(message) {
  throw new Error(message);
}

function backup(filePath) {
  if (!fs.existsSync(filePath)) fail(`No se encontró ${path.relative(root, filePath)}`);
  const backupPath = `${filePath}${BACKUP_SUFFIX}`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);
}

function writeIfChanged(filePath, before, after) {
  if (before !== after) {
    fs.writeFileSync(filePath, after);
    console.log(`[OK] ${path.relative(root, filePath)} actualizado.`);
    return true;
  }
  console.log(`[OK] ${path.relative(root, filePath)} ya estaba actualizado.`);
  return false;
}

function patchOtrosGastosPage() {
  backup(pagePath);
  let source = fs.readFileSync(pagePath, 'utf8');
  const before = source;

  // ExcelJS no permite /, \\, *, ?, :, [, ] en el nombre de una hoja.
  // Usamos un nombre fijo y seguro por idioma, sin depender de helpers ni de traducciones UI.
  const safeWorksheet = 'workbook.addWorksheet(locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos")';

  source = source.replace(
    /workbook\.addWorksheet\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*\)\s*\)/g,
    safeWorksheet,
  );

  source = source.replace(
    /workbook\.addWorksheet\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*,\s*["']Expenses\s*\/\s*Outflows["']\s*\)\s*\)/g,
    safeWorksheet,
  );

  source = source.replace(
    /workbook\.addWorksheet\(\s*c\(\s*["']Expenses\s*\/\s*Outflows["']\s*\)\s*\)/g,
    safeWorksheet,
  );

  source = source.replace(
    /workbook\.addWorksheet\(\s*["']Expenses\s*\/\s*Outflows["']\s*\)/g,
    safeWorksheet,
  );

  // Si quedó el helper viejo del v1, no molesta. Esta llamada directa evita el error real.
  if (source.includes('downloadCommercialReportPdf<OtrosGastos>({')) {
    source = source.replace(
      /downloadCommercialReportPdf<OtrosGastos>\(\{(?![\s\S]{0,260}?\blocale\b)/,
      'downloadCommercialReportPdf<OtrosGastos>({\n      locale,',
    );
  } else if (source.includes('downloadCommercialReportPdf({')) {
    source = source.replace(
      /downloadCommercialReportPdf\(\{(?![\s\S]{0,260}?\blocale\b)/,
      'downloadCommercialReportPdf({\n      locale,',
    );
  }

  if (before === source) {
    if (!source.includes('Expenses - Outflows') && !source.includes('Gastos - Egresos')) {
      fail('No se encontró la llamada workbook.addWorksheet(...) de Otros gastos para corregir el nombre de hoja.');
    }
  }

  return writeIfChanged(pagePath, before, source);
}

function ensureCommercialReportLocaleSupport() {
  backup(pdfPath);
  let source = fs.readFileSync(pdfPath, 'utf8');
  const before = source;

  if (!source.includes('GymMasterLocale')) {
    source = source.replace(
      /import \{ buildTimestampedDownloadFileName \} from ["']@\/utils\/downloadFileName["'];/,
      (match) => `${match}\nimport type { GymMasterLocale } from "@/i18n/config";`,
    );
  }

  if (!/locale\?:\s*GymMasterLocale/.test(source)) {
    source = source.replace(
      /footerText\?:\s*string;\s*\n/,
      (match) => `${match}  locale?: GymMasterLocale;\n`,
    );
  }

  source = source.replace(
    /const formatDateTime = \(\): string => \{\s*return new Intl\.DateTimeFormat\("es-AR", \{/,
    'const formatDateTime = (locale: GymMasterLocale = "es"): string => {\n  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {',
  );

  // addHeader: si está en la versión vieja, agregamos locale al parámetro final.
  source = source.replace(
    /brandSubtitle: string\n\) => \{/,
    'brandSubtitle: string,\n  locale: GymMasterLocale = "es"\n) => {',
  );

  source = source.replace(
    /doc\.text\(`Generado: \$\{formatDateTime\(\)\}`, brandX,/,
    'doc.text(`${locale === "en" ? "Generated" : "Generado"}: ${formatDateTime(locale)}`, brandX,',
  );

  // addFooter: si está en la versión vieja, agregamos locale y traducimos Page/of.
  source = source.replace(
    /totalPages: number\n\) => \{/,
    'totalPages: number,\n  locale: GymMasterLocale = "es"\n) => {',
  );

  source = source.replace(
    /doc\.text\(`Página \$\{currentPage\} de \$\{totalPages\}`, pageWidth - PAGE_MARGIN, pageHeight - 5, \{/,
    'doc.text(`${locale === "en" ? "Page" : "Página"} ${currentPage} ${locale === "en" ? "of" : "de"} ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {',
  );

  // downloadCommercialReportPdf destructuring: agregar locale con default si no existe.
  source = source.replace(
    /footerText,\n\}: DownloadCommercialReportPdfParams<T>\): Promise<void> \{/,
    'footerText,\n  locale = "es",\n}: DownloadCommercialReportPdfParams<T>): Promise<void> {',
  );

  // Footer default: en EN no usar el pie institucional español por defecto.
  source = source.replace(
    /const resolvedFooterText = footerText \?\? resolvedBranding\.piePagina;/,
    'const resolvedFooterText = footerText ?? (locale === "en" ? "Document generated by Gym Master." : resolvedBranding.piePagina);',
  );

  // Pasar locale a todos los headers/footers de la utilidad vieja.
  source = source.replace(
    /addHeader\(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle\);/g,
    'addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle, locale);',
  );

  source = source.replace(
    /addFooter\(doc, pageWidth, pageHeight, resolvedFooterText, page, pages\);/g,
    'addFooter(doc, pageWidth, pageHeight, resolvedFooterText, page, pages, locale);',
  );

  source = source.replace(
    /doc\.text\(`Detalle \(\$\{rows\.length\} registros\)`, PAGE_MARGIN, y\);/,
    'doc.text(`${locale === "en" ? "Details" : "Detalle"} (${rows.length} ${locale === "en" ? "records" : "registros"})`, PAGE_MARGIN, y);',
  );

  source = source.replace(
    /doc\.text\("No hay registros para el filtro seleccionado\.", PAGE_MARGIN, y \+ 8\);/,
    'doc.text(locale === "en" ? "No records for the selected filter." : "No hay registros para el filtro seleccionado.", PAGE_MARGIN, y + 8);',
  );

  return writeIfChanged(pdfPath, before, source);
}

patchOtrosGastosPage();
ensureCommercialReportLocaleSupport();
console.log('\nPatch v2 aplicado. Validá con: rm -rf .next && npm run build');
