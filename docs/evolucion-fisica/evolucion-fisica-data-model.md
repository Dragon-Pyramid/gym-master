# Evolución física - Data Model

## Objetivo

Esta feature amplía el modelo de datos de evolución física de Gym Master sobre la tabla existente `public.evolucion_socio`.

No se crea una tabla nueva porque la base ya cuenta con una estructura inicial útil.

## Campos agregados

Se agregan métricas corporales avanzadas:

- pecho
- cadera
- abdomen
- cuello
- hombros
- antebrazos
- bíceps izquierdo/derecho
- tríceps izquierdo/derecho
- muslos
- pantorrillas
- porcentaje de grasa
- masa muscular

También se agregan campos de clasificación y visualización:

- tipo corporal
- sexo de referencia
- foto frontal
- foto lateral
- foto espalda
- origen del registro
- registro inicial
- actualizado en

## Tipo corporal

Valores permitidos:

- ectomorfo
- mesomorfo
- endomorfo
- mixto

## Registro inicial

El campo `es_registro_inicial` permitirá identificar el primer registro corporal del socio. Ese registro será la referencia estática para futuras comparaciones antes/después.

## Próximas features dependientes

- `feature/evolucion-fisica-demo-seeds`
- `feature/evolucion-fisica-silueta-dinamica`
- `feature/evolucion-fisica-pdf-export`
