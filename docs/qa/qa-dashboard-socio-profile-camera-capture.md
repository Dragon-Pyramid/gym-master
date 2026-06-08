# QA Dashboard Socio — Captura real de foto de perfil

## Rama

`feature/qa-dashboard-socio-recorrido-general`

## Objetivo

Corregir el flujo de **Editar mi perfil** para que las acciones de imagen tengan comportamientos distintos:

- **Subir foto:** abre el explorador/galería del dispositivo.
- **Sacar foto:** abre la cámara real cuando el navegador lo permite.

## Alcance

- Se agregó apertura de cámara con `navigator.mediaDevices.getUserMedia`.
- Se agregó modal de cámara con preview en vivo.
- Se agregó captura a `canvas` y conversión a `File` JPG.
- La foto capturada usa el mismo flujo de vista previa y guardado existente.
- Se mantiene fallback al input con `capture="user"` cuando el navegador no permite cámara directa.
- No requiere migración de base de datos.
- No modifica endpoints ni Swagger/OpenAPI.

## Checklist QA

1. Entrar como socio.
2. Ir a **Editar mi perfil**.
3. Usar **Subir foto** y verificar que abre archivos/galería.
4. Usar **Sacar foto** y verificar que abre cámara o modal de cámara.
5. Capturar foto.
6. Ver preview.
7. Guardar foto.
8. Verificar que la imagen se actualiza correctamente.
9. Probar fallback en navegador sin permisos de cámara.
