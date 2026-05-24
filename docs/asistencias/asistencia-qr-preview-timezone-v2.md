# Fix asistencia QR preview/timezone v2

## Objetivo

Corregir los tres problemas detectados después del deploy de asistencia/control de acceso:

1. El preview de cámara en móvil se veía gris aunque el QR escaneaba.
2. La hora quedó adelantada una hora después del primer fix.
3. El splash de bienvenida ya no aparecía en la pantalla del administrador, aunque la lista de asistencias recientes sí se actualizaba.

## Cambios aplicados

### Preview QR

Se reemplaza el render del lector basado en `react-qr-reader` por un flujo controlado con:

- `navigator.mediaDevices.getUserMedia`;
- elemento `<video>` nativo;
- `BarcodeDetector` del navegador para detectar QR;
- botón **Reintentar** que reinicia cámara y detector.

Esto apunta a corregir el cuadro gris en Chrome móvil, manteniendo el escaneo por QR.

### Hora local Argentina

Se elimina la dependencia de `Intl.DateTimeFormat` del runtime para calcular la hora operativa.

Ahora se calcula la fecha/hora Argentina con offset fijo UTC-03, evitando diferencias entre:

- local;
- Vercel;
- navegador móvil;
- ICU/timezone del runtime.

También se evita convertir `hora_ingreso` a `Date` al mostrarla en la tabla de asistencias recientes. La hora se imprime como string `HH:MM:SS` guardado por backend.

### Splash admin

Se mejora `AsistenciasRecientesTable` para detectar asistencias nuevas incluso si el primer fetch de la tabla ocurre justo después del escaneo.

Antes, si la tabla se montaba o refrescaba cuando la asistencia nueva ya estaba como primer registro, se tomaba como baseline y no disparaba `onNewAsistencia`.

Ahora, si el primer registro es muy reciente, se dispara el splash admin. También se reduce el polling de fallback a 2.5 segundos.

## Archivos modificados

- `src/components/ui/RegistrarAsistenciaQR.tsx`
- `src/components/ui/asistencias-recientes-table.tsx`
- `src/app/dashboard/page.tsx`
- `src/services/asistenciaService.ts`
- `src/lib/swagger/openApiSpec.ts`

## Validación requerida

Probar en deploy Vercel desde celular:

1. Admin abre QR del día.
2. Socio escanea desde Chrome móvil.
3. Verificar que el preview de cámara muestre video.
4. Verificar que la asistencia se registre.
5. Verificar que la hora no aparezca adelantada.
6. Verificar que el splash aparezca también en pantalla admin.
7. Probar socio al día y socio con deuda.

## Fuera de alcance

- Desactivación automática por mora de 7 días.
- Bloqueo en login para socio desactivado por mora.
- Biometría o reconocimiento facial.
