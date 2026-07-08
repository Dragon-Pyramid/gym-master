# i18n ES/EN admin dashboard v1

## Objetivo
Completar la internacionalización inicial ES/EN de la experiencia visible del dashboard administrador.

## Alcance
- Dashboard principal cuando el usuario autenticado tiene rol `admin`.
- Hero ejecutivo, métricas operativas y accesos rápidos.
- Cards de estado operativo, puntualidad de pagos, ingresos del período y riesgo técnico.
- Bandeja de entrada de mensajes de socios.
- Cards y gráficos de equipamiento, fallos y pagos.
- Alertas de parametrización del gimnasio y aviso comercial Dragon Pyramid.
- Página legacy `/dashboard/admin`.
- Sidebar desktop/mobile con grupos e ítems visibles para administrador.

## Decisiones técnicas
- Se usa la foundation i18n existente (`useI18n`, `dictionaries.ts`).
- No se cambian rutas, permisos ni estructura del menú.
- No se agregan dependencias.
- No se agregan endpoints.
- No se modifica Swagger/OpenAPI.
- No se requiere migración de base de datos.

## QA sugerido
- Validar `/dashboard` como administrador en ES y EN.
- Validar sidebar desktop con idioma Inglés.
- Validar mobile/F12 y menú lateral.
- Validar modo claro/oscuro.
- Confirmar que no haya mezcla ES/EN en textos fijos del dashboard administrador.
- Confirmar que nombres de datos provenientes de BD se mantienen como contenido de usuario/sistema.
