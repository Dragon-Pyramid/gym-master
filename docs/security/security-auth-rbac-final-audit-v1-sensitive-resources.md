# Security Auth & RBAC Final Audit v1 — recursos sensibles y propiedad

## Rama

`feature/security-auth-rbac-final-audit-v1`

## Bloque

Bloque 3 — datos personales, propiedad del socio y aislamiento de Master Admin.

## Objetivo

Impedir que un JWT autenticado sea suficiente para consultar o modificar recursos sensibles. Cada operación debe validar, según corresponda:

1. identidad autenticada;
2. rol permitido;
3. permiso del módulo;
4. socio objetivo;
5. propiedad del recurso;
6. exposición mínima de datos.

## Hallazgos corregidos

### Socios y pagos

- El detalle `/api/socios/[id]` podía consultar un socio por ID sin comprobar que un usuario con rol `socio` estuviera solicitando su propio registro.
- `/api/pagos/[id]` no tenía una frontera Auth/RBAC equivalente a la colección de pagos.
- Las colecciones de socios y pagos validaban autenticación, pero no aplicaban de manera uniforme el permiso del módulo.
- El historial `/api/mi-cuenta/pagos` ahora queda reservado al rol `socio` y filtra por el socio resuelto desde el JWT o desde la relación `usuario_id`.
- La verificación pública de recibos conserva su propósito, exige código válido y deja de exponer el correo electrónico del socio.

### Rutinas

- La generación aceptaba un `id_socio` enviado por el cliente antes de consolidar la identidad propia del socio autenticado.
- El historial por socio no rechazaba de forma uniforme una consulta cruzada.
- Los usuarios internos autorizados no eran tratados consistentemente como gestores en todas las operaciones.

Ahora el socio siempre se resuelve desde su JWT o relación de usuario; un ID distinto produce `403`. Los roles `admin` y `usuario` requieren el permiso de Rutinas.

### Dietas

Las lecturas, generación y consulta por ID ahora validan el socio propietario. Un socio no puede usar un ID de dieta o de socio perteneciente a otra persona. La consulta global queda reservada a gestores autorizados.

### Evolución física

Las altas y consultas resuelven el socio propio incluso cuando el JWT no contiene `id_socio`. Un `socio_id` enviado por el cliente no puede reemplazar la identidad autenticada. Las consultas administrativas requieren el permiso del Gestor de evolución física.

### Ficha médica

Todas las rutas de ficha actual, historial, detalle y actualización aplican autorización personal o permiso administrativo. El servicio mantiene la validación de relación entre usuario y socio antes de devolver o modificar información clínica.

### Mensajes y notificaciones

- Mensajes administrativos: permiso `/dashboard/mensajes-admin`.
- Mensajes personales: rol socio y permiso `/dashboard/mensajes`.
- Centro, plantillas, detalle y envío de notificaciones: permiso `/dashboard/notificaciones`.
- Notificaciones del header: sesión autenticada y respuesta 401 tipada.

### Analítica sensible

Se endurecieron los endpoints de:

- BI demográfico y promociones;
- ranking mensual y bonificaciones;
- métricas de pagos/finanzas;
- métricas y generación administrativa de rutinas.

Cada familia exige el permiso exacto de su pantalla además del rol `admin` o `usuario`.

### Master Admin y licencia Dragon Pyramid

La consulta, edición y reactivación de licencia exigen explícitamente:

- rol `masteradmin`;
- acceso a `/dashboard/masteradmin/license`;
- respuestas tipadas 401/403.

El aviso de licencia continúa limitado a `admin` y `masteradmin`. El estado de suspensión conserva una respuesta reducida para socios, sin detalles internos ni nombre del cliente.

### Archivos y fotografías

La foto de perfil se carga en una carpeta derivada del rol autenticado y se asigna al mismo usuario del JWT. Los errores de autenticación se preservan como 401. Las cargas administrativas especializadas conservan sus controles de rol y tamaño/tipo de archivo.

## Verificación automática

```bash
npm run test:auth-rbac
```

El gate comprueba:

- middleware JWT y aislamiento de Terminal;
- 40 rutas heredadas del Bloque 2;
- 24 rutas sensibles con rol y permiso de dashboard;
- 20 rutas personales con alcance de socio o gestión autorizada;
- propiedad en rutinas, dietas, evolución, ficha médica, detalle de socio y pagos;
- aislamiento de Master Admin;
- redacción del recibo público;
- actualización de foto del usuario autenticado.

## QA manual requerido

Probar la matriz con:

- Master Admin;
- administrador;
- usuario interno con permiso;
- usuario interno sin permiso;
- socio propietario;
- socio intentando usar el ID de otro socio;
- ausencia de token;
- token de Terminal fuera de su alcance.

Validar especialmente respuestas `200`, `401` y `403`, ausencia de `500` por autorización y ausencia de datos parciales antes del rechazo.

## Límites del bloque

Este endurecimiento se ejecuta en API Routes y servicios del servidor. No reemplaza la protección de base de datos. El aislamiento multi-tenant, las políticas RLS y las operaciones directas contra Supabase se revisarán en:

`feature/database-rls-final-audit-v1`

## Base de datos

No se agregan migraciones, tablas, políticas RLS, RPC ni cambios de datos persistidos.
