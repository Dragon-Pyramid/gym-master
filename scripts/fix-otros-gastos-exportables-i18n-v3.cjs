const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'otros-gastos', 'page.tsx');
const BACKUP_SUFFIX = '.bak_exportables_i18n_otros_gastos_v3_pre';

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
  console.log(`[OK] ${path.relative(root, filePath)} ya estaba correcto.`);
  return false;
}

function ensureCommercialReportPdfLocaleTypeIsSingle() {
  backup(pdfPath);
  let source = fs.readFileSync(pdfPath, 'utf8');
  const before = source;

  // La v2 podía dejar dos props "locale" en DownloadCommercialReportPdfParams:
  //   locale?: GymMasterLocale;
  //   locale?: CommercialReportLocale;
  // Normalizamos la utilidad a un solo tipo local de reporte para evitar el build error.
  source = source.replace(/import type \{ GymMasterLocale \} from ["']@\/i18n\/config["'];\r?\n/g, '');
  source = source.replace(/\bGymMasterLocale\b/g, 'CommercialReportLocale');

  if (!/(export\s+)?type\s+CommercialReportLocale\s*=/.test(source)) {
    const lastImportMatch = [...source.matchAll(/^import[^;]+;\r?\n/gm)].pop();
    if (lastImportMatch) {
      const insertAt = lastImportMatch.index + lastImportMatch[0].length;
      source = `${source.slice(0, insertAt)}\ntype CommercialReportLocale = "es" | "en";\n${source.slice(insertAt)}`;
    } else {
      source = `type CommercialReportLocale = "es" | "en";\n\n${source}`;
    }
  }

  // Colapsar cualquier duplicado de la propiedad locale dentro de interfaces/types.
  source = source.replace(
    /(?:\r?\n\s*locale\?:\s*CommercialReportLocale;){2,}/g,
    '\n  locale?: CommercialReportLocale;',
  );

  // Defensa extra por si quedó el par exacto en otro orden.
  source = source.replace(
    /\r?\n\s*locale\?:\s*CommercialReportLocale;\r?\n\s*locale\?:\s*CommercialReportLocale;/g,
    '\n  locale?: CommercialReportLocale;',
  );

  // Si alguna versión dejó dos destructurings default, también los colapsamos.
  source = source.replace(
    /(?:\r?\n\s*locale\s*=\s*["']es["'],){2,}/g,
    '\n  locale = "es",',
  );

  // Mantener nombres de hoja seguros para ExcelJS: sin /, \\, *, ?, :, [, ].
  source = source.replace(/addWorksheet\(locale === "en" \? "Expenses \/ Outflows" : "Gastos \/ Egresos"\)/g,
    'addWorksheet(locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos")');

  writeIfChanged(pdfPath, before, source);
}

function ensureOtrosGastosWorksheetNameIsSafe() {
  if (!fs.existsSync(pagePath)) return;
  backup(pagePath);
  let source = fs.readFileSync(pagePath, 'utf8');
  const before = source;

  source = source.replace(
    /workbook\.addWorksheet\(locale === "en" \? "Expenses \/ Outflows" : "Gastos \/ Egresos"\)/g,
    'workbook.addWorksheet(locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos")',
  );

  source = source.replace(
    /workbook\.addWorksheet\(c\("Gastos \/ Egresos", "Expenses \/ Outflows"\)\)/g,
    'workbook.addWorksheet(locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos")',
  );

  writeIfChanged(pagePath, before, source);
}

ensureCommercialReportPdfLocaleTypeIsSingle();
ensureOtrosGastosWorksheetNameIsSafe();

console.log('\nPatch v3 aplicado. Validá con: rm -rf .next && npm run build');
