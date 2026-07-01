# Socio mobile salud ficha médica card v1

## Rama

`feature/socio-mobile-salud-ficha-medica-card-v1`

## Objetivo

Agregar al dashboard mobile del socio una tarjeta de `Mi salud / Ficha médica` para que la información médica básica esté visible desde el home de la app.

## Alcance

- Frontend mobile socio.
- Reutiliza `getFichaMedicaActual` y la ruta `/dashboard/ficha-medica`.
- No agrega tablas, migraciones ni cambios backend.
- No modifica la experiencia de administrador ni usuario interno.

## Cambios principales

- Nueva tarjeta `SocioMobileSaludFichaMedicaCard`.
- Estado de carga y error para la consulta de ficha médica.
- Estado pendiente cuando el socio todavía no cargó ficha.
- Resumen cuando la ficha existe:
  - Apto médico presentado o pendiente de revisión.
  - Próxima revisión médica.
  - Peso, altura e IMC.
  - Datos preventivos principales: alergias, medicación, lesiones, enfermedades crónicas, problemas cardíacos o respiratorios.
- Botón directo a `/dashboard/ficha-medica`.
- Reemplaza el aviso mobile básico de ficha médica pendiente por una tarjeta más completa y permanente.

## QA sugerido

1. Ingresar como socio desde mobile o F12 mobile.
2. Abrir `/dashboard`.
3. Validar que aparece la tarjeta `Mi salud`.
4. Probar socio con ficha médica cargada.
5. Probar socio sin ficha médica cargada.
6. Presionar `Ver ficha médica` o `Cargar ficha médica`.
7. Confirmar navegación a `/dashboard/ficha-medica`.
8. Revisar que desktop conserva el comportamiento anterior.
