/** @type {import('next').NextConfig} */


const isProduction = process.env.NODE_ENV === 'production';

function getOrigin(value) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLoopbackOrigin(origin) {
  if (!origin) return false;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

const configuredAppOrigin = getOrigin(
  process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL,
);
const shouldEnforceHttps =
  isProduction &&
  Boolean(configuredAppOrigin?.startsWith('https://')) &&
  !isLoopbackOrigin(configuredAppOrigin);

function buildContentSecurityPolicy() {
  const supabaseOrigin = getOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseWebSocketOrigin = supabaseOrigin
    ?.replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:');
  const connectSources = [
    "'self'",
    supabaseOrigin,
    supabaseWebSocketOrigin,
    ...(shouldEnforceHttps ? [] : ['http:', 'https:', 'ws:', 'wss:']),
  ].filter(Boolean);
  const imageSources = [
    "'self'",
    'data:',
    'blob:',
    'https:',
    ...(shouldEnforceHttps ? [] : ['http:']),
  ];
  const mediaSources = [
    "'self'",
    'blob:',
    'https:',
    ...(shouldEnforceHttps ? [] : ['http:']),
  ];

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    `media-src ${mediaSources.join(' ')}`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(shouldEnforceHttps ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: buildContentSecurityPolicy(),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), browsing-topics=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
  {
    key: 'Origin-Agent-Cluster',
    value: '?1',
  },
  ...(shouldEnforceHttps
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000',
        },
      ]
    : []),
];

const runtimeCaching = [
  {
    urlPattern: ({ url, request }) =>
      request.method === 'GET' &&
      url.origin === self.location.origin &&
      url.pathname.startsWith('/api/'),
    handler: 'NetworkOnly',
    method: 'GET',
    options: {},
  },
  {
    urlPattern: ({ url, request }) =>
      request.mode === 'navigate' && url.origin === self.location.origin,
    handler: 'NetworkOnly',
    method: 'GET',
    options: {},
  },
  {
    urlPattern: ({ url, request }) =>
      request.method === 'GET' &&
      url.origin === self.location.origin &&
      url.pathname.startsWith('/_next/static/'),
    handler: 'CacheFirst',
    method: 'GET',
    options: {
      cacheName: 'gym-master-static-v1',
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 256,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      },
    },
  },
  {
    urlPattern: ({ url, request }) =>
      request.method === 'GET' &&
      url.origin === self.location.origin &&
      /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname),
    handler: 'StaleWhileRevalidate',
    method: 'GET',
    options: {
      cacheName: 'gym-master-public-images-v1',
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 48,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      },
    },
  },
  {
    urlPattern: ({ url, request }) =>
      request.method === 'GET' && url.origin !== self.location.origin,
    handler: 'NetworkOnly',
    method: 'GET',
    options: {},
  },
  {
    urlPattern: ({ url, request }) =>
      request.method === 'GET' && url.origin === self.location.origin,
    handler: 'NetworkOnly',
    method: 'GET',
    options: {},
  },
];

const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  // Keep updates waiting until the user explicitly accepts the new version.
  // This avoids mixing an old page with a newly activated worker and hashed chunks.
  skipWaiting: false,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  buildExcludes: [/app-build-manifest\.json$/],
  reloadOnOnline: false,
  disableDevLogs: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  // next-pwa@5.6.0 expects a mutable array and augments its entries while
  // wiring the offline fallback during the client compilation.
  runtimeCaching,
});

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.aesthetics-blog.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'vitruve.fit' },
      { protocol: 'https', hostname: 'boxlifemagazine.com' },
      { protocol: 'https', hostname: 'fitcron.com' },
      { protocol: 'https', hostname: 'menspower.nl' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

module.exports = withPWA(nextConfig);
