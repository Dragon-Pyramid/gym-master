import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const servicePath = path.join(root, 'src/services/adminRespaldoNegocioService.ts');
const service = fs.readFileSync(servicePath, 'utf8');

function fail(message) {
  console.error(`Business backup export verification failed: ${message}`);
  process.exit(1);
}

const requiredSnippets = [
  'const EXCEL_WORKSHEET_NAME_MAX_LENGTH = 31;',
  'const EXCEL_WORKSHEET_FORBIDDEN_CHARACTERS = /[\\\\/*?:\\[\\]]/g;',
  'const EXCEL_WORKSHEET_CONTROL_CHARACTERS = /[\\u0000-\\u001f\\u007f]/g;',
  'function normalizeBusinessBackupWorksheetName(',
  'function reserveBusinessBackupWorksheetName(',
  'const usedWorksheetNames = new Set<string>();',
  'reserveBusinessBackupWorksheetName(',
];

for (const snippet of requiredSnippets) {
  if (!service.includes(snippet)) fail(`missing source guard: ${snippet}`);
}

if (service.includes(".replace(/[\\/*?:[]]/g, ' - ')") || service.includes(".replace(/s+-s+/g, ' - ')") || service.includes(".replace(/s{2,}/g, ' ')")) {
  fail('legacy malformed worksheet-name sanitizer is still present');
}

const MAX_LENGTH = 31;
const forbidden = /[\\/*?:\[\]]/g;
const controls = /[\u0000-\u001f\u007f]/g;

function normalizeWorksheetName(name, fallback = 'Sheet') {
  const safeFallback = String(fallback || 'Sheet')
    .replace(forbidden, ' ')
    .replace(controls, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^'+|'+$/g, '')
    .trim() || 'Sheet';

  const normalized = String(name || '')
    .replace(forbidden, ' - ')
    .replace(controls, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^'+|'+$/g, '')
    .trim();

  return (normalized || safeFallback).slice(0, MAX_LENGTH).trim();
}

function reserveWorksheetName(name, used, fallback = 'Sheet') {
  const base = normalizeWorksheetName(name, fallback);
  let candidate = base;
  let sequence = 2;

  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${sequence})`;
    const availableLength = MAX_LENGTH - suffix.length;
    const prefix = base.slice(0, availableLength).trimEnd();
    candidate = `${prefix || normalizeWorksheetName(fallback, 'Sheet').slice(0, availableLength)}${suffix}`;
    sequence += 1;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}

const sourceLabels = [...service.matchAll(/\n\s+label:\s+'([^']+)'/g)].map((match) => match[1]);
if (!sourceLabels.includes('Gastos / egresos')) fail('expected Gastos / egresos module label was not found');

const used = new Set();
const names = [
  'Resumen',
  ...sourceLabels,
  'Products / stock',
  'Invalid:*?/\\[name]',
  "'Quoted sheet'",
  'A worksheet name that is intentionally longer than thirty-one characters',
  'Resumen',
].map((name) => reserveWorksheetName(name, used, 'Hoja'));

for (const name of names) {
  if (!name) fail('empty worksheet name generated');
  if (name.length > MAX_LENGTH) fail(`worksheet name exceeds ${MAX_LENGTH} characters: ${name}`);
  if (/[\\/*?:\[\]]/.test(name)) fail(`worksheet name still contains a forbidden character: ${name}`);
  if (name.startsWith("'") || name.endsWith("'")) fail(`worksheet name starts or ends with apostrophe: ${name}`);
}

if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
  fail('duplicate worksheet names were not disambiguated');
}

const gastosName = normalizeWorksheetName('Gastos / egresos', 'Hoja');
if (gastosName !== 'Gastos - egresos') fail(`unexpected Gastos worksheet name: ${gastosName}`);

console.log('Business backup worksheet names OK: forbidden characters, control characters, length and duplicates are handled.');
console.log(`Business backup worksheet names OK: ${sourceLabels.length} configured module labels are covered, including Gastos / egresos.`);
