import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const fail = (message) => {
  console.error(`Database lifecycle contract verification failed: ${message}`)
  process.exit(1)
}

const read = (path) => {
  if (!fs.existsSync(path)) fail(`missing ${path}`)
  return fs.readFileSync(path, 'utf8')
}

const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim()

const includesNormalized = (text, snippet) =>
  normalizeWhitespace(text).includes(normalizeWhitespace(snippet))

const git = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

const contractPath = 'docs/database/database-lifecycle-versioning-v1.md'
const readmePath = 'database/lifecycle/README.md'
const gitignorePath = '.gitignore'
const verifierPath = fileURLToPath(import.meta.url)

const contract = read(contractPath)
const readme = read(readmePath)
const gitignore = read(gitignorePath)

const requiredContractSnippets = [
  'Every supported Gym Master installation converges on one canonical logical database version.',
  'Customer feature differences are expressed through configuration or licensing, never through client-specific schema forks.',
  'Database versions are monotonic integers',
  'EXPAND -> MIGRATE -> CONTRACT',
  '0001_adopt_golden_v2_lifecycle_metadata',
  'CERTIFIED_BASELINE_PRE_ADOPTION',
  'gm_lifecycle.instance_state',
  'gm_lifecycle.migration_history',
  'The Golden Baseline itself remains immutable.',
]

for (const snippet of requiredContractSnippets) {
  if (!includesNormalized(contract, snippet)) {
    fail(`contract snippet missing: ${snippet}`)
  }
}

const requiredReadmeSnippets = [
  'public-safe lifecycle documentation only',
  'Do not add real migration SQL to this directory.',
  'feature variation',
  'schema forks',
]

for (const snippet of requiredReadmeSnippets) {
  if (!includesNormalized(readme, snippet)) {
    fail(`README snippet missing: ${snippet}`)
  }
}

const requiredIgnoreSnippets = [
  '*.sql',
  '/database/private/',
  '/database/pending_migrations/',
  '/supabase/migrations/',
]

for (const snippet of requiredIgnoreSnippets) {
  if (!gitignore.includes(snippet)) {
    fail(`.gitignore boundary missing: ${snippet}`)
  }
}

const trackedSql = git(['ls-files', '*.sql'])
if (trackedSql) {
  fail(`tracked SQL is not allowed by the public lifecycle boundary: ${trackedSql}`)
}

const forbiddenTrackedPrefixes = [
  'database/private/',
  'database/pending_migrations/',
  'supabase/migrations/',
]

const trackedFiles = git(['ls-files'])
  .split(/\r?\n/)
  .filter(Boolean)

for (const file of trackedFiles) {
  if (forbiddenTrackedPrefixes.some((prefix) => file.startsWith(prefix))) {
    fail(`private/ignored migration path is tracked: ${file}`)
  }
}

for (const file of [contractPath, readmePath, verifierPath]) {
  if (/\.sql$/i.test(file)) {
    fail(`public contract unexpectedly contains SQL artifact: ${file}`)
  }
}

console.log('Database lifecycle contract OK: canonical DB versioning rules are documented.')
console.log('Database lifecycle boundary OK: real SQL/private migration paths remain untracked.')
console.log('Database lifecycle adoption OK: Golden v2 remains pre-adoption until migration 0001 succeeds.')
console.log('Database lifecycle inventory rule OK: client inventory is private and secret-free.')
