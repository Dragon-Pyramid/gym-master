# Auditoría técnica inicial — Gym Master

**Fecha:** 2026-05-19  
**Base analizada:** `gym-master_repo_2026-05-19_20-01.zip`  
**Backup SQL analizado:** `backup_completo_gym_master_19052026.sql`  
**Estado de partida:** PR single-tenant mergeado a `main`; `dbName` eliminado; login admin/socio y generación de rutina validados.

---

## 1. Resumen ejecutivo

Gym Master no arranca desde cero. El sistema ya tiene una base funcional importante: login custom con JWT, usuarios, socios, rutinas generadas por RPC, módulos administrativos, PWA, Stripe, Cloudinary, QR, ficha médica, dietas, equipamiento, mantenimientos y endpoints de métricas.

El checkpoint más importante ya quedó cerrado: el proyecto dejó de depender de `dbName` y pasó a operar como **single-tenant por instancia/deploy**, con una base Supabase/PostgreSQL por gimnasio. En el repo inspeccionado no se encontraron referencias activas a `dbName` en `src`, `database`, `.env.example` ni `README.md`.

El diagnóstico principal es que el proyecto tiene mucho avance, pero con deuda técnica clara: módulos a medio terminar, endpoints de Data Science incompletos, RLS demasiado abierto para producción, duplicidad en algunas tablas de entrenadores/horarios, mezcla de responsabilidades entre frontend/API/services y ausencia de testing automatizado.

---

## 2. Arquitectura actual validada

### Decisión vigente

```txt
Una app/deploy por gimnasio
Una base Supabase/PostgreSQL por gimnasio
Sin selector de base
Sin dbName en login, JWT, servicios ni middleware
```

### Estado detectado en código

- `src/services/supabaseClient.ts` expone un cliente único de Supabase.
- `src/middlewares/conexionBd.middleware.ts` devuelve ese cliente único.
- `src/app/api/custom-login/route.ts` recibe `email`, `password` y `rol`.
- `src/services/loginService.ts` valida usuario, bcrypt, rol, estado activo y agrega `id_socio` al JWT cuando corresponde.
- `src/services/rutinaService.ts` resuelve `id_socio` desde body, JWT o fallback por `usuario_id` y llama a `generar_rutina_socio`.

### Verificación de limpieza

```txt
Referencias activas a dbName detectadas: 0
```

- Ninguna referencia activa encontrada en el paquete inspeccionado.

---

## 3. Stack real detectado

Según `package.json`:

| Área | Tecnología / librería | Estado |
|---|---|---|
| Framework | Next.js `14.2.33` + App Router | En uso |
| UI | React `18.3.1`, Tailwind, Radix/Shadcn-style components | En uso |
| Estado | Zustand | En uso |
| Auth custom | JWT + bcryptjs | En uso |
| Auth adicional | NextAuth | Presente, revisar alcance real |
| Base | Supabase JS `^2.49.10` | En uso |
| Pagos | Stripe | Parcial / requiere hardening |
| Imágenes | Cloudinary | En uso para perfil/ficha médica |
| Emails | Brevo | Presente |
| QR | qrcode + react-qr-reader | En uso |
| Charts | Chart.js, Recharts | En uso/parcial |
| PWA | next-pwa | En uso |
| Swagger | swagger-jsdoc + swagger-ui-react | Presente/parcial |
| Testing | No hay scripts de test activos | Pendiente |

---

## 4. Inventario funcional por módulo

| Módulo | Estado | Evidencia / comentario | Prioridad |
|---|---:|---|---:|
| Login custom | ✅ Funcional | Login sin `dbName`, validación bcrypt/JWT/rol. | Alta |
| Usuarios | 🟡 Parcial | CRUD existe. Al crear rol `socio`, crea perfil asociado. Falta DTO seguro y no devolver `password_hash`. | Alta |
| Socios | 🟡 Parcial | CRUD, activo/inactivo, foto, relación con usuario. Requiere revisar consistencia y permisos. | Alta |
| Rutinas | ✅ / 🟡 | Generación por `generar_rutina_socio` validada. Historial y gestor existen. Falta test y normalización de JSON. | Alta |
| Objetivos/Niveles/Ejercicios | 🟡 Parcial | Catálogos y ejercicios existen. Requiere revisar cantidad/calidad de seed. | Alta |
| Dietas | 🟡 Parcial | RPC `genera_dieta_socio` y endpoints existen. Falta validar flujo completo UI/API/PDF. | Media |
| Evolución física | 🟡 Parcial | Tabla y endpoints existen. Falta validar UI, métricas e IMC. | Media |
| Ficha médica | 🟡 Parcial | RPCs y pantallas con tabs existen. Requiere hardening de permisos y Cloudinary. | Alta |
| Pagos/cuotas | 🟡 Parcial | Pago manual/Stripe existe, pero hay mocks/hardcodes y falta lógica final de vencimientos. | Alta |
| Stripe | 🔴 Riesgo | Webhook usa `registrado_por` hardcodeado y página éxito indica mock. | Alta |
| Asistencia manual | 🟡 Parcial | CRUD existe. Faltan restricciones de doble asistencia por día y permisos. | Alta |
| Asistencia QR | 🟡 Parcial | QR diario y registro por token existen. Requiere seguridad, antireplay y modo recepción. | Alta |
| Perfil/foto | 🟡 Parcial | Perfil, Cloudinary y sincronización usuario/socio existen. Falta QA por rol. | Media |
| Entrenadores | 🟡 Parcial | Módulo y horarios existen. Hay posible duplicidad `entrenador_horarios` / `horario_entrenador`. | Media |
| Equipamiento/mantenimiento | 🟡 Parcial | CRUD y métricas SQL existen. Falta validar UI y flujo de mantenimiento. | Media |
| Dashboard admin | 🟡 Parcial | Hay métricas conectadas y otras 501/TODO. | Alta |
| Data Science | 🔴 Incompleto | RPCs parciales. Dos llamadas del código no existen en backup: `sp_prediccion_abandono`, `sp_top_inactivos`. | Media |
| PWA/mobile socio | 🟡 Base | PWA configurada. Mobile dedicada a socio aún no desarrollada formalmente. | Futura |
| RAG rutinas | ⚪ Futuro | No implementado en este repo. Debe partir de baseline actual de rutinas. | Futura |

---

## 5. API Routes detectadas

Total de archivos `route.ts` bajo `src/app/api`: **72**.

Áreas principales detectadas:

- Auth/custom login.
- Usuarios y perfil.
- Socios y ficha médica.
- Rutina, historial y generación.
- Dieta y evolución.
- Asistencias, QR, ranking y recientes.
- Pagos, cuotas, Stripe.
- Productos, proveedores, ventas y ventas detalle.
- Equipamiento, mantenimiento y entrenadores.
- Métricas admin/Data Science.

Endpoints con implementación explícitamente pendiente o 501 detectados:

- `src/app/api/admin/metricas/asistencia/prediccion-abandono/route.ts`
- `src/app/api/admin/metricas/pagos/proyeccion-ingresos/route.ts`
- `src/app/api/admin/metricas/equipamiento/prediccion-fallo/route.ts`

---

## 6. Páginas dashboard detectadas

Total de páginas directas bajo `src/app/dashboard/*/page.tsx`: **25**.

```txt
- actividades/page.tsx
- admin/page.tsx
- asistencias/page.tsx
- avisos/page.tsx
- control-asistencia/page.tsx
- cuotas/page.tsx
- dietas/page.tsx
- entrenadores/page.tsx
- equipamientos/page.tsx
- evolucion-fisica/page.tsx
- ficha-medica/page.tsx
- gestion-dietas/page.tsx
- gestor-dietas/page.tsx
- gestor-rutinas/page.tsx
- otros-gastos/page.tsx
- pagos/page.tsx
- perfil/page.tsx
- productos/page.tsx
- proveedores/page.tsx
- rutinas/page.tsx
- servicios/page.tsx
- socios/page.tsx
- usuarios/page.tsx
- ventas-detalle/page.tsx
- ventas/page.tsx
```

Esto confirma que existe una interfaz amplia, pero se debe validar módulo por módulo contra backend y DB real.

---

## 7. Estado de base de datos

El backup SQL contiene:

- **33 tablas públicas** del dominio Gym Master.
- **29 funciones/RPC públicas**.
- Datos seed/de prueba en tablas operativas.
- RLS habilitado con policies de desarrollo demasiado abiertas.

Tablas públicas principales:

```txt
- public.ficha_medica
- public.access_scan_events
- public.actividad
- public.asistencia
- public.avisos
- public.comida_base
- public.cuota
- public.dia
- public.dieta
- public.ejercicio
- public.entrenador_horarios
- public.entrenadores
- public.equipamiento
- public.evento_profile_photo_updated
- public.evolucion_socio
- public.grupo_muscular
- public.historial_precios_cuota
- public.horario_entrenador
- public.kiosk_config
- public.logs_qr
- public.mantenimiento
- public.nivel
- public.objetivo
- public.otros_gastos
- public.pago
- public.producto
- public.proveedor
- public.rutina
- public.servicio
- public.socio
- public.usuario
- public.venta
- public.venta_detalle
```

Funciones públicas principales:

```txt
- public.actualizar_horarios_texto
- public.actualizar_updated_at
- public.attendance_ranking
- public.calcular_retencion_por_combinacion
- public.fn_top10_asistencia
- public.genera_dieta_socio
- public.generar_horarios_texto
- public.generar_rutina_socio
- public.get_ficha_medica_actual
- public.insert_ficha_medica
- public.list_fichas_medicas
- public.log_profile_photo_updated
- public.obtener_evolucion_cuota
- public.rls_auto_enable
- public.set_updated_at
- public.sp_adherencia_mensual_rutinas
- public.sp_analisis_conducta_pagos
- public.sp_analisis_costo_beneficio
- public.sp_concurrencia_anual
- public.sp_concurrencia_mensual
- public.sp_concurrencia_semanal
- public.sp_estado_equipamiento_semaforo
- public.sp_evolucion_promedio_por_objetivo
- public.sp_generar_guardar_rutina_json
- public.sp_generar_rutina_personalizada
- public.sp_ranking_fallos_equipamiento
- public.sp_resumen_asistencias_por_periodo
- public.sync_socio_foto_desde_usuario
- public.tiene_foto
```

### Datos detectados en el backup

```txt
- public.access_scan_events: 21 filas
- public.actividad: 16 filas
- public.asistencia: 476 filas
- public.avisos: 6 filas
- public.comida_base: 28 filas
- public.cuota: 12 filas
- public.dia: 6 filas
- public.dieta: 8 filas
- public.ejercicio: 47 filas
- public.entrenador_horarios: 24 filas
- public.entrenadores: 13 filas
- public.equipamiento: 53 filas
- public.evento_profile_photo_updated: 5 filas
- public.evolucion_socio: 5 filas
- public.ficha_medica: 4 filas
- public.grupo_muscular: 15 filas
- public.historial_precios_cuota: 20 filas
- public.horario_entrenador: 18 filas
- public.kiosk_config: 1 filas
- public.logs_qr: 502 filas
- public.mantenimiento: 54 filas
- public.nivel: 3 filas
- public.objetivo: 10 filas
- public.otros_gastos: 6 filas
- public.pago: 16 filas
- public.proveedor: 6 filas
- public.rutina: 17 filas
- public.servicio: 8 filas
- public.socio: 13 filas
- public.usuario: 17 filas
- public.venta: 9 filas
- public.venta_detalle: 8 filas
```

---

## 8. RPC usados por el código

| RPC | Archivos que lo consumen | Existe en backup |
|---|---|---:|
| `genera_dieta_socio` | src/services/dietaService.ts | Sí |
| `generar_horarios_texto` | src/services/entrenadorService.ts | Sí |
| `generar_rutina_socio` | src/services/rutinaService.ts | Sí |
| `get_ficha_medica_actual` | src/services/fichaMedicaService.ts | Sí |
| `insert_ficha_medica` | src/services/fichaMedicaService.ts | Sí |
| `list_fichas_medicas` | src/services/fichaMedicaService.ts | Sí |
| `sp_adherencia_mensual_rutinas` | src/services/rutinaService.ts | Sí |
| `sp_analisis_conducta_pagos` | src/services/pagoService.ts | Sí |
| `sp_analisis_costo_beneficio` | src/services/equipamientoService.ts | Sí |
| `sp_concurrencia_anual` | src/services/asistenciaService.ts | Sí |
| `sp_concurrencia_mensual` | src/services/asistenciaService.ts | Sí |
| `sp_concurrencia_semanal` | src/services/asistenciaService.ts | Sí |
| `sp_estado_equipamiento_semaforo` | src/services/equipamientoService.ts | Sí |
| `sp_prediccion_abandono` | src/services/asistenciaService.ts | No |
| `sp_ranking_fallos_equipamiento` | src/services/equipamientoService.ts | Sí |
| `sp_top_inactivos` | src/services/asistenciaService.ts | No |

### RPC faltantes detectados

```txt
- sp_prediccion_abandono
- sp_top_inactivos
```

Estos faltantes deben resolverse antes de considerar completo el módulo de métricas de asistencia/Data Science.

---

## 9. Riesgos técnicos prioritarios

### 9.1 RLS/policies abiertas

El backup incluye policies `dev_all_*` con `USING (true)` y `WITH CHECK (true)` sobre muchas tablas. Esto destraba desarrollo, pero no es apto para producción.

Riesgo: cualquier cliente con anon key podría operar más datos de los permitidos si no se restringen rutas, roles y policies.

Recomendación:

1. Mantenerlas solo en desarrollo local.
2. Crear migración de hardening RLS.
3. Mover operaciones críticas a API server-side con `service_role` cuando corresponda.
4. Definir matriz de permisos admin/usuario/socio.

### 9.2 Duplicidad de horarios de entrenadores

Existen dos tablas relacionadas:

- `public.entrenador_horarios`
- `public.horario_entrenador`

Ambas apuntan a `entrenadores`. Hay que decidir cuál queda como oficial y migrar/eliminar la otra para evitar inconsistencias.

### 9.3 Venta / venta_detalle con relación circular

El backup muestra:

- `venta_detalle.venta_id -> venta.id`
- `venta.id_venta_detalle -> venta_detalle.id`

Esto sugiere una relación circular innecesaria. El modelo típico debería ser `venta` como cabecera y `venta_detalle` como líneas.

### 9.4 Stripe incompleto

Riesgos detectados:

- Webhook crea pago con `registrado_por` hardcodeado.
- Página de éxito contiene comentario de mock.
- Falta validar idempotencia del webhook.
- Falta guardar `stripe_session_id` / `payment_intent` para evitar duplicados.

### 9.5 Métricas/Data Science incompletas

Hay endpoints 501/TODO y RPC inexistentes según el backup. Debe separarse:

- Métricas SQL listas.
- Métricas pendientes.
- Métricas que irán a FastAPI/Python.

### 9.6 Testing inexistente

`package.json` no tiene scripts `test`, `test:e2e` ni dependencias de Vitest/Playwright. Esto deja el sistema vulnerable a regresiones.

---

## 10. Backlog recomendado posterior a auditoría

### Bloque 1 — Hardening mínimo

- Crear matriz de permisos por rol.
- Reemplazar policies `dev_all_*`.
- Revisar endpoints que no validan rol.
- Evitar exposición de `password_hash`.
- Añadir `export const dynamic = "force-dynamic"` en API Routes que usan headers/cookies si se desea limpiar ruido de build.

### Bloque 2 — DER y migraciones limpias

- Generar DER real.
- Resolver duplicidad de entrenadores/horarios.
- Corregir modelo venta/venta_detalle.
- Revisar cuotas/pagos/historial de precios.
- Crear `database/migrations`, `database/seeds`, `database/docs`.

### Bloque 3 — Core vendible

- Usuarios/socios/login/perfil.
- Rutinas e historial.
- Cuotas/pagos/asistencia.
- QR operativo.

### Bloque 4 — Funciones diferenciales

- Dieta/evolución.
- Ficha médica.
- Equipamiento/mantenimiento.
- Dashboard con métricas reales.

### Bloque 5 — Futuro

- RAG generador de rutinas.
- Mobile solo socios.
- Biometría con enfoque realista: QR primero, passkeys/WebAuthn o hardware externo después.

---

## 11. Siguiente rama sugerida

```bash
git checkout main
git pull origin main
git checkout -b docs/audit-current-system
```

Como este primer bloque es documentación/auditoría, no debería tocar lógica productiva.

---

## 12. Comandos robocopy sugeridos

Desde Windows, aplicando el paquete generado de archivos de auditoría:

```powershell
robocopy `
  "E:\gym-master-2026\sistema\temp-robocopy\gym-master-audit-files" `
  "E:\gym-master-2026\sistema\gym-master" `
  /E /XD .git node_modules .next .vercel /R:2 /W:2
```

Luego revisar:

```bash
git status
git diff -- README.md docs/auditoria-tecnica-gym-master.md docs/database/estado-base-datos.md docs/pr/pr-auditoria-tecnica-gym-master.md docs/informes/informe-ejecutivo-auditoria-inicial.md
```
