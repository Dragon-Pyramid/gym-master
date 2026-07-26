# Database RLS Final Audit V1 — Browser Business-Data Boundary (Block 2)

## Purpose

This block removes the remaining direct browser dependency on Supabase business-table and RPC access before any private RLS policy migration is applied.

Gym Master uses its own JWT/NextAuth authorization layer. A browser Supabase session therefore must not be treated as the primary business authorization boundary. Browser modules now call protected Next.js API Routes with the existing Bearer token, while database execution remains on the trusted server boundary.

## Scope

The block introduces browser API clients for the legacy CRUD modules used by dashboard components:

- activities;
- attendances;
- notices;
- fees;
- equipment;
- maintenance;
- products;
- suppliers;
- services;
- sales and sale details;
- member lists.

Existing secure API clients for other modules remain unchanged.

The equipment detail route gains an authenticated `GET` method because its edit/view modals previously read that record directly from Supabase.

## Security result

After this block:

- client-reachable modules contain no business `.from(...)` calls;
- client-reachable modules contain no business `.rpc(...)` calls;
- client modules do not import `conexionBD` or the server-only Supabase client;
- all affected operations cross the existing Auth/RBAC API boundary;
- the public anon key remains limited to Supabase Auth helpers and Realtime infrastructure;
- the service-role key remains server-only.

## Automatic verification

`npm run test:database-rls-boundary` now builds a local import graph from every `"use client"` module and follows relative and `@/` imports.

The gate fails when any browser-reachable module:

- executes `.from(...)`;
- executes `.rpc(...)`;
- imports the database middleware;
- imports the server-only Supabase client.

It also verifies the required browser API clients and the protected equipment detail endpoint.

## Database scope

This public block does not include or apply:

- SQL migrations;
- policy changes;
- grants or revokes;
- schema changes;
- RLS changes;
- RPC changes;
- data changes.

Private SQL remains outside the public repository.

## Required validation before private migration

1. Production build.
2. Accumulated automatic gates.
3. Admin/user regression of every migrated CRUD module.
4. Socio screens that consume member lists.
5. Sales flow with products, services, stock and details.
6. Equipment and maintenance detail modals.
7. Browser network inspection confirming `/api/...` calls and no direct PostgREST business requests.

Only after this block passes is it safe to apply the private policy/grant hardening migration to `gymmaster_migration_qa`.
