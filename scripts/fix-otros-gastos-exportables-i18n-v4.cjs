const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'otros-gastos', 'page.tsx');

if (!fs.existsSync(pagePath)) {
  console.error(`[ERROR] No existe ${pagePath}`);
  process.exit(1);
}

let src = fs.readFileSync(pagePath, 'utf8');
const original = src;

const safeFunction = `function safeOtrosGastosWorksheetName(name: string) {
  const safeName = String(name || "Gastos - Egresos")
    .replace(/[\\/*?:[\]]/g, " - ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 31);

  return safeName || "Gastos - Egresos";
}`;

if (/function\s+safeOtrosGastosWorksheetName\s*\(/.test(src)) {
  src = src.replace(
    /function\s+safeOtrosGastosWorksheetName\s*\([^)]*\)\s*\{[\s\S]*?\n\}/,
    safeFunction,
  );
} else {
  const marker = 'export default function';
  if (src.includes(marker)) {
    src = src.replace(marker, `${safeFunction}\n\n${marker}`);
  } else {
    src = `${safeFunction}\n\n${src}`;
  }
}

// El error venía de construir la hoja con "Expenses / Outflows". Aunque el helper exista,
// blindamos también el llamado para que siempre pase por el sanitizador y nunca use el texto crudo.
src = src.replace(
  /workbook\.addWorksheet\(\s*c\(\s*["']Gastos\s*\/\s*Egresos["']\s*\)\s*\)/g,
  'workbook.addWorksheet(safeOtrosGastosWorksheetName(c("Gastos / Egresos")))',
);
src = src.replace(
  /workbook\.addWorksheet\(\s*c\(\s*["']Expenses\s*\/\s*Outflows["']\s*\)\s*\)/g,
  'workbook.addWorksheet(safeOtrosGastosWorksheetName(c("Gastos / Egresos")))',
);

// Si una versión anterior dejó un sanitizador alrededor, lo dejamos, pero ahora el sanitizador realmente limpia /.
// Además, prevenimos que se use una cadena directa con slash en este export.
src = src.replace(
  /workbook\.addWorksheet\(\s*["']Expenses\s*\/\s*Outflows["']\s*\)/g,
  'workbook.addWorksheet("Expenses - Outflows")',
);
src = src.replace(
  /workbook\.addWorksheet\(\s*["']Gastos\s*\/\s*Egresos["']\s*\)/g,
  'workbook.addWorksheet("Gastos - Egresos")',
);

// Localiza el nombre del archivo cuando existe el patrón anterior, sin tocar datos del negocio.
// En EN genera expenses-outflows-..., en ES conserva listado-gastos-egresos-...
src = src.replace(
  /const\s+fileName\s*=\s*`listado-gastos-egresos-\$\{timestamp\}\.xlsx`;?/g,
  'const fileName = `${locale === "en" ? "expenses-outflows" : "listado-gastos-egresos"}-${timestamp}.xlsx`;',
);
src = src.replace(
  /const\s+fileName\s*=\s*`gastos-egresos-\$\{timestamp\}\.xlsx`;?/g,
  'const fileName = `${locale === "en" ? "expenses-outflows" : "gastos-egresos"}-${timestamp}.xlsx`;',
);

if (src === original) {
  console.log('[INFO] No hubo cambios detectables. Es posible que el archivo ya esté corregido.');
} else {
  fs.writeFileSync(pagePath, src, 'utf8');
  console.log('[OK] src/app/dashboard/otros-gastos/page.tsx actualizado.');
}

console.log('Patch v4 aplicado. Validá con: rm -rf .next && npm run build');
