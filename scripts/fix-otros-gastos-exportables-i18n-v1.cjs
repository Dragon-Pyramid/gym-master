const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'otros-gastos', 'page.tsx');
const BACKUP_SUFFIX = '.bak_exportables_i18n_otros_gastos_v1';

if (!fs.existsSync(pagePath)) {
  throw new Error(`No se encontró ${path.relative(root, pagePath)}`);
}

const backupPath = `${pagePath}${BACKUP_SUFFIX}`;
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(pagePath, backupPath);
}

let source = fs.readFileSync(pagePath, 'utf8');
let changed = false;

function replaceOrThrow(description, pattern, replacement) {
  const before = source;
  source = source.replace(pattern, replacement);
  if (source === before) {
    throw new Error(`No se pudo aplicar cambio: ${description}`);
  }
  changed = true;
}

const worksheetHelper = `
function safeOtrosGastosWorksheetName(name: string) {
  const cleaned = String(name || "Expenses")
    .replace(/[\\/*?:[\]]/g, "-")
    .replace(/\s+-\s+/g, " - ")
    .trim()
    .slice(0, 31);

  return cleaned || "Expenses";
}
`;

if (!source.includes('safeOtrosGastosWorksheetName')) {
  if (source.includes('export default function')) {
    source = source.replace('export default function', `${worksheetHelper}\nexport default function`);
    changed = true;
  } else if (source.includes('export default')) {
    source = source.replace('export default', `${worksheetHelper}\nexport default`);
    changed = true;
  } else {
    throw new Error('No se encontró un punto seguro para insertar safeOtrosGastosWorksheetName.');
  }
}

if (!source.includes('safeOtrosGastosWorksheetName(c("Gastos / Egresos"))')) {
  replaceOrThrow(
    'nombre seguro de hoja Excel para otros gastos',
    /const\s+worksheet\s*=\s*workbook\.addWorksheet\(\s*c\("Gastos \/ Egresos"\)\s*\);/,
    'const worksheet = workbook.addWorksheet(safeOtrosGastosWorksheetName(c("Gastos / Egresos")));',
  );
}

const pdfLabelsBlock = `
        locale,
        footerText: c("Documento generado por Gym Master."),
        labels: {
          generated: c("Generado"),
          page: c("Página"),
          of: c("de"),
          detail: c("Detalle"),
          records: c("registros"),
          empty: c("No hay gastos registrados aún."),
        },`;

const pdfCallIndex = source.indexOf('downloadCommercialReportPdf({');
if (pdfCallIndex !== -1) {
  const pdfCallPreview = source.slice(pdfCallIndex, pdfCallIndex + 1200);
  if (!pdfCallPreview.includes('labels:') && !pdfCallPreview.includes('footerText:')) {
    source = source.replace('downloadCommercialReportPdf({', `downloadCommercialReportPdf({${pdfLabelsBlock}`);
    changed = true;
  }
}

if (!changed) {
  console.log('[OK] Otros gastos exportables ya estaban corregidos.');
} else {
  fs.writeFileSync(pagePath, source);
  console.log('[OK] src/app/dashboard/otros-gastos/page.tsx actualizado.');
}

console.log('Patch aplicado. Ejecutá: rm -rf .next && npm run build');
