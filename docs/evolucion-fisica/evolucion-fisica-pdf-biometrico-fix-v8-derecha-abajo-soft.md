# Evolucion Fisica PDF Biometrico - Fix v8 derecha/abajo soft

## Objetivo
Ajustar el encuadre fino de la silueta soft/robusta en el PDF biometrico para moverla apenas a la derecha y un poco hacia abajo, manteniendo la escala y la proporcion logradas en la iteracion anterior.

## Cambios aplicados
- incremento suave del offset horizontal en variante soft;
- reduccion leve del bottom inset para bajar la silueta dentro del panel;
- sin cambios en la logica general del layout.

## Archivo modificado
- `src/utils/evolucionFisicaPdf.ts`

## Resultado esperado
- la silueta izquierda del PDF queda mejor centrada respecto al circulo del core;
- los pies quedan mejor apoyados sobre la plataforma;
- la altura y presencia visual se mantienen cercanas a la silueta derecha.
