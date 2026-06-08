# QA Dashboard Socio — recorrido general

**Fecha:** 2026-06-07  
**Feature:** `feature/qa-dashboard-socio-recorrido-general`

## Alcance del patch

Este ajuste toma el primer relevamiento del menú de socio y corrige problemas detectados durante el recorrido funcional.

### 1. Estado de cuota en dashboard del socio

Se reemplazó la lectura legacy de `/api/cuota-estado`, que esperaba campos antiguos como `pagada`, `monto` y `fecha_limite`, por el contrato real actual del endpoint.

Ahora la card del socio muestra:

- Si está al día:
  - Estado de cuota: **Al día**
  - Monto adeudado: **$ 0**
  - Vencimiento de cuota: fecha real de vencimiento/período hasta.
- Si está vencida o pendiente:
  - Estado de cuota: **Vencida** o **Pendiente**
  - Monto a regularizar estimado desde la cuota vigente.
  - Fecha límite de pago calculada como vencimiento + 7 días de gracia.

El endpoint `/api/cuota-estado` fue enriquecido desde servidor para incluir:

- `vencimiento_cuota`
- `fecha_limite_pago`
- `dias_gracia`
- `monto_adeudado`

### 2. Ficha médica

Se mejoró la experiencia de carga de ficha médica:

- Secciones visuales más claras.
- Select/combo para grupo sanguíneo.
- Inputs nativos de fecha para último control y próxima revisión.
- Cálculo automático de IMC.
- Validación de PDF/JPG/PNG con límite de 5MB por archivo.
- Carga mediante arrastrar archivo o buscar desde computadora/celular.
- Archivo de apto médico separado de adjuntos generales.
- Subida real a Cloudinary usando el backend existente.
- Vista actual modernizada con links claros a certificados y adjuntos.

### 3. Preferencias

Se creó la página base:

```txt
/dashboard/settings/preferences
```

La pantalla es role-aware para socio, usuario interno y administrador. Por ahora guarda preferencias simples en `localStorage` para no agregar una migración prematura de preferencias avanzadas.

### 4. Engranaje de configuración

El icono de configuración superior derecho ahora abre un menú funcional con:

- Mi perfil.
- Preferencias.
- Cambiar contraseña.
- Datos del gimnasio y parametrización para admin.

## Archivos principales

```txt
src/components/dashboard/DashboardInitialContent.tsx
src/services/server/cuotaEstadoServerService.ts
src/interfaces/cuotaEstado.interface.ts
src/app/api/socios/[id]/ficha-medica/route.ts
src/services/fichaMedicaService.ts
src/components/ficha-medica/TabNueva.tsx
src/components/ficha-medica/TabActual.tsx
src/app/dashboard/settings/preferences/page.tsx
src/components/header/AppHeader.tsx
src/lib/swagger/openApiSpec.ts
```

## Validación sugerida

1. Iniciar sesión como socia al día, por ejemplo Laura Fernández.
2. Verificar que dashboard muestre “Al día” y vencimiento de cuota.
3. Iniciar sesión con socio vencido o sin pagos.
4. Verificar monto a regularizar y fecha límite de pago.
5. Entrar a Ficha Médica.
6. Cargar ficha con apto médico PDF/JPG/PNG.
7. Cargar adjuntos adicionales.
8. Verificar que los links aparezcan en “Ficha actual”.
9. Entrar a Preferencias desde menú lateral y engranaje superior.
10. Validar que el engranaje ya no apunte a una ruta inexistente.
11. Ejecutar `npm run build`.

## Ajuste incremental QA — ficha médica, recordatorio y cambio de contraseña

Durante la prueba funcional del dashboard de socio se detectaron tres puntos adicionales:

1. La creación de ficha médica fallaba cuando la pantalla enviaba `usuario.id` en lugar de `socio.id_socio`.
2. El socio sin ficha médica no recibía un recordatorio visible en el dashboard.
3. El acceso a “Cambiar contraseña” desde Preferencias o desde el engranaje redirigía al dashboard cuando el usuario no tenía `must_change_password=true`.

Correcciones aplicadas:

- Resolución server-side de `id_socio` para endpoints de ficha médica. Los endpoints aceptan tanto `id_socio` como `usuario_id` y resuelven el socio real antes de consultar/insertar.
- Eliminación de llamadas client-side a `/api/socios` para resolver la ficha médica, evitando `403` para socios no administradores.
- Uso prioritario de `user.id_socio` en la página de ficha médica.
- Recordatorio visible en el dashboard del socio cuando todavía no tiene ficha médica cargada. El recordatorio aclara que no es obligatoria para ingresar, pero sí es un deber preventivo.
- Descarga de ficha médica en PDF desde la pestaña “Actual”, con membrete simple de Gym Master, datos cargados y enlaces a documentos adjuntos/apto médico.
- Cambio de contraseña habilitado también como acción voluntaria desde Preferencias y desde el engranaje, no solo para el primer ingreso obligatorio.
