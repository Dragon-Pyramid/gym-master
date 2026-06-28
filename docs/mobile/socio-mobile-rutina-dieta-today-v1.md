# socio-mobile-rutina-dieta-today-v1

## Resumen

Se agrega una tarjeta mobile para el socio en el dashboard principal con una vista rápida de su plan del día: rutina vigente, dieta asignada y accesos directos al asistente/coach IA.

## Alcance

- Se reutilizan endpoints existentes de rutinas y dietas.
- No se modifican tablas ni políticas RLS.
- No se modifica backend ni autenticación.
- La experiencia queda limitada al home mobile del socio, porque el componente se monta dentro de la sección `md:hidden` ya existente.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `src/components/dashboard/socio/SocioMobileTodayPlan.tsx`
- `docs/mobile/socio-mobile-rutina-dieta-today-v1.md`

## Detalle funcional

- Consulta historial de rutinas con `getHistorialRutinas()`.
- Consulta dietas del socio con `getDietasPorSocio(socioId)`.
- Selecciona la última rutina registrada.
- Intenta detectar el día actual dentro de la rutina, soportando formatos con `dias`, `semana` o claves directas por día.
- Selecciona dieta activa según `fecha_inicio` y `fecha_fin`; si no hay una activa, muestra la última registrada.
- Incluye estados de carga, error y vacío.
- Agrega CTAs para:
  - Ver rutina.
  - Ver dieta.
  - Ir al asistente de rutinas.
  - Ir al Coach IA.

## QA sugerido

1. Entrar como socio desde Android.
2. Ir a `/dashboard`.
3. Confirmar que aparece la tarjeta `Tu plan de acción`.
4. Validar que muestra rutina si el socio tiene rutinas.
5. Validar que muestra dieta activa o última dieta registrada.
6. Probar navegación a `/dashboard/rutinas`, `/dashboard/dietas`, `/dashboard/rutinas/asistente` y `/dashboard/coach`.
7. Confirmar que admin y usuario interno no ven la tarjeta en desktop ni fuera del home mobile de socio.

## Riesgo

Bajo. El cambio es frontend y reutiliza servicios existentes. Si algún endpoint remoto no devuelve información, la tarjeta muestra estado vacío sin bloquear el dashboard.
