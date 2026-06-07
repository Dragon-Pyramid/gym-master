# Servicios adicionales de gimnasio

Esta feature amplía el módulo de **Servicios** para que el gimnasio pueda vender y administrar prestaciones comerciales adicionales a la cuota mensual.

## Alcance

- Categoría de servicio.
- Modalidad presencial, online o mixta.
- Duración estimada.
- Requerimiento de reserva o coordinación previa.
- Cupo máximo opcional.
- Disponibilidad para venta online futura.
- Observaciones internas.
- Exportación Excel/PDF con nuevos campos.
- Seeds iniciales para servicios típicos de gimnasio.

## Servicios seed sugeridos

- Personal trainer 1 hora.
- Evaluación física inicial.
- Plan nutricional básico.
- Clase especial funcional.
- Pase diario.
- Alquiler de espacio por hora.
- Servicio premium mensual.

## Integración comercial

El modelo de ventas existente ya soporta detalles de venta con `item_tipo = servicio`, por lo que estos servicios pueden seleccionarse como ítems comerciales sin descontar stock.

## Futuro

Este módulo puede evolucionar hacia reservas, turnos/cupos, paquetes comerciales, promociones, venta online y reportes de rentabilidad por servicio.
