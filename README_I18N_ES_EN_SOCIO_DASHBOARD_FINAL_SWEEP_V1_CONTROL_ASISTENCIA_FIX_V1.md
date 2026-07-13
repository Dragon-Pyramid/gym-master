# i18n ES/EN socio dashboard final sweep v1 — Control asistencia fix v1

## Alcance

Pantalla corregida:

- `/dashboard/control-asistencia`

Archivos modificados:

- `src/app/dashboard/control-asistencia/page.tsx`
- `src/components/ui/RegistrarAsistenciaQR.tsx`
- `src/components/ui/BienvenidaSocio.tsx`

## Cambios realizados

- Traducción ES/EN del header de pantalla y estado inicial de carga.
- Traducción ES/EN del panel de escaneo QR de asistencia socio.
- Traducción ES/EN de textos operativos de cámara:
  - inicio de cámara,
  - permisos denegados,
  - cámara no disponible,
  - cámara ocupada,
  - navegador sin detección QR nativa,
  - reintento.
- Traducción ES/EN de mensajes de registro de asistencia y salida cuando vienen de fallback local o de respuestas comunes del backend.
- Traducción ES/EN del modal de bienvenida/salida/deuda/desactivación del socio.
- Ajuste dark mode local en card principal del lector QR.

## No incluido

- No se modifican endpoints.
- No se modifica base de datos.
- No se modifica Swagger/OpenAPI.
- No se modifica lógica de cámara, QR, registro de asistencia, broadcast al display admin ni validaciones de cuota/estado.

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar assets PWA generados por build:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```

QA manual:

- Revisar `/dashboard/control-asistencia` en ES y EN.
- Validar textos con cámara habilitada y navegador sin soporte QR nativo.
- Validar botón Retry/Reintentar.
- Validar modal de bienvenida tras lectura QR si se dispone de QR de prueba.
