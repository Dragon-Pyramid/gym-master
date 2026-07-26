# Database RLS Final Audit V1 — Realtime Boundary Hotfix

## Objective

Remove browser-side `postgres_changes` subscriptions over the `public.asistencia` business table before private RLS hardening.

Gym Master uses its own JWT and protected Next.js API Routes for business authorization. Browser Supabase clients use the public anon key for Auth helpers and Realtime broadcast channels, but must not depend on direct table visibility.

## Changes

- `AsistenciasRecientesTable` keeps its existing protected API polling every 2.5 seconds and no longer subscribes directly to table changes.
- `AsistenciaTerminalDisplay` keeps protected polling and the existing `access_event` broadcast channel, but no longer subscribes directly to `public.asistencia` changes.
- `test:database-rls-boundary` now rejects browser-reachable `postgres_changes` subscriptions.

## Functional behavior preserved

- Attendance data continues loading through protected API Routes.
- The terminal keeps refreshing recent movements.
- Access feedback continues using the existing Realtime broadcast channel.
- No API, database, RLS, RPC, migration, payload or Swagger contract changes are included.

## Validation

```bash
npm run test:database-rls-boundary
rm -rf .next
npm run build
npm run start
```

Manual checks:

1. Open the attendance dashboard and confirm recent rows refresh.
2. Create, update and delete an attendance record and wait up to 2.5 seconds for the list to refresh.
3. Open the terminal and confirm recent movements refresh.
4. Scan a member QR and confirm the access broadcast still reaches the administrator/terminal.
5. Verify DevTools shows protected `/api/...` requests and no Realtime `postgres_changes` subscription to `public.asistencia`.
