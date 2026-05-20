# Mapa API / RPC / Frontend — Gym Master

**Fecha:** 19 de mayo de 2026  
**Bloque:** Auditoría de integración entre API Routes, servicios, procedimientos almacenados y frontend  
**Estado base:** Gym Master single-tenant por instancia/deploy. `dbName` eliminado. Login y generación de rutina validados.

---

## 1. Objetivo del documento

Este documento mapea el estado real de integración entre:

1. Procedimientos almacenados / funciones PostgreSQL-Supabase.
2. Servicios TypeScript que consumen esos procedimientos o tablas.
3. API Routes de Next.js.
4. Funciones cliente en `src/services/apiClient.ts`.
5. Pantallas/componentes frontend que consumen y visualizan la información.

El objetivo es identificar qué parte de Data Science/Business Intelligence ya está implementada, qué está parcialmente conectada y qué todavía no tiene visualización final.

---

## 2. Hallazgo ejecutivo

Gym Master ya tiene una base importante de inteligencia de negocio implementada. No todo está pendiente desde cero.

El sistema tiene:

- RPC/funciones SQL para asistencia, rutinas, pagos y equipamiento.
- API Routes protegidas por token y rol admin para varias métricas.
- Funciones cliente en `apiClient.ts` para consumir endpoints de métricas.
- Algunas gráficas ya renderizadas en el dashboard admin.

Pero todavía hay brechas importantes:

- Algunos endpoints existen pero devuelven `501 Endpoint no implementado`.
- Algunas funciones cliente existen pero no se usan en pantalla.
- Algunas métricas se consultan y se guardan en estado React, pero no se renderizan.
- Algunos endpoints consumen la misma RPC para gráficos conceptualmente distintos.
- Hay referencias frontend a rutas API inexistentes o antiguas.
- Falta una sección BI ordenada, con cards, filtros, empty states, loading states y agrupación por dominio.

---

## 3. Estado por dominio

### 3.1 Asistencia

| RPC / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| `sp_concurrencia_semanal` | `dataConcurrenciaSemanal` | `GET /api/admin/metricas/asistencia/semanal` vía `[tipo]` | `getConcurrenciaAsistencia('semanal')` | Se carga en `dashboard/page.tsx`, pero no se grafica | 🟡 Parcial |
| `sp_concurrencia_mensual` | `dataConcurrenciaMensual` | `GET /api/admin/metricas/asistencia/mensual` vía `[tipo]` | `getConcurrenciaAsistencia('mensual')` | No detectado en pantalla | 🟡 API lista / visual pendiente |
| `sp_concurrencia_anual` | `dataConcurrenciaAnual` | `GET /api/admin/metricas/asistencia/anual` vía `[tipo]` | `getConcurrenciaAsistencia('anual')` | No detectado en pantalla | 🟡 API lista / visual pendiente |
| `sp_resumen_asistencias_por_periodo` | No conectado | No conectado | No conectado | No visualizado | 🟡 RPC disponible / integración pendiente |
| `sp_prediccion_abandono` | `dataPrediccionAbandono` existe | `GET /api/admin/metricas/asistencia/prediccion-abandono` | `getPrediccionAbandonoAsistencia` | No visualizado | 🔴 Ruta devuelve 501; RPC no aparece en backup analizado |
| `sp_top_inactivos` | `dataTopInactivos` existe | `GET /api/admin/metricas/asistencia/top-inactivos` | `getTopInactivosAsistencia` | No visualizado | 🔴 Ruta devuelve 501; RPC no aparece en backup analizado |
| Consulta manual sobre `asistencia` | `rankingMensualAsistencia` | `POST /api/asistencias/ranking-mensual` | No consolidado | Hay componente con ruta antigua | 🔴 Requiere alineación de endpoint |

Notas:

- La API dinámica `GET /api/admin/metricas/asistencia/[tipo]` sí está implementada para `semanal`, `mensual` y `anual`.
- El dashboard admin actualmente llama `getConcurrenciaAsistencia('semanal')`, pero el estado `concurrenciaSemanal` no aparece renderizado en JSX.
- El componente `RankingAsistenciaTable.tsx` apunta a `/api/ranking-asistencia?mes=...&anio=...`, pero la ruta existente es `/api/asistencias/ranking-mensual` y usa POST. Esto debe corregirse antes de considerar terminado el ranking.

---

### 3.2 Rutinas

| RPC / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| `generar_rutina_socio` | `dataGeneracionRutina` | `POST /api/rutina/generar` | `generarNuevaRutina` | Se usa en flujo de socio/rutinas | ✅ Funcional validado |
| `generar_rutina_socio` | `dataGeneracionRutina` | `POST /api/admin/metricas/rutinas/generar-rutina` | `generarRutina` | Uso admin/BI no consolidado | 🟡 Funcional, revisar ubicación |
| `sp_generar_rutina_personalizada` | `dataGeneracionRutinaPersonalizada` | `POST /api/admin/metricas/rutinas/generar-rutina-personalizada` | `generarRutinaPersonalizada` | No detectado | 🔴 La ruta devuelve string fijo, no devuelve datos reales |
| `sp_adherencia_mensual_rutinas` | `dataAdherenciaMensualRutinas` | `GET /api/admin/metricas/rutinas/adherencia` | `getAdherenciaRutinas` | Se carga en dashboard, pero no se grafica | 🟡 API lista / visual pendiente |
| `sp_evolucion_promedio_por_objetivo` | `dataEvolucionPromedioPorObjetivo` | `GET /api/admin/metricas/rutinas/evolucion-promedio` | `getEvolucionPromedioRutinas` | Se carga en dashboard, pero no se grafica | 🟡 API lista / visual pendiente |
| `calcular_retencion_por_combinacion` | `dataRetencionPorCombinacion` | `GET /api/admin/metricas/retencion_por_combinacion` | No detectado en `apiClient.ts` | No visualizado | 🟡 API lista / cliente y visual pendiente |
| Tabla `rutina` | `historialRutinaSocioLogueado` | `GET /api/rutina/historial` | `getHistorialRutinas` | Rutinas socio | ✅ Base funcional |
| Tabla `rutina` | `historialRutinaSocio` | `GET /api/rutina/[idSocio]` / `historial/[id_socio]` | `getRutinasPorSocio` | Gestor rutinas/admin | 🟡 Revisar duplicidad de rutas |

Notas:

- El flujo crítico de generación de rutinas está operativo y fue validado luego del checkpoint single-tenant.
- Hay dos rutas conceptualmente parecidas para generar rutina: una bajo `/api/rutina/generar` y otra bajo `/api/admin/metricas/rutinas/generar-rutina`. Conviene dejar `/api/rutina/generar` para negocio y reservar `/api/admin/metricas/*` solo para métricas.
- Las métricas de adherencia/evolución ya están conectadas a API y cliente, pero no tienen visual final en dashboard.

---

### 3.3 Pagos / ingresos

| RPC / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| `sp_analisis_conducta_pagos` | `dataAnalisisConductaPagos` | `GET /api/admin/metricas/pagos/histograma` | `getHistogramaPagos` | Gráfico de barras en dashboard | ✅ Parcialmente visualizado |
| `sp_analisis_conducta_pagos` | `dataAnalisisConductaPagos` | `GET /api/admin/metricas/pagos/segmentacion` | `getSegmentacionPagos` | Pie chart en dashboard | ✅ Parcialmente visualizado |
| Proyección de ingresos | `dataProyeccionIngresos` TODO | `GET /api/admin/metricas/pagos/proyeccion-ingresos` | `getProyeccionIngresos` | No visualizado | 🔴 Endpoint devuelve 501; falta RPC o lógica |
| Pago manual | `createPago` | `POST /api/pagos` | Formularios/módulo pagos | ABM operativo a revisar | 🟡 Funcionalidad operativa, no BI |
| Stripe checkout | `pagarCuotaConStripe` / `stripeService` | `POST /api/pagar-cuota`, `POST /api/stripe-webhook` | `pagarCuotaConStripe` | Flujo pago socio | 🟡 Requiere validación integral |

Notas:

- Histograma y segmentación usan la misma RPC `sp_analisis_conducta_pagos`. Esto no está mal si el frontend toma campos distintos, pero conviene documentar que es una única fuente.
- La proyección de ingresos está declarada como intención, pero no implementada.
- Si la proyección existe como SQL en otro script no incluido en el dump actual, debe consolidarse en `database/migrations` o `database/scripts`.

---

### 3.4 Equipamiento y mantenimiento

| RPC / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| `sp_estado_equipamiento_semaforo` | `dataEstadoEquipamientoSemaforo` | `GET /api/admin/metricas/equipamiento/estado-actual` | `getEstadoActualEquipamiento` | Pie chart en dashboard | ✅ Visualizado, pero mejorable |
| `sp_ranking_fallos_equipamiento` | `dataRankingFallosEquipamiento` | `GET /api/admin/metricas/equipamiento/top-fallos` | `getTopFallosEquipamiento` | Bar chart en dashboard | ✅ Visualizado |
| `sp_analisis_costo_beneficio` | `dataAnalisisCostoBeneficio` | `GET /api/admin/metricas/equipamiento/costo-beneficio` | `getCostoBeneficioEquipamiento` | No detectado en dashboard | 🟡 API lista / visual pendiente |
| Predicción de fallos | `dataPrediccionFallo` TODO | `GET /api/admin/metricas/equipamiento/prediccion-fallo` | `getPrediccionFalloEquipamiento` | No visualizado | 🔴 Endpoint devuelve 501; falta modelo/RPC |
| Tablas `equipamiento` / `mantenimiento` | Servicios ABM | `/api/equipamientos`, `/api/mantenimientos` | Páginas y tablas del módulo | ABM a validar | 🟡 Funcionalidad operativa, revisar UX y datos |

Notas:

- Equipamiento es uno de los dominios más avanzados para BI: tiene RPC, endpoints y algunas visualizaciones.
- La visualización de `estado-actual` actualmente usa costo últimos 3 meses como pie por equipo. Para semáforo operativo quizás convenga una card/lista por estado: verde, amarillo, rojo.
- Falta incorporar costo-beneficio y predicción de fallo como paneles claros.

---

### 3.5 Dietas y evolución

| RPC / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| `genera_dieta_socio` | `createDietaSocio` | `POST /api/dieta/generar` | `crearDieta` | Gestión dieta | 🟡 Conectado, validar respuesta |
| Tabla `dieta` | `getAllDietasSocio` | `GET /api/dieta/socio/[id]` | `getDietasPorSocio` | Historial dietas | 🟡 Parcial |
| Tabla `dieta` | `getAllDietas` | `GET /api/dieta/todas` | `getDietas` | Gestión global | 🟡 Parcial |
| Tabla `evolucion_socio` | `registrarEvolucionSocio` | `POST /api/evolucion_socio/registro` | `registrarEvolucionSocio` | Evolución física | 🟡 Parcial |
| Tabla `evolucion_socio` | `getEvolucionesSocio` | `GET /api/evolucion_socio/[socio_id]` | `getEvolucionesSocio` | Evolución física | 🟡 Parcial |

Brechas detectadas:

- `apiClient.ts` referencia rutas como `/api/dieta/${id}`, `/api/dieta/generar-personalizada` y `/api/dieta/socio/${socioId}/dietas/${dietaId}`, pero en el árbol de API Routes analizado no aparecen esas rutas.
- El procedimiento `genera_dieta_socio` retorna `void`, por lo que el servicio hace una segunda consulta para traer la última dieta. Esto es válido, pero conviene documentarlo y testearlo bien.
- Falta BI nutricional/evolución: adherencia por objetivo, variación de peso, IMC, medidas corporales y correlación con asistencia.

---

### 3.6 Ficha médica

| RPC / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| `insert_ficha_medica` | `fichaMedicaService` | `POST /api/socios/[id]/ficha-medica` | `crearFichaMedica` | Tabs ficha médica | 🟡 Parcial, requiere QA |
| `get_ficha_medica_actual` | `fichaMedicaService` | `GET /api/socios/[id]/ficha-medica/actual` | `getFichaMedicaActual` | Tab actual | 🟡 Parcial |
| `list_fichas_medicas` | `fichaMedicaService` | `GET /api/socios/[id]/ficha-medica/historial` | `getFichaMedicaHistorial` | Tab historial | 🟡 Parcial |
| Tabla `ficha_medica` | `getFichaMedicaById` | `GET /api/socios/[id]/ficha-medica/[id_ficha]` | No consolidado | Detalle puntual | 🟡 API disponible / UX pendiente |

Notas:

- El módulo tiene buena arquitectura base: RPC para inserción, actual e historial.
- Requiere validación de permisos por rol y control de archivos Cloudinary.
- Podría alimentar BI futuro de salud: IMC, revisión vencida, prevalencia de condiciones y correlación con asistencia/rutina.

---

### 3.7 Perfil / foto / Cloudinary

| Función / lógica | Servicio | API Route | Cliente frontend | Visualización | Estado |
|---|---|---|---|---|---|
| Upload Cloudinary | `fileUploadService` / `lib/cloudinary` | `POST /api/file-upload` | `uploadFile` | Perfil y ficha médica | 🟡 Parcial |
| Perfil usuario | Servicios usuario/socio | `GET /api/usuarios/[id]/perfil` | Perfil | Header/card | 🟡 Parcial |
| `log_profile_photo_updated` | DB trigger/function | No mapeado en frontend BI | No detectado | Métrica adopción | 🟡 Disponible / visual pendiente |
| `tiene_foto` | DB helper | No mapeado | No detectado | Métrica adopción | 🟡 Disponible / visual pendiente |

---

## 4. Rutas frontend a revisar por posible desalineación

| Archivo / función | Ruta llamada | Estado observado | Acción sugerida |
|---|---|---|---|
| `DashboardInitialContent.tsx` | `/api/cuota-estado` | No existe API Route detectada | Crear ruta o corregir consumo |
| `RankingAsistenciaTable.tsx` | `/api/ranking-asistencia?mes=&anio=` | No existe API Route detectada | Cambiar a `/api/asistencias/ranking-mensual` o crear alias |
| `apiClient.getDieta` | `/api/dieta/${id}` | No existe `src/app/api/dieta/[id]/route.ts` | Crear ruta o eliminar función |
| `apiClient.actualizarDieta` | `/api/dieta/${id}` PUT | No existe ruta | Crear ruta o eliminar flujo |
| `apiClient.eliminarDieta` | `/api/dieta/${id}` DELETE | No existe ruta | Crear ruta o eliminar flujo |
| `apiClient.eliminarDietaDeSocio` | `/api/dieta/socio/${socioId}/dietas/${dietaId}` | No existe ruta | Crear ruta o ajustar modelo |
| `apiClient.generarDietaPersonalizada` | `/api/dieta/generar-personalizada` | No existe ruta | Crear ruta o sacar del cliente |
| `getPrediccionAbandonoAsistencia` | `/api/admin/metricas/asistencia/prediccion-abandono` | Ruta existe pero devuelve 501 | Implementar o ocultar UI |
| `getTopInactivosAsistencia` | `/api/admin/metricas/asistencia/top-inactivos` | Ruta existe pero devuelve 501 | Implementar o ocultar UI |
| `getPrediccionFalloEquipamiento` | `/api/admin/metricas/equipamiento/prediccion-fallo` | Ruta existe pero devuelve 501 | Implementar o ocultar UI |
| `getProyeccionIngresos` | `/api/admin/metricas/pagos/proyeccion-ingresos` | Ruta existe pero devuelve 501 | Implementar o ocultar UI |

---

## 5. Recomendación de arquitectura para BI visual

Se recomienda crear una sección explícita:

```txt
src/app/dashboard/business-intelligence/page.tsx
src/components/business-intelligence/
  BusinessIntelligenceDashboard.tsx
  MetricCard.tsx
  ChartCard.tsx
  EmptyState.tsx
  ErrorState.tsx
  charts/
    AsistenciaConcurrenciaChart.tsx
    RutinasAdherenciaChart.tsx
    RutinasEvolucionObjetivoChart.tsx
    PagosConductaChart.tsx
    EquipamientoSemaforoPanel.tsx
    EquipamientoTopFallosChart.tsx
```

Ventajas:

- Evita sobrecargar `src/app/dashboard/page.tsx`.
- Permite agrupar métricas por dominio.
- Facilita loading/error/empty states.
- Permite ir activando métricas gradualmente.
- Separa BI de ABM operativo.

---

## 6. Próximo bloque técnico recomendado

Antes de crear nuevas gráficas, conviene hacer una corrección mínima de integración:

1. Corregir rutas frontend desalineadas.
2. Marcar endpoints `501` como no disponibles en UI.
3. Crear una capa de tipos para respuestas BI.
4. Crear componentes BI reutilizables.
5. Mover las gráficas BI fuera del dashboard principal o encapsularlas mejor.
6. Agregar un documento `docs/business-intelligence/bi-roadmap.md`.

---

## 7. Estado resumido

| Dominio | DB/RPC | API | Frontend cliente | Visual | Estado general |
|---|---:|---:|---:|---:|---|
| Rutinas | Alta | Alta | Media | Baja/media | 🟡 Funcional + BI pendiente |
| Asistencia | Media/alta | Media | Media | Baja | 🟡 Mucho disponible, poca visualización |
| Pagos | Media | Media | Media | Media | 🟡 Visual parcial |
| Equipamiento | Alta | Alta | Media | Media | 🟡 Buen candidato para cierre visual |
| Dietas | Media | Media | Media | Baja | 🟡 Integración parcial |
| Evolución física | Media | Media | Media | Baja | 🟡 Visual pendiente |
| Ficha médica | Alta | Alta | Media | Media | 🟡 QA y permisos pendientes |
| Perfil/foto | Media | Media | Media | Media | 🟡 Falta métricas adopción |

