# i18n ES/EN socio dashboard v1

## Rama

`feature/i18n-es-en-socio-dashboard-v1`

## Objetivo

Completar la base de internacionalización ES/EN sobre la experiencia inicial del socio, especialmente el dashboard mobile/PWA que usa el cliente final al ingresar a Gym Master.

## Alcance

- Se amplió el diccionario `socioDashboard` para textos visibles del socio.
- Se internacionalizó el home del socio en `/dashboard`.
- Se internacionalizaron cards mobile de:
  - accesos rápidos;
  - cuota, pagos y recibos;
  - QR/asistencia;
  - rutina/dieta del día;
  - actividades/agenda;
  - evolución física;
  - ficha médica;
  - mensajería/soporte.
- Se internacionalizó la navegación inferior mobile del socio.
- Se internacionalizaron banners PWA de instalación, conexión y actualización.
- Se mantuvo fallback seguro a Español cuando alguna clave futura no exista en Inglés.

## Archivos principales

- `src/i18n/dictionaries.ts`
- `src/components/dashboard/DashboardInitialContent.tsx`
- `src/components/dashboard/socio/SocioMobileAsistenciaQrCard.tsx`
- `src/components/dashboard/socio/SocioMobileMensajeriaSoporteCard.tsx`
- `src/components/dashboard/socio/SocioMobilePagosRecibosCard.tsx`
- `src/components/dashboard/socio/SocioMobileSaludFichaMedicaCard.tsx`
- `src/components/dashboard/socio/SocioMobileActividadesAgendaCard.tsx`
- `src/components/dashboard/socio/SocioMobileTodayPlan.tsx`
- `src/components/dashboard/evolucion-fisica/SocioEvolucionProgressInsights.tsx`
- `src/components/navigation/SocioMobileBottomNavigation.tsx`
- `src/components/pwa/SocioPwaInstallPrompt.tsx`
- `src/components/pwa/PwaConnectionUpdateBanner.tsx`

## Fuera de alcance

- No se agregan migraciones.
- No se modifica base de datos.
- No se agregan endpoints.
- No se modifica Swagger/OpenAPI.
- No se traduce todavía todo el módulo admin/comercial; queda para features posteriores del roadmap.

## QA sugerido

1. Entrar como socio a `/dashboard`.
2. Cambiar idioma a Español y validar textos del home mobile.
3. Cambiar idioma a Inglés y validar:
   - saludo;
   - estado de cuota;
   - accesos rápidos;
   - QR/asistencia;
   - rutina/dieta del día;
   - actividades;
   - evolución física;
   - ficha médica;
   - mensajes;
   - navegación inferior;
   - banners PWA.
4. Recargar y confirmar persistencia de idioma.
5. Probar F12 mobile y salida a desktop.
6. Confirmar sin scroll horizontal y sin espacio blanco después del footer.
7. Ejecutar `npm run build`.
