# Ajuste QA — calendarios y avatar por defecto

Rama: `feature/auth-usuarios-socios-normalizacion`

## Objetivo

Este ajuste corrige dos observaciones detectadas durante QA de alta de usuarios internos y socios:

1. Los campos de fecha del `UserForm` deben mostrar un botón explícito de calendario para facilitar la selección visual de fechas.
2. Cuando un usuario, socio o empleado no tiene foto/avatar cargado, debe mostrarse el logo de Gym Master como fallback visual, manteniendo coherencia con la Terminal de Asistencia.

## Cambios

- `src/components/forms/UserForm.tsx`
  - Se agrega `CalendarDateInput`, un wrapper de `Input type="date"` con botón de calendario.
  - Se aplica a fechas de socio y empleado: nacimiento, alta, inicio y fin.

- `src/components/perfil/ProfileImage.tsx`
  - El fallback por defecto pasa a `/gm_logo.svg`.
  - Si una imagen cargada falla, se muestra automáticamente el logo.

- `src/components/dashboard/DashboardInitialContent.tsx`
  - El dashboard usa `/gm_logo.svg` cuando el usuario no tiene foto.

## Alcance

No requiere migración de base de datos. No modifica reglas de auth, permisos, RLS ni endpoints.
