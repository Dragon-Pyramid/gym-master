# i18n ES/EN Admin Dashboard Final Sweep v3 — Usuarios fix v1

## Ruta

- `/dashboard/usuarios`

## Alcance

- Traducción ES/EN de listado de usuarios, filtros, acciones, modales de alta/edición/detalle y mensajes de validación/toast.
- Traducción de contenido de combos visibles: rol, sexo, puestos, áreas, tipos de contratación, turnos y horarios/disponibilidad.
- Traducción de permisos, roles y estados presentados en tabla y modal de detalle.
- Mejora local de dark mode en cards, tabla, modales, secciones operativas y permisos.

## Archivos modificados

- `src/app/dashboard/usuarios/page.tsx`
- `src/components/forms/UserForm.tsx`
- `src/components/modal/UserModal.tsx`
- `src/components/modal/UserViewModal.tsx`
- `src/components/tables/UserTable.tsx`

## No incluido

- No se tocan DB, endpoints, Swagger/OpenAPI, autenticación ni lógica de permisos.
- No se modifica la estructura de roles/permisos; solo presentación UI ES/EN.
