# FIX_RAG_COACH_SOCIO_ID_RESOLUTION_V1

## Objetivo

Corregir el error del Coach IA unificado cuando intenta generar dieta/rutina/evolución con `socio_id: "me"` o sin un `id_socio` real.

## Problema detectado

El frontend enviaba `socio_id: user?.id_socio || 'me'`.

Cuando el usuario no tenía `id_socio` en sesión o estaba operando como administrador sin socio seleccionado, el backend terminaba usando `"me"` como identificador real y fallaba al guardar dieta:

```text
Error al generar la dieta: invalid input syntax for type uuid: "me"
```

También aparecía:

```text
Debe indicar un socio real para construir contexto.
```

## Cambios incluidos

- El frontend deja de enviar `"me"` como fallback.
- El backend valida UUID antes de aceptar un `socio_id`.
- Si el JWT de socio no trae `id_socio`, el backend intenta resolverlo por `usuario_id` en tabla `socio`.
- Si no hay socio real y el usuario es admin, bloquea la automatización y devuelve orientación segura en vez de intentar insertar con un UUID inválido.
- Se mantiene la respuesta HTTP 200 del Coach IA, pero la acción vuelve como `guidance_only` y explica qué falta.

## Archivos modificados

- `src/app/dashboard/coach/page.tsx`
- `src/services/server/ragCoachUnifiedChatService.ts`

## No cambia

- DB
- migraciones
- endpoints nuevos
- Swagger/OpenAPI
- generación real de dietas cuando hay `id_socio` válido
- generación real de rutinas cuando hay `id_socio` válido
- análisis RAG cuando hay `id_socio` válido

## Validación sugerida

```bash
rm -rf .next
npm run build
```

Luego probar:

1. Socio logueado con `id_socio` válido: generar dieta debe funcionar.
2. Socio con token viejo/incompleto: debe resolver por `usuario_id` si existe vínculo.
3. Admin sin socio seleccionado: no debe aparecer `invalid input syntax for type uuid: "me"`; debe devolver mensaje seguro indicando que falta socio real.
