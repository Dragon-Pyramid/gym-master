# PR — API/RPC/Frontend map and BI gap analysis

## Descripción

Este PR agrega documentación técnica para mapear la integración actual entre procedimientos almacenados, servicios, API Routes y frontend en Gym Master.

El objetivo es identificar qué métricas de Data Science/Business Intelligence ya existen en Supabase/PostgreSQL, cuáles están expuestas por APIs, cuáles se consumen desde frontend y cuáles todavía no tienen representación visual.

## Cambios incluidos

- Se agrega `docs/api/api-rpc-frontend-map.md` con el mapeo por dominio:
  - Asistencia
  - Rutinas
  - Pagos
  - Equipamiento
  - Dietas y evolución
  - Ficha médica
  - Perfil/foto
- Se agrega `docs/business-intelligence/bi-gap-analysis.md` con brechas visuales y roadmap BI.
- Se agrega `database/scripts/diagnostico_api_rpc_frontend.sql` como script de apoyo para inspeccionar funciones, RLS y objetos clave.
- Se agrega informe ejecutivo del bloque en `docs/informes/informe-ejecutivo-api-rpc-bi.md`.

## Hallazgos principales

- Existen varias métricas de Data Science implementadas como RPC/funciones SQL.
- Existen API Routes que consumen parte de esas funciones.
- El dashboard admin ya consume algunas métricas, pero algunas se guardan en estado y no se renderizan.
- Hay endpoints declarados pero no implementados que devuelven `501` o contienen TODO.
- Hay funciones frontend que apuntan a rutas API no detectadas en el árbol actual.
- Falta una sección Business Intelligence ordenada y separada del dashboard principal.

## Impacto

Este PR no modifica lógica productiva. Solo agrega documentación y scripts de diagnóstico.

## Validación sugerida

```bash
git diff -- docs/ database/scripts/
```

Opcional:

```bash
npm run build
```

## Próximo paso recomendado

Crear una rama funcional para cerrar la base visual de Business Intelligence:

```bash
feature/business-intelligence-foundation
```

Objetivo inicial:

- Corregir rutas frontend desalineadas.
- Renderizar métricas que ya se consultan pero no se muestran.
- Encapsular BI en componentes reutilizables.
- Ocultar o documentar endpoints todavía no implementados.
