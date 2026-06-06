# Traba de parametrización legal para documentos comerciales

## Objetivo

Evitar que Gym Master emita recibos, reportes PDF o comprobantes comerciales usando datos genéricos de la plataforma cuando el gimnasio cliente todavía no cargó su identidad legal/comercial.

Gym Master / Dragon Pyramid debe ser entendido como plataforma tecnológica. El emisor comercial y legal de comprobantes debe ser siempre el gimnasio cliente.

## Regla funcional

Si no existe parametrización completa en `public.gimnasio_parametrizacion`, el sistema bloquea la generación de documentos comerciales y muestra un mensaje indicando que deben completarse los datos en:

```txt
Administración → Datos del Gimnasio
```

## Campos mínimos requeridos

- Nombre comercial
- Razón social
- CUIT / DNI fiscal
- Condición fiscal
- Domicilio legal
- Ciudad
- Provincia
- País
- Teléfono
- Email institucional

## Alcance aplicado

- Recibo PDF de pago de cuota.
- Reportes PDF comerciales generados con `downloadCommercialReportPdf`.
- Banner preventivo en dashboard admin cuando faltan datos.

## Criterio técnico

`GET /api/gimnasio-parametrizacion` ya no crea automáticamente un registro default si la tabla está vacía. Devuelve una estructura vacía/default para que el frontend pueda mostrar el formulario sin registrar datos falsos.

Los documentos comerciales usan `getResolvedGimnasioBranding()` y validan `parametrizacionCompleta` antes de generar el PDF.

## Resultado esperado QA

1. Borrar registros de `public.gimnasio_parametrizacion`.
2. Ingresar como admin.
3. Ver banner de datos pendientes en dashboard.
4. Intentar emitir recibo/reporte PDF.
5. Confirmar bloqueo con mensaje claro.
6. Completar Datos del Gimnasio.
7. Confirmar que los documentos vuelven a emitirse con datos/logo del gimnasio.
