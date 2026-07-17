const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'comercial', 'codigos-etiquetas', 'page.tsx');
const BACKUP_SUFFIX = '.bak_exportables_i18n_commercial_labels_v1';

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo esperado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
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

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) {
    return { content, changed: false, label };
  }
  return { content: content.replace(search, replacement), changed: true, label };
}

function replaceRegexOnce(content, regex, replacement, label) {
  if (!regex.test(content)) {
    return { content, changed: false, label };
  }
  return { content: content.replace(regex, replacement), changed: true, label };
}

let content = read(pagePath);
backup(pagePath);

if (!content.includes("import type { GymMasterLocale } from '@/i18n/config';")) {
  content = content.replace(
    "import { useI18n } from '@/i18n/I18nProvider';\n",
    "import { useI18n } from '@/i18n/I18nProvider';\nimport type { GymMasterLocale } from '@/i18n/config';\n",
  );
}

const helperMarker = "function commercialLabelsPrintTx(locale: GymMasterLocale, es: string, en: string)";
if (!content.includes(helperMarker)) {
  const marker = `function escapeHtml(value?: string | null) {\n  return String(value ?? '')\n    .replaceAll('&', '&amp;')\n    .replaceAll('<', '&lt;')\n    .replaceAll('>', '&gt;')\n    .replaceAll('"', '&quot;')\n    .replaceAll("'", '&#039;');\n}\n`;
  const helpers = `\nfunction commercialLabelsPrintTx(locale: GymMasterLocale, es: string, en: string) {\n  return locale === 'en' ? en : es;\n}\n\nfunction commercialLabelTypeForPrint(locale: GymMasterLocale, type: string) {\n  if (type === 'producto') return commercialLabelsPrintTx(locale, 'Producto', 'Product');\n  if (type === 'servicio') return commercialLabelsPrintTx(locale, 'Servicio', 'Service');\n  if (type === 'pack') return 'Pack';\n  return type;\n}\n`;
  if (!content.includes(marker)) {
    throw new Error('No se encontró el bloque escapeHtml esperado para insertar helpers de etiquetas comerciales.');
  }
  content = content.replace(marker, `${marker}${helpers}`);
}

let changed = false;
let result;

result = replaceRegexOnce(
  content,
  /function printLabels\(\s*items:\s*ComercialCodigoLabelItem\[\],\s*columns:\s*number\s*\)\s*\{/,
  'function printLabels(items: ComercialCodigoLabelItem[], columns: number, locale: GymMasterLocale) {',
  'firma printLabels con locale',
);
content = result.content;
changed = changed || result.changed;

const replacements = [
  [
    '<div class="type">${escapeHtml(typeLabel(item.target_type))}</div>',
    '<div class="type">${escapeHtml(commercialLabelTypeForPrint(locale, item.target_type))}</div>',
    'tipo de etiqueta impresa',
  ],
  [
    `'<div class="no-code">Sin código</div>'`,
    `'<div class="no-code">' + escapeHtml(commercialLabelsPrintTx(locale, 'Sin código', 'No code')) + '</div>'`,
    'placeholder sin código',
  ],
  [
    `<div class="code">\${escapeHtml(code || 'SIN CÓDIGO')}</div>`,
    `<div class="code">\${escapeHtml(code || commercialLabelsPrintTx(locale, 'SIN CÓDIGO', 'NO CODE'))}</div>`,
    'código vacío',
  ],
  [
    `<div class="small">Barra: \${escapeHtml(item.codigo_barras)}</div>`,
    `<div class="small">\${escapeHtml(commercialLabelsPrintTx(locale, 'Barra', 'Barcode'))}: \${escapeHtml(item.codigo_barras)}</div>`,
    'label barra',
  ],
  [
    '<title>Etiquetas comerciales Gym Master</title>',
    `<title>\${escapeHtml(commercialLabelsPrintTx(locale, 'Etiquetas comerciales Gym Master', 'Gym Master commercial labels'))}</title>`,
    'título ventana impresión',
  ],
  [
    '<strong>Etiquetas comerciales Gym Master · ${items.length} etiquetas</strong>',
    `<strong>\${escapeHtml(commercialLabelsPrintTx(locale, 'Etiquetas comerciales Gym Master', 'Gym Master commercial labels'))} · \${items.length} \${escapeHtml(commercialLabelsPrintTx(locale, 'etiquetas', 'labels'))}</strong>`,
    'toolbar cantidad etiquetas',
  ],
  [
    '<button onclick="window.print()">Imprimir / Guardar PDF</button>',
    `<button onclick="window.print()">\${escapeHtml(commercialLabelsPrintTx(locale, 'Imprimir / Guardar PDF', 'Print / Save PDF'))}</button>`,
    'botón imprimir guardar PDF',
  ],
  [
    'printLabels(selectedItems.length ? selectedItems : filteredItems.slice(0, 24), columns)',
    'printLabels(selectedItems.length ? selectedItems : filteredItems.slice(0, 24), columns, locale)',
    'llamada impresión masiva',
  ],
  [
    'printLabels([item], columns)',
    'printLabels([item], columns, locale)',
    'llamada impresión individual',
  ],
];

for (const [search, replacement, label] of replacements) {
  result = replaceOnce(content, search, replacement, label);
  content = result.content;
  changed = changed || result.changed;
}

// Fallback defensivo para variantes con comillas que ya pudieron haber sido editadas.
content = content.replace(/printLabels\(selectedItems\.length \? selectedItems : filteredItems\.slice\(0, 24\), columns\)(?!,?\s*locale)/g, 'printLabels(selectedItems.length ? selectedItems : filteredItems.slice(0, 24), columns, locale)');
content = content.replace(/printLabels\(\[item\], columns\)(?!,?\s*locale)/g, 'printLabels([item], columns, locale)');

if (!content.includes('function printLabels(items: ComercialCodigoLabelItem[], columns: number, locale: GymMasterLocale)')) {
  throw new Error('La firma de printLabels no quedó con locale. Revisá manualmente src/app/dashboard/comercial/codigos-etiquetas/page.tsx');
}
if (!content.includes('commercialLabelTypeForPrint(locale, item.target_type)')) {
  throw new Error('La etiqueta tipo impresa no quedó internacionalizada.');
}
if (!content.includes("commercialLabelsPrintTx(locale, 'SIN CÓDIGO', 'NO CODE')")) {
  throw new Error('El fallback SIN CÓDIGO no quedó internacionalizado.');
}
if (!content.includes('columns, locale')) {
  throw new Error('Las llamadas a printLabels no quedaron pasando locale.');
}

write(pagePath, content);
console.log('[OK] src/app/dashboard/comercial/codigos-etiquetas/page.tsx actualizado.');
console.log('Patch aplicado. Ejecutá: rm -rf .next && npm run build');
