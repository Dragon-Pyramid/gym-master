# i18n ES/EN commercial final sweep kiosco labels fix v4

## Objetivo
Corregir textos restantes visibles en Español dentro de `/dashboard/comercial/kiosco` cuando el idioma activo es Inglés.

## Ajustes visuales principales
- Hero POS/Kiosco:
  - `Punto de Venta / Kiosco`
  - descripción mixta ES/EN
  - `Total actual`
  - `Pago`
  - `Estado POS`
  - `Actualizar`
  - `Ventas`

- Cards y filtros:
  - `Ventas hoy`
  - `Total hoy`
  - `Productos`
  - `Buscar producto, servicio o pack`
  - `Agregar`
  - `Stock total`
  - `Servicios vendibles`
  - `Packs / promociones vendibles`
  - `Ventas recientes`
  - `Imprimir`

- Carrito:
  - `Disponible`
  - `Subtotal`
  - `Descuentos`
  - `Confirmar venta`

- Scanner móvil:
  - `Celular conectado al POS`
  - `Verificar ahora`
  - `Estado`
  - `Eventos`
  - `Expira`
  - estados runtime (`activa`, `pendiente`, etc.)

## Ajuste técnico adicional
- `buildTicketHtml()` ahora recibe `c` como parámetro para evitar traducciones fuera del scope del componente.
- El ticket imprimible traduce `Cliente`, `Pago`, `Total`, `Ticket` y `Gracias por tu compra`.

## Alcance
- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
