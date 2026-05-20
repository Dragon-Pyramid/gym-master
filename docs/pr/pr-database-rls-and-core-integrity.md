## Descripción

Este PR inicia la etapa de desarrollo/corrección real posterior a la auditoría documental de Gym Master. El foco está en reforzar la integridad core y preparar el sistema para endurecer RLS sin romper los módulos principales.

El cambio mantiene la arquitectura single-tenant ya definida: una instancia/deploy y una base Supabase por gimnasio.

## Cambios principales

- Se agrega un cliente Supabase server-only basado en `SUPABASE_SERVICE_ROLE_KEY`.
- Se agregan servicios backend específicos para usuarios y socios.
- Se actualizan las API Routes de usuarios y socios para operar mediante servicios server-only.
- Se agregan clientes browser para que el frontend consuma `/api/usuarios` y `/api/socios` en lugar de importar servicios Supabase directos.
- Se actualizan pantallas y formularios de usuarios/socios para usar API Routes.
- Se agrega script de preflight para detectar inconsistencias usuario/socio y policies abiertas.
- Se agrega migración de integridad core con índices y constraint de días por semana.
- Se agrega plan controlado para hardening progresivo de RLS.

## Archivos relevantes

- `src/services/supabaseServerClient.ts`
- `src/services/server/usuarioServerService.ts`
- `src/services/server/socioServerService.ts`
- `src/services/browser/usuarioApiClient.ts`
- `src/services/browser/socioApiClient.ts`
- `src/app/api/usuarios/route.ts`
- `src/app/api/socios/route.ts`
- `src/app/dashboard/usuarios/page.tsx`
- `src/app/dashboard/socios/page.tsx`
- `src/components/forms/UserForm.tsx`
- `src/components/forms/SocioForm.tsx`
- `database/scripts/preflight_core_integrity.sql`
- `database/migrations/202605200001_core_integrity_constraints.sql`
- `database/scripts/rls_hardening_plan.sql`
- `docs/database/rls-and-core-integrity.md`

## Validaciones sugeridas

- `npm run build`
- Login admin.
- Listado de usuarios.
- Crear usuario socio con DNI.
- Login socio.
- Listado de socios.
- Crear socio manual.
- Activar/desactivar usuario.
- Activar/desactivar socio.
- Generación de rutina para socio.

## Nota sobre RLS

Este PR no elimina masivamente las policies abiertas de desarrollo. Primero se empieza a mover el acceso de módulos core hacia API Routes y service role server-side. El endurecimiento RLS debe hacerse progresivamente por módulo para evitar romper pantallas que todavía consulten Supabase desde cliente.
