# Security HTTP Runtime Hardening — Final V1

## Rama

`feature/security-http-runtime-hardening-final-v1`

## Objetivo

Endurecer el runtime HTTP de Gym Master sin cambiar el modelo de datos, migraciones, RLS, RPC ni contratos funcionales principales. El alcance cubre cabeceras de navegador, abuso de endpoints públicos, límites de payload, exposición de errores, CORS, recuperación de contraseña, proxy de imágenes, cookies y renderizado HTML generado desde Markdown.

## Hallazgos corregidos

1. `next.config.js` no publicaba una política global de cabeceras de seguridad.
2. Los endpoints públicos de autenticación, recuperación, scanner, verificación e imagen no tenían un control uniforme de frecuencia.
3. La mayoría de los cuerpos JSON se parseaban con `request.json()` sin límite explícito y los uploads verificaban tamaño después de ejecutar `formData()`.
4. El webhook de Stripe leía el cuerpo completo sin límite propio y devolvía mensajes internos del proveedor.
5. La recuperación de contraseña podía construir el enlace usando `Origin`, `Host` o `X-Forwarded-Host` cuando faltaba una URL pública configurada.
6. Existían respuestas con CORS wildcard en rutas que operan como same-origin.
7. El proxy de imágenes no tenía timeout, cargaba el cuerpo completo antes de validar el límite real y admitía SVG remoto.
8. El preview Markdown usaba `dangerouslySetInnerHTML` sin escapar primero el HTML ni filtrar protocolos de URL.
9. Las cookies de bearer token eran `SameSite=Strict` y `Secure` sobre HTTPS, pero la ruta de creación/eliminación no estaba expresada de forma determinística.
10. Algunos errores de autorización y endpoints públicos podían exponer mensajes de configuración, base de datos o proveedor.

## Implementación

### Cabeceras globales

Se agregaron desde `next.config.js`:

- `Content-Security-Policy`.
- `Strict-Transport-Security` únicamente en producción.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` conservando cámara para el mismo origen.
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- `Origin-Agent-Cluster: ?1`.
- `X-DNS-Prefetch-Control: off`.
- `X-Permitted-Cross-Domain-Policies: none`.

También se deshabilitó `X-Powered-By` y se fijó el límite de Server Actions en `1mb`.

La CSP admite imágenes HTTPS dinámicas, `blob:` y `data:`; frames de YouTube; workers locales/PWA; conexión al origen Supabase configurado y su WebSocket. `unsafe-eval` queda limitado a desarrollo. Se conserva `unsafe-inline` para compatibilidad con Next.js 14 y ventanas de impresión heredadas; su eliminación requeriría una migración posterior a nonces/hashes.

### Rate limiting

`src/middleware.ts` protege rutas públicas y sensibles:

- login personalizado;
- recuperación y reset de contraseña;
- POST de NextAuth;
- refresh de Terminal;
- scanner móvil público;
- verificación pública de recibos;
- image proxy;
- sincronización interna de licencia.

Las respuestas por exceso usan `429`, `Retry-After`, `X-RateLimit-*` y `Cache-Control: no-store`.

El almacenamiento es en memoria y está acotado a 5000 buckets con limpieza periódica. Es una defensa por instancia. Para un despliegue horizontal de alto tráfico debe complementarse con WAF, Vercel Firewall o un almacén distribuido como Redis/KV.

### Límites y parsing de solicitudes

Se creó `src/lib/security/httpRuntimeSecurity.ts` con:

- `readJsonBody` con validación de `Content-Type`, `Content-Length`, tamaño UTF-8 real y JSON válido;
- `readTextBody` para payloads firmados;
- `requestBodyTooLargeResponse` para cortar multipart antes de `formData()` cuando el cliente declara longitud;
- `noStoreJson`;
- `runtimeErrorResponse` para redacción uniforme.

Se aplicaron límites a login, recuperación, cambio de contraseña, scanner, registro QR, confirmación Stripe, webhook, sincronización de licencia y cinco familias de upload.

### Recuperación de contraseña

En producción, los enlaces solo se construyen con `NEXT_PUBLIC_APP_URL` o `APP_URL`. Ya no se confía en `Origin`, `Host` ni `X-Forwarded-Host`. La URL debe ser HTTP/HTTPS, sin credenciales embebidas.

### Image proxy

Se mantuvo el control SSRF existente y se agregó:

- URL máxima de 4096 caracteres;
- timeout de 8 segundos;
- máximo de tres redirects manuales;
- lectura streaming con corte real en 10 MB;
- rechazo de SVG remoto;
- respuesta `private` para impedir cache compartida de URLs arbitrarias;
- eliminación de CORS wildcard;
- errores de upstream redactados.

### Uploads

Los uploads de perfil, logo, comprobante, media de ejercicios y ficha médica rechazan payloads declarados demasiado grandes antes de parsear multipart. La ficha médica ahora también valida firma binaria real de PDF, JPG y PNG.

### Cookies y sesión

NextAuth habilita explícitamente cookies seguras en producción y mantiene debug desactivado. Las cookies bearer del flujo propio conservan:

- `SameSite=Strict`;
- `Secure` sobre HTTPS;
- `Path=/` explícito tanto al crear como al eliminar;
- expiración alineada al JWT.

Los JWT del flujo propio continúan siendo legibles por JavaScript porque los clientes construyen headers Bearer. Convertirlos a `HttpOnly` exige migrar la arquitectura de autenticación y no se realiza en esta rama.

### Prevención XSS en preview Markdown

El editor ahora:

- escapa HTML crudo antes de convertir Markdown;
- permite links `http`, `https`, `mailto`, rutas relativas y anchors;
- permite imágenes solo `http` y `https`;
- rechaza credenciales embebidas y protocolos como `javascript:`;
- agrega `noopener`, `noreferrer` y `nofollow` a links externos.

### CORS y errores

Se eliminaron wildcard CORS de `registro-qr` e `image-proxy`. Las rutas endurecidas operan same-origin. Los errores 5xx de autenticación, Stripe, scanner, recibos, licencia, uploads y autorización ya no devuelven mensajes de proveedor, SQL ni nombres de variables internas.

## Gate automático

```bash
npm run test:http-runtime-security
```

Valida:

- cabeceras y CSP;
- rate limiting y `Retry-After`;
- límites de JSON, raw body y multipart;
- ausencia de CORS wildcard;
- origen confiable en recuperación;
- atributos de cookies;
- hardening del image proxy;
- escape de Markdown;
- firma binaria de adjuntos médicos.

## QA manual recomendada

1. Ejecutar build y todos los gates acumulativos.
2. Confirmar headers en `/auth/login`, `/dashboard` y `/api/swagger-json`.
3. Probar login correcto e incorrecto; verificar que no aparezcan mensajes internos.
4. En local, superar el límite del login y comprobar `429` + `Retry-After`; reiniciar el servidor para limpiar buckets.
5. Probar recuperación con `APP_URL`/`NEXT_PUBLIC_APP_URL` correctas.
6. Probar reset válido, inválido, expirado y reutilizado.
7. Validar Terminal y scanner público.
8. Generar PDFs de rutina/dieta con imágenes remotas; verificar timeout/formatos y ausencia de regresión.
9. Subir archivos válidos, falsos y sobredimensionados en las cinco familias de upload.
10. En el editor Markdown, probar `<img onerror=alert(1)>`, `[x](javascript:alert(1))`, links HTTPS e imágenes HTTPS.
11. Confirmar cámara QR bajo `Permissions-Policy`.
12. Revisar consola del navegador por violaciones CSP reales antes de desplegar.

## Riesgos residuales

- El rate limiting es por instancia, no global distribuido.
- La CSP conserva `unsafe-inline` por compatibilidad.
- Los JWT propios siguen siendo browser-readable; la defensa depende de evitar XSS.
- Los límites multipart previos a `formData()` dependen de `Content-Length`; la plataforma de hosting debe mantener límites de request a nivel ingress.
- El image proxy valida DNS antes de cada fetch/redirect, pero una protección absoluta contra DNS rebinding requeriría pinning de IP/agente de red o allowlist de hosts.

## Fuera de alcance

- Base de datos, migraciones, RLS y RPC.
- Cambio de contratos funcionales de negocio.
- Incorporación de Redis/KV/WAF.
- Migración completa de JWT bearer a cookies `HttpOnly`.
- Reescritura de ventanas de impresión y scripts inline con nonces.
