# Análisis de brecha Business Intelligence — Gym Master

**Fecha:** 19 de mayo de 2026  
**Contexto:** Existen procedimientos almacenados y APIs de Data Science/BI, pero no toda la información está representada visualmente en el frontend.

---

## 1. Resumen ejecutivo

Gym Master no necesita empezar desde cero en Data Science. La base ya tiene funciones SQL y el código ya expone varias API Routes para métricas. El problema principal es de integración visual, orden de arquitectura frontend y cierre de endpoints incompletos.

La oportunidad inmediata es transformar lo ya existente en un módulo de **Inteligencia de Negocio** usable para el administrador.

---

## 2. Qué ya existe

### Base de datos / RPC

Existen funciones para:

- Concurrencia semanal, mensual y anual.
- Adherencia mensual a rutinas.
- Evolución promedio por objetivo.
- Retención por combinación objetivo/nivel/días.
- Conducta de pagos.
- Estado semáforo de equipamiento.
- Ranking de fallos de equipamiento.
- Costo-beneficio de mantenimiento.
- Generación de rutina.
- Generación de dieta.
- Ficha médica actual/historial/inserción.

### Backend / API Routes

Existen endpoints para:

- `/api/admin/metricas/asistencia/[tipo]`
- `/api/admin/metricas/rutinas/adherencia`
- `/api/admin/metricas/rutinas/evolucion-promedio`
- `/api/admin/metricas/retencion_por_combinacion`
- `/api/admin/metricas/pagos/histograma`
- `/api/admin/metricas/pagos/segmentacion`
- `/api/admin/metricas/equipamiento/estado-actual`
- `/api/admin/metricas/equipamiento/top-fallos`
- `/api/admin/metricas/equipamiento/costo-beneficio`

### Frontend

El dashboard admin ya consume algunas métricas:

- Rutinas: adherencia y evolución promedio se consultan pero no se renderizan.
- Asistencia: concurrencia semanal se consulta pero no se renderiza.
- Equipamiento: estado actual y top fallos se visualizan.
- Pagos: segmentación e histograma se visualizan.

---

## 3. Brechas principales

### Brecha 1 — Métricas cargadas pero no renderizadas

En `src/app/dashboard/page.tsx` se cargan estados para:

- `adherenciaRutinas`
- `evolucionRutinas`
- `concurrenciaSemanal`

Pero no aparecen usados en el JSX final. Esto significa que la API puede estar funcionando y aun así el usuario administrador no ve el valor generado.

**Prioridad:** Alta.

---

### Brecha 2 — Endpoints declarados pero no implementados

Endpoints que devuelven o deberían devolver `501`:

- `/api/admin/metricas/asistencia/prediccion-abandono`
- `/api/admin/metricas/asistencia/top-inactivos`
- `/api/admin/metricas/pagos/proyeccion-ingresos`
- `/api/admin/metricas/equipamiento/prediccion-fallo`

**Prioridad:** Media. No deben mostrarse en UI hasta implementarse.

---

### Brecha 3 — Rutas cliente desalineadas

Existen funciones frontend que llaman rutas no detectadas en `src/app/api`, especialmente en dieta y ranking de asistencia.

Riesgo:

- Botones o pantallas que fallan en runtime.
- Falsa sensación de funcionalidad completa.
- Dificultad para testing E2E.

**Prioridad:** Alta.

---

### Brecha 4 — Dashboard principal sobrecargado

`src/app/dashboard/page.tsx` mezcla:

- Layout general.
- QR del día.
- Bienvenida post-escaneo.
- Métricas de equipamiento.
- Métricas de pagos.
- Fetch de métricas no renderizadas.
- Lógica de estados.

Esto dificulta mantener el dashboard y escalar BI.

**Prioridad:** Media/alta.

---

### Brecha 5 — Falta contrato de datos para BI

Las respuestas de RPC llegan directamente al frontend. Conviene documentar y tipar:

- Shape de cada endpoint.
- Campos obligatorios.
- Campos opcionales.
- Unidades y significado de cada métrica.
- Estados vacíos.
- Errores esperados.

**Prioridad:** Alta antes de implementar muchas gráficas nuevas.

---

## 4. Roadmap visual sugerido

### Iteración BI 1 — Cierre visual de lo ya existente

Objetivo: mostrar todo lo que ya se consulta.

Incluir:

- Card/gráfico de concurrencia semanal.
- Gráfico de adherencia mensual a rutinas.
- Gráfico de evolución promedio por objetivo.
- Mejor visual para estado semáforo de equipamiento.
- Mantener top fallos, segmentación e histograma.

No requiere crear nuevos RPC.

---

### Iteración BI 2 — Ordenar arquitectura frontend

Objetivo: sacar BI del dashboard general.

Crear:

```txt
src/app/dashboard/business-intelligence/page.tsx
src/components/business-intelligence/
```

Y dejar el dashboard principal con cards resumidas y enlaces hacia BI.

---

### Iteración BI 3 — Completar endpoints pendientes sin modelo ML avanzado

Implementar versiones baseline SQL para:

- Top inactivos.
- Proyección de ingresos simple.
- Predicción de abandono heurística.
- Predicción de fallo heurística.

Estas versiones pueden ser reglas iniciales, no ML avanzado:

- abandono: cantidad de días sin asistir + deuda + baja adherencia.
- ingresos: pagos últimos 3/6 meses + cuota actual.
- fallo: mantenimiento vencido + cantidad de correctivos + costo acumulado.

---

### Iteración BI 4 — FastAPI / modelos avanzados

Recién después de cerrar lo anterior:

- Microservicio Python/FastAPI.
- Modelos scikit-learn.
- Batch nocturno o cache de resultados.
- Versionado de modelos.
- Registro de predicciones.

---

## 5. Priorización recomendada

| Prioridad | Acción | Motivo |
|---:|---|---|
| 1 | Corregir rutas frontend inexistentes | Evita errores runtime |
| 2 | Renderizar métricas ya cargadas | Alto valor con bajo esfuerzo |
| 3 | Crear módulo BI separado | Mejora mantenibilidad |
| 4 | Tipar contratos de métricas | Evita bugs visuales |
| 5 | Implementar endpoints 501 con baseline SQL | Completa promesa funcional |
| 6 | Evaluar FastAPI | Solo cuando el BI base esté estable |

---

## 6. Entregables sugeridos para el próximo PR funcional

Nombre de rama sugerido:

```bash
feature/business-intelligence-foundation
```

Entregables:

- `src/app/dashboard/business-intelligence/page.tsx`
- `src/components/business-intelligence/*`
- `src/interfaces/businessIntelligence.interface.ts`
- Ajuste de `sidebarConfig.ts` para agregar menú BI.
- Corrección de rutas frontend inexistentes o remoción de funciones no usadas.
- Documentación `docs/business-intelligence/bi-roadmap.md`.

---

## 7. Definición de terminado para BI foundation

- No existen llamadas frontend a rutas inexistentes.
- Las métricas ya implementadas se ven en pantalla.
- Los endpoints 501 no aparecen en UI productiva.
- Cada gráfico tiene loading, empty y error state.
- El dashboard principal no queda sobrecargado.
- Queda documentado qué métricas son SQL baseline y cuáles serán ML futuro.

