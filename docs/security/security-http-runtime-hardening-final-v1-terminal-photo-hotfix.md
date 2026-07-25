# HTTP Runtime Hardening — Terminal member photo hotfix

## Context

During production-mode QA on `http://localhost:3000`, the attendance terminal continued loading recent movements but member avatars rendered as broken images after the HTTP security header baseline was enabled.

## Root cause

`next build` + `next start` sets `NODE_ENV=production` even when the application is being exercised locally over plain HTTP. The initial policy therefore enabled HTTPS-only image sources, HSTS and `upgrade-insecure-requests` solely from `NODE_ENV`. Legacy or local HTTP image URLs could consequently be blocked or rewritten to an unavailable HTTPS endpoint.

## Resolution

- HTTPS enforcement is now based on a configured HTTPS application origin (`NEXT_PUBLIC_APP_URL`, `APP_URL` or `NEXTAUTH_URL`) rather than `NODE_ENV` alone.
- HSTS and `upgrade-insecure-requests` remain active for real configured HTTPS deployments.
- Local production-mode QA may load HTTP image/media endpoints without weakening the real HTTPS deployment policy.
- Legacy `http://res.cloudinary.com/...` profile photos are normalized to HTTPS.
- The terminal replaces an image that still fails with the local Gym Master logo instead of leaving a broken avatar.
- The HTTP runtime verification gate covers both the environment-aware policy and the terminal fallback.

## Scope

Modified files:

- `next.config.js`
- `src/components/asistencia/AsistenciaTerminalDisplay.tsx`
- `scripts/verify-http-runtime-security.mjs`

No database, migration, RLS, RPC, API contract or authorization changes are included.

## QA

1. Build and start with the configured local origin over HTTP.
2. Open `/dashboard/asistencias/terminal`.
3. Confirm recent members display their photos.
4. Confirm an intentionally invalid image URL falls back to `/gm_logo.svg`.
5. Confirm the response headers omit HSTS and `upgrade-insecure-requests` for a configured local HTTP origin.
6. Confirm a configured production HTTPS origin retains HSTS and `upgrade-insecure-requests`.
