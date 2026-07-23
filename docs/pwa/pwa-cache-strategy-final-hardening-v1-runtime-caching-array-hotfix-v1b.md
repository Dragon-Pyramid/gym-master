# PWA cache strategy final hardening — runtimeCaching array hotfix v1b

## Context

The previous compatibility hotfix supplied `runtimeCaching` as a factory function. The installed dependency `next-pwa@5.6.0` reads this option as a mutable array and calls `unshift()` before generating the service worker. That produced the build error `TypeError: runtimeCaching.unshift is not a function`.

## Correction

- Replace the factory with a concrete `runtimeCaching` array.
- Preserve `options: {}` on every `NetworkOnly` rule so the offline fallback integration can safely inspect and extend each entry.
- Set `dynamicStartUrl: false` in addition to `cacheStartUrl: false`; otherwise `next-pwa@5.6.0` injects its `start-url` `NetworkFirst` runtime cache.
- Update the post-build verifier so it rejects the incompatible factory form and requires both start-url protections.

## Effective policy

- Same-origin `/api/*`: `NetworkOnly`.
- Same-origin document navigations: `NetworkOnly`, with the precached `/offline` fallback when the network fails.
- Versioned `/_next/static/*`: `CacheFirst` in `gym-master-static-v1`.
- Same-origin public images: `StaleWhileRevalidate` in `gym-master-public-images-v1`.
- Cross-origin and remaining same-origin GET requests: `NetworkOnly`.

## Scope

Functional files changed:

- `next.config.js`
- `scripts/verify-pwa-cache-policy.mjs`

No database, migration, RLS, RPC, API contract, authentication rule, or business operation was changed.
