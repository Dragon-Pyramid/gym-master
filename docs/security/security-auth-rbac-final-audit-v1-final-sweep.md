# Security Auth & RBAC Final Audit v1 — final sweep

## Rama

`feature/security-auth-rbac-final-audit-v1`

## Bloque

Bloque 4 — Barrido final, clasificación explícita de API Routes y cierre de fronteras públicas/internas.

## Objetivo

Completar la auditoría de autenticación y autorización de la aplicación antes de la revisión específica de RLS. El objetivo de este bloque es que ninguna API Route quede pública por omisión y que cada operación privada aplique, según corresponda:

1. JWT válido mediante `Authorization: Bearer <token>`.
2. Rechazo de tokens de Terminal fuera de su alcance.
3. Rol autorizado.
4. Permiso real del módulo.
5. Propiedad del socio o de la cuenta cuando el recurso sea personal.
6. Respuestas `401` y `403` tipadas, sin convertir rechazos de seguridad en `500`.

## Resultado consolidado

El verificador `npm run test:auth-rbac` clasifica los **175 archivos `route.ts`** existentes debajo de `src/app/api`.

La cobertura acumulativa queda compuesta por:

- 3 endpoints operativos de Terminal con opt-in explícito.
- 40 rutas heredadas protegidas en el Bloque 2.
- 24 rutas sensibles de dashboard protegidas en el Bloque 3.
- 20 rutas personales con alcance por socio protegidas en el Bloque 3.
- 68 rutas operativas del barrido final con rol y permiso de módulo.
- 3 rutas personales o de cuenta propia del barrido final.
- 6 rutas autenticadas de alcance transversal.
- 11 rutas públicas o internas con política explícita y control específico.

No quedan API Routes implícitamente públicas.

## Familias privadas cerradas en el barrido final

### Operación, asistencia y analítica

- Asistencias, egresos y aforo.
- Ranking de asistencia.
- Métricas de asistencia y retención.
- Métricas de equipamiento.
- Respaldo y exportación del negocio.

### Comercial y finanzas

- Caja.
- POS/Kiosco y scanner móvil administrativo.
- Compras y reposición.
- Ventas y detalles de venta.
- Códigos, QR y etiquetas.
- Stock Ledger.
- Packs, promociones y servicios.
- Finanzas BI.
- Cuotas, descuentos, pagos y confirmación Stripe.
- Otros gastos y comprobantes.

### Personal y administración

- Empleados y sueldos.
- Entrenadores y horarios.
- Usuarios internos.
- Perfil propio de usuario.
- Datos y logo del gimnasio.
- Parametrización, niveles y objetivos.

La ruta heredada `/dashboard/entrenadores` reutiliza explícitamente el permiso `Empleados`, evitando que un usuario interno autorizado sea bloqueado antes de su redirección.

### IA, RAG y media

- Chat, búsqueda y estado del Coach.
- Corpus, ingesta y vectorización, reservados al administrador.
- Catálogo, importación, sincronización y carga de media de ejercicios.

### Soporte

- Tickets y detalle de tickets de Dragon Pyramid.
- El endpoint heredado `/api/test-alertas`, que puede desactivar socios por deuda, queda limitado a administrador y responde `404` en producción.

## Recursos personales reforzados

### Asistencia QR

`/api/asistencias/registro-qr` autoriza antes de leer o procesar el código. El socio puede registrar su propia asistencia y el personal autorizado puede operar desde Asistencias. El token de Terminal no obtiene acceso implícito a esta ruta.

### Estado de cuota

`/api/cuota-estado` ignora cualquier `socio_id` enviado por el navegador cuando el solicitante es socio y utiliza exclusivamente `user.id_socio`.

### Perfil de usuario

`/api/usuarios/[id]/perfil` permite la cuenta propia o un administrador con permiso `Usuarios`. Un usuario interno o socio no puede cambiar el ID para consultar otra cuenta.

### Confirmación Stripe

`/api/pagar-cuota/confirmar` queda limitada al rol `socio` con acceso a `Pagar cuota`. Antes de registrar el pago valida simultáneamente:

- `metadata.usuario_id === user.id`;
- `metadata.socio_id === user.id_socio`;
- presencia de ambos metadatos.

Una sesión Stripe ajena, incompleta o manipulada responde `403`.

## Políticas públicas e internas explícitas

Las excepciones que no usan un JWT normal declaran una política visible en el código:

| Política | Endpoint o familia | Control principal |
|---|---|---|
| `PUBLIC_AUTH_PROVIDER` | NextAuth | Proveedor de autenticación |
| `PUBLIC_LOGIN` | Login personalizado | Credenciales y rol solicitado |
| `PUBLIC_RECOVERY` | Solicitud de recuperación | Flujo de reset controlado |
| `PUBLIC_RECOVERY_TOKEN` | Validación/reset | Token de recuperación |
| `TERMINAL_BEARER_REFRESH` | Renovación Terminal | JWT normal, permiso Asistencias y emisión acotada |
| `PUBLIC_TOKEN` | Scanner móvil público | Token aleatorio con formato, expiración y estado de sesión |
| `PUBLIC_VERIFICATION_CODE` | Verificación de recibo | ID + código de verificación, exposición reducida |
| `PUBLIC_SIGNED_WEBHOOK` | Stripe webhook | Firma `stripe-signature` |
| `PUBLIC_DOCUMENTATION` | Swagger JSON | Especificación pública intencional |
| `PUBLIC_CONTROLLED` | Proxy de imágenes | Validación de URL, red, redirecciones, tipo y tamaño |
| `INTERNAL_SHARED_SECRET` | Sincronización de licencia | Secreto dedicado y comparación en tiempo constante |

## Endurecimiento del proxy de imágenes

El proxy público requerido por los PDFs ahora:

- acepta únicamente HTTP/HTTPS;
- rechaza credenciales embebidas y puertos no permitidos;
- bloquea localhost, dominios internos y rangos IP privados, loopback, link-local, reservados y multicast;
- resuelve DNS antes de cada destino;
- valida nuevamente cada redirección;
- limita las redirecciones a tres;
- exige `Content-Type: image/*`;
- limita la respuesta a 10 MB;
- agrega `X-Content-Type-Options: nosniff`.

Este control reduce el riesgo SSRF en la capa de aplicación. La política de red y egress de la plataforma deberá revisarse también durante la preparación de producción.

## Seguridad de cargas

Se incorpora `src/lib/security/uploadValidation.ts` para verificar tipo MIME permitido y firma binaria real antes de enviar archivos a Cloudinary.

La validación se aplica a:

- fotografía de perfil;
- logo del gimnasio;
- media de ejercicios;
- comprobantes de gastos.

Formatos reconocidos:

- PNG;
- JPEG;
- WEBP;
- GIF;
- HEIC/HEIF;
- PDF únicamente en comprobantes.

SVG queda excluido de cargas de usuario por su capacidad de contener contenido activo. Un archivo cuyo contenido no coincide con el MIME declarado responde `400`.

## Clientes browser

El gate verifica que los clientes de operación, comercial, finanzas, parametrización, soporte, RAG, usuarios y respaldo conserven encabezados Bearer al llamar las rutas ahora protegidas.

## Verificación automática

```bash
npm run test:auth-rbac
```

El gate falla cuando:

- aparece una API Route nueva sin clasificación;
- una ruta protegida deja de invocar el helper esperado;
- se pierde la respuesta tipada de autorización;
- un cliente crítico deja de enviar Bearer;
- se relaja el aislamiento de Terminal, socio, cuenta propia o Master Admin;
- se elimina un control de los endpoints públicos;
- una carga deja de validar la firma real del archivo.

## QA manual mínimo

### Administrador

- Recorrer operación, comercial, usuarios, parametrización, soporte, RAG y respaldo.
- Confirmar carga y mutaciones autorizadas sin `401/403` incorrectos.

### Usuario interno

- Probar un usuario con permiso y otro sin permiso.
- Confirmar `200` para módulos autorizados y `403` para URL/API no autorizada.

### Socio

- Confirmar Coach, pagos propios, cuota, asistencia QR y perfil propio.
- Probar IDs de otro socio, otra cuenta y otra sesión Stripe; deben responder `403`.

### Master Admin

- Confirmar acceso exclusivo a licencia.
- Confirmar bloqueo de módulos operativos no asignados.

### Público e interno

- Scanner: token inválido/expirado no expone sesión.
- Recibo: código inválido no expone datos.
- Stripe webhook: firma inválida es rechazada.
- Image proxy: localhost, IP privada, puerto no permitido y recurso no imagen son rechazados.
- License sync: secreto ausente o incorrecto es rechazado.

### Uploads

- Imagen válida aceptada.
- Archivo renombrado con MIME falso rechazado.
- SVG rechazado.
- Archivo sobre el límite rechazado.

## Límites y trabajo posterior

Esta rama protege la frontera Next.js y la navegación por rol. La garantía multi-tenant definitiva también depende de políticas RLS, RPC y consultas de Supabase, que se auditarán en:

`feature/database-rls-final-audit-v1`

Los endpoints públicos de login, recuperación, scanner e image proxy también deben recibir rate limiting en la capa de plataforma/edge para producción. No se implementa un contador en memoria dentro de Next.js porque no ofrece garantías consistentes en despliegues serverless distribuidos.

## Base de datos

Este bloque no modifica tablas, migraciones, RLS, RPC, seeds ni datos persistidos.
