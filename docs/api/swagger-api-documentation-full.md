# Swagger / OpenAPI - documentación completa de endpoints

## Objetivo

Documentar en Swagger/OpenAPI todos los endpoints detectados en `src/app/api/**/route.ts` del repo enviado para la rama `feature/swagger-api-documentation`.

## Alcance generado

- Rutas API detectadas: **80**.
- Operaciones HTTP documentadas: **130** incluyendo `/api/swagger-json`.
- Se crea `/api/swagger-json` como fuente OpenAPI.
- Se actualiza `/swagger` para consumir esa especificación.

## Nota importante sobre parametrización

El ZIP recibido para esta rama contiene `GET /api/parametrizacion/catalogos`. Si la rama de CRUD de catálogos ya fue mergeada en otro estado local con `POST`/`PATCH`, conviene regenerar este inventario o extender la especificación para reflejar esos métodos exactos.

## Inventario de endpoints

| Método(s) | Endpoint | Tag | Archivo fuente |
|---|---|---|---|
| GET | `/api/actividades/{id}` | Catálogos y operación | `src/app/api/actividades/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/actividades` | Catálogos y operación | `src/app/api/actividades/route.ts` |
| GET | `/api/admin/cuotas/dashboard-bi` | Administración y BI | `src/app/api/admin/cuotas/dashboard-bi/route.ts` |
| GET | `/api/admin/cuotas/estado-socios` | Administración y BI | `src/app/api/admin/cuotas/estado-socios/route.ts` |
| GET | `/api/admin/cuotas/resumen` | Administración y BI | `src/app/api/admin/cuotas/resumen/route.ts` |
| GET | `/api/admin/metricas/asistencia/{tipo}` | Administración y BI | `src/app/api/admin/metricas/asistencia/[tipo]/route.ts` |
| GET | `/api/admin/metricas/asistencia/prediccion-abandono` | Administración y BI | `src/app/api/admin/metricas/asistencia/prediccion-abandono/route.ts` |
| GET | `/api/admin/metricas/asistencia/top-inactivos` | Administración y BI | `src/app/api/admin/metricas/asistencia/top-inactivos/route.ts` |
| GET | `/api/admin/metricas/equipamiento/costo-beneficio` | Administración y BI | `src/app/api/admin/metricas/equipamiento/costo-beneficio/route.ts` |
| GET | `/api/admin/metricas/equipamiento/estado-actual` | Administración y BI | `src/app/api/admin/metricas/equipamiento/estado-actual/route.ts` |
| GET | `/api/admin/metricas/equipamiento/prediccion-fallo` | Administración y BI | `src/app/api/admin/metricas/equipamiento/prediccion-fallo/route.ts` |
| GET | `/api/admin/metricas/equipamiento/top-fallos` | Administración y BI | `src/app/api/admin/metricas/equipamiento/top-fallos/route.ts` |
| GET | `/api/admin/metricas/pagos/histograma` | Administración y BI | `src/app/api/admin/metricas/pagos/histograma/route.ts` |
| GET | `/api/admin/metricas/pagos/proyeccion-ingresos` | Administración y BI | `src/app/api/admin/metricas/pagos/proyeccion-ingresos/route.ts` |
| GET | `/api/admin/metricas/pagos/segmentacion` | Administración y BI | `src/app/api/admin/metricas/pagos/segmentacion/route.ts` |
| GET | `/api/admin/metricas/retencion_por_combinacion` | Administración y BI | `src/app/api/admin/metricas/retencion_por_combinacion/route.ts` |
| GET | `/api/admin/metricas/rutinas/adherencia` | Administración y BI | `src/app/api/admin/metricas/rutinas/adherencia/route.ts` |
| GET | `/api/admin/metricas/rutinas/evolucion-promedio` | Administración y BI | `src/app/api/admin/metricas/rutinas/evolucion-promedio/route.ts` |
| POST | `/api/admin/metricas/rutinas/generar-rutina` | Administración y BI | `src/app/api/admin/metricas/rutinas/generar-rutina/route.ts` |
| POST | `/api/admin/metricas/rutinas/generar-rutina-personalizada` | Administración y BI | `src/app/api/admin/metricas/rutinas/generar-rutina-personalizada/route.ts` |
| GET | `/api/asistencias/qr-dia` | Asistencias | `src/app/api/asistencias/qr-dia/route.ts` |
| POST | `/api/asistencias/ranking-mensual` | Asistencias | `src/app/api/asistencias/ranking-mensual/route.ts` |
| GET | `/api/asistencias/recientes` | Asistencias | `src/app/api/asistencias/recientes/route.ts` |
| GET, POST | `/api/asistencias/registro-qr` | Asistencias | `src/app/api/asistencias/registro-qr/route.ts` |
| GET, POST, PUT, DELETE | `/api/asistencias` | Asistencias | `src/app/api/asistencias/route.ts` |
| GET, POST | `/api/auth/{nextauth}` | Autenticación | `src/app/api/auth/[...nextauth]/route.ts` |
| GET, PUT, DELETE | `/api/avisos/{id}` | Catálogos y operación | `src/app/api/avisos/[id]/route.ts` |
| GET, POST | `/api/avisos` | Catálogos y operación | `src/app/api/avisos/route.ts` |
| GET | `/api/cuota/{id}` | Cuotas y pagos | `src/app/api/cuota/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/cuota` | Cuotas y pagos | `src/app/api/cuota/route.ts` |
| GET | `/api/cuota-estado` | Cuotas y pagos | `src/app/api/cuota-estado/route.ts` |
| POST | `/api/custom-login` | Autenticación | `src/app/api/custom-login/route.ts` |
| POST | `/api/dieta/generar` | Dietas | `src/app/api/dieta/generar/route.ts` |
| GET | `/api/dieta/socio/{id}` | Dietas | `src/app/api/dieta/socio/[id]/route.ts` |
| GET | `/api/dieta/todas` | Dietas | `src/app/api/dieta/todas/route.ts` |
| GET | `/api/entrenadores/{id}/horarios` | Empleados y entrenadores | `src/app/api/entrenadores/[id]/horarios/route.ts` |
| GET, PUT | `/api/entrenadores/{id}` | Empleados y entrenadores | `src/app/api/entrenadores/[id]/route.ts` |
| GET, POST | `/api/entrenadores` | Empleados y entrenadores | `src/app/api/entrenadores/route.ts` |
| PUT, DELETE | `/api/equipamientos/{id}` | Equipamiento | `src/app/api/equipamientos/[id]/route.ts` |
| GET, POST | `/api/equipamientos` | Equipamiento | `src/app/api/equipamientos/route.ts` |
| GET | `/api/evolucion_socio/{socio_id}` | Evolución física | `src/app/api/evolucion_socio/[socio_id]/route.ts` |
| POST | `/api/evolucion_socio/registro` | Evolución física | `src/app/api/evolucion_socio/registro/route.ts` |
| POST | `/api/file-upload` | Archivos | `src/app/api/file-upload/route.ts` |
| GET | `/api/image-proxy` | Archivos | `src/app/api/image-proxy/route.ts` |
| GET | `/api/mantenimientos/{id}` | Mantenimiento | `src/app/api/mantenimientos/[id]/route.ts` |
| PUT | `/api/mantenimientos/completado/{id}` | Mantenimiento | `src/app/api/mantenimientos/completado/[id]/route.ts` |
| GET, POST, PUT | `/api/mantenimientos` | Mantenimiento | `src/app/api/mantenimientos/route.ts` |
| GET | `/api/mi-cuenta/pagos` | Socios | `src/app/api/mi-cuenta/pagos/route.ts` |
| GET | `/api/niveles` | Catálogos y operación | `src/app/api/niveles/route.ts` |
| GET | `/api/objetivos` | Catálogos y operación | `src/app/api/objetivos/route.ts` |
| GET, POST, PUT, DELETE | `/api/otros_gastos` | Catálogos y operación | `src/app/api/otros_gastos/route.ts` |
| POST | `/api/pagar-cuota` | Cuotas y pagos | `src/app/api/pagar-cuota/route.ts` |
| GET | `/api/pagos/{id}` | Cuotas y pagos | `src/app/api/pagos/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/pagos` | Cuotas y pagos | `src/app/api/pagos/route.ts` |
| GET | `/api/parametrizacion/catalogos` | Parametrización | `src/app/api/parametrizacion/catalogos/route.ts` |
| GET | `/api/productos/{id}` | Comercial | `src/app/api/productos/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/productos` | Comercial | `src/app/api/productos/route.ts` |
| GET | `/api/proveedores/{id}` | Comercial | `src/app/api/proveedores/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/proveedores` | Comercial | `src/app/api/proveedores/route.ts` |
| GET, DELETE | `/api/rutina/{idSocio}` | Rutinas | `src/app/api/rutina/[idSocio]/route.ts` |
| GET, DELETE | `/api/rutina/delete/{id}` | Rutinas | `src/app/api/rutina/delete/[id]/route.ts` |
| POST | `/api/rutina/generar` | Rutinas | `src/app/api/rutina/generar/route.ts` |
| GET | `/api/rutina/historial/{id_socio}` | Rutinas | `src/app/api/rutina/historial/[id_socio]/route.ts` |
| GET | `/api/rutina/historial` | Rutinas | `src/app/api/rutina/historial/route.ts` |
| GET | `/api/servicios/{id}` | Comercial | `src/app/api/servicios/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/servicios` | Comercial | `src/app/api/servicios/route.ts` |
| GET | `/api/socios/{id}/ficha-medica/{id_ficha}` | Ficha médica | `src/app/api/socios/[id]/ficha-medica/[id_ficha]/route.ts` |
| GET | `/api/socios/{id}/ficha-medica/actual` | Ficha médica | `src/app/api/socios/[id]/ficha-medica/actual/route.ts` |
| GET | `/api/socios/{id}/ficha-medica/historial` | Ficha médica | `src/app/api/socios/[id]/ficha-medica/historial/route.ts` |
| POST | `/api/socios/{id}/ficha-medica` | Ficha médica | `src/app/api/socios/[id]/ficha-medica/route.ts` |
| GET | `/api/socios/{id}` | Socios | `src/app/api/socios/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/socios` | Socios | `src/app/api/socios/route.ts` |
| POST | `/api/stripe-webhook` | Cuotas y pagos | `src/app/api/stripe-webhook/route.ts` |
| POST | `/api/test-alertas` | Alertas | `src/app/api/test-alertas/route.ts` |
| GET | `/api/usuarios/{id}/perfil` | Usuarios | `src/app/api/usuarios/[id]/perfil/route.ts` |
| GET | `/api/usuarios/{id}` | Usuarios | `src/app/api/usuarios/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/usuarios` | Usuarios | `src/app/api/usuarios/route.ts` |
| GET | `/api/ventas/{id}` | Comercial | `src/app/api/ventas/[id]/route.ts` |
| GET, POST, PUT, DELETE | `/api/ventas` | Comercial | `src/app/api/ventas/route.ts` |
| GET, POST, PUT, DELETE | `/api/ventas_detalles` | Comercial | `src/app/api/ventas_detalles/route.ts` |
| GET | `/api/swagger-json` | General | `src/app/api/swagger-json/route.ts` |

## Criterio futuro

Cada feature que agregue o modifique APIs debe actualizar `src/lib/swagger/openApiSpec.ts` con:

- `summary` claro;
- `description` funcional;
- `operationId`;
- parámetros de ruta/query;
- request body con ejemplos;
- respuestas HTTP y errores esperados;
- schemas reutilizables cuando aplique.
