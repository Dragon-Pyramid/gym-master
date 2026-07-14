const fs = require('fs');
const path = require('path');

const root = process.cwd();
const filePath = path.join(root, 'src', 'app', 'dashboard', 'actividades', 'page.tsx');
const BACKUP_SUFFIX = '.bak_exportables_actividades_estado_type_fix_v1';

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`No existe el archivo esperado: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function backup(file) {
  const backupPath = `${file}${BACKUP_SUFFIX}`;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(file, backupPath);
}

function replaceInRange(content, startMarker, endMarker, replacer, label) {
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error(`No se encontró el bloque esperado: ${startMarker}`);
  const end = content.indexOf(endMarker, start);
  if (end < 0) throw new Error(`No se encontró el cierre del bloque esperado: ${endMarker}`);
  const before = content.slice(0, start);
  const block = content.slice(start, end);
  const after = content.slice(end);
  const nextBlock = replacer(block);
  if (nextBlock !== block) {
    console.log(`[OK] ${label}`);
  } else {
    console.log(`[OK] ${label}: ya estaba correcto o no requería cambios.`);
  }
  return before + nextBlock + after;
}

let content = read(filePath).replace(/\r\n/g, '\n');
backup(filePath);

// 1) Estado del formulario de edición: debe conservar el enum crudo del turno,
// no la etiqueta traducida. Si se usa estadoLabel acá, TypeScript falla porque
// devuelve string y el form espera ActividadTurnoEstado.
content = replaceInRange(
  content,
  'const handleEditTurno = (turno: ActividadTurno) => {',
  '  const handleSubmitTurno = async',
  (block) => block.replace(
    /estado:\s*estadoLabel\(\s*turno\.estado\s*(?:,\s*locale\s*)?\),/g,
    'estado: turno.estado,'
  ),
  'handleEditTurno usa turno.estado crudo para el form'
);

// 2) Excel/export de turnos: acá sí corresponde mostrar la etiqueta traducida,
// porque es una fila de exportación y no un payload tipado.
content = replaceInRange(
  content,
  'filteredTurnos.forEach((turno) => {',
  '    });\n\n    inscripcionesSheet.columns',
  (block) => block.replace(
    /estado:\s*turno\.estado,/g,
    'estado: estadoLabel(turno.estado, locale),'
  ),
  'Excel de turnos usa estado traducido'
);

// 3) Cobertura defensiva: si quedó algún estadoLabel(turno.estado, locale) antes
// del submit del turno, lo dejamos crudo. Evita repetir este error con formatos mínimos.
const editStart = content.indexOf('const handleEditTurno = (turno: ActividadTurno) => {');
const submitStart = content.indexOf('  const handleSubmitTurno = async', editStart);
if (editStart >= 0 && submitStart > editStart) {
  const before = content.slice(0, editStart);
  const block = content.slice(editStart, submitStart).replace(
    /estado:\s*estadoLabel\(\s*turno\.estado\s*(?:,\s*locale\s*)?\),/g,
    'estado: turno.estado,'
  );
  const after = content.slice(submitStart);
  content = before + block + after;
}

if (!content.includes('estado: turno.estado,')) {
  throw new Error('No quedó confirmado el estado crudo dentro del formulario de edición. Revisar manualmente handleEditTurno.');
}

write(filePath, content);
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
