# i18n navigation menus final sweep v10 - routine assistant example fix

## Objetivo

Corregir el ejemplo del hero de `/dashboard/rutinas/asistente` que seguía visible en Español cuando el idioma activo era Inglés.

## Caso corregido

- `“Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.”`
- `"Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia."`
- `Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.`

## Traducción

`“I want to gain muscle mass, train 6 days, prioritize back and shoulders. I am intermediate and I have lower back pain.”`

## Motivo

La frase se renderiza como ejemplo con comillas y mayúscula inicial, por lo que no coincidía con la variante previa ya existente en el sweep.

## Alcance

- Solo frontend/i18n.
- No toca DB.
- No toca endpoints.
- No toca Swagger/OpenAPI.
- No modifica lógica funcional del asistente de rutinas.
