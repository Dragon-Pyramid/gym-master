# Admin Dashboard Final Polish v1

## Rama

`feature/admin-dashboard-final-polish-v1`

## Objetivo

Pulir el dashboard principal del administrador como centro operativo diario del gimnasio, reforzando lectura ejecutiva, accesos rápidos, responsive mobile/desktop y estabilidad visual del layout.

## Cambios principales

- Se ajustó el shell del dashboard a una estructura `Header / Contenido / Footer` con altura controlada por viewport.
- El contenido central queda como área scrollable interna para evitar espacio blanco después del footer al salir de F12 mobile.
- Se agregó un bloque de salud operativa con señales clave:
  - estado operativo general;
  - puntualidad de pagos;
  - ingresos del período;
  - riesgo técnico por equipos fuera de servicio.
- Se agregó un bloque de accesos rápidos para operación diaria:
  - Socios;
  - Pagos;
  - Mensajes;
  - Equipamiento;
  - Comercial;
  - Parametrización.
- Se reforzaron estados vacíos en gráficos para evitar cards vacías cuando no hay datos suficientes.
- Se preservan los avisos Dragon Pyramid y la parametrización del gimnasio.
- Se preservan las métricas, gráficos y accesos ya existentes.

## Alcance técnico

Archivo modificado:

- `src/app/dashboard/page.tsx`

No se modifican endpoints.
No se modifica Swagger.
No se modifica base de datos.
No se agregan migraciones.
No se suben SQL ni artefactos sensibles.

## QA sugerido

1. Entrar como admin a `/dashboard`.
2. Confirmar hero ejecutivo y acciones rápidas.
3. Confirmar bloque de salud operativa.
4. Confirmar acceso a Socios, Pagos, Mensajes, Equipamiento, Comercial y Parametrización.
5. Confirmar cards existentes y gráficos.
6. Confirmar estados vacíos si no hay datos en algún gráfico.
7. Probar modo claro/oscuro.
8. Probar F12 mobile y desktop.
9. Confirmar que no hay scroll horizontal.
10. Confirmar que no queda espacio blanco después del footer.
11. Confirmar que socio/usuario siguen viendo su dashboard sin cambios operativos.
12. Ejecutar `npm run build`.
