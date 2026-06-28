# Socio Mobile Bottom Navigation v1

## Objetivo

Agregar una barra de navegación inferior mobile para el perfil **socio**, con experiencia tipo app nativa y accesos rápidos a las secciones principales.

## Alcance

- Visible solo en mobile.
- Visible solo para usuarios con rol `socio`.
- Oculta para `admin` y `usuario`.
- Detecta ruta activa.
- No modifica backend ni base de datos.
- Mantiene desktop sin cambios.

## Accesos incluidos

- Inicio: `/dashboard`
- Rutina: `/dashboard/rutinas/asistente`
- Dieta: `/dashboard/dietas`
- Pagos: `/dashboard/mi-cuenta/pagar-cuota`
- Perfil: `/dashboard/perfil`

## Archivos modificados

- `src/components/header/AppHeader.tsx`
- `src/components/navigation/SocioMobileBottomNavigation.tsx`
- `src/app/globals.css`

## Cambios técnicos

### Nuevo componente

Se agrega `SocioMobileBottomNavigation`, un componente client-side que:

- lee el rol desde `useAuthStore`;
- detecta mobile con `useIsMobile`;
- detecta ruta activa con `usePathname`;
- agrega/remueve la clase `gm-socio-bottom-nav` en `body` para reservar espacio inferior.

### Integración

Se integra desde `AppHeader`, porque todas las pantallas dashboard relevantes ya renderizan header dentro del `SidebarProvider`.

### Safe area

Se contempla `env(safe-area-inset-bottom)` para celulares con barra inferior o notch.

## Validación sugerida

1. Ejecutar `npm run build`.
2. Iniciar sesión como socio.
3. Probar en mobile:
   - `/dashboard`
   - `/dashboard/rutinas/asistente`
   - `/dashboard/dietas`
   - `/dashboard/mi-cuenta/pagar-cuota`
   - `/dashboard/perfil`
4. Confirmar que la opción activa se resalta correctamente.
5. Confirmar que la barra no tapa contenido.
6. Confirmar que admin y usuario interno no ven la barra.
7. Confirmar que desktop no cambia.
