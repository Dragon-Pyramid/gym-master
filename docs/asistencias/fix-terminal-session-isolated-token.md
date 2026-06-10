# Fix: sesión de Terminal aislada del token global

## Contexto

Durante la validación de `feature/asistencia-control-salida-aforo` se confirmó que el registro de salida funciona correctamente. Sin embargo, la pantalla Terminal podía quedar en estado de sesión expirada y afectar la sesión global de la aplicación.

## Problema detectado

El flujo de renovación de Terminal reutilizaba el mismo almacenamiento del token general (`token` / `auth-storage`). Eso podía provocar que una renovación, expiración o cookie vieja de Terminal impactara en otras pantallas administrativas.

## Solución aplicada

Se separó la sesión extendida de Terminal del token global de administración:

- Token general de la app: se mantiene en `token` / `auth-storage`.
- Token de Terminal: se guarda en `terminal_token` / `terminal-session-token`.
- Los endpoints usados por la Terminal consumen `terminalAuthHeader()`.
- Las pantallas administrativas siguen usando `authHeader()`.
- La Terminal ya no reemplaza la sesión global del usuario con el token extendido.
- El logout general limpia ambos tokens.

## Alcance técnico

Archivos modificados:

- `src/services/storageService.ts`
- `src/services/qrService.ts`
- `src/components/asistencia/AsistenciaTerminalDisplay.tsx`

## Validación sugerida

1. Limpiar cookies/localStorage de `localhost:3000`.
2. Iniciar sesión como administrador.
3. Abrir `/dashboard/asistencias/terminal`.
4. Abrir `/dashboard/asistencias/aforo` en otra pestaña.
5. Registrar entrada y salida.
6. Confirmar que la Terminal no invalida la sesión administrativa.
7. Confirmar que `/api/asistencias/recientes` y `/api/notificaciones/terminal` responden 200 mientras la Terminal está activa.

## Variables recomendadas

```env
JWT_EXPIRES_IN=12h
JWT_TERMINAL_EXPIRES_IN=7d
```

## Base de datos

No requiere migración.
