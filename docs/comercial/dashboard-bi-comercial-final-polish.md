# Dashboard BI comercial - pulido final

## Rama

`feature/dashboard-bi-comercial-final-polish`

## Objetivo

Mejorar la lectura ejecutiva y comercial de los tableros principales de Gym Master para demo y venta, sin modificar reglas de negocio ni estructura de base de datos.

## Alcance

### Dashboard principal

- Reemplazo del bloque genérico de bienvenida por un hero ejecutivo.
- Accesos rápidos a QR del día, Finanzas / BI, Comercial y BI Socios.
- Resumen visual de mensajes sin responder, equipos en revisión, próximos mantenimientos y costo mensual de mantenimiento.
- Mejor lectura del tablero como centro operativo para administración.

### Comercial / Kiosco

- Se amplían KPIs comerciales:
  - productos activos
  - stock crítico
  - productos sin stock
  - inventario estimado
  - ventas activas
  - total vendido
- Se agrega ticket promedio en la descripción de ventas activas.
- Se incorpora porcentaje de productos críticos sobre catálogo activo.
- Se reemplaza el bloque de “próximas integraciones financieras” por una lectura ejecutiva comercial.
- Se muestra recomendación operativa según estado del stock.

## Decisión de diseño

La feature no busca agregar módulos nuevos. El objetivo es que los tableros existentes comuniquen mejor la situación real del gimnasio y permitan tomar decisiones rápidas durante la demo o la operación diaria.

## Recorrido manual sugerido

1. `/dashboard`
   - Verificar hero ejecutivo.
   - Probar QR del día.
   - Probar accesos a Finanzas / BI, Comercial y BI Socios.
   - Confirmar cards de mensajes, equipos y mantenimiento.

2. `/dashboard/comercial`
   - Verificar KPIs comerciales ampliados.
   - Revisar cálculo visual de stock crítico, sin stock, ticket promedio y total vendido.
   - Revisar lectura ejecutiva comercial.
   - Confirmar que las cards de productos críticos siguen funcionando.

3. `/dashboard/finanzas`
   - Verificar que el acceso desde dashboard principal navegue correctamente.

4. `/dashboard/bi-socios-demografia-promociones`
   - Verificar que el acceso desde dashboard principal navegue correctamente.

## Validación esperada

- El build compila.
- Los tests E2E pasan.
- No aparecen textos técnicos o de QA.
- No se agregan migraciones ni SQL.
- El tablero principal se percibe más ejecutivo.
- El tablero comercial se percibe más claro para demo y decisión operativa.

## Ajuste posterior de recorrido

Durante la revisión visual del hero ejecutivo se agregó un acceso directo `Terminal` entre `QR del día` y `Finanzas / BI`.

- `QR del día`: conserva la vista rápida del QR dentro del dashboard.
- `Terminal`: abre `/dashboard/asistencias/terminal` en una nueva pestaña para registrar asistencia en modo operativo.

Este acceso reduce pasos para el uso diario del gimnasio y separa la vista rápida del QR del modo terminal completo.
