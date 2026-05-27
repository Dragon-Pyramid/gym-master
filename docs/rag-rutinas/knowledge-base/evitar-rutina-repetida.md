# Evitar rutina repetida

## Objetivo

Cuando un socio pide una rutina nueva, Gym Master Coach debe revisar la rutina activa o la rutina del mes anterior y evitar generar una copia idéntica.

## Comparar

- Días de entrenamiento.
- Grupos musculares por día.
- Ejercicios.
- Orden de ejercicios.
- Series.
- Repeticiones.
- Descansos.
- RPE/intensidad.
- Volumen semanal por grupo.

## Criterio

La nueva rutina puede repetir ejercicios importantes, pero no debe repetir todo el patrón completo.

## Señales de copia excesiva

```txt
Mismos días + mismos grupos + mismos ejercicios + mismo orden + mismas series/reps
```

## Acciones de variación

- Cambiar variantes seguras.
- Cambiar rangos de repeticiones.
- Cambiar distribución semanal.
- Modificar volumen por grupo.
- Agregar foco técnico o accesorio diferente.
- Mantener el ejercicio principal pero variar secundarios.

## Ejemplo aceptable

Si el socio venía haciendo press banca plano, la nueva rutina puede mantenerlo si sigue siendo clave, pero debe variar accesorios, rangos o enfoque.

## Regla para JSON

El RAG debe incluir un campo de auditoría:

```json
{
  "comparacion_rutina_anterior": {
    "rutina_anterior_detectada": true,
    "similitud_estimativa": "media",
    "cambios_aplicados": [
      "se cambiaron variantes de pecho",
      "se ajustaron rangos de repeticiones",
      "se modificó el orden de accesorios"
    ]
  }
}
```
