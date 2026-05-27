# Uso de ejercicios reales de Gym Master

## Regla principal

El RAG no debe inventar ejercicios para guardar en rutina si no puede mapearlos a ejercicios reales de Gym Master.

## Proceso esperado

```txt
1. RAG propone patrón/ejercicio.
2. Backend busca ejercicio real activo compatible.
3. Si hay match exacto, usa id_ejercicio.
4. Si no hay match exacto, busca alternativa equivalente aprobada.
5. Si no hay alternativa, no guarda ese ejercicio y pide revisión o usa fallback seguro.
```

## Campos relevantes

La selección debe considerar:

- `id_ejercicio`;
- `nombre_ejercicio`;
- `nombre_en`;
- `id_objetivo`;
- `id_nivel`;
- `id_gm` / grupo muscular;
- `tipo_ejercicio`;
- `patron_movimiento`;
- `equipamiento`;
- `dificultad`;
- `activo`;
- media asociada.

## Prioridad de búsqueda

1. Mismo objetivo + mismo nivel + mismo grupo.
2. Mismo objetivo + nivel cercano.
3. Objetivo compatible + mismo ejercicio canónico.
4. Alternativa segura por patrón.

## Reglas

- No usar ejercicios inactivos.
- No duplicar ejercicios equivalentes en el mismo día sin sentido.
- No mezclar variantes peligrosas sin contexto.
- No confundir press banca plano con inclinado si la planificación requiere uno específico.

## Relación con media

Cuando un ejercicio tenga equivalentes, se puede reutilizar media validada, especialmente desde Volumen Avanzado como fuente prioritaria de GIFs/imágenes reales.
