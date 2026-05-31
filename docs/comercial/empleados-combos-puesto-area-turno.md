# Empleados — combos base para puesto, área y turno

## Objetivo

Mejorar el alta y edición de empleados reemplazando campos libres por combos controlados en:

- Puesto / responsabilidad
- Área
- Turno

Esto evita valores escritos de distintas formas para el mismo concepto y deja datos más limpios para futuras features de sueldos, permisos/RBAC, BI y reportes.

## Opciones base incorporadas

### Puesto / responsabilidad

- Recepción y atención al socio
- Administración y caja
- Entrenamiento de sala
- Personal trainer / clases
- Mantenimiento operativo
- Otras responsabilidades

### Área

- Administración
- Recepción
- Sala de musculación
- Actividades / clases
- Mantenimiento y limpieza
- Otras áreas

### Turno

- Mañana
- Tarde
- Noche
- Rotativo
- Fin de semana
- Personalizado

## Compatibilidad

Si un empleado existente tiene un valor anterior no incluido en las opciones base, el formulario lo conserva como opción actual para no perder datos históricos.

## Futuro parametrizable

Más adelante estos valores deberían moverse a catálogos parametrizables administrados por cada gimnasio, por ejemplo:

- `empleado_puesto_responsabilidad`
- `empleado_area`
- `empleado_turno`

De esa forma cada gimnasio podrá administrar sus propias responsabilidades, áreas y turnos desde Parametrización.
