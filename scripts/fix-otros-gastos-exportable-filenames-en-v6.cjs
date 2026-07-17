const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pagePath = path.join(
  root,
  "src",
  "app",
  "dashboard",
  "otros-gastos",
  "page.tsx"
);
const backupPath = `${pagePath}.bak-otros-gastos-exportable-filenames-en-v6`;

function fail(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(pagePath)) {
  fail(`No existe el archivo esperado: ${path.relative(root, pagePath)}`);
}

let source = fs.readFileSync(pagePath, "utf8");
const original = source;

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, original, "utf8");
  console.log(`[OK] Backup creado: ${path.relative(root, backupPath)}`);
} else {
  console.log(`[OK] Backup existente preservado: ${path.relative(root, backupPath)}`);
}

// Excel: el contenido ya respeta locale, pero el nombre descargado seguía fijo en español.
source = source.replace(
  /a\.download\s*=\s*buildTimestampedDownloadFileName\(\s*["']listado-gastos-egresos["']\s*,\s*["']xlsx["']\s*\)\s*;/g,
  [
    "a.download = buildTimestampedDownloadFileName(",
    '      locale === "en" ? "expenses-outflows-list" : "listado-gastos-egresos",',
    '      "xlsx",',
    "    );",
  ].join("\n")
);

// PDF: downloadCommercialReportPdf arma el nombre final desde fileName.
source = source.replace(
  /fileName:\s*["']listado-gastos-egresos["']\s*,/g,
  'fileName: locale === "en" ? "expenses-outflows-list" : "listado-gastos-egresos",'
);

// Variante defensiva por si una iteración anterior dejó fileName construido con c(...).
source = source.replace(
  /fileName:\s*c\(\s*["']Listado de Gastos\s*\/\s*Egresos["']\s*(?:,\s*["']Expenses\s*\/\s*Outflows list["']\s*)?\)\s*,/g,
  'fileName: locale === "en" ? "expenses-outflows-list" : "listado-gastos-egresos",'
);

if (source === original) {
  fail(
    "No se encontraron los nombres de archivo de Otros gastos para cambiar. Pegame el bloque handleExportExcel/handleDownloadPdf de page.tsx."
  );
}

if (/a\.download\s*=\s*buildTimestampedDownloadFileName\(\s*["']listado-gastos-egresos["']\s*,\s*["']xlsx["']/.test(source)) {
  fail("El Excel todavía conserva nombre fijo en español.");
}

if (/fileName:\s*["']listado-gastos-egresos["']\s*,/.test(source)) {
  fail("El PDF todavía conserva fileName fijo en español.");
}

fs.writeFileSync(pagePath, source, "utf8");
console.log(`[OK] ${path.relative(root, pagePath)} actualizado.`);
console.log('[OK] PDF EN: expenses-outflows-list.pdf');
console.log('[OK] Excel EN: expenses-outflows-list.xlsx');
console.log('[OK] ES preservado: listado-gastos-egresos.pdf/xlsx');
console.log("Patch aplicado. Validá con: rm -rf .next && npm run build");
