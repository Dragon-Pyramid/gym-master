# Gym Master — YouTube Auto Discovery Candidate Selection

## Objetivo

Mejorar el descubrimiento automático de videos de YouTube para ejercicios evitando que se guarden videos incorrectos por tener muchas vistas.

## Cambios

- El modo preview permite desmarcar candidatos incorrectos antes de guardar.
- El botón `Aplicar seleccionados` aplica solo los candidatos marcados.
- Los candidatos desmarcados no se guardan en la base.
- El auto-discovery mejora el scoring para evitar confusiones frecuentes, por ejemplo `press plano con barra` vs. `leg press` / prensa de piernas.
- Los videos aplicados siguen quedando como `sugerido`, no `validado`, para revisión administrativa.
- Se mantiene la regla de no pisar videos existentes.

## Flujo recomendado

1. Ejecutar preview con lote chico.
2. Revisar candidatos.
3. Desmarcar videos que no coinciden con el ejercicio.
4. Aplicar seleccionados.
5. Repetir por corridas.

## Nota

Este flujo no reemplaza la revisión humana. Automatiza la curación inicial y evita ensuciar la base con candidatos evidentemente incorrectos.
