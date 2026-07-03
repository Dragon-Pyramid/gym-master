# Ficha médica socio context polish v1

## Objetivo

Ajustar la experiencia de `/dashboard/ficha-medica` cuando ingresa un socio, evitando que vea métricas operativas pensadas para administración.

## Cambios

- El hero mantiene métricas administrativas únicamente para roles `admin` y `usuario`.
- Para rol `socio`, el encabezado cambia a una lectura personal:
  - `Mi ficha médica`.
  - `Mi control médico`.
  - Accesos/contexto de `Actual`, `Nueva` e `Historial`.
- Se eliminan del modo socio los indicadores no relevantes:
  - `Modo Socio`.
  - `Socios`.
  - `Activos`.
  - `Revisión Lista`.
- El panel administrativo, selector de socios y métricas globales se preservan para admin/usuario.

## Alcance

No modifica base de datos, endpoints ni permisos. Es un ajuste de presentación condicional por rol.
