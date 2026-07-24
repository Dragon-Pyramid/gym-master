import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'public', 'manifest.json');
const configPath = resolve(root, 'next.config.js');
const serviceWorkerPath = resolve(root, 'public', 'sw.js');
const sessionWrapperPath = resolve(root, 'src', 'components', 'SessionWrapper.tsx');
const appHeaderPath = resolve(root, 'src', 'components', 'header', 'AppHeader.tsx');
const updateBannerPath = resolve(
  root,
  'src',
  'components',
  'pwa',
  'PwaConnectionUpdateBanner.tsx',
);
const installPromptPath = resolve(
  root,
  'src',
  'components',
  'pwa',
  'SocioPwaInstallPrompt.tsx',
);
const registrarPath = resolve(
  root,
  'src',
  'components',
  'pwa',
  'PwaServiceWorkerRegistrar.tsx',
);

function fail(message) {
  console.error(`PWA install/update verification failed: ${message}`);
  process.exit(1);
}

function readRequired(path, label) {
  if (!existsSync(path)) {
    fail(`${label} was not found.`);
  }

  return readFileSync(path, 'utf8');
}

function readPngDimensions(path) {
  if (!existsSync(path)) {
    fail(`required icon was not found: ${path}`);
  }

  const buffer = readFileSync(path);
  const pngSignature = '89504e470d0a1a0a';

  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    fail(`icon is not a valid PNG: ${path}`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function requireSourceTokens(source, tokens, label) {
  const missing = tokens.filter((token) => !source.includes(token));

  if (missing.length > 0) {
    fail(`${label} tokens missing: ${missing.join(', ')}`);
  }
}

const manifestSource = readRequired(manifestPath, 'public/manifest.json');
let manifest;

try {
  manifest = JSON.parse(manifestSource);
} catch {
  fail('public/manifest.json is not valid JSON.');
}

const requiredManifestValues = {
  name: 'Gym Master - Dragon Pyramid',
  short_name: 'Gym Master',
  id: '/dashboard',
  start_url: '/dashboard?source=pwa',
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: '#000000',
  theme_color: '#000000',
};

for (const [key, expected] of Object.entries(requiredManifestValues)) {
  if (manifest[key] !== expected) {
    fail(`manifest.${key} must be ${JSON.stringify(expected)}.`);
  }
}

if (!Array.isArray(manifest.icons)) {
  fail('manifest.icons must be an array.');
}

const requiredIcons = [
  { src: '/icon-192x192.png', size: 192, purpose: 'any' },
  { src: '/icon-512x512.png', size: 512, purpose: 'any' },
  { src: '/maskable-icon-192x192.png', size: 192, purpose: 'maskable' },
  { src: '/maskable-icon-512x512.png', size: 512, purpose: 'maskable' },
  { src: '/apple-touch-icon.png', size: 180, purpose: 'any' },
];

for (const requiredIcon of requiredIcons) {
  const icon = manifest.icons.find((candidate) => candidate.src === requiredIcon.src);

  if (!icon) {
    fail(`manifest icon missing: ${requiredIcon.src}`);
  }

  if (icon.sizes !== `${requiredIcon.size}x${requiredIcon.size}`) {
    fail(`manifest icon has an invalid sizes value: ${requiredIcon.src}`);
  }

  if (!String(icon.purpose ?? '').split(/\s+/).includes(requiredIcon.purpose)) {
    fail(`manifest icon has an invalid purpose: ${requiredIcon.src}`);
  }

  const iconPath = resolve(root, 'public', requiredIcon.src.replace(/^\//, ''));
  const dimensions = readPngDimensions(iconPath);

  if (
    dimensions.width !== requiredIcon.size ||
    dimensions.height !== requiredIcon.size
  ) {
    fail(
      `icon dimensions do not match the manifest: ${requiredIcon.src} is ${dimensions.width}x${dimensions.height}`,
    );
  }
}

const configSource = readRequired(configPath, 'next.config.js');
requireSourceTokens(
  configSource,
  [
    'register: false',
    'skipWaiting: false',
    'clientsClaim: true',
    'cleanupOutdatedCaches: true',
    'cacheStartUrl: false',
    'dynamicStartUrl: false',
    "document: '/offline'",
  ],
  'next.config.js',
);

const registrarSource = readRequired(
  registrarPath,
  'PwaServiceWorkerRegistrar.tsx',
);
requireSourceTokens(
  registrarSource,
  [
    "SERVICE_WORKER_URL = '/sw.js'",
    "SERVICE_WORKER_SCOPE = '/'",
    "updateViaCache: 'none'",
  ],
  'service worker registrar',
);

if (
  !/navigator\.serviceWorker\s*\.register\s*\(\s*SERVICE_WORKER_URL\s*,/s.test(
    registrarSource,
  )
) {
  fail('the App Router service worker registrar does not register /sw.js.');
}

const sessionWrapperSource = readRequired(
  sessionWrapperPath,
  'SessionWrapper.tsx',
);
requireSourceTokens(
  sessionWrapperSource,
  [
    '<PwaServiceWorkerRegistrar />',
    '<SocioPwaInstallPrompt />',
    '<PwaConnectionUpdateBanner />',
    '<PwaAndroidInstalledAppPolish />',
  ],
  'global PWA mount',
);

const appHeaderSource = readRequired(appHeaderPath, 'AppHeader.tsx');
const duplicateHeaderMounts = [
  '<SocioPwaInstallPrompt />',
  '<PwaConnectionUpdateBanner />',
  '<PwaAndroidInstalledAppPolish />',
].filter((token) => appHeaderSource.includes(token));

if (duplicateHeaderMounts.length > 0) {
  fail(
    `PWA components are mounted twice in AppHeader: ${duplicateHeaderMounts.join(', ')}`,
  );
}

const updateBannerSource = readRequired(
  updateBannerPath,
  'PwaConnectionUpdateBanner.tsx',
);
requireSourceTokens(
  updateBannerSource,
  [
    'registration.waiting',
    "newWorker.state === 'installed'",
    "waitingWorker.postMessage({ type: 'SKIP_WAITING' })",
    "'controllerchange'",
    "'updatefound'",
    "'visibilitychange'",
    'window.location.reload()',
    'UPDATE_ACTIVATION_TIMEOUT_MS',
  ],
  'controlled update flow',
);

const installPromptSource = readRequired(
  installPromptPath,
  'SocioPwaInstallPrompt.tsx',
);
requireSourceTokens(
  installPromptSource,
  [
    "'beforeinstallprompt'",
    "'appinstalled'",
    "'(display-mode: standalone)'",
    'event.preventDefault()',
    'installEvent.prompt()',
  ],
  'install prompt flow',
);

if (!existsSync(serviceWorkerPath)) {
  fail('public/sw.js was not generated. Run npm run build first.');
}

const serviceWorkerSource = readFileSync(serviceWorkerPath, 'utf8');
requireSourceTokens(
  serviceWorkerSource,
  ['SKIP_WAITING', '/offline'],
  'generated service worker',
);

let trackedGeneratedFiles = '';

try {
  trackedGeneratedFiles = execFileSync(
    'git',
    [
      'ls-files',
      'public/sw.js',
      'public/workbox-*.js',
      'public/fallback-*.js',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  ).trim();
} catch {
  fail('git could not verify generated PWA artifacts.');
}

if (trackedGeneratedFiles) {
  fail(
    `generated PWA artifacts are still tracked by Git: ${trackedGeneratedFiles
      .split(/\r?\n/)
      .join(', ')}`,
  );
}

console.log('PWA manifest OK: install identity, standalone display, orientation and icons are valid.');
console.log('PWA install OK: the install prompt is mounted globally and detects installed mode.');
console.log('PWA update OK: updates wait for user confirmation and reload after controllerchange.');
console.log('PWA repository OK: generated service worker and Workbox assets are not versioned.');
