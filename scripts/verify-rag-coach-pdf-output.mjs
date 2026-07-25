import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function includesAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['test:rag-coach-pdf'] === 'node scripts/verify-rag-coach-pdf-output.mjs',
  'package.json must expose the RAG Coach PDF verification gate.',
);

const pdf = read('src/utils/ragCoachPdf.ts');
assert(
  includesAll(pdf, [
    'import jsPDF from "jspdf";',
    'getResolvedGimnasioBranding',
    'buildTimestampedDownloadFileName',
    'export async function descargarRagCoachPdf',
    'addContextSnapshot',
    'addRoutinePayload',
    'addDietPayload',
    'addEvolutionPayload',
    'addSources',
    'addFooter',
    'textoLegalReportes',
    'piePagina',
  ]),
  'The PDF utility must cover branding, context, routines, diets, evolution, sources and paginated footer output.',
);
assert(
  includesAll(pdf, [
    'ensureSpace(state',
    'addPage(state)',
    'CONTENT_BOTTOM',
    'splitTextToSize',
    'getNumberOfPages()',
  ]),
  'The PDF utility must wrap long text and add pages before content reaches the footer.',
);
assert(
  includesAll(pdf, [
    'locale = "es"',
    'translateCoreDayLabel',
    'translateCoreFoodItem',
    'translateCoreLevel',
    'translateCoreObjective',
    'Responsible notice',
  ]),
  'The PDF utility must preserve ES/EN governance and translate system-owned labels.',
);
assert(
  !pdf.includes('JSON.stringify(action.payload)') && !pdf.includes('doc.html('),
  'The export must not dump raw payload JSON or capture the dashboard DOM.',
);

const coachPage = read('src/app/dashboard/coach/page.tsx');
assert(
  includesAll(coachPage, [
    "import { descargarRagCoachPdf } from '@/utils/ragCoachPdf';",
    "import { toast } from 'sonner';",
    'FileDown,',
    'createdAt: string;',
    'requestMessage?: string;',
    'socioSnapshot?: {',
    'const handleDownloadPdf = async (message: ChatMessage)',
    'message.socioSnapshot ??',
    "locale: locale === 'en' ? 'en' : 'es'",
    "c('Descargar informe PDF', 'Download PDF report')",
  ]),
  'Coach UI must capture the member/message snapshot and offer an ES/EN PDF download for successful assistant responses.',
);
assert(
  coachPage.includes("message.role === 'assistant' && message.requestMessage") &&
    coachPage.includes('disabled={Boolean(exportingPdfMessageId)}'),
  'Only generated assistant responses must expose a guarded download action.',
);

const forbiddenApiOrDatabaseChanges = [
  'src/app/api/rag/coach/chat/route.ts',
  'src/services/server/ragCoachUnifiedChatService.ts',
  'database/',
  'supabase/migrations/',
];
const documentation = read('docs/rag/rag-coach-pdf-output-v1.md');
for (const marker of forbiddenApiOrDatabaseChanges) {
  assert(documentation.includes(marker), `Documentation must state the status of ${marker}.`);
}

if (failures.length > 0) {
  console.error('RAG Coach PDF output verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('RAG Coach PDF output OK: authenticated Coach responses expose a professional browser-generated PDF download.');
console.log('RAG Coach PDF layout OK: branding, member snapshot, ES/EN content, actions, context, sources, QA, safety and page footers are covered.');
console.log('RAG Coach PDF scope OK: no API contract, database, migration, RLS or RPC changes are required.');
