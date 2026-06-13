# Feature — Header notifications bell center

## Rama

`feature/header-notifications-bell-center`

## Objetivo

Convertir la campanita del header en un centro rápido de alertas operativas y personales, con contador rojo de pendientes y popup desplegable con accesos directos al módulo donde se resuelve cada aviso.

## Alcance funcional

### Para socios

La campanita puede mostrar alertas como:

- Cuota vencida o sin pagos registrados.
- Riesgo de bloqueo de acceso por mora dentro del período de gracia.
- Cuota próxima a vencer.
- Mensajes respondidos por administración en la casilla del socio.
- Ficha médica inexistente o con próxima revisión vencida.

### Para administrador / usuario interno

La campanita puede mostrar alertas como:

- Socios con cuotas vencidas o sin pagos.
- Stock crítico o productos sin stock.
- Mensajes de socios pendientes de lectura o respuesta.
- Mantenimientos de equipos pendientes o revisiones vencidas.

## Diseño UX

- Si hay pendientes, la campanita muestra un círculo rojo con la cantidad total.
- Al hacer click, se despliega un popup con tarjetas resumidas.
- Cada ítem muestra prioridad, título, resumen y cantidad si corresponde.
- Al hacer click en un ítem, navega al módulo relacionado.
- Si no hay pendientes críticos, muestra un estado tranquilo: “Sin pendientes críticos”.

## Regla de resolución

Las notificaciones del header son derivadas del estado real del sistema. No se resuelven desde la campanita: se resuelven corrigiendo la situación original.

Ejemplos:

- Pagar cuota o registrar pago quita alerta de mora.
- Reponer stock quita alerta de stock crítico.
- Responder/cerrar mensajes quita alerta de casilla.
- Completar ficha médica quita alerta de ficha incompleta.
- Completar mantenimiento o revisar equipamiento quita alerta técnica.

## Archivos principales

- `src/components/header/HeaderNotificationsBell.tsx`
- `src/components/header/AppHeader.tsx`
- `src/app/api/notificaciones/header/route.ts`
- `src/services/server/headerNotificationsServerService.ts`

## Base de datos

No requiere migración inicial.

La implementación usa tablas existentes:

- `socio`
- `pago`
- funciones RPC de estado de cuota existentes
- `socio_mensaje`
- `ficha_medica`
- `producto`
- `mantenimiento`
- `equipamiento`

## Validación sugerida

1. Iniciar sesión como administrador.
2. Verificar que la campanita muestre contador si hay cuotas vencidas, stock crítico, mensajes pendientes o mantenimientos.
3. Hacer click en la campanita y validar el popup.
4. Hacer click en un ítem y confirmar navegación al módulo correcto.
5. Iniciar sesión como socio con cuota vencida o ficha médica incompleta.
6. Validar contador, popup y navegación.
7. Ejecutar:

```bash
npm run build
npm run test:e2e
```
