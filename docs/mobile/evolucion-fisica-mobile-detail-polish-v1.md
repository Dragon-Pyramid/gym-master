# Evolución física mobile detail polish v1

## Rama

`feature/evolucion-fisica-mobile-detail-polish-v1`

## Objetivo

Pulir la experiencia mobile del socio en el módulo de Evolución Física sin alterar la calibración fina del mapa corporal, fondos, siluetas ni coordenadas milimétricas de músculos geométricos para hombre y mujer.

## Alcance

- Mejora del layout responsive de `/dashboard/evolucion-fisica`.
- Encabezado mobile más claro para el socio.
- Ocultamiento de exportación Excel para socio; se mantiene para admin en desktop.
- Historial de medidas con cards mobile legibles.
- Tabla histórica preservada para desktop/admin.
- Comparativa “Antes vs. ahora” con formato mobile por cards y tabla desktop.
- Gráficos con altura más amigable en mobile.
- Modal de detalle con ancho y padding mobile mejorados.

## Restricción crítica aplicada

No se modificaron:

- `MUSCLE_TRANSFORMS_BY_SEX`.
- `PAIRED_MUSCLE_TRANSFORMS_BY_SEX`.
- `overlayTransform`.
- `BodyMapSvg`.
- Paths SVG del mapa corporal.
- Posiciones, escalas, clipPaths, imágenes de fondo ni coordenadas de músculos.

La animación antes/después y la alineación de músculos geométricos contra la silueta masculina/femenina quedan intactas.

## Archivos modificados

- `src/app/dashboard/evolucion-fisica/page.tsx`
- `src/components/dashboard/evolucion-fisica/EvolucionFisicaDashboard.tsx`
- `src/components/tables/EvolucionSocioTable.tsx`
- `src/components/modal/EvolucionFisicaViewModal.tsx`

## Validación sugerida

### Socio mobile

1. Entrar a `/dashboard/evolucion-fisica` desde celular o responsive.
2. Verificar que el encabezado no ocupa demasiado espacio.
3. Verificar cards de métricas iniciales/actuales.
4. Confirmar que la animación antes/después mantiene alineados fondo y músculos.
5. Probar hombre y mujer si hay datos demo disponibles.
6. Cambiar vista Frente/Espalda.
7. Probar Slider/Superpuesto/Heatmap.
8. Confirmar que el historial se muestra como cards mobile.
9. Abrir un registro y revisar el modal.
10. Descargar PDF.
11. Confirmar que no hay scroll horizontal accidental.

### Admin desktop

1. Entrar a `/dashboard/evolucion-fisica`.
2. Seleccionar socio.
3. Confirmar que la tabla desktop sigue disponible.
4. Confirmar que Exportar Excel sigue visible para admin.
5. Confirmar que PDF sigue funcionando.

## Notas

La mejora es visual/responsive y no requiere migración DB ni cambios Swagger/OpenAPI.
