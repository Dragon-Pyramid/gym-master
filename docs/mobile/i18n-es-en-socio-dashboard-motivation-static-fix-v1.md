# i18n ES/EN socio dashboard motivation static fix v1

## Objetivo
Eliminar el salto visual/palpitar del hero desktop del dashboard socio.

## Diagnóstico
El hero tenía una card de frase motivacional que rotaba automáticamente cada 5 segundos mediante `setInterval` y `setTimeout`. Cada rotación cambiaba la longitud del texto, disparaba fade/translate y podía modificar la altura del bloque, generando la sensación de que el hero se agrandaba y achicaba.

## Ajuste realizado
- Se eliminó la rotación automática de frases motivacionales.
- Se reemplazó el índice aleatorio por un índice determinístico por usuario/sesión.
- Se quitó el fade/translate del blockquote.
- Se agregó altura mínima estable para la card de frase en mobile y desktop.
- Se removió `animate-pulse` del punto decorativo de la frase desktop.

## Alcance
No toca DB, endpoints, permisos, Swagger/OpenAPI ni lógica de negocio.
