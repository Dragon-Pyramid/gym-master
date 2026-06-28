# Socio mobile evolución progress insights v1

## Objetivo

Agregar una tarjeta mobile de progreso físico en el home del socio para que el usuario vea rápidamente su evolución corporal sin tener que entrar primero al módulo completo.

## Alcance

- Se agrega una tarjeta compacta visible dentro del dashboard mobile del socio.
- Se reutiliza el endpoint existente `/api/evolucion_socio/me` mediante `getEvolucionesFisicas("me")`.
- Se compara el primer registro o registro marcado como inicial contra la última medición.
- Se muestran métricas clave: peso, cintura, porcentaje de grasa y masa muscular.
- Se agregan indicadores visuales de cambio y CTA hacia `/dashboard/evolucion-fisica`.
- Se ajusta levemente el padding mobile de la página de evolución física.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`
- `src/app/dashboard/evolucion-fisica/page.tsx`

## Archivos agregados

- `src/components/dashboard/evolucion-fisica/SocioEvolucionProgressInsights.tsx`
- `docs/mobile/socio-mobile-evolucion-progress-insights-v1.md`

## Notas técnicas

- No agrega migraciones.
- No modifica base de datos.
- No toca autenticación.
- No crea endpoints nuevos.
- La tarjeta tiene estados de carga, error, sin mediciones, una medición y comparación completa.
- La comparación queda preparada para los datos históricos cargados manualmente para pruebas mobile.

## QA sugerido

Validar con socio mobile que tenga dos mediciones históricas:

- Ingresar a `/dashboard` desde Android.
- Confirmar que aparece la tarjeta “Progreso físico”.
- Confirmar que muestra peso, cintura, grasa y músculo.
- Confirmar que los deltas se interpretan correctamente.
- Tocar “Ver detalle” y validar navegación a `/dashboard/evolucion-fisica`.
- Validar que admin y usuario interno no vean esta tarjeta en el home.
