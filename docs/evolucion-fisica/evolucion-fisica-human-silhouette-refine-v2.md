# Evolución Física — Human Silhouette Refine v2

## Rama

`feature/evolucion-fisica-before-after-polish-v1`

## Objetivo

Refinar el estudio interactivo antes/después para que la silueta principal se perciba más humana, menos geométrica y más empática para el socio, manteniendo la interactividad por grupos corporales.

## Ajustes realizados

### 1) Silueta principal más humana

Se reemplaza la percepción geométrica del mapa principal combinando:

- una base visual humana frontal usando siluetas PNG existentes del módulo;
- overlays SVG interactivos por grupo corporal;
- diferenciación por sexo (`masculino` / `femenino`);
- variante frontal y posterior;
- soporte para torso femenino con busto y contorno más orgánico.

### 2) Diferenciación por sexo

La silueta ahora prioriza `sexo_referencia` cuando existe en `EvolucionSocio`.

Fallback:

- si no existe `sexo_referencia`, se infiere visualmente una referencia a partir de cintura / pecho / cadera.

### 3) Ocultar la segunda silueta comparativa

Se deja de renderizar temporalmente `EvolucionFisicaHumanSilhouette` dentro de `EvolucionFisicaDashboard.tsx`, manteniendo solo el bloque interactivo principal mientras se consolida la experiencia visual.

## Archivos modificados

- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`
- `src/components/dashboard/evolucion-fisica/EvolucionFisicaDashboard.tsx`

## Resultado esperado

- menor sensación “matemática” o “fría”;
- mejor identificación del socio con la figura corporal;
- continuidad total de la interactividad actual;
- lectura más amigable para frente / espalda;
- base lista para una próxima etapa con assets anatómicos propios más detallados.

## Validación sugerida

1. Entrar al detalle de evolución física de un socio.
2. Confirmar que se renderiza solamente el estudio interactivo principal.
3. Verificar que la silueta frontal se vea más humana.
4. Cambiar entre hombre / mujer usando registros con `sexo_referencia` distinto.
5. Probar vista frente y espalda.
6. Hacer click en hombros, pecho, abdomen, cintura, cadera, brazos y piernas.
7. Confirmar que cambian lectura, deltas y chips de grupo.
8. Validar que slider / superpuesto / heatmap sigan funcionando.

## Próxima iteración sugerida

- incorporar assets anatómicos propios también para vista posterior;
- agregar cabello / contorno femenino más fino para espalda;
- sumar selector manual de sexo de visualización si el registro no lo informa;
- evaluar fotos de progreso con comparador antes/después en una segunda pestaña.
