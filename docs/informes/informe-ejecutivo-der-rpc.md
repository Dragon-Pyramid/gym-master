# Informe ejecutivo — Auditoría DER, base de datos y APIs/RPC de Gym Master

**Fecha:** 2026-05-19  
**Bloque:** Auditoría técnica posterior al checkpoint single-tenant  
**Alcance:** Base Supabase/PostgreSQL, DER, funciones/RPC, APIs Next.js y capa pendiente de Business Intelligence.

## 1. Resumen

Gym Master cuenta con una base de datos amplia y funcional, no con un modelo vacío. El backup analizado contiene tablas para usuarios, socios, rutinas, dietas, asistencia, pagos, ventas, equipamiento, mantenimiento, entrenadores, ficha médica, QR/kiosco, perfil/foto y métricas.

También se detectaron procedimientos almacenados relevantes para Data Science y operación del negocio. Esto confirma que parte del trabajo analítico ya fue desarrollado en PostgreSQL/Supabase y que no conviene rehacerlo desde cero.

## 2. Puntos positivos

- La arquitectura ya quedó simplificada como single-tenant por instancia.
- Existen RPC para rutinas, dietas, ficha médica, asistencia, pagos, equipamiento y análisis de retención/adherencia.
- Existen API routes para `/api/admin/metricas/...`.
- El dashboard principal ya consume algunas métricas y muestra gráficas iniciales.
- Hay datos suficientes en el dump para probar varios módulos: asistencia, equipamiento, mantenimiento, pagos, socios, rutinas y logs QR.

## 3. Riesgos detectados

- Hay policies de desarrollo abiertas (`dev_all_*`) que no deben llegar a producción sin revisión.
- El código llama a `sp_prediccion_abandono` y `sp_top_inactivos`, pero esas funciones no aparecen en el backup analizado.
- Hay posible duplicación de modelo para horarios de entrenadores: `entrenador_horarios` y `horario_entrenador`.
- El modelo de ventas contiene una relación circular entre `venta` y `venta_detalle`.
- El módulo dieta requiere normalización: la documentación habla de JSON de dieta, pero la tabla detectada no tiene un campo JSONB específico para ese plan.
- La capa visual de Business Intelligence está incompleta y necesita diseño modular.

## 4. Recomendación

No ejecutar migraciones correctivas todavía. Primero se recomienda mergear esta documentación y correr el script de diagnóstico en Supabase para confirmar el estado real actual.

Luego, dividir el trabajo en dos ramas:

1. `fix/database-model-consistency`: correcciones de modelo y RPC faltantes.
2. `feature/admin-business-intelligence-dashboard`: visualización ordenada de métricas/proyecciones en el dashboard administrador.

## 5. Próximo paso operativo

Abrir PR con esta documentación. Después del merge, crear una rama para resolver los hallazgos críticos de base:

```bash
git checkout main
git pull origin main
git checkout -b fix/database-model-consistency
```
