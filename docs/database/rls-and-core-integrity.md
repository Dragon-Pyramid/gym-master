# Gym Master — RLS e integridad core

## 1. Contexto

Gym Master ya quedó migrado a una arquitectura **single-tenant por instancia**: una aplicación/deploy y una base Supabase por gimnasio. Con esto se eliminó `dbName` como mecanismo de selección dinámica de base.

Después del checkpoint, quedaron funcionando:

- Login administrador.
- Creación/login de administrador.
- Creación/login de socio.
- Relación `usuario` → `socio` para usuarios con rol socio.
- Generación de rutinas mediante el procedimiento almacenado `generar_rutina_socio`.

Esta rama inicia la etapa de desarrollo/corrección real sobre seguridad e integridad base.

## 2. Problema detectado

El proyecto venía utilizando Supabase desde servicios compartidos que podían ser importados tanto por API Routes como por componentes `use client`.

Esto genera dos problemas:

1. Para que el frontend pudiera leer datos directamente desde Supabase, se mantuvieron policies RLS abiertas de desarrollo (`dev_all_*`, `USING (true)`, `WITH CHECK (true)`).
2. La autorización real del sistema está en el JWT propio de Gym Master, no en Supabase Auth. Por lo tanto, Supabase no puede inferir correctamente el rol de negocio (`admin`, `usuario`, `socio`) desde las policies si el cliente consulta directo con la anon key.

## 3. Decisión técnica

La estrategia segura será:

```txt
Frontend / use client
  ↓ Authorization Bearer JWT propio
API Routes Next.js
  ↓ validación authMiddleware + rol
Servicios server-only
  ↓ Supabase service role
PostgreSQL/Supabase
```

Con este enfoque:

- La service role key no viaja al navegador.
- La autorización de negocio queda en API Routes.
- RLS puede endurecerse progresivamente.
- Se evita depender de policies abiertas para operar el sistema.

## 4. Cambios aplicados en esta rama

### 4.1 Cliente Supabase server-only

Se agrega:

```txt
src/services/supabaseServerClient.ts
```

Este cliente usa:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

y está protegido con `server-only`, por lo que no debe importarse desde componentes cliente.

### 4.2 Servicios server-only para core

Se agregan servicios específicos para backend:

```txt
src/services/server/usuarioServerService.ts
src/services/server/socioServerService.ts
```

Estos servicios concentran operaciones sensibles de:

- usuarios,
- socios,
- creación de usuario socio + perfil asociado,
- activación/desactivación,
- validación básica de roles.

### 4.3 API Routes migradas a servicios server-only

Se actualizan:

```txt
src/app/api/usuarios/route.ts
src/app/api/socios/route.ts
```

Ahora validan JWT con `authMiddleware` y delegan operaciones a servicios server-only.

### 4.4 Frontend migrado a API Routes en módulos core

Se agregan clientes browser:

```txt
src/services/browser/usuarioApiClient.ts
src/services/browser/socioApiClient.ts
```

Y se actualizan:

```txt
src/app/dashboard/usuarios/page.tsx
src/app/dashboard/socios/page.tsx
src/components/forms/UserForm.tsx
src/components/forms/SocioForm.tsx
```

El frontend deja de importar directamente servicios con lógica Supabase para estos dos módulos core.

## 5. Integridad de base de datos

Se agrega un preflight:

```txt
database/scripts/preflight_core_integrity.sql
```

Sirve para detectar:

- usuarios con rol socio sin perfil socio,
- perfiles socio duplicados por `usuario_id`,
- socios sin usuario asociado,
- socios con `usuario_id` inválido,
- policies abiertas de desarrollo,
- estado RLS de tablas públicas.

Se agrega migración:

```txt
database/migrations/202605200001_core_integrity_constraints.sql
```

Incluye:

- índice único parcial `idx_socio_usuario_id_unique`,
- índices de soporte para consultas frecuentes,
- constraint `socio_dias_por_semana_check` como `NOT VALID`.

## 6. RLS: criterio de avance

No se eliminan todavía todas las policies abiertas, porque aún pueden existir pantallas o módulos que consulten Supabase de manera directa.

Se agrega:

```txt
database/scripts/rls_hardening_plan.sql
```

Este script documenta el camino de retiro gradual:

1. migrar módulo a API Routes,
2. validar funcionalmente,
3. retirar policy `dev_all_*` de esa tabla,
4. bloquear acceso directo desde anon/authenticated si corresponde.

## 7. Validaciones sugeridas

```bash
npm run build
```

Flujos funcionales a probar:

- Login admin.
- Listar usuarios.
- Crear usuario admin.
- Crear usuario socio con DNI.
- Login socio.
- Listar socios.
- Crear socio manual.
- Activar/desactivar usuario.
- Activar/desactivar socio.
- Generar rutina con socio logueado.

## 8. Pendientes

- Migrar el resto de módulos que todavía importan servicios Supabase desde componentes cliente.
- Endurecer policies RLS por tabla una vez migrados sus accesos.
- Revisar relación circular `venta` ↔ `venta_detalle`.
- Consolidar `entrenador_horarios` vs `horario_entrenador`.
- Validar datos existentes antes de aplicar índices únicos en producción.
