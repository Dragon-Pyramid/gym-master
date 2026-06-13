# UI production copy cleanup - Roadmap de recorrido QA

**Rama sugerida:** `feature/ui-production-copy-cleanup`  
**Tipo:** UX / copy / limpieza visual de produccion.  
**Migracion DB:** No requiere.

## Objetivo

Eliminar o controlar textos tecnicos visibles para el cliente final y dejar Gym Master con una presentacion mas limpia para demo comercial, preventa y uso real por gimnasios.

Esta limpieza no modifica reglas de negocio, tablas ni flujos operativos. Se concentra en copy visible, badges tecnicos y documentacion de recorrido.

## Cambios incluidos

### 1. Badges tecnicos QA

Los badges de archivo/ruta dejan de mostrarse por defecto. Solo aparecen cuando se habilita explicitamente:

```bash
NEXT_PUBLIC_QA_FILE_BADGES=true
```

Se evita que un cliente vea textos como `QA:` o rutas internas de codigo durante una demo o uso real.

### 2. Rutas no mapeadas

El componente global de rutas QA ya no muestra texto tecnico de ruta no mapeada. Si una ruta no existe en el mapa interno, no renderiza badge.

### 3. Metadata general

Se actualiza la descripcion principal de la aplicacion para usar un mensaje mas comercial:

```txt
ERP inteligente para la gestion integral de gimnasios
```

### 4. BI demografico

Se elimina wording interno `activos/demo` en sugerencias comerciales de BI demografico, reemplazandolo por `socios activos`.

### 5. Swagger / documentacion API

El endpoint interno `/api/test-alertas` queda marcado como interno y no se expone en Swagger por defecto. Solo se muestra cuando:

```bash
NEXT_PUBLIC_EXPOSE_INTERNAL_TEST_ENDPOINTS=true
```

### 6. Parametrizacion de catalogos

Se retira del hero la leyenda tecnica:

```txt
Consulta y administracion base de catalogos reales para eliminar progresivamente valores hardcodeados en formularios, reportes y procesos administrativos.
```

La pantalla queda con titulo directo y menos texto tecnico para demo comercial.

## Roadmap de recorrido manual

Despues de aplicar la feature, recorrer estas pantallas y confirmar que no aparezcan badges QA, rutas internas ni textos tecnicos visibles.

### Auth

- `/auth/login`
- `/auth/login/admin`
- `/auth/login/socio`

Validar:

- No aparece badge fijo de archivo.
- Textos de entrada son claros para usuario final.
- No aparece `QA:`.

### Dashboard general

- `/dashboard`

Validar:

- No aparece badge fijo arriba a la derecha.
- Header, cards y textos se ven comerciales.

### Socios

- `/dashboard/socios`
- modales de crear/ver/editar socio

Validar:

- No aparecen rutas de archivo sobre modales.
- Botones y mensajes son entendibles para el cliente.

### Pagos

- `/dashboard/pagos`
- modal de registro de pago manual

Validar:

- No aparecen badges sobre el modal.
- Descuentos/bonificaciones se explican con copy comercial.

### Actividades

- `/dashboard/actividades`

Validar:

- No aparece badge QA en el encabezado.
- Formulario de turno queda limpio.
- Ubicaciones, cupos y lista de espera se entienden sin contexto tecnico.

### Ranking y bonificacion

- `/dashboard/socios-ranking-bonificacion`

Validar:

- No aparece badge de archivo.
- Ranking mensual, bonificacion y bloqueo por pago se muestran con lenguaje de negocio.

### Equipamientos

- `/dashboard/equipamientos`

Validar:

- No aparecen rutas internas en filtros, tablas o modales.
- Reporte PDF mantiene lenguaje comercial.

### Parametrizacion

- `/dashboard/parametrizacion`
- `/dashboard/gimnasio-parametrizacion`

Validar:

- El hero de catalogos no muestra la leyenda tecnica removida.
- Textos son entendibles para configuracion del gimnasio.
- Stripe test/sandbox solo aparece donde corresponde como configuracion tecnica consciente.

### Ventas

- `/dashboard/ventas`

Validar en esta feature solamente:

- No aparecen badges QA ni rutas internas.

Observacion funcional registrada para proxima correccion: el modulo carga ventas, pero no trae el historial/listado. Debe tratarse como fix separado para no mezclar limpieza de copy con comportamiento de datos.

### Swagger

- `/swagger`

Validar:

- No aparece `/api/test-alertas` por defecto.
- No aparece copy de prueba o testing interno en endpoints publicos.

## Validacion tecnica sugerida

```bash
npm run build
npm run test:e2e
```

## Busquedas de control sugeridas

```bash
grep -R "QA:" -n src || echo "OK: sin QA visible"
grep -R "Ruta no mapeada" -n src || echo "OK: sin ruta no mapeada visible"
grep -R "activos/demo" -n src || echo "OK: sin wording demo visible"
grep -R "Consulta y administración base de catálogos reales" -n src || echo "OK: sin leyenda tecnica de parametrizacion"
```

## Resultado esperado

- Aplicacion sin badges tecnicos por defecto.
- Swagger sin endpoint interno de pruebas por defecto.
- Parametrizacion sin leyenda tecnica en el hero.
- Copy general mas comercial.
- Roadmap manual disponible para recorrer pantallas limpias.
