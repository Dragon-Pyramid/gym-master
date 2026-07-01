# hotfix/socio-mobile-mensajeria-desktop-footer-v1

## Objetivo

Corregir una franja blanca visible debajo del footer en `/dashboard` cuando la vista del socio se valida en desktop luego de aplicar la tarjeta mobile de mensajería/soporte.

## Diagnóstico

La experiencia mobile funcionaba correctamente, pero en desktop el contenido inicial del socio podía quedar con poca altura efectiva. En pantallas grandes, el footer aparecía visualmente antes del cierre de la ventana, dejando un área blanca inferior.

## Cambio realizado

Se ajustó el contenedor raíz de `DashboardInitialContent` para que, desde breakpoint `md`, tenga una altura mínima calculada contra el viewport y centre el bloque visual principal. El cambio no afecta la experiencia mobile porque se aplica únicamente en desktop/tablet mediante clases `md:`.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`

## Validación sugerida

1. Ejecutar build.
2. Validar `/dashboard` como socio en mobile.
3. Validar `/dashboard` como socio en desktop.
4. Confirmar que el footer no deja franja blanca inferior en PC.
5. Confirmar que las tarjetas mobile siguen funcionando correctamente en F12/mobile.

## Impacto

- Frontend only.
- Sin cambios de DB.
- Sin cambios backend.
- No modifica rutas ni permisos.
