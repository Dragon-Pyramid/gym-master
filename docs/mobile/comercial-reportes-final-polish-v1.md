# Comercial reportes final polish v1

## Rama

`feature/comercial-reportes-final-polish-v1`

## Objetivo

Cerrar el bloque comercial con una experiencia final de reportes y lectura ejecutiva para administración, conectando ventas, packs/promociones, finanzas, stock y decisiones operativas.

## Alcance aplicado

- Pulido de `BI Packs / Promos` (`/dashboard/comercial/pack-analytics`).
- Pulido de `Finanzas / BI` (`/dashboard/finanzas`).
- Shell vertical controlado `Header / Contenido / Footer` en ambas pantallas.
- Scroll interno del contenido para evitar espacio blanco después del footer.
- Nueva lectura ejecutiva comercial para packs/promociones.
- Nueva lectura ejecutiva financiera para ingresos, egresos, resultado neto y compromisos.
- Accesos cruzados entre POS, stock, finanzas y gestión de packs.
- Mejor soporte responsive mobile/desktop.
- Corrección de estado vacío duplicado en gráfico financiero.

## Reportes reforzados

### BI Packs / Promos

- Pack líder del período.
- Uso relativo de cupones.
- Ticket promedio de packs.
- Decisión sugerida para promociones.
- Cruce operativo con stock antes de sostener descuentos.

### Finanzas / BI

- Señal ejecutiva financiera.
- Ventas registradas.
- Pagos de cuotas.
- Compras y gastos.
- Ingresos, egresos y pendientes como lectura rápida.

## Decisiones técnicas

- No se agregan migraciones.
- No se modifica estructura de base de datos.
- No se modifican contratos de endpoints.
- No se toca Swagger.
- Se reutilizan servicios y datos existentes.

## QA sugerido

1. Entrar como admin a `/dashboard/comercial/pack-analytics`.
2. Confirmar métricas, lectura ejecutiva y tablas.
3. Cambiar fechas y aplicar filtros.
4. Confirmar exportación/acciones existentes si aplica.
5. Entrar a `/dashboard/finanzas`.
6. Confirmar lectura ejecutiva financiera.
7. Confirmar gráficos y estados vacíos.
8. Probar PDF/Excel.
9. Probar modo claro/oscuro.
10. Probar F12 mobile y desktop.
11. Confirmar que no hay scroll horizontal.
12. Confirmar que no queda espacio blanco después del footer.
