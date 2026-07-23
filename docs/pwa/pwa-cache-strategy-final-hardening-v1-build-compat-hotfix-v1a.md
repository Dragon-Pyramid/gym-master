# PWA cache hardening — build compatibility hotfix v1a

## Context

The first hardened runtime policy failed during `next build` with:

```text
TypeError: Cannot read properties of undefined (reading 'precacheFallback')
```

The failure occurred while `next-pwa@5.6.0` was wiring the configured document fallback into the custom `runtimeCaching` entries.

## Root cause

The four `NetworkOnly` rules did not define an `options` object. The fallback integration in this version of `next-pwa` reads `entry.options.precacheFallback` for every runtime rule. Therefore, a rule without `options` aborts the build before the new service worker is emitted.

The subsequent `npm run test:pwa-cache` inspected the old `public/sw.js` left by a previous successful build. That explains why it reported the legacy cache names and did not reflect the new policy.

## Changes

- Adds `options: {}` to every `NetworkOnly` runtime rule.
- Exposes runtime caching through a factory so every webpack compilation receives a fresh rule array.
- Adds a cross-platform `prebuild` cleanup for generated `sw.js`, `workbox-*` and `fallback-*` artifacts.
- Strengthens the verifier so a failed build reports a missing fresh service worker instead of auditing a stale one.
- Keeps APIs and navigations as `NetworkOnly` and preserves the `/offline` fallback.

## Scope

No database, migration, RLS, RPC, API contract, authentication rule or commercial behavior is modified.
