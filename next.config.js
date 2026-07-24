/** @type {import('next').NextConfig} */

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
  experimental: {
    serverActions: {},
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
