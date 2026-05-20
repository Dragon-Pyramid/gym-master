# Informe técnico: API y dashboard de estado de cuotas

## Proyecto

Gym Master

## Rama

`feature/cuota-estado-api-dashboard`

## Objetivo

Implementar la capa de aplicación para visualizar estados de cuota y pagos desde el dashboard administrativo.

## Contexto

En etapas anteriores se preparó la base de datos para gestionar pagos, vencimientos y cobertura de cuotas. También se crearon datos QA con distintos escenarios: socios al día, vencidos, sin pagos, pagos en efectivo y pago Stripe simulado.

Esta rama conecta esa información con el sistema web.

## Cambios realizados

### Backend

Se incorporaron API Routes para consultar estados de cuota:

- `/api/cuota-estado`
- `/api/admin/cuotas/estado-socios`
- `/api/admin/cuotas/resumen`

También se agregó un servicio server-side para centralizar la lógica de consulta contra Supabase y mantener la service role key fuera del navegador.

### Frontend

Se agregó una sección `Estado de cuotas` dentro del dashboard administrativo.

La sección muestra:

- total de socios
- socios al día
- socios vencidos
- socios sin pagos
- monto total cobrado según pagos disponibles
- tabla de socios con atención requerida
- resumen de pagos por método

### Tipado

Se agregó una interfaz específica para normalizar y tipar estados de cuota, resumen administrativo y pagos agrupados por método.

## Impacto funcional

El administrador ahora puede visualizar rápidamente qué socios están al día, cuáles tienen cuota vencida y cuáles no registran pagos.

Esto prepara el camino para bloquear o advertir ingresos al gimnasio, generar métricas comerciales y construir BI de cuotas/pagos.

## Validaciones recomendadas

- Ejecutar `npm run build`.
- Validar login de administrador.
- Revisar dashboard principal.
- Confirmar que los datos QA se visualizan correctamente.
- Probar endpoints protegidos con token.

## Riesgos y observaciones

- El dashboard depende de las funciones SQL creadas en la foundation de cuotas/pagos.
- Si no existen datos de pago, los socios aparecerán como `sin_pagos`.
- Los datos QA deben usarse para prueba, demo y desarrollo; en producción real se puede decidir si mantenerlos o eliminarlos.

## Próximos pasos recomendados

1. Implementar pago manual desde administrador usando el modelo foundation.
2. Integrar Stripe/webhook con los nuevos campos de pago.
3. Agregar reglas de inactivación por cuota vencida y ausencia de asistencia.
4. Extender BI de pagos y cuotas en dashboard.
5. Agregar filtros por estado, método de pago y rango de fechas.
