# Informe técnico - Pagos manuales desde administrador

## Contexto

Luego de preparar el modelo base de cuotas/pagos y cargar datos QA, se implementó la funcionalidad operativa para registrar pagos manuales desde el panel administrativo.

## Objetivo

Permitir que un administrador registre pagos presenciales o en efectivo, definiendo el socio, la cuota, el período cubierto, los meses abonados y el método de pago.

## Resultado

La pantalla de pagos queda preparada para registrar pagos reales y actualizar el estado de cuota del socio mediante las funciones existentes de base de datos.

## Cambios técnicos

- Nuevo servicio backend para pagos.
- API `/api/pagos` protegida por JWT.
- Formulario administrativo de pagos manuales.
- Cliente frontend para consumir la API.
- Tabla de pagos ampliada.
- Validación SQL posterior al registro.

## Riesgos mitigados

- Se evita exponer service role en frontend.
- Se evita escribir directamente sobre `pago.total`.
- Se registra el administrador que cargó el pago.
- Se usa baja lógica para eliminar pagos.

## Próximo paso recomendado

Implementar pago Stripe real y webhook, usando los mismos campos de trazabilidad agregados en la foundation de cuotas/pagos.
