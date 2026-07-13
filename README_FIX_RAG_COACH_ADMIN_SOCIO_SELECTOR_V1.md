# Fix RAG Coach admin socio selector v1

## Objetivo

Corregir el uso del Coach IA desde una sesión de administrador cuando se intenta generar dieta, rutina o análisis físico sin un `id_socio` real.

## Problema detectado

El Coach IA necesita un UUID real de socio para guardar dietas, rutinas o análisis en los módulos del socio. Cuando el administrador usa `/dashboard/coach` sin contexto de socio, el backend bloquea correctamente las acciones automáticas para evitar usar identificadores inválidos como `me`.

## Cambios incluidos

- Agrega selector/buscador de socio en `/dashboard/coach` solo para sesiones admin.
- Carga socios desde `/api/socios` usando el cliente browser existente `fetchSociosApi`.
- Permite buscar por nombre, DNI, email o teléfono.
- Envía `socio_id` real al endpoint `/api/rag/coach/chat` cuando el admin selecciona un socio.
- Mantiene el comportamiento de socio logueado: usa `user.id_socio` como antes.
- Si admin no selecciona socio, conserva el bloqueo seguro y orientación general.
- Ajusta el mensaje del backend para indicar que el admin debe seleccionar un socio en el Coach IA.

## Archivos modificados

- `src/app/dashboard/coach/page.tsx`
- `src/services/server/ragCoachUnifiedChatService.ts`

## Fuera de alcance

- No cambia DB.
- No agrega endpoints.
- No modifica Swagger/OpenAPI.
- No cambia la lógica de generación cuando hay `id_socio` válido.
- No toca RLS/RBAC.

## Validación sugerida

1. Login admin.
2. Abrir `/dashboard/coach`.
3. Seleccionar un socio real desde el panel "Socio operativo del Coach IA".
4. Pedir: `Quiero una dieta para bajar grasa sin perder músculo`.
5. Confirmar que no aparece `invalid input syntax for type uuid: "me"`.
6. Confirmar que el backend recibe un `socio_id` UUID real.
7. Login socio directo y confirmar que `/dashboard/coach` sigue funcionando sin selector admin.
