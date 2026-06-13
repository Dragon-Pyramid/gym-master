# Gym Master — Ranking y bonificación mensual de socios

## Rama

`feature/socios-ranking-bonificacion-mensual`

## Objetivo

Crear un módulo CRM/comercial para reconocer a los socios más constantes del mes y permitir bonificaciones configurables desde administración.

La feature suma valor de fidelización, marketing interno y retención: el gimnasio puede comunicar el “socio del mes”, premiar constancia y promover el pago al día.

## Alcance

- Nueva pantalla `/dashboard/socios-ranking-bonificacion`.
- Ranking mensual por socio.
- KPIs de socios activos, socios con asistencia, cuota al día, bonificados y asistencia promedio.
- Cálculo de score operativo.
- Regla de desempate por cuota al día.
- Acción para bonificar/quitar bonificación mensual.
- Actualización del flag `socio.descuento_activo`.
- Registro histórico de bonificaciones por socio, año y mes.
- Exportación PDF y Excel.
- Menú y permisos actualizados.
- Swagger/OpenAPI actualizado.

## Reglas de ranking

1. Mayor cantidad de días asistidos durante el mes.
2. Primer desempate: cuota al día al cierre del período.
3. Segundo desempate: score operativo.
4. Último desempate: orden alfabético.

## Base de datos

La migración privada crea:

- `public.socio_ranking_bonificacion_mensual`

La tabla registra:

- Socio.
- Año y mes.
- Ranking.
- Asistencias.
- Cuota al día.
- Score.
- Bonificado sí/no.
- Porcentaje de descuento.
- Motivo.
- Observaciones.
- Usuario que generó la bonificación.
- Timestamps.

## Seguridad

Las operaciones pasan por API Routes protegidas por `authMiddleware` y usan cliente server/service role para operar contra tablas con RLS. No se exponen operaciones directas desde el navegador contra la tabla de bonificaciones.

## Validación esperada

1. Aplicar migración privada.
2. Ejecutar validación SQL.
3. Abrir `/dashboard/socios-ranking-bonificacion`.
4. Cambiar mes/año y refrescar ranking.
5. Bonificar un socio.
6. Verificar `socio.descuento_activo = true`.
7. Quitar bonificación y verificar actualización.
8. Exportar PDF y Excel.

## Refinamiento de integración con pagos

Se ajusta el flujo de pagos para que la bonificación mensual del socio se aplique al momento de registrar una cuota manual o generar una sesión Stripe.

Reglas aplicadas:

- El descuento por pago adelantado sigue funcionando según parametrización existente.
- La bonificación mensual se obtiene desde `socio_ranking_bonificacion_mensual` para el socio y el mes del período a pagar.
- Si existen ambos beneficios, se combinan en un único descuento porcentual acumulado, con tope máximo de 100%.
- El formulario de pago muestra el subtotal, descuento total, total sugerido y mensaje de bonificación aplicada.
- El registro de pago conserva `subtotal`, `descuento_porcentaje`, `descuento_monto`, `descuento_motivo` y `monto_pagado` para trazabilidad comercial.
- Stripe usa el mismo preview combinado para evitar diferencias entre pago online y pago manual.

También se ajusta el PDF del ranking para que un único gráfico use todo el ancho disponible del reporte, mejorando la lectura de etiquetas de socios.

## Regla crítica de bloqueo por pago

Una bonificación mensual es válida únicamente para el mes de la cuota correspondiente. Al finalizar ese mes, otro socio puede ser bonificado para el mes siguiente.

Cuando ya existe un pago registrado para un socio y para el mes bonificado, la bonificación de ese mes queda bloqueada y no se puede quitar ni alterar desde el ranking. Esta regla preserva el snapshot comercial del pago ya emitido, evitando inconsistencias entre:

- bonificación otorgada,
- descuento aplicado,
- monto pagado,
- recibo/comprobante,
- auditoría financiera.

La bonificación mensual se aplica sobre una cuota mensual del período. Si el socio paga varios meses juntos, se combina con el descuento por pago adelantado, pero la bonificación mensual no se multiplica por todos los meses cubiertos.
