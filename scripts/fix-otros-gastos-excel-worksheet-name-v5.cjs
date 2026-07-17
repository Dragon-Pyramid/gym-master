const fs = require("fs");
const path = require("path");

const pagePath = path.join(
  process.cwd(),
  "src",
  "app",
  "dashboard",
  "otros-gastos",
  "page.tsx"
);

if (!fs.existsSync(pagePath)) {
  console.error(`[ERROR] No existe el archivo esperado: ${pagePath}`);
  process.exit(1);
}

let source = fs.readFileSync(pagePath, "utf8");
const original = source;
const backupPath = `${pagePath}.bak-otros-gastos-excel-worksheet-name-v5`;

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, original, "utf8");
  console.log(`[OK] Backup creado: ${backupPath}`);
} else {
  console.log(`[OK] Backup existente preservado: ${backupPath}`);
}

const safeWorksheetCall =
  'workbook.addWorksheet(locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos")';

const patterns = [
  /workbook\.addWorksheet\(\s*safeOtrosGastosWorksheetName\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*,\s*["']Expenses\s*\/\s*Outflows["']\s*\)\s*\)\s*\)/g,
  /workbook\.addWorksheet\(\s*safeOtrosGastosWorksheetName\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*\)\s*\)\s*\)/g,
  /workbook\.addWorksheet\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*,\s*["']Expenses\s*\/\s*Outflows["']\s*\)\s*\)/g,
  /workbook\.addWorksheet\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*\)\s*\)/g,
  /workbook\.addWorksheet\(\s*["']Expenses\s*\/\s*Outflows["']\s*\)/g,
];

for (const pattern of patterns) {
  source = source.replace(pattern, safeWorksheetCall);
}

// Último cinturón de seguridad: si por cualquier motivo quedó una llamada exacta
// con el helper, forzamos solamente el literal interno de Excel a un valor válido.
source = source.replace(
  /safeOtrosGastosWorksheetName\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*\)\s*\)/g,
  'locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos"'
);
source = source.replace(
  /safeOtrosGastosWorksheetName\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*,\s*["']Expenses\s*\/\s*Outflows["']\s*\)\s*\)/g,
  'locale === "en" ? "Expenses - Outflows" : "Gastos - Egresos"'
);

if (source === original) {
  console.error("[ERROR] No se encontró la llamada de addWorksheet para Otros Gastos. Pegame las líneas 175-195 de src/app/dashboard/otros-gastos/page.tsx.");
  process.exit(1);
}

if (/workbook\.addWorksheet\([^\n;]*Expenses\s*\/\s*Outflows/.test(source)) {
  console.error("[ERROR] Todavía quedó un nombre de worksheet con '/'. Revisar page.tsx alrededor de handleExportExcel.");
  process.exit(1);
}

fs.writeFileSync(pagePath, source, "utf8");
console.log("[OK] src/app/dashboard/otros-gastos/page.tsx actualizado.");
console.log('[OK] Worksheet Excel seguro: Expenses - Outflows / Gastos - Egresos.');
console.log("Patch aplicado. Validá con: rm -rf .next && npm run build");
