# QA recorrido fixes — ojito en contraseña de usuarios

## Objetivo

Agregar control visual para mostrar u ocultar la contraseña en `src/components/forms/UserForm.tsx`, facilitando la carga y validación durante alta/edición de usuarios.

## Alcance

- Campo `Contraseña`.
- Campo `Confirmar contraseña`.
- Íconos `Eye` / `EyeOff` de `lucide-react`.
- Accesibilidad con `aria-label` y `title`.
- Mantiene checklist de contraseña fuerte.

## Validación sugerida

1. Entrar a `/dashboard/usuarios`.
2. Crear usuario nuevo.
3. Escribir contraseña y confirmar contraseña.
4. Usar el ojito en ambos campos.
5. Confirmar que no se rompe el checklist rojo/verde.
6. Editar usuario y verificar que el comportamiento se mantiene.
