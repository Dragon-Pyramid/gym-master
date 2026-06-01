# Empleados RBAC: permisos de menú y bloqueo por ruta

## Feature

`feature/empleados-rbac-menu-permissions`

## Objetivo

Fortalecer el esquema de permisos para usuarios internos/empleados administrativos. El administrador conserva acceso total, pero puede delegar módulos específicos a usuarios internos desde el formulario de usuarios.

## Alcance implementado

- Se amplía el catálogo de permisos disponibles para rol `usuario`.
- El formulario de usuarios permite marcar módulos operativos para empleados administrativos.
- El menú lateral sigue siendo dinámico: solo muestra opciones habilitadas para el usuario.
- El guard global del dashboard bloquea rutas no autorizadas aunque el usuario intente acceder manualmente por URL.
- Se agrega mensaje explícito de bloqueo: `USTED NO TIENE ACCESO A ESTE MENÚ`.
- Se corrige la sanitización de permisos para que no elimine permisos válidos que no formen parte del set default.
- Se habilita herencia de permisos para rutas hijas/dinámicas de módulos como gestión de rutinas, dietas y evolución física.

## Criterio de seguridad

La seguridad no depende solo del sidebar. Aunque el menú oculte opciones no permitidas, `DashboardRouteGuard` valida el acceso por path y bloquea la navegación no autorizada.

## Permisos sensibles

Por seguridad, los módulos `Usuarios` y `Parametrización` siguen reservados para administradores.

## Pendiente futuro

- Relacionar formalmente usuarios internos con empleados.
- Crear presets de permisos por puesto/responsabilidad.
- Integrar permisos con catálogos parametrizables de empleados.
- Agregar auditoría de cambios de permisos.
- Mejorar el flujo de contraseña inicial y primer cambio obligatorio.
