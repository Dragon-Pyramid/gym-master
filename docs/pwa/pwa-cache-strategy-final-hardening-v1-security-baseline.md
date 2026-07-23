# PWA cache strategy final hardening v1 — security baseline

## Objective

Replace the broad `next-pwa` default runtime cache with an explicit allowlist that favors freshness and session isolation for Gym Master.

## Risk found in the previous generated service worker

The generated `public/sw.js` contained broad runtime caches named `apis`, `others`, `cross-origin`, `next-data` and `next-image`. In practice this allowed authenticated GET APIs, dashboard navigations and remote resources to remain in Cache Storage for up to one day.

That policy is unsafe for an ERP that handles members, medical records, payments, cash register, stock, messages, permissions and license state.

## Implemented policy

- All same-origin `/api/*` GET requests use `NetworkOnly`.
- All document navigations use `NetworkOnly` and fall back to `/offline` when the network is unavailable.
- Versioned `/_next/static/*` assets use `CacheFirst` in `gym-master-static-v1`.
- Only same-origin public image files use `StaleWhileRevalidate` in `gym-master-public-images-v1`.
- Cross-origin requests use `NetworkOnly`.
- Remaining same-origin GET requests use `NetworkOnly`.
- The start URL is not cached.
- Automatic reload on reconnect is disabled so active forms are not discarded unexpectedly.
- Development continues with PWA disabled.

## Runtime cache cleanup

`clearSensitivePwaCaches()` removes legacy caches that may contain private or stale responses. It runs:

1. When the client application mounts after this release.
2. On normal logout.
3. On terminal logout.
4. When an expired or invalid token triggers the normal logout path.

The cleanup does not delete Workbox precache entries or the new static caches.

## Generated artifacts

The following files are now ignored because `next-pwa` creates them during `npm run build`:

- `public/sw.js`
- `public/workbox-*.js`
- `public/fallback-*.js`

Because the old files are already tracked, apply the patch and then remove them from the Git index while keeping local generated copies:

```bash
git rm --cached public/sw.js
git ls-files 'public/workbox-*.js' 'public/fallback-*.js' | xargs -r git rm --cached --
```

## Build verification

```bash
rm -rf .next
npm run build
npm run test:pwa-cache
```

The verifier rejects the unsafe legacy cache names and confirms that the generated worker contains the hardened strategies.

## Manual validation

1. Build and run production locally with `npm run start`.
2. Open DevTools → Application → Service Workers and Cache Storage.
3. Confirm that no cache named `apis`, `others`, `cross-origin`, `next-data` or `next-image` remains after the application mounts.
4. Navigate through Dashboard, Members, Medical record, Payments, POS and Cash register.
5. Confirm in Network that API and document requests are served from the network, not from ServiceWorker cache.
6. Go offline and request a new dashboard route. The safe `/offline` page must appear instead of private stale content.
7. Log out and confirm that private runtime caches remain absent.

## Out of scope

- Manifest/icon/installation UX final QA.
- Transactional offline writes.
- Database, migrations, RLS, RPC or API response contracts.
