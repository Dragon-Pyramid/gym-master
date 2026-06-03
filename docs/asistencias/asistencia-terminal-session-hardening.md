# Asistencia Terminal Session Hardening

**Rama:** `feature/asistencia-terminal-session-hardening`  
**Fecha:** 2026-06-03  
**Proyecto:** Gym Master

## Objetivo

Endurecer la sesión de la pantalla Terminal de Asistencia para uso operativo durante muchas horas en un monitor externo o modo kiosk, evitando que la expiración del JWT derive en errores 500 visibles o en una pantalla rota.

## Alcance

- Nuevo endpoint `POST /api/auth/terminal-session/refresh`.
- Renovación automática de token desde la pantalla `/dashboard/asistencias/terminal`.
- Token de Terminal con TTL configurable mediante `JWT_TERMINAL_EXPIRES_IN`.
- Manejo visual de sesión expirada o no renovable.
- Manejo 401 en APIs usadas por la Terminal:
  - `GET /api/asistencias/qr-dia`
  - `GET /api/asistencias/recientes`
  - `GET /api/notificaciones/terminal`
- Evita mostrar errores 500 genéricos cuando el problema real es sesión vencida.
- Swagger/OpenAPI actualizado.

## Variables de entorno

```env
JWT_TERMINAL_EXPIRES_IN=7d
```

Si no se define, el backend usa `7d` por defecto solo para sesiones renovadas de Terminal.

## Flujo funcional

1. El administrador o usuario interno autorizado abre la Terminal.
2. La Terminal intenta renovar el token inmediatamente.
3. Si el usuario tiene permiso de `Asistencias` y no debe cambiar contraseña, se emite un nuevo JWT de Terminal.
4. La pantalla continúa refrescando QR, asistencias recientes y avisos.
5. Cada 10 minutos intenta renovar la sesión si se acerca al vencimiento.
6. Si la sesión expiró o no se puede renovar, se muestra un mensaje claro con acciones:
   - Reintentar renovación.
   - Iniciar sesión nuevamente.

## Seguridad

- No se renueva token si no existe token actual.
- No se renueva token inválido o expirado.
- No se renueva token si el usuario debe cambiar contraseña.
- No se renueva token si el usuario no tiene acceso a `/dashboard/asistencias/terminal`.
- No se modifica el login normal ni el JWT normal del sistema.

## Pruebas sugeridas

1. Abrir `/dashboard/asistencias/terminal` con usuario admin.
2. Confirmar que carga QR diario.
3. Confirmar que carga avisos de Terminal.
4. Confirmar que sigue mostrando asistencias recientes.
5. Revisar en DevTools que `POST /api/auth/terminal-session/refresh` responde 200.
6. Configurar temporalmente `JWT_TERMINAL_EXPIRES_IN=2m` para QA y verificar renovación.
7. Borrar token/localStorage y confirmar mensaje de sesión expirada sin error 500 visible.
8. Probar usuario interno con y sin permiso de Asistencias.

## Endpoints modificados

- `POST /api/auth/terminal-session/refresh`
- `GET /api/asistencias/qr-dia`
- `GET /api/asistencias/recientes`
- `GET /api/notificaciones/terminal`

## Notas

Esta feature no requiere migración de base de datos. La renovación de sesión es stateless y se basa en JWT.
