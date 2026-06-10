# Fix: sesión de Terminal, token en localhost y aforo

## Rama sugerida

`feature/asistencia-control-salida-aforo`

## Problema detectado

Durante QA de la feature de salida/aforo se observó que la Terminal podía quedar con sesión expirada y el resto de la aplicación comenzaba a mostrar errores de token. En los logs se veía el patrón:

- `GET /api/asistencias/recientes 401`
- `POST /api/auth/terminal-session/refresh 401`
- `GET /api/asistencias/aforo 500`

Además, en entorno local, el navegador podía conservar una cookie antigua y priorizarla por encima del token renovado persistido.

## Causa probable

La sesión se persistía en cookie con `secure: true` en todos los entornos. En `localhost` sin HTTPS esto puede impedir que la cookie se actualice correctamente o dejar una cookie vieja priorizada frente al token renovado en `localStorage`.

También el endpoint de aforo convertía errores de autenticación en `500`, cuando debía responder `401` para que el cliente muestre una sesión expirada y no un error interno.

## Cambios realizados

### `src/services/storageService.ts`

- La cookie de sesión ahora usa `secure: true` solo en contexto HTTPS.
- `getToken()` compara cookie y token persistido.
- Si hay dos tokens válidos, usa el que tenga expiración más lejana.
- Si la cookie está vencida pero `localStorage` tiene un token renovado válido, usa el token renovado.
- Evita que una cookie vieja rompa toda la aplicación en QA local.

### `src/app/api/asistencias/aforo/route.ts`

- Clasifica errores de token/JWT/autorización como `401`.
- Evita mostrar `500` cuando el problema real es sesión expirada o token faltante.

### `src/components/asistencia/AsistenciaTerminalDisplay.tsx`

- Usa una referencia interna para consultar el estado actual de sesión desde timers/polling sin quedar atrapado por closures viejos.
- Evita seguir consultando avisos/polling cuando la Terminal ya está en estado expirado.
- Mantiene el comportamiento visual estable del patch anterior, sin reintroducir el polling agresivo que provocaba rebotes del QR.

## DB

No requiere migración.

## Swagger

No requiere cambios de Swagger.

## QA recomendado

1. Limpiar caché local:

```bash
rm -rf .next
rm -rf node_modules/.cache
```

2. Reiniciar dev server:

```bash
npm run dev
```

3. Cerrar sesión e iniciar sesión nuevamente como admin.

4. Abrir:

```txt
/dashboard/asistencias/terminal
/dashboard/asistencias/aforo
```

5. Validar:

- La Terminal carga QR.
- `POST /api/auth/terminal-session/refresh` responde `200`.
- `GET /api/asistencias/recientes` responde `200`.
- `GET /api/asistencias/aforo` responde `200` con sesión válida.
- Si no hay token, aforo responde `401`, no `500`.

## Nota de QA móvil

Si se escanea desde celular una URL de Vercel que todavía no tiene esta feature deployada, el celular seguirá ejecutando la versión anterior y no registrará salida. Para validar salida desde celular se debe desplegar esta rama en Vercel Preview o exponer el entorno local mediante una URL accesible desde el teléfono.
