# Gym Master — Recuperación de contraseña por email

**Rama:** `feature/auth-forgot-password-email-flow`  
**Fecha:** 2026-06-03  
**Objetivo:** agregar flujo seguro de “¿Olvidaste tu contraseña?” para administrador, usuario interno/empleado y socio.

## Alcance funcional

- Agrega enlace “¿Olvidaste tu contraseña?” en los formularios de login.
- Agrega pantalla `/auth/forgot-password` para solicitar recuperación por email.
- Agrega pantalla `/auth/reset-password` para definir una nueva contraseña desde un token seguro.
- Agrega endpoints públicos:
  - `POST /api/auth/forgot-password`
  - `GET /api/auth/reset-password?token=...`
  - `POST /api/auth/reset-password`
- Usa política de contraseña fuerte compartida con primer cambio obligatorio.
- Actualiza `usuario.password_hash`, `usuario.must_change_password` y `usuario.password_actualizado_en`.
- Registra auditoría de solicitudes y reseteos.
- Envía email transaccional usando Brevo.
- No revela si el email existe o no en la solicitud inicial.

## Alcance DB

Requiere migración privada/no versionada en repo público:

```txt
supabase/migrations/202606030900_auth_forgot_password_email_flow.sql
```

Crea:

```txt
public.auth_password_reset_tokens
public.auth_password_reset_auditoria
```

El token plano no se guarda en base de datos. Solo se persiste `token_hash` con SHA-256.

## Variables de entorno recomendadas

```env
BREVO_API_KEY=
BREVO_SENDER_NAME=Gym Master
BREVO_SENDER_EMAIL=no-reply@tudominio.com
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
```

Si `BREVO_API_KEY` no está configurada, el backend registra warning y auditoría, pero no envía email real.

## Flujo de prueba

1. Aplicar migración a Supabase remoto siguiendo el flujo habitual.
2. Ejecutar validación SQL:

```txt
database/scripts/validar_auth_forgot_password_email_flow.sql
```

3. Levantar app:

```bash
npm run dev
```

4. Probar:

```txt
/auth/login/admin
/auth/login/socio
/auth/forgot-password
/auth/reset-password?token=...
```

5. Verificar en Supabase:

```txt
auth_password_reset_tokens
auth_password_reset_auditoria
usuario.password_actualizado_en
usuario.must_change_password
```

## Seguridad

- El endpoint de solicitud devuelve respuesta genérica.
- El token vence por tiempo.
- El token queda marcado como usado al restablecer contraseña.
- Las solicitudes anteriores activas del usuario se invalidan al generar una nueva.
- No se versionan SQL ni dumps en el repo público.
