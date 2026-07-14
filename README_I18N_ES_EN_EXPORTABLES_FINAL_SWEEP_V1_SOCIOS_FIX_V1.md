# I18N ES/EN Exportables Final Sweep V1 — Socios PDF/Excel Fix V1

## Alcance

Corrige los exportables de `/dashboard/socios` cuando el sistema está en idioma inglés:

- PDF de socios: título, subtítulo, métricas, filtros, headers, sexo, estado, fecha de generación, detalle, estado vacío, footer y paginación.
- Excel de socios: nombre de hoja, headers principales y nombre del archivo descargado.
- Extiende `downloadCommercialReportPdf` con `locale` y labels opcionales sin romper los exportables existentes que no pasen idioma.

## Archivos tocados por el script

- `src/app/dashboard/socios/page.tsx`
- `src/utils/commercialReportPdf.ts`

## No toca

- Base de datos.
- Endpoints.
- Swagger/OpenAPI.
- Lógica de filtrado/listado de socios.
- Branding del gimnasio.

## Aplicación

Desde la raíz del repo:

```bash
node scripts/fix-socios-exportables-i18n-v1.cjs
rm -rf .next
npm run build
```

El script deja backups locales con sufijo `.bak_exportables_i18n_v1` por seguridad.
