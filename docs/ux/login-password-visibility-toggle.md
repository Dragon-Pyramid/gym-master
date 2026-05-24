# Login - Password visibility toggle

## Objetivo

Mejorar la experiencia de usuario del login principal agregando un botón con ícono de ojo para mostrar u ocultar la contraseña ingresada.

## Alcance

Archivo modificado:

```txt
src/app/auth/login/page.tsx
```

## Cambios

- Se agrega estado local `showPassword`.
- El input de contraseña alterna entre:
  - `type="password"`
  - `type="text"`
- Se agregan íconos `Eye` y `EyeOff` desde `lucide-react`.
- El botón mantiene accesibilidad mediante:
  - `aria-label`
  - `title`
  - `type="button"` para evitar submit accidental.
- Se agrega `autoComplete="current-password"`.

## Fuera de alcance

- No se modifican endpoints.
- No se modifica autenticación.
- No se modifica Swagger/OpenAPI porque no hay cambios de API.
- No se agregan migraciones.
