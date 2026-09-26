/// <reference lib="webworker" />

import type { PrecacheEntry } from "serwist";
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<PrecacheEntry | string>;
};

// Only explicitly inventoried files from public/ may use the image cache.
const PUBLIC_IMAGE_PATHS = new Set([
  "/apple-touch-icon.png",
  "/female_silhouette.svg",
  "/file.svg",
  "/globe.svg",
  "/gm_logo.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/images/evolucion-fisica/siluetas/female-athletic-back.png",
  "/images/evolucion-fisica/siluetas/female-athletic.png",
  "/images/evolucion-fisica/siluetas/female-soft.png",
  "/images/evolucion-fisica/siluetas/male-athletic-back.png",
  "/images/evolucion-fisica/siluetas/male-athletic.png",
  "/images/evolucion-fisica/siluetas/male-soft.png",
  "/images/exercises/gym-master-exercise-fallback.svg",
  "/male_silhouette.svg",
  "/maskable-icon-192x192.png",
  "/maskable-icon-512x512.png",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
]);

const networkOnly = new NetworkOnly();

const runtimeCaching = [
  // Authentication and business data must never enter a runtime cache.
  {
    matcher: ({ request, url, sameOrigin }: {
      request: Request;
      url: URL;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      request.method === "GET" &&
      url.pathname.startsWith("/api/"),
    handler: networkOnly,
  },

  // This includes authenticated dashboard navigations.
  {
    matcher: ({ request, sameOrigin }: {
      request: Request;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      request.method === "GET" &&
      request.mode === "navigate",
    handler: networkOnly,
  },

  // Next.js content-hashed static assets only.
  {
    matcher: ({ request, url, sameOrigin }: {
      request: Request;
      url: URL;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      request.method === "GET" &&
      url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "gym-master-static-v2",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 256,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },

  // Only public, same-origin image requests.
  {
    matcher: ({ request, url, sameOrigin }: {
      request: Request;
      url: URL;
      sameOrigin: boolean;
    }) =>
      sameOrigin &&
      request.method === "GET" &&
      request.destination === "image" &&
      PUBLIC_IMAGE_PATHS.has(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: "gym-master-public-images-v2",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 48,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },

  // All remaining GET requests stay on the network.
  {
    matcher: ({ request }: { request: Request }) =>
      request.method === "GET",
    handler: networkOnly,
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
  },
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  disableDevLogs: true,
  runtimeCaching,
});


// Only failed navigations may receive the public offline document.
// API and other failed requests must retain their network error.
serwist.setCatchHandler(async ({ request }) => {
  const pathname = new URL(request.url).pathname;

  // A direct browser navigation to an API must never receive offline HTML.
  if (
    request.method !== "GET" ||
    request.mode !== "navigate" ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  ) {
    return Response.error();
  }

  return (await serwist.matchPrecache("/offline.html")) ?? Response.error();
});

serwist.addEventListeners();
