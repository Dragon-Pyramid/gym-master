# i18n navigation menus final sweep v19 - inline sweep ES exact-only fix

## Objetivo

Corregir el bloqueo del dashboard al alternar EN → ES y volver a abrir el modal 360 de socios.

## Diagnóstico

El bloqueo no viene de los endpoints: los logs muestran respuestas 200 para las APIs del modal 360. El síntoma `La página no responde` apunta al hilo principal del navegador.

La causa probable estaba en `DashboardInlineI18nSweep`: desde el fix bidireccional, el modo ES hacía reemplazos parciales EN → ES sobre el valor actual del DOM. Algunas traducciones no eran idempotentes. Ejemplos:

- `Contact` → `Contacto` y luego `Contacto` todavía contiene `Contact`, generando `Contactoo`.
- `Edit` → `Editar` y luego `Editar` todavía contiene `Edit`, generando `Editarar`.
- `Sex` → `Sexo` y luego `Sexoo`.

Como el `MutationObserver` escucha `characterData`, esas mutaciones podían dispararse en bucle y congelar la página, especialmente después de cambiar idioma y abrir el modal 360.

## Ajuste quirúrgico

Se mantiene el comportamiento ES → EN con reemplazos parciales para cubrir textos heredados.

Para el camino EN → ES se cambia a modo seguro:

- exact-only translations;
- no partial replacements en Español;
- mantiene reversión de frases exactas ya registradas;
- evita bucles como `Contactoo`, `Editarar`, `Sexoo`.

## Archivo modificado

- `src/components/i18n/DashboardInlineI18nSweep.tsx`

## Alcance

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No cambia lógica funcional del modal 360.
- No toca el layout.

## QA recomendado

Repro exacta:

1. Entrar en Español al dashboard admin.
2. Cambiar idioma a Inglés.
3. Ir a Members.
4. Abrir modal 360 de un socio.
5. Cerrar modal.
6. Cambiar idioma a Español.
7. Volver al listado de socios.
8. Abrir modal 360 nuevamente.

Resultado esperado: la página no debe congelarse y el menú lateral debe seguir respondiendo.
