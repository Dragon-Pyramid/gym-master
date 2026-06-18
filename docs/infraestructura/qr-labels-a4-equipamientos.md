# Gym Master — Infraestructura QR Labels A4 + Equipamientos

## Rama

`feature/infraestructura-qr-labels-a4-equipamientos`

## Objetivo

Extender la base QR de Infraestructura para imprimir etiquetas individuales o múltiples en hoja A4, reutilizable para Mantenimiento Edilicio, Sectores, Equipamientos y futuros productos/servicios del módulo comercial.

## Alcance

- Nueva pantalla `/dashboard/infraestructura/etiquetas-qr`.
- Nuevo ítem de menú `Infraestructura → Etiquetas QR`.
- Generación de QR para:
  - Equipamientos.
  - Activos edilicios.
  - Sectores edilicios.
- Selección múltiple de códigos QR existentes.
- Vista previa de etiquetas seleccionadas.
- Impresión A4 en 2 o 3 columnas.
- Opción de guardar como PDF usando el diálogo de impresión del navegador.
- Endpoint `GET /api/infraestructura/qr/labels` para alimentar la pantalla.
- Swagger actualizado.

## Sin migración DB

No se agrega migración porque la tabla `infraestructura_qr_codigo` ya soporta `target_type = equipamiento`, además de `infra_activo`, `infra_sector`, `producto` y `servicio`.

## Flujo funcional

1. El administrador ingresa a `Infraestructura → Etiquetas QR`.
2. Selecciona el tipo de destino: Equipamiento, Activo edilicio o Sector edilicio.
3. Selecciona el destino concreto.
4. Genera la etiqueta QR.
5. El sistema selecciona automáticamente el código generado.
6. El administrador puede seleccionar más etiquetas.
7. Elige plantilla A4 de 2 o 3 columnas.
8. Imprime o guarda como PDF desde el navegador.
9. Pega las etiquetas en máquinas, sectores o activos edilicios.

## Valor de producto

Esta mejora profesionaliza el circuito físico de Gym Master y reduce costos de hardware para el gimnasio. La misma base se reutilizará luego en Comercial/Kiosco para productos con código de barras/QR y escaneo desde celular.

## Validación sugerida

- Generar QR para un equipamiento.
- Generar QR para un activo edilicio.
- Generar QR para un sector.
- Seleccionar dos o más etiquetas.
- Imprimir en A4 3 columnas.
- Repetir en A4 2 columnas.
- Usar “Guardar como PDF” desde el diálogo de impresión.
- Resolver un código desde `Infraestructura → Lector QR/barra`.
