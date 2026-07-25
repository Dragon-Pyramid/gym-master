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

const nextConfig = read('next.config.js');
assert(
  includesAll(nextConfig, [
    "key: 'Content-Security-Policy'",
    "default-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "key: 'Strict-Transport-Security'",
    "key: 'Referrer-Policy'",
    "key: 'X-Content-Type-Options'",
    "key: 'X-Frame-Options'",
    "key: 'Permissions-Policy'",
    'poweredByHeader: false',
    "bodySizeLimit: '1mb'",
  ]),
  'Next.js must publish the complete HTTP security header baseline and disable X-Powered-By.',
);
assert(
  includesAll(nextConfig, [
    'const shouldEnforceHttps =',
    "configuredAppOrigin?.startsWith('https://')",
    '!isLoopbackOrigin(configuredAppOrigin)',
    "shouldEnforceHttps ? ['upgrade-insecure-requests'] : []",
    "...(shouldEnforceHttps ? [] : ['http:'])",
  ]) &&
    !nextConfig.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval'"),
  'HTTPS-only CSP and HSTS must remain enabled for configured secure deployments while local production QA may load HTTP media without mixed-content breakage.',
);

const middleware = read('src/middleware.ts');
assert(
  includesAll(middleware, [
    '/api/custom-login',
    '/api/auth/:path*',
    '/api/comercial/mobile-scanner/public/:path*',
    '/api/pagos/:id/verificar',
    '/api/image-proxy',
    '/api/internal/dragon-pyramid/license-sync',
    'status: 429',
    "'Retry-After'",
    'MAX_BUCKETS',
    'sweepExpiredBuckets',
  ]),
  'Sensitive public and internal routes must be covered by bounded per-instance rate limiting.',
);

const runtimeSecurity = read('src/lib/security/httpRuntimeSecurity.ts');
assert(
  includesAll(runtimeSecurity, [
    'export async function readJsonBody',
    'export async function readTextBody',
    'export function requestBodyTooLargeResponse',
    'REQUEST_BODY_TOO_LARGE',
    'UNSUPPORTED_MEDIA_TYPE',
    'INVALID_JSON_BODY',
    "'Cache-Control': 'no-store'",
  ]),
  'Runtime security helpers must enforce body limits, JSON media types and no-store responses.',
);

const requiredJsonBodyRoutes = [
  'src/app/api/custom-login/route.ts',
  'src/app/api/auth/forgot-password/route.ts',
  'src/app/api/auth/reset-password/route.ts',
  'src/app/api/auth/change-password/route.ts',
  'src/app/api/comercial/mobile-scanner/public/[token]/route.ts',
  'src/app/api/internal/dragon-pyramid/license-sync/route.ts',
  'src/app/api/pagar-cuota/confirmar/route.ts',
  'src/app/api/asistencias/registro-qr/route.ts',
];

for (const route of requiredJsonBodyRoutes) {
  assert(
    read(route).includes('readJsonBody'),
    `${route} must parse JSON through the bounded runtime helper.`,
  );
}

const stripeWebhook = read('src/app/api/stripe-webhook/route.ts');
assert(
  includesAll(stripeWebhook, [
    'readTextBody',
    'STRIPE_WEBHOOK_BODY_MAX_BYTES',
    'constructEvent',
    'stripe-signature',
    "{ error: 'Firma de Stripe inválida' }",
  ]),
  'Stripe webhook must bound its raw body and redact signature/provider errors.',
);

const imageProxy = read('src/app/api/image-proxy/route.ts');
assert(
  includesAll(imageProxy, [
    "redirect: 'manual'",
    'AbortSignal.timeout',
    'readImageBodyWithinLimit',
    "contentType === 'image/svg+xml'",
    'MAX_IMAGE_URL_LENGTH',
    'MAX_IMAGE_BYTES',
  ]),
  'Image proxy must retain SSRF controls and add timeout, streaming size enforcement and SVG rejection.',
);
assert(
  !imageProxy.includes('Access-Control-Allow-Origin'),
  'Image proxy must remain same-origin and must not emit wildcard CORS.',
);

const apiRoot = path.join(root, 'src/app/api');
const routeFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    if (entry.isFile() && entry.name === 'route.ts') routeFiles.push(fullPath);
  }
}
walk(apiRoot);

for (const routeFile of routeFiles) {
  const source = fs.readFileSync(routeFile, 'utf8');
  assert(
    !source.includes("'Access-Control-Allow-Origin': '*'") &&
      !source.includes('"Access-Control-Allow-Origin": "*"'),
    `${path.relative(root, routeFile)} must not allow wildcard CORS.`,
  );
}

const uploadRoutes = [
  'src/app/api/file-upload/route.ts',
  'src/app/api/gimnasio-parametrizacion/logo-upload/route.ts',
  'src/app/api/otros_gastos/comprobante-upload/route.ts',
  'src/app/api/rutinas/ejercicios-media/upload/route.ts',
  'src/app/api/socios/[id]/ficha-medica/route.ts',
];

for (const route of uploadRoutes) {
  assert(
    read(route).includes('requestBodyTooLargeResponse'),
    `${route} must reject oversized multipart requests before formData parsing when Content-Length is available.`,
  );
}
assert(
  read('src/app/api/socios/[id]/ficha-medica/route.ts').includes('hasSafeUploadSignature'),
  'Medical attachments must validate binary signatures in addition to MIME type.',
);

const loginService = read('src/services/loginService.ts');
assert(
  loginService.includes('.maybeSingle()') &&
    !loginService.includes(".eq('email', email)\n    .single()") &&
    !loginService.includes("error.message") &&
    loginService.includes("code: error.code || 'LOGIN_USER_QUERY_ERROR'"),
  'Login lookup must treat an absent user as invalid credentials and must not expose provider error messages in logs.',
);

const authRecovery = read('src/services/authRecoveryService.ts');
assert(
  includesAll(authRecovery, [
    'function normalizeAppBaseUrl',
    "process.env.NODE_ENV === 'production'",
    'NEXT_PUBLIC_APP_URL o APP_URL debe estar configurada',
  ]) &&
    !authRecovery.includes("headers.get('origin')") &&
    !authRecovery.includes("headers.get('x-forwarded-host')") &&
    !authRecovery.includes("headers.get('host')"),
  'Password recovery links must use a configured public origin in production and must not trust request Host/Origin headers.',
);


const serverAuthorization = read('src/lib/auth/serverAuthorization.ts');
assert(
  includesAll(serverAuthorization, [
    'noStoreJson',
    'No se pudo validar la autorización de la solicitud',
    'error.status >= 500',
  ]),
  'Authorization failures must be no-store and redact server-side configuration details.',
);

const nextAuth = read('src/app/api/auth/[...nextauth]/route.ts');
assert(
  nextAuth.includes("useSecureCookies: process.env.NODE_ENV === 'production'") &&
    nextAuth.includes('debug: false'),
  'NextAuth must explicitly enable secure production cookies and keep debug output disabled.',
);

const storageService = read('src/services/storageService.ts');
assert(
  includesAll(storageService, [
    'sameSite: "strict"',
    'secure: shouldUseSecureCookie()',
    'path: "/"',
    'Cookies.remove(TOKEN_KEY, { path: "/" })',
    'Cookies.remove(TERMINAL_TOKEN_KEY, { path: "/" })',
  ]),
  'Browser-readable bearer cookies must keep Strict SameSite, HTTPS-only production transport and deterministic Path cleanup.',
);

const attendanceTerminal = read('src/components/asistencia/AsistenciaTerminalDisplay.tsx');
assert(
  includesAll(attendanceTerminal, [
    'function normalizeTerminalPhotoUrl',
    "normalized.startsWith('http://res.cloudinary.com/')",
    'function replaceBrokenTerminalPhoto',
    "image.src = '/gm_logo.svg'",
    'onError={replaceBrokenTerminalPhoto}',
  ]),
  'Attendance terminal must normalize legacy Cloudinary URLs and replace failed member photos with a deterministic local fallback.',
);

const textEditor = read('src/components/ui/TextEditor.tsx');
assert(
  includesAll(textEditor, [
    'function escapeHtml',
    'function sanitizeMarkdownUrl',
    'return escapeHtml(text)',
    "new Set(['http:', 'https:', 'mailto:'])",
    'rel="noopener noreferrer nofollow"',
    'dangerouslySetInnerHTML',
  ]),
  'Markdown preview must escape raw HTML and allow only explicit URL protocols before HTML rendering.',
);

if (failures.length > 0) {
  console.error('HTTP runtime security verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('HTTP security headers OK: CSP, HSTS, clickjacking, MIME, referrer and permissions policies are configured.');
console.log('Runtime abuse controls OK: sensitive public routes have bounded rate limits and Retry-After responses.');
console.log('Request limits OK: JSON, Stripe raw bodies and multipart uploads reject oversized payloads.');
console.log('Public endpoint exposure OK: wildcard CORS and raw provider/database errors are removed from hardened routes.');
console.log('Browser security OK: secure cookie attributes, trusted recovery origins and escaped Markdown preview are enforced.');
