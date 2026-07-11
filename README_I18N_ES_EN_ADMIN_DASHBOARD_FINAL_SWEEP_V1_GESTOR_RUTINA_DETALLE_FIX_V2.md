# Patch - i18n ES/EN admin dashboard final sweep v1 - gestor rutina detalle fix v2

## Objetivo
Cerrar residuos de nombres de ejercicios semilla/demo en español dentro de `/dashboard/gestor-rutinas/rutina/[idRutina]` cuando el idioma activo es Inglés.

## Cambios
Se amplió el mapa de traducción de presentación de ejercicios en `RutinaDisplay.tsx`, sin tocar datos persistidos, DB, endpoints, Swagger ni PDF.

## Ejercicios agregados/cubiertos
- Flexiones asistidas -> Assisted push-ups
- Aperturas con mancuernas livianas -> Light dumbbell flyes
- Elevaciones laterales livianas -> Light lateral raises
- Press inclinado con mancuernas livianas -> Light dumbbell incline press
- Remo con mancuerna liviana -> Light dumbbell row
- Jalón al pecho liviano -> Light lat pulldown
- Puente de glúteos -> Glute bridge
- Peso muerto rumano liviano -> Light Romanian deadlift
- Zancadas asistidas -> Assisted lunges
- Curl de bíceps con mancuernas livianas -> Light dumbbell biceps curl

## Archivo modificado
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`
