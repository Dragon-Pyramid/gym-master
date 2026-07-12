# I18N ES/EN Admin Dashboard Final Sweep v2 - Pagos Fix v2

## Alcance
- Refina `src/components/forms/PagoForm.tsx`.
- Corrige mensajes dinámicos de preview de descuento/bonificación que llegan desde la lógica de pagos en español mientras la UI está en inglés.

## Cambios
- Agrega `translatePaymentPreviewMessage` para traducción de presentación.
- Traduce frases como:
  - `Pagando 2 o más cuotas por adelantado obtenés 10% de descuento.`
  - `Pagando 2 o más cuotas se aplicará 10% de descuento.`
- No modifica cálculos, reglas de descuento, cuotas, DB, endpoints ni Swagger/OpenAPI.

## QA
- Abrir `/dashboard/pagos` en EN.
- Abrir `Register manual payment`.
- Confirmar que el panel `Applied discounts and bonus` no muestre frases en español.
