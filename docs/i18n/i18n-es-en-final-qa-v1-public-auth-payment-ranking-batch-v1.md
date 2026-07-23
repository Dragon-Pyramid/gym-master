# i18n ES/EN Final QA v1 — Public/Auth/Payment/Ranking Batch v1

## Objetivo

Cerrar el primer bloque del QA final ES/EN sobre accesos públicos, recuperación de contraseña, resultados de pago y ranking de asistencias, manteniendo intactos los datos ingresados por usuarios y los contratos backend.

## Hallazgos corregidos

- Las pantallas `/pago-exitoso` y `/pago-fallido` mostraban encabezados, estados, botones y mensajes de Stripe únicamente en español.
- El ranking público de asistencias mostraba título, encabezados y meses únicamente en español.
- El selector de año del ranking estaba limitado a 2023–2025, por lo que no ofrecía el año actual 2026.
- El texto alternativo del logo permanecía fijo en inglés en las pantallas de autenticación.

## Implementación

- Se agregaron claves ES/EN bajo `publicPages.payment`, `publicPages.paymentSuccess`, `publicPages.paymentFailure` y `publicPages.attendanceRanking`.
- Se reemplazaron textos visibles de pagos por `t(...)`.
- Los mensajes de error de sincronización usan fallbacks localizados para evitar mezclar respuestas técnicas del backend con la interfaz activa.
- El ranking localiza nombres de meses mediante `es-AR` o `en-US` según el locale activo.
- El selector de años se calcula con el año actual y los dos años anteriores.
- Se agregaron etiquetas accesibles ES/EN a los selectores de mes y año.
- El `alt` del logo de Gym Master usa una clave común localizada.

## Archivos modificados

- `src/i18n/dictionaries.ts`
- `src/app/pago-exitoso/page.tsx`
- `src/app/pago-fallido/page.tsx`
- `src/app/ranking-asistencias/page.tsx`
- `src/components/ranking-asistencia/RankingAsistenciaTable.tsx`
- `src/app/auth/login/page.tsx`
- `src/components/auth/GymMasterLoginForm.tsx`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/app/auth/change-password/page.tsx`

## Fuera de alcance

- No se modificaron endpoints, base de datos, migraciones, RLS, RPC, Swagger/OpenAPI ni flujos de Stripe.
- No se tradujeron datos del socio, gimnasio o respuestas persistidas.
- No se alteró la lógica de autenticación ni autorización.

## Validación realizada

- Parseo TypeScript/TSX de los diez archivos modificados: correcto.
- Verificación de claves ES/EN: una definición por locale.
- Segundo escaneo estático del bloque público/auth: sin residuos visibles reales.
- El build completo debe ejecutarse en el repositorio local porque el entorno de generación no contiene `node_modules` ni el binario local de Next.js.

## QA manual recomendado

1. Cambiar entre ES y EN desde login.
2. Recorrer login de socio, administración y Master Admin.
3. Abrir recuperar contraseña, restablecer contraseña y cambio obligatorio de contraseña.
4. Probar `/pago-exitoso?session_id=...` en ambos idiomas, incluyendo estado de sincronización correcto y fallido.
5. Probar `/pago-fallido?session_id=...` en ambos idiomas.
6. Abrir `/ranking-asistencias`, alternar idioma y validar meses, encabezados y año actual.
7. Revisar mobile, desktop, light y dark mode.
