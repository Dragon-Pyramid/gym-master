# Gym Master — Admin Socios Risk Alerts v1

Feature: `feature/admin-socios-risk-alerts-v1`

## Objetivo

Agregar una capa de alertas de riesgo para que administración pueda priorizar socios que requieren atención antes de que el problema derive en baja, mora, falta de seguimiento o reclamo operativo.

## Alcance implementado

- Se agrega helper centralizado `src/utils/socioRiskAlerts.ts`.
- Se agrega lectura de riesgo base en el listado de `/dashboard/socios`.
- Se agregan filtros rápidos por:
  - riesgo alto;
  - riesgo medio;
  - socios con alertas.
- Se agrega columna `Riesgo` en la tabla de socios.
- Se agregan métricas superiores de riesgo.
- Se amplía el modal 360° con sección **Alertas de riesgo 360**.
- Las alertas 360 consolidan señales de cuota, ficha médica, rutinas, dietas, evolución, mensajes, actividades, contacto y estado operativo.
- El modal preserva estados parciales: si un módulo falla, la lectura base del socio sigue disponible.

## Reglas de riesgo

La primera versión usa datos ya disponibles y no crea tablas nuevas.

Se consideran señales de riesgo:

- socio inactivo;
- cuota vencida o con deuda;
- ficha médica pendiente;
- falta de rutina;
- falta de dieta;
- falta de evolución física;
- mensajes pendientes;
- solicitudes de actividades pendientes;
- falta de contacto directo;
- falta de contacto de emergencia;
- foto pendiente.

## Exclusiones

- No requiere migración DB.
- No modifica endpoints.
- No modifica Swagger.
- No sube SQL ni estructura privada.
- No implementa scoring persistido en base de datos.

## QA sugerido

1. Entrar como admin a `/dashboard/socios`.
2. Confirmar métricas de riesgo.
3. Probar filtros de riesgo alto, riesgo medio y con alertas.
4. Confirmar columna `Riesgo` en la tabla.
5. Abrir modal 360°.
6. Confirmar sección **Alertas de riesgo 360**.
7. Probar socio activo, inactivo, con ficha pendiente, sin rutina/dieta y con mensajes pendientes.
8. Confirmar que no hay scroll horizontal.
9. Confirmar que el modal mantiene scroll interno.
10. Confirmar que no queda espacio blanco después del footer al salir de F12.
