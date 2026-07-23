# i18n ES/EN final QA — Admin, Master Admin, usuarios y notificaciones — batch v2

## Objetivo

Cerrar el segundo bloque del recorrido final ES/EN sobre las superficies administrativas de Gym Master, priorizando textos visibles, estados comerciales, advertencias, acciones, fechas, monedas, errores, accesibilidad y persistencia del idioma.

## Alcance auditado

- Dashboard administrador.
- Panel Master Admin de licencia y control comercial Dragon Pyramid.
- Usuarios, permisos y exportaciones asociadas.
- Centro de notificaciones y sus componentes.
- Mensajes de socios para administración.
- Preferencias y configuración de usuario.
- Header, sidebar y cambio de idioma.
- Aviso de licencia Dragon Pyramid mostrado en el dashboard administrador.

## Hallazgos

### Hallazgo principal corregido

El panel `/dashboard/masteradmin/license` permanecía fijado en español. La deuda incluía:

- títulos, descripciones y etiquetas;
- estados de licencia y pago;
- ayudas de selectores;
- confirmaciones y toasts;
- acciones rápidas comerciales;
- advertencias de gracia, vencimiento, suspensión y cancelación;
- fechas y monedas con formato fijo `es-AR`;
- placeholders y estados de carga;
- textos generados por las acciones comerciales;
- ausencia de selector de idioma dentro del panel Master Admin.

### Hallazgo transversal corregido

El dashboard administrador solicitaba `/api/dragon-pyramid/license/warning` sin transmitir el idioma activo. Como consecuencia, el aviso podía aparecer en español aunque la interfaz estuviera en inglés.

La llamada ahora envía el header estándar `Accept-Language: es|en`. El endpoint normaliza ese valor y genera título, mensaje y detalle en el idioma solicitado, manteniendo español como fallback seguro.

### Ajustes menores

- El `alt` del logo del header utiliza la clave accesible `common.logoAlt`.
- La tarjeta de Terminal del centro de notificaciones declara explícitamente su salida ES/EN.
- La descripción OpenAPI del endpoint de advertencia refleja el header de idioma y el comportamiento operativo actual.

## Superficies auditadas sin cambios funcionales

Las siguientes superficies ya respetaban el locale mediante `useI18n`, helpers locales o claves del diccionario:

- `/dashboard/admin`;
- `/dashboard/usuarios` y sus modales/tablas;
- `/dashboard/notificaciones` y sus modales/tablas;
- `/dashboard/mensajes-admin`;
- `/dashboard/settings/preferences`;
- navegación lateral y encabezados relacionados.

No se agregaron cambios artificiales donde el barrido no encontró deuda real.

## Archivos modificados

- `src/app/api/dragon-pyramid/license/warning/route.ts`
- `src/app/dashboard/masteradmin/license/page.tsx`
- `src/app/dashboard/notificaciones/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/header/AppHeader.tsx`
- `src/i18n/masterAdminLicenseLabels.ts`
- `src/lib/swagger/openApiSpec.ts`
- `src/services/apiClient.ts`
- `src/utils/dragonPyramidLicenseWarning.ts`
- `docs/i18n/i18n-es-en-final-qa-v1-admin-masteradmin-users-notifications-batch-v2.md`

## Decisiones de diseño

- Se centralizaron los textos específicos de licencia Master Admin en `src/i18n/masterAdminLicenseLabels.ts`.
- La firma de `buildDragonPyramidGraceWarning` acepta un locale opcional y conserva `es` como valor predeterminado para no romper consumidores existentes.
- No se traducen nombres del cliente, planes, notas o motivos ya almacenados. Esos valores permanecen en su idioma original.
- Los nuevos textos que genera una acción rápida se guardan en el idioma activo porque son contenido producido por Gym Master, no datos ingresados previamente por el cliente.
- El endpoint mantiene su ruta, método, autorización y forma de respuesta. Solo incorpora localización mediante un header HTTP estándar.

## Sin cambios

- Base de datos.
- Migraciones.
- RLS, políticas o RPC.
- Storage.
- Contratos de persistencia.
- Roles o reglas de autorización.
- Lógica de suspensión/reactivación.
- Integraciones externas.

## Validaciones estáticas realizadas

- Parseo TypeScript/TSX de los archivos modificados: correcto.
- Paridad de claves ES/EN del catálogo Master Admin: 167/167.
- Claves duplicadas: ninguna.
- Referencias a claves inexistentes: ninguna.
- Escaneo de literales visibles en el bloque auditado: sin residuos reales.
- Revisión de diff para evitar cambios masivos por finales de línea: correcta.

## QA manual recomendado

### Master Admin

1. Ingresar por `/auth/login/masteradmin`.
2. Abrir `/dashboard/masteradmin/license`.
3. Cambiar ES → EN desde el nuevo selector del header y volver EN → ES.
4. Verificar títulos, tarjetas, estados, ayudas, botones, placeholders, fechas y monedas.
5. Probar cada acción rápida con datos de prueba:
   - al día;
   - trial;
   - gracia;
   - vencido;
   - suspender;
   - cancelar;
   - reactivar después del pago.
6. Confirmar que diálogos, loaders y toasts respeten el idioma activo.
7. Verificar mobile, desktop y dark mode.

### Dashboard administrador

1. Iniciar sesión como administrador.
2. Configurar un estado que produzca advertencia de licencia.
3. Abrir `/dashboard` en español y comprobar el aviso.
4. Cambiar a inglés y verificar que el aviso se vuelva a solicitar y aparezca completamente en inglés.
5. Volver a español y repetir la validación.
6. Revisar Network y confirmar `Accept-Language: es` o `Accept-Language: en` en la solicitud de warning.

### Regresión rápida

- `/dashboard/usuarios`
- `/dashboard/notificaciones`
- `/dashboard/mensajes-admin`
- `/dashboard/settings/preferences`

En cada pantalla comprobar ES/EN, mobile, dark mode, estados vacíos, errores y ausencia de scroll horizontal.
