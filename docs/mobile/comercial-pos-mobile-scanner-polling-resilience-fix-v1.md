# Comercial POS mobile scanner polling resilience fix v1

## Objetivo

Evitar que un error transitorio del polling del scanner móvil muestre HTML crudo de infraestructura, como `502 Bad Gateway`, dentro de la interfaz del POS.

## Contexto QA

Durante prueba mobile del POS/Kiosco se detectó que el scanner móvil seguía funcionando, pero una consulta aislada del polling devolvió error temporal. La UI mostró el HTML recibido en un toast, generando ruido visual para el cajero.

## Cambios

- Se sanitizan errores no JSON o mensajes HTML en el cliente del scanner móvil.
- Se sanitizan errores del route handler `/api/comercial/mobile-scanner`.
- El polling del scanner no muestra toast por un fallo aislado.
- Después de tres fallos consecutivos, se muestra una advertencia amigable y se sigue reintentando en segundo plano.
- En una respuesta exitosa posterior, se reinicia el contador de fallos.

## Alcance

No cambia contratos de API, no toca DB y no modifica Swagger. Es un fix de resiliencia UX para polling.

## Validación

1. Abrir `/dashboard/comercial/kiosco`.
2. Crear scanner móvil.
3. Mantener polling activo.
4. Confirmar que un fallo transitorio no muestra HTML crudo.
5. Confirmar que el scanner continúa reintentando.
6. Confirmar que ventas, carrito, ticket y scanner siguen funcionando.
