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

const withSerwist = require("@serwist/next").default({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  swUrl: "/sw.js",
  scope: "/",
  register: false,
  cacheOnNavigation: false,
  reloadOnOnline: false,
  globPublicPatterns: ["offline.html"],
  disable: process.env.NODE_ENV === "development",
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

module.exports = withSerwist(nextConfig);
