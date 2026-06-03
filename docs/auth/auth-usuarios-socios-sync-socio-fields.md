# Auth usuarios socios sync — campos operativos de socio

## Contexto

Durante la prueba de `feature/auth-forgot-password-email-flow` se detectó que un usuario con rol `socio` podía existir sin un registro vinculado en `public.socio`, provocando `PGRST116` en `/api/custom-login` al intentar obtener el socio asociado.

También se definió que el alta principal de un socio debe centralizarse en **Usuarios** al seleccionar rol `Socio`, mientras que el menú **Socios** queda para consulta, edición operativa y activación/desactivación.

## Ajustes incluidos

- Al crear usuario con rol `socio`, el formulario permite cargar datos operativos del socio:
  - teléfono
  - sexo
  - fecha de nacimiento
  - fecha de alta
  - dirección
  - ciudad
  - provincia
  - país
  - contacto de emergencia
  - teléfono de emergencia
- El backend crea o vincula automáticamente el registro `public.socio`.
- Si existe socio con mismo DNI/email y `usuario_id` nulo, lo vincula al usuario creado.
- Si existe socio con mismo DNI/email vinculado a otro usuario, devuelve error claro.
- Si no existe socio, crea el perfil operativo.
- Al desactivar/reactivar socio desde menú Socios, también sincroniza `usuario.activo`.
- Al desactivar/reactivar usuario socio desde menú Usuarios, también sincroniza `socio.activo`.
- La contraseña inicial automática sigue usando `GymMaster` + DNI y `must_change_password = true`.
- Se agrega permiso de menú para `Asistente de Dietas` en rol socio.
- El menú Socios ya no muestra acción de alta directa; informa que el alta se realiza desde Usuarios → rol Socio.

## Nota operativa

Los socios existentes creados antes de este ajuste pueden requerir revisión puntual si tienen `usuario_id` nulo o permisos de menú incompletos. Para nuevos socios creados desde Usuarios, el flujo queda homogéneo.
