# Fix API routes force dynamic auth

## Objetivo

Limpiar los logs de build/deploy de Vercel relacionados con:

```txt
Dynamic server usage: Route ... couldn't be rendered statically because it used request.headers
```

## Causa

Varias rutas API de Gym Master usan autenticación, `request.headers`, `NextRequest`, cookies, Supabase, JWT o lógica dinámica. Next.js intenta analizar algunas rutas durante build como si fueran estáticas y, al encontrar acceso a headers/request, registra advertencias/errores de uso dinámico.

## Corrección aplicada

Se agrega:

```ts
export const dynamic = 'force-dynamic';
```

en rutas API que dependen de comportamiento dinámico.

Esto indica explícitamente a Next.js/Vercel que esas rutas no deben tratarse como estáticas durante build.

## Alcance

- No cambia reglas de negocio.
- No cambia base de datos.
- No cambia payloads ni contratos de API.
- No cambia componentes visuales.
- No modifica Swagger porque no se agrega ni elimina ningún endpoint.
- Solo ajusta configuración runtime de rutas API.

## Archivos modificados

Total de rutas ajustadas: 58

```txt
src/app/api/asistencias/route.ts
src/app/api/avisos/route.ts
src/app/api/entrenadores/route.ts
src/app/api/file-upload/route.ts
src/app/api/mantenimientos/route.ts
src/app/api/niveles/route.ts
src/app/api/objetivos/route.ts
src/app/api/socios/route.ts
src/app/api/usuarios/route.ts
src/app/api/ventas/route.ts
src/app/api/ventas_detalles/route.ts
src/app/api/ventas/[id]/route.ts
src/app/api/usuarios/[id]/route.ts
src/app/api/usuarios/[id]/perfil/route.ts
src/app/api/socios/[id]/route.ts
src/app/api/socios/[id]/ficha-medica/route.ts
src/app/api/socios/[id]/ficha-medica/actual/route.ts
src/app/api/socios/[id]/ficha-medica/historial/route.ts
src/app/api/socios/[id]/ficha-medica/[id_ficha]/route.ts
src/app/api/servicios/[id]/route.ts
src/app/api/rutina/generar/route.ts
src/app/api/rutina/[idSocio]/route.ts
src/app/api/rutina/historial/[id_socio]/route.ts
src/app/api/proveedores/[id]/route.ts
src/app/api/productos/[id]/route.ts
src/app/api/pagos/[id]/route.ts
src/app/api/mantenimientos/[id]/route.ts
src/app/api/mantenimientos/completado/[id]/route.ts
src/app/api/evolucion_socio/registro/route.ts
src/app/api/evolucion_socio/[socio_id]/route.ts
src/app/api/equipamientos/[id]/route.ts
src/app/api/entrenadores/[id]/route.ts
src/app/api/entrenadores/[id]/horarios/route.ts
src/app/api/dieta/generar/route.ts
src/app/api/dieta/todas/route.ts
src/app/api/dieta/socio/[id]/route.ts
src/app/api/cuota/[id]/route.ts
src/app/api/avisos/[id]/route.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/api/asistencias/qr-dia/route.ts
src/app/api/asistencias/ranking-mensual/route.ts
src/app/api/asistencias/recientes/route.ts
src/app/api/asistencias/registro-qr/route.ts
src/app/api/admin/metricas/retencion_por_combinacion/route.ts
src/app/api/admin/metricas/rutinas/adherencia/route.ts
src/app/api/admin/metricas/rutinas/evolucion-promedio/route.ts
src/app/api/admin/metricas/rutinas/generar-rutina/route.ts
src/app/api/admin/metricas/rutinas/generar-rutina-personalizada/route.ts
src/app/api/admin/metricas/pagos/histograma/route.ts
src/app/api/admin/metricas/pagos/proyeccion-ingresos/route.ts
src/app/api/admin/metricas/pagos/segmentacion/route.ts
src/app/api/admin/metricas/equipamiento/costo-beneficio/route.ts
src/app/api/admin/metricas/equipamiento/estado-actual/route.ts
src/app/api/admin/metricas/equipamiento/prediccion-fallo/route.ts
src/app/api/admin/metricas/equipamiento/top-fallos/route.ts
src/app/api/admin/metricas/asistencia/prediccion-abandono/route.ts
src/app/api/admin/metricas/asistencia/top-inactivos/route.ts
src/app/api/admin/metricas/asistencia/[tipo]/route.ts
```

## Validación recomendada

```bash
npm run build
git restore public/sw.js public/workbox-*.js
git status
```

Luego revisar el siguiente deploy en Vercel y confirmar que disminuyan o desaparezcan los mensajes `DYNAMIC_SERVER_USAGE`.
