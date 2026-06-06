# Gym Master — Parametrización de branding y datos legales del gimnasio

## Alcance

La feature `feature/gimnasio-parametrizacion-branding-legal` incorpora una fuente única para la identidad comercial, legal y visual del gimnasio cliente.

## Datos cubiertos

- Nombre comercial.
- Razón social.
- CUIT / DNI fiscal.
- Condición fiscal desde catálogo editable.
- Domicilio legal, ciudad, provincia y país.
- Teléfono, email institucional, sitio web y redes.
- Logo principal y logo alternativo.
- Carga de logo principal a Cloudinary.
- Colores de marca.
- Texto legal para recibos.
- Texto legal para reportes/PDF.
- Pie de página institucional.

## Catálogo de condición fiscal

La condición fiscal se administra como catálogo parametrizable mediante `gimnasio_condicion_fiscal`.

Valores seed iniciales:

- Responsable inscripto.
- Monotributo.
- Consumidor final.
- Exento.
- No responsable.
- Otro.

El catálogo queda visible en Parametrización y se consume como combo en la pantalla de Datos del Gimnasio.

## Cloudinary

El logo principal puede cargarse desde la pantalla `/dashboard/gimnasio-parametrizacion` mediante el endpoint:

- `POST /api/gimnasio-parametrizacion/logo-upload`

El archivo se sube a Cloudinary en la carpeta:

```txt
gym-master/gimnasio/branding
```

El endpoint requiere rol administrador y reutiliza las variables de entorno existentes de Cloudinary.

## PDFs y recibos

La parametrización se usa como fuente única para documentos comerciales:

- Recibos de pago de cuota.
- Reportes comerciales basados en `downloadCommercialReportPdf`.
- Recibos/listados de sueldos que usan el generador comercial.
- Exportaciones y futuros documentos PDF.

Los documentos deben evitar textos hardcodeados como `Gym Master` cuando correspondan al gimnasio cliente y deben usar:

- `nombre_comercial`.
- `razon_social`.
- `identificacion_fiscal`.
- `condicion_fiscal`.
- `logo_url`.
- `texto_legal_recibos`.
- `texto_legal_reportes`.
- `pie_pagina_documentos`.

## Consideración futura

La integración con la futura plataforma independiente de Dragon Pyramid podrá usar esta parametrización como metadata de cada cliente/instancia, pero la administración comercial de clientes, licencias, pagos y bloqueos seguirá perteneciendo al proyecto separado de Dragon Pyramid, no a Gym Master.
