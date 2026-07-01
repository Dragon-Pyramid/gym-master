# Socio Mobile E2E Final QA v1

## Rama

`feature/socio-mobile-e2e-final-qa-v1`

## Objetivo

Consolidar una pasada final de QA del flujo socio mobile/PWA luego de las mejoras aplicadas al dashboard, navegación inferior, PWA instalada, tarjetas funcionales y módulos principales del socio.

Esta feature no agrega lógica de negocio nueva. Su foco es dejar una base de validación repetible para evitar regresiones en el recorrido mobile del socio.

## Alcance

- Se agregan helpers E2E para credenciales de socio.
- Se agrega test Playwright mobile para recorrer rutas críticas del socio.
- Se valida que el dashboard mobile muestre el feed priorizado.
- Se valida que las rutas del socio no caigan en bloqueo RBAC.
- Se valida ausencia de errores críticos de renderizado.
- Se documenta checklist manual para Android real, Vercel y Supabase remoto.

## Archivos modificados

- `e2e/helpers/auth.ts`
- `e2e/helpers/assertions.ts`
- `e2e/socio-mobile-final-qa.spec.ts`
- `docs/mobile/socio-mobile-e2e-final-qa-v1.md`

## Variables E2E requeridas

Para correr las pruebas autenticadas de socio:

```bash
E2E_SOCIO_EMAIL="socio-demo@gymmaster.local"
E2E_SOCIO_PASSWORD="password-demo"
```

También se puede usar contra Vercel o contra local:

```bash
E2E_BASE_URL="http://127.0.0.1:3000"
E2E_SKIP_WEBSERVER=1
```

## Comandos sugeridos

### Local con servidor iniciado por Playwright

```bash
npm run test:e2e -- e2e/socio-mobile-final-qa.spec.ts
```

### Contra servidor ya iniciado

```bash
E2E_SKIP_WEBSERVER=1 E2E_BASE_URL="http://localhost:3000" npm run test:e2e -- e2e/socio-mobile-final-qa.spec.ts
```

### Contra Vercel

```bash
E2E_SKIP_WEBSERVER=1 E2E_BASE_URL="https://TU_DEPLOY.vercel.app" npm run test:e2e -- e2e/socio-mobile-final-qa.spec.ts
```

## Rutas cubiertas

- `/dashboard`
- `/dashboard/control-asistencia`
- `/dashboard/mi-cuenta/pagar-cuota`
- `/dashboard/mi-cuenta/historial-pagos`
- `/dashboard/rutinas`
- `/dashboard/rutinas/asistente`
- `/dashboard/dietas`
- `/dashboard/coach`
- `/dashboard/evolucion-fisica`
- `/dashboard/ficha-medica`
- `/dashboard/mensajes`

## Validación automática

El test verifica:

- Login como socio desde `/auth/login/socio`.
- Carga del dashboard mobile.
- Presencia de secciones clave:
  - Tu plan de acción.
  - Acceso y estado.
  - Pagos y recibos / cuota.
  - Mi salud / ficha médica.
  - Agenda del gimnasio.
  - Soporte / mensajes.
- Ausencia del mensaje `USTED NO TIENE ACCESO A ESTE MENÚ`.
- Ausencia de errores críticos tipo `Application error`, `Internal Server Error`, `ChunkLoadError` o errores runtime relevantes.

## Checklist manual Android/PWA

Validar en Android real después de deploy:

1. Abrir Gym Master desde el ícono instalado.
2. Login como socio.
3. Confirmar que no aparece prompt de instalación si ya está instalada.
4. Recorrer el dashboard completo.
5. Confirmar scroll fluido sin trabas.
6. Confirmar que la bottom navigation no tapa contenido.
7. Abrir QR de ingreso.
8. Revisar pagos y recibos.
9. Revisar rutina/dieta de hoy.
10. Abrir detalle de rutina y probar ayuda de series/repeticiones.
11. Revisar evolución física.
12. Revisar ficha médica.
13. Revisar mensajes/soporte.
14. Revisar agenda informativa de actividades.
15. Cortar conexión y confirmar aviso offline.
16. Restaurar conexión y confirmar aviso online.

## Checklist desktop

- `/dashboard` como socio no debe dejar franja blanca excesiva debajo del footer.
- El layout desktop debe conservar hero, estado de cuota y footer correctamente.
- Las tarjetas mobile deben permanecer ocultas en desktop cuando corresponda.

## Resultado esperado

La experiencia mobile del socio queda validada como flujo completo, con cobertura automática de rutas críticas y checklist manual para Android real/PWA instalada.
