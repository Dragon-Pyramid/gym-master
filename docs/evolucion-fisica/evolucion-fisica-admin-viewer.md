# Evolución física — Gestor administrativo solo lectura

## Objetivo

Agregar un gestor administrativo para consultar la evolución física de los socios sin permitir edición de valores desde administración.

La feature sigue el patrón del Gestor de Rutinas: listado de socios, búsqueda, estado resumido y pantalla de detalle con navegación de vuelta al gestor.

## Alcance funcional

- Nueva ruta administrativa: `/dashboard/gestor-evolucion-fisica`.
- Listado de socios con búsqueda por nombre, DNI o email.
- Tarjetas con estado activo/inactivo, cantidad de registros y última medición.
- Acceso a detalle solo si el socio tiene registros de evolución.
- Nueva ruta detalle: `/dashboard/gestor-evolucion-fisica/socio/[socioId]`.
- Visualización de dashboard biométrico, gráficos, silueta y tabla histórica.
- Modal de detalle por registro.
- Vista solo lectura: no se incorpora formulario de alta/edición en este gestor.

## Endpoint agregado

`GET /api/evolucion_socio/admin/resumen`

Devuelve una vista consolidada para administración:

- datos básicos del socio;
- cantidad de registros;
- última fecha de medición;
- peso, altura, IMC, cintura, grasa y masa muscular más recientes;
- estado activo/inactivo.

El endpoint requiere autenticación y rol administrador.

## Seguridad y permisos

- El menú se agrega en Administración como `Gestión Evolución Física`.
- La ruta queda restringida a rol administrador.
- La pantalla de detalle no permite modificar datos.
- El endpoint rechaza roles no administrativos con `403`.

## Decisiones de diseño

Se mantiene `/dashboard/evolucion-fisica` como experiencia operativa existente, mientras que el nuevo gestor administrativo queda enfocado en consulta y seguimiento.

Esto evita que administración edite valores corporales desde una vista de supervisión y conserva trazabilidad para futuras reglas de permisos específicas.

## Validación funcional

1. Ingresar como administrador.
2. Abrir `/dashboard/gestor-evolucion-fisica`.
3. Buscar un socio por nombre o DNI.
4. Confirmar tarjetas con resumen de evolución.
5. Abrir `Ver evolución` en un socio con registros.
6. Confirmar dashboard, gráficos, silueta y tabla histórica.
7. Abrir el modal de detalle de un registro.
8. Confirmar que no existe acción de edición/carga desde el gestor.
