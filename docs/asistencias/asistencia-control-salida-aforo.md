# Gym Master — Asistencia: control de salida y aforo

## Rama

`feature/asistencia-control-salida-aforo`

## Objetivo

Completar el flujo operativo de asistencia para que el sistema registre ingreso y egreso de socios, y calcule el aforo actual del gimnasio en tiempo casi real.

## Alcance funcional

- El QR diario ahora opera como flujo de entrada/salida:
  - si el socio no tiene asistencia abierta del día, registra ingreso;
  - si el socio tiene asistencia abierta del día, registra salida con `hora_egreso`.
- El listado de asistencias muestra registros abiertos con acción rápida para registrar salida administrativa.
- Se agrega pantalla administrativa `/dashboard/asistencias/aforo`.
- Se agrega menú `Salida / Aforo` en Administración.
- Se agrega endpoint `GET /api/asistencias/aforo`.
- Se agrega endpoint `POST /api/asistencias/{id}/salida`.
- Se actualiza Swagger/OpenAPI.
- Se actualiza terminal de asistencia para distinguir ingreso y salida.

## Cálculo de aforo

El aforo actual se calcula con la tabla existente `asistencia`:

```sql
fecha = día operativo actual Argentina
hora_egreso IS NULL
```

No requiere migración de base de datos porque la tabla ya posee `hora_egreso` nullable.

## Capacidad máxima

La capacidad máxima se toma desde variables de entorno:

```env
GYM_MASTER_AFORO_MAXIMO=80
```

Fallback seguro: `80` si la variable no está configurada o no es válida.

Esto permite configurar distinto aforo por gimnasio en cada proyecto Vercel sin tocar código.

## Semáforo operativo

- `normal`: menor a 65%.
- `medio`: desde 65%.
- `alto`: desde 85%.
- `critico`: desde 100%.

## Archivos principales

- `src/app/api/asistencias/aforo/route.ts`
- `src/app/api/asistencias/[id]/salida/route.ts`
- `src/app/dashboard/asistencias/aforo/page.tsx`
- `src/services/asistenciaAforoService.ts`
- `src/interfaces/asistenciaAforo.interface.ts`
- `src/services/asistenciaService.ts`
- `src/services/qrService.ts`
- `src/components/ui/RegistrarAsistenciaQR.tsx`
- `src/components/ui/BienvenidaSocio.tsx`
- `src/components/asistencia/AsistenciaTerminalDisplay.tsx`
- `src/components/tables/AsistenciaTable.tsx`
- `src/app/dashboard/asistencias/page.tsx`
- `src/components/sidebar/sidebarConfig.ts`
- `src/lib/permissions/menuPermissions.ts`
- `src/components/qa/QaCurrentPageBadge.tsx`
- `src/lib/swagger/openApiSpec.ts`

## Validación sugerida

1. Entrar como admin.
2. Abrir Administración → Salida / Aforo.
3. Confirmar cards de dentro ahora, capacidad, ocupación, entradas y salidas.
4. Entrar como socio y escanear QR.
5. Confirmar que registra ingreso.
6. Verificar aumento del aforo.
7. Escanear nuevamente con el mismo socio.
8. Confirmar que registra salida.
9. Verificar disminución del aforo.
10. Desde listado de asistencias, usar acción rápida de salida sobre una asistencia abierta.
11. Confirmar terminal de asistencia mostrando ingreso/salida.
12. Confirmar que el socio no accede a `/dashboard/asistencias/aforo`.

## Seguridad y permisos

- Endpoints administrativos de aforo/salida requieren usuario autenticado con rol `admin` o `usuario`.
- QR sigue exigiendo socio autenticado.
- La salida por QR se permite si existe una asistencia abierta del día, incluso si el socio luego quedó inactivo/moroso, porque el egreso no debe quedar bloqueado.
- Para nuevos ingresos se mantiene la lógica de socio activo y morosidad.

## DB

No requiere migración.
