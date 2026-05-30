# Proveedores Comercial Profile

## Rama

`feature/proveedores-comercial-profile`

## Objetivo

Ampliar la gestión de proveedores del módulo comercial para contemplar información fiscal, contacto, ubicación, estado operativo, observaciones y datos bancarios opcionales.

## Alcance funcional

- Nombre comercial como dato principal visible.
- Razón social.
- CUIT/RUC/identificación fiscal.
- Condición fiscal.
- Contacto principal.
- Teléfono, WhatsApp y email.
- Dirección, ciudad, provincia y país.
- Rubro/categoría.
- Estado: activo, inactivo o discontinuado.
- Observaciones internas.
- Datos bancarios opcionales: banco, alias, CBU/CVU y titular.
- Desactivación lógica en lugar de hard delete.
- Excel ampliado con todos los campos comerciales.
- Tabla, formulario y modal de detalle actualizados.
- Productos solo lista proveedores activos para nuevas asignaciones, conservando el proveedor actual al editar.

## Base de datos

La migración real se maneja como archivo local/privado en `supabase/migrations` para permitir `npx supabase db push`, pero no debe commitearse al repositorio público.

Migración esperada:

`202605300815_proveedores_comercial_profile.sql`

Validación:

`database/scripts/validar_proveedores_comercial_profile.sql`

## Seguridad del repositorio

Los archivos SQL deben permanecer ignorados por `.gitignore`. Antes del commit verificar que no aparezcan en `git status --short`.

## Pruebas recomendadas

1. Crear proveedor activo con datos completos.
2. Crear proveedor con solo datos mínimos.
3. Editar proveedor y completar datos fiscales/bancarios.
4. Filtrar por activo, inactivo y discontinuado.
5. Buscar por nombre, razón social, CUIT/RUC, email, ciudad o rubro.
6. Ver detalle del proveedor.
7. Exportar Excel y confirmar columnas nuevas.
8. Desactivar proveedor y confirmar que no se borra el histórico.
9. Ir a Productos y validar que para nuevas asignaciones se muestran proveedores activos.
