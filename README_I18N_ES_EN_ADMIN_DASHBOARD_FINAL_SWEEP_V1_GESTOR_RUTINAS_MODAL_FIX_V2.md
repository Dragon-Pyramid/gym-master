# Patch - i18n ES/EN admin dashboard final sweep v1 - gestor rutinas modal fix v2

## Objetivo
Completar la traducción de opciones de objetivo que llegan como datos/catálogos en el modal de generación de rutina.

## Ruta impactada
- `/dashboard/gestor-rutinas`

## Cambio principal
Se amplió el mapa de traducción de objetivos en `RutinasForm.tsx` para cubrir opciones que permanecían en español en el dropdown cuando el idioma activo era inglés:

- Rehabilitación física → Physical rehabilitation
- Salud general → General health
- Preparación para competencia → Competition preparation
- Condición física postparto → Postpartum physical conditioning
- Condición physical postpartum → Postpartum physical conditioning
- Control del estrés → Stress management

## Archivo modificado
- `src/components/forms/RutinasForm.tsx`

## Notas
- No cambia valores guardados en DB.
- No toca endpoints, servicios, Swagger/OpenAPI ni la lógica de generación.
- Traduce únicamente la presentación del catálogo en el selector.
