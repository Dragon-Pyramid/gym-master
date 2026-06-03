# Auth: contraseña inicial y cambio obligatorio en primer ingreso

## Rama

`feature/auth-first-login-password-change`

## Objetivo

Agregar un flujo seguro para usuarios creados por administración con contraseña inicial temporal.

El patrón inicial queda definido como:

```txt
GymMaster + DNI
```

Ejemplo:

```txt
GymMaster25555486
```

Al ingresar por primera vez, el sistema fuerza el cambio obligatorio de contraseña antes de permitir el acceso al dashboard.

## Alcance técnico

- Nueva columna `usuario.dni`.
- Nueva columna `usuario.must_change_password`.
- Nuevas columnas de auditoría:
  - `password_actualizado_en`
  - `primer_login_en`
  - `ultimo_login_en`
- Generación de contraseña inicial desde `UserForm`.
- Token JWT con marca `must_change_password`.
- Redirección automática a `/auth/change-password`.
- Bloqueo de dashboard mientras la contraseña temporal siga activa.
- API segura para cambio de contraseña:
  - `POST /api/auth/change-password`
- Validación de contraseña fuerte.
- Hash de contraseña con `bcryptjs`.
- Emisión de nuevo JWT luego del cambio.

## Seguridad

- No se guarda la contraseña inicial en texto plano.
- No se expone `password_hash` en respuestas API, listados, PDFs ni Excel.
- El usuario debe cambiar la contraseña inicial antes de operar el sistema.
- La contraseña nueva debe cumplir requisitos mínimos:
  - 8 caracteres
  - mayúscula
  - minúscula
  - número
  - símbolo

## Pendiente futuro

Este flujo queda preparado para integrarse más adelante con:

- `feature/auth-forgot-password-email-flow`
- notificaciones por email
- recuperación de contraseña con token seguro
- auditoría completa de cambios de contraseña
