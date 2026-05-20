# Auditoría inicial de cuotas, pagos y vencimientos — Gym Master

## 1. Contexto

Esta auditoría corresponde a la rama `feature/cuotas-pagos-vencimientos` y toma como punto de partida el estado actualizado del repositorio y del dump `backup_completo_gym_master_20052026.sql`.

El objetivo es revisar el estado real del módulo de cuotas/pagos antes de implementar reglas nuevas de negocio, especialmente:

- pago manual desde administrador,
- pago online con Stripe,
- historial de precios de cuota,
- cuotas vencidas,
- pagos adelantados,
- pagos que cubren varios meses,
- inactivación por vencimiento + falta de asistencia,
- métricas para dashboard/Business Intelligence.

Regla operativa del proyecto: cualquier cambio de base de datos debe probarse primero con Supabase CLI en entorno local y luego aplicarse en remoto con historial de migraciones controlado.

---

## 2. Tablas detectadas en el dump actualizado

### `cuota`

Tabla principal para precios/cuotas por período.

Columnas relevantes:

- `id`
- `descripcion`
- `monto`
- `periodo`
- `fecha_inicio`
- `fecha_fin`
- `activo`
- `creado_en`
- `actualizado_en`

Estado observado:

- Existen cuotas mensuales históricas cargadas.
- El campo `periodo` está representado como texto, por ejemplo `2024-11`, `2025-04`, etc.
- La lógica actual parece tomar la cuota más reciente por `creado_en`, no necesariamente por `fecha_inicio` o vigencia real.

Riesgo:

- Si se crea o edita una cuota fuera de orden, tomar la última por `creado_en` puede no representar la cuota vigente.

---

### `historial_precios_cuota`

Tabla de historial de precios.

Columnas relevantes:

- `id`
- `id_socio`
- `precio`
- `fecha_inicio`
- `fecha_fin`

Estado observado:

- La tabla tiene relación con `socio` mediante `id_socio`.
- Existen registros asociados a socios específicos.

Riesgo / decisión pendiente:

- Hay que definir si el precio de cuota es global del gimnasio o individual por socio.
- Si la cuota es global, esta tabla debería modelarse como historial global de precios.
- Si existen precios especiales por socio, debe diferenciarse claramente entre precio base global y excepción/descuento individual.

---

### `pago`

Tabla de pagos registrados.

Columnas relevantes:

- `id`
- `socio_id`
- `cuota_id`
- `fecha_pago`
- `monto_pagado`
- `total` generado como `monto_pagado`
- `registrado_por`
- `fecha_vencimiento`
- `enviar_email`
- `creado_en`
- `actualizado_en`

Estado observado:

- En el dump actualizado, la tabla `pago` no contiene registros de negocio cargados.
- La tabla no tiene campos explícitos para `periodo_desde`, `periodo_hasta`, `meses_cubiertos`, `metodo_pago`, `estado`, `stripe_session_id`, ni `stripe_payment_intent_id`.
- La tabla tampoco tiene columna `activo`, pero el servicio actual intenta hacer borrado lógico actualizando `{ activo: false }`.

Riesgos:

- El borrado de pagos puede fallar porque `pago.activo` no existe.
- No se puede representar de manera limpia un pago adelantado o un pago que cubre varios meses.
- No queda trazabilidad completa entre pago manual y pago Stripe.
- El cálculo de cobertura depende de `fecha_vencimiento`, pero no hay `periodo_desde/periodo_hasta` explícitos.

---

### `socio`

Tabla de socios.

Columnas relevantes para esta auditoría:

- `id_socio`
- `usuario_id`
- `nombre_completo`
- `activo`
- `fecha_alta`
- `fecha_baja`
- `descuento_activo`

Estado observado:

- Existe bandera `activo`.
- Existe `descuento_activo`, actualmente usado en lógica de pagos.
- No existe campo directo de estado de cuota; debe calcularse a partir de pagos/vencimientos.

---

### `asistencia`

Tabla de asistencias.

Columnas relevantes:

- `socio_id`
- `fecha`
- `hora_ingreso`
- `hora_egreso`

Uso futuro:

- Será clave para la regla de inactivación: si la cuota venció y el socio no registra asistencia durante una semana, puede pasar a inactivo hasta que pague y vuelva.

---

## 3. Servicios y APIs actuales detectados

### APIs principales

- `GET /api/cuota`
- `POST /api/cuota`
- `PUT /api/cuota`
- `DELETE /api/cuota`
- `GET /api/cuota/[id]`
- `GET /api/pagos`
- `POST /api/pagos`
- `PUT /api/pagos`
- `DELETE /api/pagos`
- `GET /api/pagos/[id]`
- `POST /api/pagar-cuota`
- `POST /api/stripe-webhook`

### Servicios relacionados

- `src/services/cuotaService.ts`
- `src/services/pagoService.ts`
- `src/services/stripeService.ts`

---

## 4. Hallazgos de código

### 4.1 Creación de pago manual

`createPago` recibe `socio_id` y `registrado_por`. Luego:

- busca la cuota más reciente,
- calcula `fecha_pago` como hoy,
- calcula `fecha_vencimiento` como hoy + 30 días,
- toma el monto de la cuota,
- aplica 10% de descuento si `socio.descuento_activo = true`,
- inserta el pago,
- desactiva `descuento_activo` en el socio.

Riesgos:

- No permite pagar varios meses.
- No permite elegir período cubierto.
- No usa explícitamente `fecha_inicio/fecha_fin` de la cuota para cobertura.
- No contempla pagos adelantados de forma clara.
- No deja trazabilidad del método de pago.

---

### 4.2 Pago Stripe

`createSessionPago`:

- obtiene la cuota más reciente,
- obtiene socio desde usuario,
- verifica último pago,
- crea sesión Stripe,
- guarda en metadata `socio_id` y `cuota_id`.

`stripe-webhook`:

- escucha `checkout.session.completed`,
- obtiene `socio_id` desde metadata,
- llama a `createPago`,
- usa un `registrado_por` hardcodeado.

Riesgos:

- El webhook no usa `cuota_id` de metadata para registrar el pago.
- El usuario registrador está hardcodeado.
- No guarda `stripe_session_id` ni `payment_intent_id` en `pago`.
- La lógica de `createPago` vuelve a buscar la última cuota, lo que puede no coincidir con la cuota que se pagó en Stripe.

---

### 4.3 Eliminación de pagos

El servicio `deletePago` intenta:

```ts
supabase.from("pago").update({ activo: false })
```

Pero en el dump actualizado la tabla `pago` no tiene columna `activo`.

Conclusión:

- La eliminación de pagos probablemente falla o está incompleta.
- Debe decidirse si `pago` tendrá borrado lógico con `activo`, `estado`, `anulado_en`, `anulado_por`, o si no se permitirá eliminar pagos por razones contables.

---

### 4.4 Formulario de pagos

`PagoForm` contiene campos para:

- `socio_id`,
- `cuota_id`,
- `fecha_pago`,
- `fecha_vencimiento`,
- `monto_pagado`,
- `registrado_por`.

Pero la API `POST /api/pagos` solo valida `socio_id` y `registrado_por`, y `createPago` ignora el resto.

Riesgo:

- Hay desalineación entre formulario, API, DTO y lógica real de negocio.

---

## 5. RPC / Data Science detectado

Funciones relevantes detectadas:

- `obtener_evolucion_cuota()`
- `sp_analisis_conducta_pagos()`

### `obtener_evolucion_cuota()`

Devuelve evolución de monto por período usando `cuota.fecha_inicio` y `cuota.monto`.

Uso recomendado:

- gráfica de evolución histórica del precio de cuota en dashboard BI.

### `sp_analisis_conducta_pagos()`

Clasifica pagos por puntualidad/morosidad según diferencia entre `fecha_pago` y `fecha_vencimiento`.

Riesgo:

- Si `fecha_vencimiento` representa vencimiento posterior al pago, la fórmula puede no medir correctamente retrasos respecto al período adeudado.
- La función depende de que existan registros reales en `pago`; actualmente el dump no trae pagos cargados.

---

## 6. Decisiones pendientes antes de desarrollo

1. Definir si `cuota` representa un precio mensual global o una cuota concreta por período.
2. Definir si `historial_precios_cuota` debe ser global o por socio.
3. Definir cómo representar pagos que cubren varios meses.
4. Definir si se agregan campos a `pago`:
   - `periodo_desde`
   - `periodo_hasta`
   - `meses_cubiertos`
   - `metodo_pago`
   - `estado`
   - `stripe_session_id`
   - `stripe_payment_intent_id`
   - `observaciones`
5. Definir si los pagos pueden eliminarse o solo anularse.
6. Definir la regla exacta de inactivación por vencimiento + asistencia.
7. Definir cómo se mostrarán los vencidos en el dashboard inicial.

---

## 7. Recomendación técnica

No implementar UI todavía. Primero conviene cerrar un sub-bloque de modelo de datos y reglas de negocio.

Orden sugerido:

1. Ejecutar diagnóstico SQL en local/remoto.
2. Confirmar estado real de datos actuales.
3. Diseñar migración controlada para extender `pago` o crear tabla complementaria.
4. Probar migración con Supabase local.
5. Crear seeds demo de pagos para socio hombre/mujer.
6. Recién después corregir APIs y frontend.

---

## 8. Próxima rama/sub-bloque sugerido

Dentro de `feature/cuotas-pagos-vencimientos`, el primer sub-bloque real debería ser:

```txt
modelo de pagos y cobertura de cuotas
```

Objetivo:

- dejar el modelo preparado para efectivo, Stripe, pagos adelantados y cobertura multi-mes.
