# Database RLS Final Audit V1 — Baseline de frontera e inventario

## Estado

Primera fase de `feature/database-rls-final-audit-v1`.

Esta fase **no modifica la base de datos**. Endurece la frontera entre API y Supabase, agrega un gate de código y prepara el inventario que debe contrastarse con la base local restaurada antes de generar cualquier migración RLS.

## Motivo de la fase previa

El snapshot limpio del repositorio no contiene:

- esquema SQL versionado;
- migraciones de negocio;
- definición actual de políticas RLS;
- grants de tablas, secuencias o funciones;
- configuración efectiva de publicaciones Realtime;
- estado real de funciones `SECURITY DEFINER`.

Por lo tanto, no es técnicamente válido afirmar que la auditoría RLS está cerrada usando solo el código TypeScript.

La documentación histórica registra policies de desarrollo `dev_all_*` con `USING (true)` y `WITH CHECK (true)`, pero ese dato debe tratarse como antecedente y verificarse contra la base actual.

## Hallazgos del código

El inventario estático del snapshot detecta aproximadamente:

- 87 tablas o vistas referenciadas mediante `.from(...)`;
- 24 RPC referenciados mediante `.rpc(...)`;
- 11 API Routes que todavía dependían de un cliente compartido o anon;
- servicios compartidos que pueden ejecutarse tanto en navegador como en servidor;
- canales Realtime de navegador que utilizan la anon key.

La aplicación utiliza autenticación propia con JWT/NextAuth. El navegador no recibe una sesión Supabase equivalente para que `auth.uid()` pueda representar de forma confiable al usuario de Gym Master. Por esa razón, las operaciones de negocio no deben depender de acceso directo irrestricto mediante anon.

## Cambios de esta fase

### Cliente runtime compartido

`src/services/supabaseClient.ts` conserva:

- un cliente anon para navegador, Auth helpers y canales Realtime;
- un cliente service role creado de forma lazy únicamente cuando el módulo se ejecuta en Node;
- `persistSession: false` y `autoRefreshToken: false` para el cliente de servidor;
- error explícito si `SUPABASE_SERVICE_ROLE_KEY` no está disponible en servidor.

La clave service role no se exporta ni se incorpora a variables `NEXT_PUBLIC_*`.

### API Routes endurecidas

Las siguientes rutas pasan a importar explícitamente `getSupabaseServerClient`:

- `src/app/api/admin/cuotas/dashboard-bi/route.ts`
- `src/app/api/asistencias/recientes/route.ts`
- `src/app/api/compras/[id]/route.ts`
- `src/app/api/compras/route.ts`
- `src/app/api/equipamientos/alertas-mantenimiento/route.ts`
- `src/app/api/equipamientos/mantenimiento-bi/route.ts`
- `src/app/api/evolucion_socio/admin/resumen/route.ts`
- `src/app/api/finanzas/dashboard-bi/route.ts`
- `src/app/api/otros_gastos/route.ts`
- `src/app/api/productos/stock-movimientos/route.ts`
- `src/app/api/socios/demografia-promociones-bi/route.ts`

Estas rutas ya aplican autenticación/RBAC en la capa Next.js. El cambio evita que una operación server-side autorizada dependa accidentalmente de policies anon abiertas.

### Servicios compartidos

Los servicios que importaban directamente el singleton anon ahora resuelven el cliente mediante `getSupabaseClient()`:

- en navegador se mantiene anon y queda sujeto a RLS;
- en servidor se utiliza service role;
- no se modifica la firma pública de los servicios.

Esto evita regresiones mientras se prepara la siguiente fase, en la que los flujos de navegador con CRUD directo deberán migrarse a API Routes o quedar justificados como excepciones de solo lectura.

## Gate agregado

```bash
npm run test:database-rls-boundary
```

El gate valida:

1. Ninguna API Route importa el cliente anon, el cliente de navegador o `conexionBD`.
2. Las 11 rutas heredadas usan el cliente server-only.
3. `supabaseServerClient.ts` mantiene la barrera `server-only`.
4. Ningún archivo `use client` referencia `SUPABASE_SERVICE_ROLE_KEY` ni el cliente server-only.
5. No se incorporan SQL privados al parche público.
6. El inventario de tablas/vistas y RPC sigue disponible para contraste con la base.
7. `package.json` expone el gate.

## Kit SQL privado

La entrega incluye por separado un kit de auditoría de solo lectura. No debe copiarse ni commitearse dentro del repositorio público.

El kit inspecciona:

- tablas públicas y RLS habilitado/forzado;
- policies, roles, comandos, `USING` y `WITH CHECK`;
- policies permisivas o equivalentes a `true`;
- grants efectivos de `anon`, `authenticated` y `PUBLIC`;
- secuencias y funciones ejecutables;
- RPC `SECURITY DEFINER`, owner y `search_path`;
- vistas/materialized views y privilegios;
- publicación Realtime;
- relaciones con `auth.users`;
- presencia de las 87 relaciones o vistas y 24 RPC consumidas por el código.

## Orden obligatorio

1. Aplicar este parche de frontera.
2. Ejecutar build y gates.
3. Restaurar o usar la base local QA.
4. Ejecutar el SQL de auditoría **sin aplicar migraciones**.
5. Guardar y revisar el informe.
6. Recién entonces diseñar la migración privada de hardening RLS.
7. Probar migración + validación en local.
8. Ejecutar `supabase db push --dry-run`.
9. Aplicar remoto solo después de backup y aprobación.

## Bloqueos antes de una migración deny-by-default

No debe revocarse todavía el acceso anon de forma global hasta clasificar:

- CRUD directo desde servicios consumidos por componentes de navegador;
- canales Realtime de asistencias;
- Broadcast de eventos de acceso;
- vistas públicas comerciales;
- RPC que hoy podrían ser llamados con anon;
- cualquier integración externa que dependa de PostgREST.

## Fuera de alcance de esta fase

- crear o modificar policies;
- revocar grants;
- habilitar o forzar RLS;
- modificar funciones;
- aplicar SQL local o remoto;
- cambiar tablas, datos, RPC o migraciones;
- reescribir todos los servicios de navegador.

## Resultado esperado

La fase queda aprobada cuando:

```text
Database server boundary OK
Database secret boundary OK
Database code inventory OK
Database RLS phase status: ... read-only local audit ...
```

La feature completa solo podrá cerrarse después de analizar el informe SQL real y aprobar la migración privada resultante.
