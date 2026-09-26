// SERWIST_CACHE_POLICY_VERIFIER_V1
import { existsSync, readFileSync, statSync } from "node:fs";
import { sep, resolve } from "node:path";

const root = process.cwd();

function fail(message) {
  console.error("PWA cache verification failed: " + message);
  process.exit(1);
}

function readRequired(relativePath) {
  const file = resolve(root, relativePath);

  if (!existsSync(file)) {
    fail("required file was not found: " + relativePath);
  }

  return readFileSync(file, "utf8");
}

function requireChecks(label, checks) {
  const failed = [];

  for (const [name, passed] of checks) {
    console.log(
      label + " / " + name + "=" + (passed ? "PASS" : "FAIL")
    );

    if (!passed) failed.push(name);
  }

  if (failed.length > 0) {
    fail(label + " checks failed: " + failed.join(", "));
  }
}

function sectionBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(
    endMarker,
    start < 0 ? 0 : start + startMarker.length
  );

  if (start < 0 || end <= start) {
    fail(
      "expected worker section was not found: " +
      startMarker + " -> " + endMarker
    );
  }

  return source.slice(start, end);
}

const manifest = JSON.parse(readRequired("package.json"));
const lock = JSON.parse(readRequired("package-lock.json"));

const config = readRequired("next.config.js");
const worker = readRequired("src/sw.ts");
const registrar = readRequired(
  "src/components/pwa/PwaServiceWorkerRegistrar.tsx"
);
const generated = readRequired("public/sw.js");

const offlineFile = resolve(root, "public/offline.html");

requireChecks("Dependency contract", [
  [
    "Serwist retained",
    manifest.dependencies?.["@serwist/next"] === "9.5.12" &&
      lock.packages?.["node_modules/@serwist/next"]?.version === "9.5.12"
  ],
  [
    "legacy next-pwa absent",
    !manifest.dependencies?.["next-pwa"] &&
      !lock.packages?.["node_modules/next-pwa"]
  ],
  [
    "offline document exists",
    existsSync(offlineFile) && statSync(offlineFile).size > 0
  ]
]);

requireChecks("Next.js Serwist configuration", [
  [
    "Serwist wrapper",
    /require\([\x22\x27]@serwist\/next[\x22\x27]\)/.test(config) &&
      config.includes("module.exports = withSerwist(nextConfig);")
  ],
  [
    "worker source and destination",
    /swSrc:\s*[\x22\x27]src\/sw\.ts[\x22\x27]/.test(config) &&
      /swDest:\s*[\x22\x27]public\/sw\.js[\x22\x27]/.test(config)
  ],
  [
    "worker URL and scope",
    /swUrl:\s*[\x22\x27]\/sw\.js[\x22\x27]/.test(config) &&
      /scope:\s*[\x22\x27]\/[\x22\x27]/.test(config)
  ],
  [
    "manual registration",
    /register:\s*false\b/.test(config)
  ],
  [
    "navigation cache disabled",
    /cacheOnNavigation:\s*false\b/.test(config)
  ],
  [
    "automatic online reload disabled",
    /reloadOnOnline:\s*false\b/.test(config)
  ],
  [
    "public precache limited to offline document",
    /globPublicPatterns:\s*\[\s*[\x22\x27]offline\.html[\x22\x27]\s*\]/.test(config)
  ],
  [
    "development worker disabled",
    /disable:\s*process\.env\.NODE_ENV\s*===\s*[\x22\x27]development[\x22\x27]/.test(config)
  ],
  [
    "legacy next-pwa configuration absent",
    !config.includes("next-pwa")
  ]
]);

requireChecks("App Router registration", [
  [
    "worker URL",
    /const\s+SERVICE_WORKER_URL\s*=\s*[\x22\x27]\/sw\.js[\x22\x27]/.test(registrar)
  ],
  [
    "worker scope",
    /const\s+SERVICE_WORKER_SCOPE\s*=\s*[\x22\x27]\/[\x22\x27]/.test(registrar)
  ],
  [
    "explicit registration",
    /navigator\.serviceWorker\s*\.register\s*\(\s*SERVICE_WORKER_URL\s*,/s.test(registrar)
  ],
  [
    "service worker script bypasses HTTP cache",
    /updateViaCache:\s*[\x22\x27]none[\x22\x27]/.test(registrar)
  ],
  [
    "production-only registration",
    /process\.env\.NODE_ENV\s*!==\s*[\x22\x27]production[\x22\x27]/.test(registrar)
  ]
]);

const apiRule = sectionBetween(
  worker,
  "// Authentication and business data must never enter a runtime cache.",
  "// This includes authenticated dashboard navigations."
);

const navigationRule = sectionBetween(
  worker,
  "// This includes authenticated dashboard navigations.",
  "// Next.js content-hashed static assets only."
);

const staticRule = sectionBetween(
  worker,
  "// Next.js content-hashed static assets only.",
  "// Only public, same-origin image requests."
);

const imageRule = sectionBetween(
  worker,
  "// Only public, same-origin image requests.",
  "// All remaining GET requests stay on the network."
);

const remainingRule = sectionBetween(
  worker,
  "// All remaining GET requests stay on the network.",
  "const serwist = new Serwist("
);

const fallback = sectionBetween(
  worker,
  "serwist.setCatchHandler(",
  "serwist.addEventListeners();"
);

const checksGetAndOrigin = source =>
  source.includes("sameOrigin") &&
  source.includes("request.method === \"GET\"");

requireChecks("Worker runtime policy", [
  [
    "API GET requests are network-only",
    checksGetAndOrigin(apiRule) &&
      apiRule.includes("url.pathname.startsWith(\"/api/\")") &&
      apiRule.includes("handler: networkOnly")
  ],
  [
    "authenticated navigations are network-only",
    checksGetAndOrigin(navigationRule) &&
      navigationRule.includes("request.mode === \"navigate\"") &&
      navigationRule.includes("handler: networkOnly")
  ],
  [
    "only versioned Next.js assets use static cache",
    checksGetAndOrigin(staticRule) &&
      staticRule.includes("url.pathname.startsWith(\"/_next/static/\")") &&
      staticRule.includes("new CacheFirst(") &&
      staticRule.includes("gym-master-static-v2")
  ],
  [
    "public images use an explicit allowlist",
    checksGetAndOrigin(imageRule) &&
      imageRule.includes("request.destination === \"image\"") &&
      imageRule.includes("PUBLIC_IMAGE_PATHS.has(url.pathname)") &&
      imageRule.includes("new StaleWhileRevalidate(") &&
      imageRule.includes("gym-master-public-images-v2")
  ],
  [
    "remaining GET requests are network-only",
    remainingRule.includes("request.method === \"GET\"") &&
      remainingRule.includes("handler: networkOnly")
  ],
  [
    "worker runtime rules are installed",
    worker.includes("runtimeCaching,") &&
      worker.includes("serwist.addEventListeners();")
  ],
  [
    "failed API navigations cannot receive offline HTML",
    fallback.includes("request.method !== \"GET\"") &&
      fallback.includes("request.mode !== \"navigate\"") &&
      fallback.includes("pathname === \"/api\"") &&
      fallback.includes("pathname.startsWith(\"/api/\")") &&
      fallback.includes("Response.error()") &&
      fallback.includes("serwist.matchPrecache(\"/offline.html\")")
  ],
  [
    "worker does not activate automatically",
    worker.includes("skipWaiting: false") &&
      worker.includes("clientsClaim: true")
  ],
  [
    "precache cleanup enabled",
    worker.includes("cleanupOutdatedCaches: true")
  ]
]);

const marker = "precacheEntries:[";
const manifestStart = generated.lastIndexOf(marker);
const entriesStart = manifestStart + marker.length;
const manifestEnd = generated.indexOf(
  "],precacheOptions:",
  entriesStart
);

if (manifestStart < 0 || manifestEnd < 0) {
  fail("compiled precache manifest was not found");
}

const compiledManifest = generated.slice(
  entriesStart,
  manifestEnd
);

const urls = [...compiledManifest.matchAll(
  /[\x22\x27]url[\x22\x27]\s*:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]/g
)].map(match => match[1]);

const entryCount = [...compiledManifest.matchAll(
  /\{\s*[\x22\x27]revision[\x22\x27]\s*:/g
)].length;

const offlineUrls = urls.filter(
  url => url === "/offline.html"
);

const staticUrls = urls.filter(
  url => url.startsWith("/_next/static/")
);

const unexpectedUrls = urls.filter(
  url =>
    url !== "/offline.html" &&
    !url.startsWith("/_next/static/")
);

const staticRoot = resolve(root, ".next/static");

const missingStaticFiles = staticUrls.filter(url => {
  let pathname;

  try {
    pathname = new URL(url, "http://localhost").pathname;
  } catch {
    return true;
  }

  let relative;

  try {
    relative = decodeURIComponent(
      pathname.slice("/_next/static/".length)
    );
  } catch {
    return true;
  }

  const absolute = resolve(staticRoot, relative);

  return (
    !absolute.startsWith(staticRoot + sep) ||
    !existsSync(absolute)
  );
});

console.log("PRECACHE_ENTRIES=" + entryCount);
console.log("PRECACHE_STATIC_URLS=" + staticUrls.length);
console.log("PRECACHE_OFFLINE_URLS=" + offlineUrls.length);
console.log("PRECACHE_UNEXPECTED_URLS=" + unexpectedUrls.length);
console.log("PRECACHE_MISSING_STATIC_FILES=" + missingStaticFiles.length);

const compiledCacheNames = [...generated.matchAll(
  /cacheName\s*:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]/g
)].map(match => match[1]);

const forbiddenCacheNames = [
  "start-url",
  "apis",
  "others",
  "cross-origin",
  "next-data",
  "next-image",
  "static-data-assets",
  "static-image-assets",
  "static-audio-assets",
  "static-video-assets",
  "gym-master-static-v1",
  "gym-master-public-images-v1"
];

const forbiddenCaches = compiledCacheNames.filter(
  name => forbiddenCacheNames.includes(name)
);

requireChecks("Compiled worker policy", [
  [
    "precache entries and URLs agree",
    entryCount > 0 && entryCount === urls.length
  ],
  [
    "no duplicate precache URLs",
    new Set(urls).size === urls.length
  ],
  [
    "offline document precached exactly once",
    offlineUrls.length === 1
  ],
  [
    "versioned Next.js assets present",
    staticUrls.length > 0
  ],
  [
    "no API, dashboard or other unexpected precache URL",
    unexpectedUrls.length === 0
  ],
  [
    "all precached static files exist",
    missingStaticFiles.length === 0
  ],
  [
    "expected runtime cache names compiled",
    compiledCacheNames.includes("gym-master-static-v2") &&
      compiledCacheNames.includes("gym-master-public-images-v2")
  ],
  [
    "legacy runtime caches absent",
    forbiddenCaches.length === 0
  ],
  [
    "controlled update handler compiled",
    generated.includes("SKIP_WAITING") &&
      generated.includes("setCatchHandler(") &&
      generated.includes("matchPrecache(\"/offline.html\")")
  ]
]);

console.log(
  "PWA_CACHE_POLICY_RESULT=SERWIST_SOURCE_AND_COMPILED_POLICY_PASS"
);
console.log(
  "NOTE=Static contract verification supplements isolated browser tests."
);
