import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { relative, sep } from 'node:path';

const ROOT = process.cwd();
const NORMALIZE = (value) => value.split(sep).join('/').replace(/^\.\//, '');

function walk(directory = ROOT) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next'].includes(entry.name)) continue;
    const absolute = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile()) files.push(NORMALIZE(relative(ROOT, absolute)));
  }
  return files;
}

function getTrackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split('\0').filter(Boolean).map(NORMALIZE);
  } catch {
    return walk();
  }
}

function fail(title, items) {
  console.error(`\n${title}`);
  for (const item of items) console.error(` - ${item}`);
  process.exitCode = 1;
}

function readText(path) {
  try {
    const buffer = readFileSync(path);
    if (buffer.subarray(0, 2048).includes(0)) return null;
    return buffer.toString('utf8');
  } catch {
    return null;
  }
}

const trackedFiles = getTrackedFiles();

const forbiddenPathPatterns = [
  /^\.env(?:\..+)?$/,
  /^supabase\/(?:\.temp|\.branches)(?:\/|$)/,
  /^database\/(?:private|scripts|migrations|pending_migrations|backups|dumps|seeds|local|remote|tmp)(?:\/|$)/,
  /^(?:backups?|dumps?|exports?|logs)(?:\/|$)/,
  /(?:^|\/)(?:playwright-report|test-results)(?:\/|$)/,
  /\.(?:sql|sql\.gz|dump|backup|bak|pgdump|psql|sqlite3?|db|pem|key|p12|pfx|jks|keystore)$/i,
  /(?:^|\/)(?:credentials[^/]*|service-account[^/]*)\.json$/i,
];

const allowedTrackedPaths = new Set(['.env.example']);
const forbiddenTracked = trackedFiles.filter(
  (path) => !allowedTrackedPaths.has(path) && forbiddenPathPatterns.some((pattern) => pattern.test(path))
);

if (forbiddenTracked.length) {
  fail('Repository paths FAILED: private/local/generated files are still tracked.', forbiddenTracked);
} else {
  console.log(`Repository paths OK: ${trackedFiles.length} tracked files contain no forbidden operational artifacts.`);
}

const secretPatterns = [
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['GitHub token', /(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,})/g],
  ['OpenAI-style key', /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ['Stripe live key', /(?:sk|rk)_live_[A-Za-z0-9]{16,}/g],
  ['Google API key', /AIza[0-9A-Za-z_-]{30,}/g],
  ['JWT', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ['credential-bearing URL', /https?:\/\/[^\s/@:]+:[^\s/@]+@/g],
];

const secretFindings = [];
for (const path of trackedFiles) {
  if (path === 'package-lock.json') continue;
  const text = readText(path);
  if (text == null) continue;
  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length;
      secretFindings.push(`${path}:${line} (${label})`);
    }
  }
}

const personalMailboxPattern = /\b[A-Z0-9._%+-]+@(?:gmail|hotmail|outlook|yahoo)\.[A-Z]{2,}\b/gi;
for (const path of trackedFiles.filter((item) => item.endsWith('.md') || item.endsWith('.txt'))) {
  const text = readText(path);
  if (text == null) continue;
  for (const match of text.matchAll(personalMailboxPattern)) {
    const line = text.slice(0, match.index).split('\n').length;
    secretFindings.push(`${path}:${line} (personal mailbox in documentation)`);
  }
}

if (secretFindings.length) {
  fail('Secret scan FAILED: potential credentials or personal test accounts were found.', secretFindings);
} else {
  console.log('Secret scan OK: no private keys, provider tokens, JWTs, credential URLs or personal test mailboxes were found.');
}

const envExample = readText('.env.example') ?? '';
const envEntries = new Map();
for (const rawLine of envExample.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const separator = line.indexOf('=');
  envEntries.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
}

const usedEnvKeys = new Set();
const processEnvPattern = /process\.env(?:\.([A-Z0-9_]+)|\[\s*['"]([A-Z0-9_]+)['"]\s*\])/g;
for (const path of trackedFiles.filter((item) => /\.(?:[cm]?js|tsx?)$/.test(item))) {
  const text = readText(path);
  if (text == null) continue;
  for (const match of text.matchAll(processEnvPattern)) usedEnvKeys.add(match[1] ?? match[2]);
}

const runtimeBuiltIns = new Set(['CI', 'NODE_ENV']);
const missingEnvKeys = [...usedEnvKeys]
  .filter((key) => !runtimeBuiltIns.has(key) && !envEntries.has(key))
  .sort();

const sensitiveExampleKeys = [
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'DRAGON_PYRAMID_LICENSE_SYNC_SECRET',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BREVO_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_CLOUD_API_KEY',
  'CLOUDINARY_CLOUD_API_SECRET',
  'GYM_MASTER_RAG_COACH_API_KEY',
  'YOUTUBE_DATA_API_KEY',
  'GITHUB_TOKEN',
  'OPENAI_API_KEY',
  'E2E_ADMIN_PASSWORD',
  'E2E_SOCIO_PASSWORD',
];
const populatedSensitiveExamples = sensitiveExampleKeys.filter((key) => (envEntries.get(key) ?? '') !== '');

const unsafePublicKeys = [...usedEnvKeys].filter(
  (key) =>
    key.startsWith('NEXT_PUBLIC_') &&
    /(?:SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|TOKEN|API_KEY)/.test(key) &&
    key !== 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);

const environmentProblems = [
  ...missingEnvKeys.map((key) => `.env.example is missing ${key}`),
  ...populatedSensitiveExamples.map((key) => `.env.example must keep ${key} empty`),
  ...unsafePublicKeys.map((key) => `${key} has a secret-like NEXT_PUBLIC_ name`),
];

if (environmentProblems.length) {
  fail('Environment contract FAILED.', environmentProblems);
} else {
  console.log(`Environment contract OK: ${[...usedEnvKeys].filter((key) => !runtimeBuiltIns.has(key)).length} application variables are documented and secret examples are empty.`);
}

const requiredVercelIgnores = ['.env.*', 'database', 'supabase', 'docs', 'e2e', 'backups', 'exports', 'logs'];
const vercelIgnore = readText('.vercelignore') ?? '';
const missingVercelIgnores = requiredVercelIgnores.filter(
  (entry) => !vercelIgnore.split(/\r?\n/).some((line) => line.trim() === entry)
);

if (missingVercelIgnores.length) {
  fail('Deployment exclusions FAILED.', missingVercelIgnores.map((entry) => `.vercelignore is missing ${entry}`));
} else {
  console.log('Deployment exclusions OK: environment, DB tooling, Supabase metadata, docs, E2E and local artifacts stay outside Vercel uploads.');
}

if (process.exitCode) process.exit(process.exitCode);
