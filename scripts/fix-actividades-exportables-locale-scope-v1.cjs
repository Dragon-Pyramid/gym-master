const fs = require('fs');
const path = require('path');

const root = process.cwd();
const filePath = path.join(root, 'src', 'app', 'dashboard', 'actividades', 'page.tsx');
const BACKUP_SUFFIX = '.bak_exportables_i18n_actividades_locale_scope_v1';

if (!fs.existsSync(filePath)) {
  throw new Error(`No existe el archivo esperado: ${filePath}`);
}

let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
const backupPath = `${filePath}${BACKUP_SUFFIX}`;
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
}

const before = `function sanitizeActivity(actividad: ActividadBaseOption): Actividad {\n  return {\n    id: actividad.id,\n    nombre_actividad: translateActivityText(locale, actividad.nombre_actividad),\n    creado_en: actividad.creado_en ?? \"\",\n    actualizado_en: actividad.actualizado_en ?? \"\",\n  };\n}`;

const after = `function sanitizeActivity(actividad: ActividadBaseOption): Actividad {\n  return {\n    id: actividad.id,\n    nombre_actividad: actividad.nombre_actividad,\n    creado_en: actividad.creado_en ?? \"\",\n    actualizado_en: actividad.actualizado_en ?? \"\",\n  };\n}`;

if (content.includes(before)) {
  content = content.replace(before, after);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[OK] sanitizeActivity corregido: no usa locale fuera del componente.');
  console.log('Patch aplicado. Ejecutá: rm -rf .next && npm run build');
  process.exit(0);
}

const sanitizeRegex = /function sanitizeActivity\(actividad: ActividadBaseOption\): Actividad \{[\s\S]*?\n\}/;
const match = content.match(sanitizeRegex);
if (!match) {
  throw new Error('No se encontró la función sanitizeActivity para corregir.');
}

const fixedBlock = match[0].replace(
  /nombre_actividad:\s*translateActivityText\(locale,\s*actividad\.nombre_actividad\),/,
  'nombre_actividad: actividad.nombre_actividad,'
);

if (fixedBlock === match[0]) {
  console.log('[OK] sanitizeActivity ya estaba corregido.');
  process.exit(0);
}

content = content.replace(match[0], fixedBlock);
fs.writeFileSync(filePath, content, 'utf8');
console.log('[OK] sanitizeActivity corregido: no usa locale fuera del componente.');
console.log('Patch aplicado. Ejecutá: rm -rf .next && npm run build');
