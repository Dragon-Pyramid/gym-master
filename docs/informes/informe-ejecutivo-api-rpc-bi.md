# Informe ejecutivo — Mapa API/RPC/Frontend y brecha BI

**Proyecto:** Gym Master  
**Fecha:** 19 de mayo de 2026  
**Bloque:** Auditoría API/RPC/Frontend + Business Intelligence

---

## 1. Resumen ejecutivo

Se analizó el estado de integración entre las funciones almacenadas de Supabase/PostgreSQL, los servicios TypeScript, las API Routes de Next.js y el frontend de Gym Master.

El hallazgo principal es positivo: Gym Master ya cuenta con una base relevante de Data Science implementada en base de datos y parcialmente expuesta a través de endpoints. Sin embargo, el valor todavía no está completamente visible para el usuario administrador porque falta cerrar la capa visual de Business Intelligence.

---

## 2. Estado actual

El sistema ya tiene funciones/RPC para asistencia, rutinas, pagos y equipamiento. También hay endpoints protegidos por autenticación y rol admin que consumen varias de esas funciones.

El dashboard administrador ya renderiza algunas gráficas, especialmente de equipamiento y pagos. Sin embargo, también existen métricas que se consultan pero no se muestran, y endpoints que todavía están declarados como pendientes.

---

## 3. Hallazgos principales

1. **Rutinas:** la generación de rutina ya funciona correctamente con `generar_rutina_socio`. Las métricas de adherencia y evolución existen, se consumen, pero no se visualizan.
2. **Asistencia:** existen RPC de concurrencia semanal/mensual/anual. El dashboard consulta concurrencia semanal, pero no la grafica.
3. **Pagos:** segmentación e histograma se visualizan, aunque ambos usan la misma fuente `sp_analisis_conducta_pagos`.
4. **Equipamiento:** estado semáforo y top fallos están conectados y visualizados. Costo-beneficio tiene endpoint/cliente, pero falta visual.
5. **Endpoints pendientes:** predicción de abandono, top inactivos, proyección de ingresos y predicción de fallos requieren implementación real o deben ocultarse de la UI.
6. **Rutas desalineadas:** existen llamadas frontend a rutas no detectadas, especialmente en dieta, ranking de asistencia y cuota estado.
7. **Arquitectura frontend:** el dashboard principal concentra demasiada lógica. Conviene separar Business Intelligence en una sección propia.

---

## 4. Riesgos técnicos

- Errores runtime por llamadas a rutas inexistentes.
- Gráficas vacías por métricas cargadas pero no renderizadas.
- Confusión funcional por endpoints presentes pero no implementados.
- Dashboard difícil de mantener por exceso de responsabilidades.
- Métricas sin contrato de datos explícito.

---

## 5. Recomendación ejecutiva

Antes de avanzar con RAG, FastAPI o modelos predictivos complejos, conviene cerrar una primera versión sólida del módulo BI con lo que ya existe.

El próximo bloque funcional debería ser:

```txt
Business Intelligence Foundation
```

Objetivo:

- Ordenar las métricas existentes.
- Visualizar lo que ya se consulta.
- Corregir rutas frontend desalineadas.
- Separar BI del dashboard principal.
- Crear componentes reutilizables y tipados.

---

## 6. Próximo PR sugerido

Rama sugerida:

```bash
feature/business-intelligence-foundation
```

Alcance recomendado:

1. Crear página/sección BI.
2. Crear componentes base para cards y charts.
3. Mostrar concurrencia, adherencia, evolución, pagos y equipamiento.
4. Agregar empty/error/loading states.
5. No mostrar endpoints todavía no implementados.
6. Documentar roadmap BI.

---

## 7. Conclusión

Gym Master ya tiene una base analítica importante. El trabajo inmediato no es crear más Data Science, sino convertir lo existente en valor visible para el administrador mediante una capa BI clara, mantenible y profesional.
