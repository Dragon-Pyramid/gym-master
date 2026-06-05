# Ajustes QA — Normalización auth/usuarios/socios/empleados

## Alcance

Durante la prueba funcional de `feature/auth-usuarios-socios-normalizacion` se detectaron dos ajustes necesarios:

1. El dashboard inicial de usuarios internos mostraba el mensaje motivacional de socio: “¡Llegó la hora de entrenar!”.
2. El alta de usuario interno/empleado usaba inputs libres para campos que deben venir de catálogos parametrizables.

## Cambios aplicados

### Dashboard por rol

`DashboardInitialContent` ahora diferencia el copy según rol:

- Socio: mantiene mensaje de entrenamiento.
- Usuario interno: muestra mensaje operativo orientado a gestión del gimnasio.

### Catálogos laborales

Se agregan tablas parametrizables con seed inicial:

- `empleado_tipo_contratacion`
- `empleado_puesto_responsabilidad`
- `empleado_area`
- `empleado_turno`
- `empleado_horario_disponibilidad`

Los catálogos se exponen desde `/api/parametrizacion/catalogos`, por lo que quedan disponibles también en el panel de Parametrización.

### UserForm

Cuando el rol seleccionado es `Usuario interno`, los campos laborales relevantes ahora usan combos:

- Tipo de contratación
- Puesto / responsabilidad
- Área
- Turno
- Horario / disponibilidad

Los campos de fecha ya usan `type="date"`, por lo que se mantienen como date picker nativo del navegador.

## Validación esperada

1. Ejecutar migración `202606051620_empleados_catalogos_laborales.sql`.
2. Ejecutar `database/scripts/validar_empleados_catalogos_laborales.sql`.
3. Abrir `/dashboard/parametrizacion` y confirmar nuevos catálogos laborales.
4. Abrir `/dashboard/usuarios` → Añadir Usuario → Rol `Usuario interno`.
5. Confirmar que aparecen combos con opciones lógicas de gimnasio.
6. Crear usuario interno/empleado y verificar que se crea el perfil laboral vinculado.
7. Iniciar sesión como usuario interno y confirmar que el dashboard no muestra “¡Llegó la hora de entrenar!”.
