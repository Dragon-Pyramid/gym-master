# Socio Mobile Home App-Like v1

## Objetivo

Convertir la experiencia inicial del socio en celular en una pantalla tipo app, más directa y accionable.

La mejora se aplica sobre el dashboard del socio sin tocar backend, base de datos ni servicios existentes.

## Ruta impactada

- `/dashboard` cuando el usuario autenticado tiene rol `socio`.

## Cambios principales

### Home mobile exclusiva para socio

Se agrega una experiencia `md:hidden` para socios:

- hero compacto con foto, saludo y nombre;
- estado de cuota visible;
- acción principal para pagar cuota o ver historial;
- aviso de ficha médica pendiente;
- accesos rápidos tipo app;
- bloque de plan de acción diario;
- frase motivacional compacta.

### Compatibilidad desktop

La experiencia desktop existente se conserva para el socio en pantallas medianas y grandes.

Para evitar duplicación visual en celulares, el hero anterior queda oculto solo para socios mobile.

### Accesos rápidos

La home mobile prioriza:

- cuota / pagos;
- QR / asistencia;
- Coach IA;
- rutina;
- dieta;
- evolución física;
- ficha médica;
- mensajes.

### UX mobile

- botones grandes para uso con el pulgar;
- cards con alto táctil suficiente;
- layout mobile-first;
- textos cortos;
- navegación directa a las secciones principales.

## Archivos modificados

- `src/components/dashboard/DashboardInitialContent.tsx`

## Validación sugerida

1. Ejecutar `npm run build`.
2. Ingresar como socio.
3. Probar `/dashboard` en vista mobile.
4. Verificar:
   - hero compacto;
   - estado de cuota;
   - botón de pago/historial;
   - accesos rápidos;
   - plan de acción;
   - sin duplicación del dashboard anterior en mobile.
5. Probar desktop como socio y confirmar que mantiene la vista anterior.
6. Probar usuario interno y confirmar que no se altera su dashboard.
