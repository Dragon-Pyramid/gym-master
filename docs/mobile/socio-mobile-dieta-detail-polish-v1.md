# Socio mobile dieta detail polish v1

## Objetivo

Pulir la experiencia mobile del socio en `/dashboard/dietas`, reemplazando la visualización técnica/tabular por una lectura clara del plan alimentario desde celular.

## Alcance

- Header mobile específico para la vista de dietas del socio.
- Ocultamiento de acciones administrativas para socios.
- Listado mobile por tarjetas.
- Detalle real con `DietaDisplay`, evitando mostrar JSON crudo.
- Resumen de objetivo, fechas, duración y cantidad de comidas.
- Chips horizontales de comidas.
- Card destacada para la comida seleccionada.
- Detalle completo de comidas en formato legible.
- Recordatorio de seguridad alimentaria/nutricional.
- Descarga PDF desde el detalle.
- Estado vacío claro cuando el socio no tiene dietas cargadas.

## Archivos modificados

- `src/app/dashboard/dietas/page.tsx`
- `src/components/tables/DietaHistorial.tsx`
- `src/components/dashboard/dietas/DietaDisplay.tsx`

## Migraciones

No requiere migración de base de datos.

## Swagger / API

No modifica endpoints ni contratos API.

## Validación sugerida

1. Entrar como socio desde mobile.
2. Abrir `/dashboard/dietas`.
3. Confirmar que no aparece `Nueva Dieta`, `Imprimir` ni `Exportar` para socio.
4. Ver listado de dietas como tarjetas.
5. Abrir una dieta.
6. Confirmar que no se muestra JSON crudo.
7. Validar resumen, chips de comidas, card activa y detalle completo.
8. Probar descarga PDF.
9. Confirmar que no hay scroll horizontal en mobile.
10. Validar vista desktop/tablet.

## Notas

La mejora mantiene la pantalla administrativa de creación de dietas fuera del flujo del socio. La gestión completa por socio continúa en el Gestor de Dietas.
