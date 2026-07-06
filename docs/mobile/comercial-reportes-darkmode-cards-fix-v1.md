# Comercial reportes dark mode cards fix v1

## Contexto

Durante QA visual de comercial-reportes-final-polish-v1 se detectó que algunas cards mantenían fondo blanco fijo en modo oscuro, generando bajo contraste.

## Corrección

- Cards BI Packs/Promos con estilos dark mode.
- Cards Finanzas/BI con estilos dark mode.
- Mejor contraste de texto, bordes e iconos.

## Alcance

No modifica DB, endpoints ni Swagger.

## QA

1. Activar modo oscuro.
2. Revisar pack analytics.
3. Revisar finanzas.
4. Confirmar legibilidad de textos y métricas.
