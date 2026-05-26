# Feature: profile-photo-camera-upload

## Resumen

Se mejora la actualización de foto de perfil en Gym Master para que el usuario pueda cargar su imagen desde celular con dos opciones:

- Subir una imagen existente desde el dispositivo.
- Sacar una foto directamente con la cámara del celular.

## Alcance

La mejora aplica al perfil del usuario autenticado y mantiene la integración existente con Cloudinary y la actualización de foto en `usuario`. Cuando el usuario autenticado es socio, también se actualiza la foto vinculada en `socio`.

## Cambios principales

- Se reemplaza el botón único de cambio de imagen por dos acciones:
  - **Subir foto**
  - **Sacar foto**
- Se agrega vista previa antes de guardar.
- Se permite cancelar la selección antes de subir.
- Se validan tamaño y formato de imagen en frontend y backend.
- Se actualiza el estado local de sesión para refrescar el avatar sin reloguear.
- Se mantiene fallback por inicial del usuario cuando no hay foto.

## Validaciones

Formatos aceptados:

- PNG
- JPG/JPEG
- WEBP
- GIF
- SVG
- HEIC/HEIF

Tamaño máximo:

- 5 MB

## Endpoints impactados

```txt
POST /api/file-upload
```

No se agregan migraciones ni cambios de base de datos.

## Consideraciones

La captura con cámara utiliza `input type="file"` con `capture="user"`, por lo que en navegadores móviles compatibles se abre la cámara del dispositivo. En escritorio o navegadores sin soporte, el comportamiento puede caer al selector de archivos.

## Pruebas sugeridas

1. Entrar como socio.
2. Ir a Perfil.
3. Usar "Subir foto".
4. Ver vista previa.
5. Guardar.
6. Confirmar que se actualiza el avatar.
7. Repetir desde celular usando "Sacar foto".
8. Verificar que la foto se refleje en perfil, header y vistas que consuman `foto`.
