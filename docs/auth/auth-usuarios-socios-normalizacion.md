# Auth: normalización de usuarios, socios y empleados

## Rama

`feature/auth-usuarios-socios-normalizacion`

## Objetivo

Ordenar el modelo de identidad y perfiles operativos/laborales de Gym Master:

- `usuario`: identidad de acceso, credenciales, rol, permisos, estado y primer cambio de contraseña.
- `socio`: perfil operativo del gimnasio asociado a un usuario con rol `socio`.
- `empleados`: perfil laboral interno asociado a un usuario con rol `usuario` cuando corresponde.

## Reglas funcionales

### Usuario con rol socio

Cuando se crea un usuario con rol `socio` desde Gestión de Usuarios:

1. Se exige DNI/documento.
2. Se genera la contraseña inicial `GymMaster` + DNI si está activado el modo automático.
3. Se guarda la contraseña hasheada.
4. Se marca `must_change_password = true` para forzar cambio en el primer ingreso.
5. Se crea o vincula un registro en `public.socio`.
6. Si ya existe un socio con igual DNI/email y `usuario_id` nulo, se vincula.
7. Si existe socio con igual DNI/email vinculado a otro usuario, se bloquea el alta con error claro.

### Usuario interno / empleado

Cuando se crea un usuario con rol `usuario`:

1. Se exige DNI/documento.
2. Se genera la contraseña inicial `GymMaster` + DNI si está activado el modo automático.
3. Se guarda la contraseña hasheada.
4. Se marca `must_change_password = true`.
5. Se crea o vincula un registro en `public.empleados`.
6. Si existe un empleado con igual DNI/email y `usuario_id` nulo, se vincula.
7. Si existe empleado con igual DNI/email vinculado a otro usuario, se bloquea el alta.

### Administrador

El rol `admin` se mantiene como identidad con control total del panel. No fuerza creación de perfil `socio` ni `empleados`.

## Reglas de activación/desactivación

- Desactivar un usuario con rol `socio` también desactiva el socio asociado.
- Desactivar un socio también desactiva el usuario asociado.
- Desactivar un usuario interno con perfil laboral vinculado también desactiva el empleado asociado.
- Desactivar un empleado también desactiva el usuario asociado.

## Cambios de base de datos

La migración agrega índices únicos parciales para consolidar relaciones 1:1:

- `socio_usuario_id_unique_idx` en `public.socio(usuario_id)` cuando `usuario_id IS NOT NULL`.
- `empleados_usuario_id_unique_idx` en `public.empleados(usuario_id)` cuando `usuario_id IS NOT NULL`.
- `usuario_dni_unique_not_empty_idx` en `public.usuario(dni)` cuando el DNI está informado.

También intenta vincular defensivamente socios/empleados existentes sin `usuario_id` cuando coinciden por email o DNI con usuarios del rol correspondiente y no existe otra relación ya activa.

## Alcance intencionalmente excluido

Esta rama no reescribe todo el dashboard del socio ni la auditoría completa del recorrido socio. Esa revisión queda para `feature/qa-dashboard-socio-recorrido-general`.

Tampoco convierte el módulo de empleados en un sistema completo de RRHH/sueldos; solo normaliza la relación identidad ↔ perfil laboral para que el modelo quede consistente.
