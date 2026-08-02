import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`Database RLS boundary check failed: ${message}`);
  process.exit(1);
}

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, predicate));
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const routeFiles = walk(
  path.join(root, 'src', 'app', 'api'),
  (file) => file.endsWith(`${path.sep}route.ts`)
);

const forbiddenRouteImports = [
  '@/services/supabaseClient',
  '@/lib/supabase-browser',
  '@/middlewares/conexionBd.middleware',
];

const badRoutes = [];
for (const file of routeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const forbidden of forbiddenRouteImports) {
    if (source.includes(forbidden)) {
      badRoutes.push(`${path.relative(root, file)} -> ${forbidden}`);
    }
  }
}

if (badRoutes.length > 0) {
  fail(`API routes still depend on browser/anon database clients:\n${badRoutes.join('\n')}`);
}

const topLevelPrivilegedClientRoutes = [];
for (const file of routeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const topLevelServerClientPattern =
    /^(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*getSupabaseServerClient\(\)\s*;?[ \t]*$/m;

  if (topLevelServerClientPattern.test(source)) {
    topLevelPrivilegedClientRoutes.push(path.relative(root, file));
  }
}

if (topLevelPrivilegedClientRoutes.length > 0) {
  fail(
    `API routes must not initialize the privileged Supabase client at module scope:\n${topLevelPrivilegedClientRoutes.join('\n')}`
  );
}

const hardenedRoutes = [
  'src/app/api/admin/cuotas/dashboard-bi/route.ts',
  'src/app/api/asistencias/recientes/route.ts',
  'src/app/api/compras/[id]/route.ts',
  'src/app/api/compras/route.ts',
  'src/app/api/equipamientos/alertas-mantenimiento/route.ts',
  'src/app/api/equipamientos/mantenimiento-bi/route.ts',
  'src/app/api/evolucion_socio/admin/resumen/route.ts',
  'src/app/api/finanzas/dashboard-bi/route.ts',
  'src/app/api/otros_gastos/route.ts',
  'src/app/api/productos/stock-movimientos/route.ts',
  'src/app/api/socios/demografia-promociones-bi/route.ts',
];

for (const relativePath of hardenedRoutes) {
  const source = read(relativePath);
  if (!source.includes('@/services/supabaseServerClient')) {
    fail(`${relativePath} must use the explicit server-only Supabase client.`);
  }
}

const serverClientSource = read('src/services/supabaseServerClient.ts');
if (!serverClientSource.includes("import 'server-only'")) {
  fail('src/services/supabaseServerClient.ts must remain protected by server-only.');
}
if (!serverClientSource.includes('SUPABASE_SERVICE_ROLE_KEY')) {
  fail('The server-only Supabase client must require SUPABASE_SERVICE_ROLE_KEY.');
}

const sharedClientSource = read('src/services/supabaseClient.ts');
for (const required of [
  'typeof window !== "undefined"',
  'SUPABASE_SERVICE_ROLE_KEY',
  'persistSession: false',
  'autoRefreshToken: false',
]) {
  if (!sharedClientSource.includes(required)) {
    fail(`src/services/supabaseClient.ts is missing runtime boundary marker: ${required}`);
  }
}

const sourceFiles = walk(
  path.join(root, 'src'),
  (file) => file.endsWith('.ts') || file.endsWith('.tsx')
);

const sourceFileSet = new Set(sourceFiles.map((file) => path.resolve(file)));
const sourceRoot = path.join(root, 'src');
const moduleExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function resolveLocalModule(importer, specifier) {
  let candidateBase = null;

  if (specifier.startsWith('@/')) {
    candidateBase = path.join(sourceRoot, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    candidateBase = path.resolve(path.dirname(importer), specifier);
  } else {
    return null;
  }

  const candidates = path.extname(candidateBase)
    ? [candidateBase]
    : [
        ...moduleExtensions.map((extension) => `${candidateBase}${extension}`),
        ...moduleExtensions.map((extension) =>
          path.join(candidateBase, `index${extension}`)
        ),
      ];

  return candidates
    .map((candidate) => path.resolve(candidate))
    .find((candidate) => sourceFileSet.has(candidate)) ?? null;
}

function localImports(file, source) {
  const imports = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const resolved = resolveLocalModule(file, match[1]);
      if (resolved) imports.add(resolved);
    }
  }

  return imports;
}

const sourceByFile = new Map();
const importsByFile = new Map();
const clientEntryFiles = [];

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  sourceByFile.set(path.resolve(file), source);
  importsByFile.set(path.resolve(file), localImports(file, source));

  if (/^\s*['"]use client['"]/.test(source)) {
    clientEntryFiles.push(path.resolve(file));
  }
}

const browserReachable = new Set();
const browserQueue = [...clientEntryFiles];

while (browserQueue.length > 0) {
  const current = browserQueue.shift();
  if (!current || browserReachable.has(current)) continue;

  browserReachable.add(current);
  for (const dependency of importsByFile.get(current) ?? []) {
    if (!browserReachable.has(dependency)) {
      browserQueue.push(dependency);
    }
  }
}

const browserDatabaseViolations = [];
for (const file of browserReachable) {
  const source = sourceByFile.get(file) ?? '';
  if (/\.from\(\s*['"][^'"]+['"]\s*\)/.test(source)) {
    browserDatabaseViolations.push(
      `${path.relative(root, file)} -> direct .from(...)`
    );
  }
  if (/\.rpc\(\s*['"][^'"]+['"]/.test(source)) {
    browserDatabaseViolations.push(
      `${path.relative(root, file)} -> direct .rpc(...)`
    );
  }
  if (
    source.includes("'postgres_changes'") ||
    source.includes('"postgres_changes"')
  ) {
    browserDatabaseViolations.push(
      `${path.relative(root, file)} -> direct postgres_changes subscription`
    );
  }
  if (
    source.includes('@/middlewares/conexionBd.middleware') ||
    source.includes('@/services/supabaseServerClient')
  ) {
    browserDatabaseViolations.push(
      `${path.relative(root, file)} -> server database dependency`
    );
  }
}

if (browserDatabaseViolations.length > 0) {
  fail(
    `Browser-reachable modules still access business data directly:\n${browserDatabaseViolations.join('\n')}`
  );
}

const requiredBrowserClients = [
  'src/services/browser/databaseApiClient.ts',
  'src/services/browser/actividadApiClient.ts',
  'src/services/browser/asistenciaApiClient.ts',
  'src/services/browser/avisoApiClient.ts',
  'src/services/browser/cuotaApiClient.ts',
  'src/services/browser/equipamientoApiClient.ts',
  'src/services/browser/mantenimientoApiClient.ts',
  'src/services/browser/productoApiClient.ts',
  'src/services/browser/proveedorApiClient.ts',
  'src/services/browser/servicioApiClient.ts',
  'src/services/browser/ventaApiClient.ts',
  'src/services/browser/ventaDetalleApiClient.ts',
  'src/services/browser/socioApiClient.ts',
];

for (const relativePath of requiredBrowserClients) {
  const source = read(relativePath);

  if (relativePath.endsWith('databaseApiClient.ts')) {
    if (!source.includes('authHeader') || !source.includes('fetch(')) {
      fail('The shared browser database API client must attach auth and use fetch.');
    }
    continue;
  }

  if (!source.includes('/api/')) {
    fail(`${relativePath} must proxy business data through protected API routes.`);
  }
}

const equipamientoRouteSource = read(
  'src/app/api/equipamientos/[id]/route.ts'
);
if (!equipamientoRouteSource.includes('export async function GET')) {
  fail('The protected equipment detail API must expose GET for browser modals.');
}

const clientSecretViolations = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const isClient = /^\s*['"]use client['"]/.test(source);
  if (!isClient) continue;

  if (
    source.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    source.includes('@/services/supabaseServerClient')
  ) {
    clientSecretViolations.push(path.relative(root, file));
  }
}
if (clientSecretViolations.length > 0) {
  fail(`Client files reference server-only database material:\n${clientSecretViolations.join('\n')}`);
}

function gitTrackedFiles(pathspecs) {
  try {
    const output = execFileSync(
      'git',
      ['ls-files', '-z', '--', ...pathspecs],
      {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    return output
      .split('\0')
      .filter(Boolean)
      .map((file) => file.replaceAll('\\', '/'));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`Git tracked-file inspection could not run: ${detail}`);
  }
}

const privateSqlPathspecs = [
  'supabase/migrations',
  'database/private',
  'database/scripts',
];
const trackedPrivateSqlFiles = gitTrackedFiles(privateSqlPathspecs).filter((file) =>
  file.toLowerCase().endsWith('.sql')
);
if (trackedPrivateSqlFiles.length > 0) {
  fail(
    `Private database SQL is tracked by Git and must remain outside the public repository:\n${trackedPrivateSqlFiles.join('\n')}`
  );
}

const relationNames = new Set();
const rpcNames = new Set();
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\.from\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    relationNames.add(match[1]);
  }
  for (const match of source.matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)) {
    rpcNames.add(match[1]);
  }
}

if (relationNames.size < 80) {
  fail(`The source inventory unexpectedly found only ${relationNames.size} relations/views.`);
}
if (rpcNames.size < 20) {
  fail(`The source inventory unexpectedly found only ${rpcNames.size} RPCs.`);
}

const packageJson = JSON.parse(read('package.json'));
if (
  packageJson.scripts?.['test:database-rls-boundary'] !==
  'node scripts/verify-database-rls-boundary.mjs'
) {
  fail('package.json must expose test:database-rls-boundary.');
}

console.log(
  `Database server boundary OK: ${routeFiles.length} API routes avoid browser/anon Supabase clients; ${hardenedRoutes.length} legacy routes now use the server-only client.`
);
console.log(
  'Database secret boundary OK: service role access is server-only and private SQL is excluded from the public patch.'
);
console.log(
  `Database browser boundary OK: ${clientEntryFiles.length} client entry modules reach no direct business .from(...) or .rpc(...) calls.`
);
console.log(
  `Database code inventory OK: ${relationNames.size} relations/views and ${rpcNames.size} RPC names are available for the private SQL audit.`
);
console.log(
  'Database RLS phase status: server and browser boundaries are ready; the private policy/grant migration can proceed only after this block passes build and manual regression QA.'
);
