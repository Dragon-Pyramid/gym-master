# Salida JSON esperada del RAG

## Propósito

Definir un contrato funcional para que el futuro `gym-master-rag-coach` genere salidas compatibles con Gym Master.

## Estructura mínima

```json
{
  "idioma": "es",
  "objetivo": "volumen",
  "nivel": "intermedio",
  "dias_por_semana": 4,
  "resumen": "Rutina de hipertrofia con frecuencia 2 controlada.",
  "criterios_aplicados": [
    "ejercicios compuestos al inicio",
    "frecuencia muscular 2 para torso/pierna",
    "progresión por repeticiones y carga"
  ],
  "dias": [
    {
      "dia": 1,
      "nombre": "Torso A",
      "grupos_musculares": ["Pecho", "Espalda", "Hombros", "Tríceps"],
      "ejercicios": [
        {
          "id_ejercicio": "uuid-o-id-real",
          "nombre": "Press banca plano",
          "orden": 1,
          "series": 4,
          "repeticiones": "6-8",
          "descanso_segundos": 150,
          "rpe": 8,
          "tipo": "compuesto",
          "motivo": "Ejercicio principal ubicado al inicio por demanda técnica y carga."
        }
      ]
    }
  ],
  "progresion": {
    "tipo": "doble progresión",
    "indicacion": "Cuando completes el rango alto con técnica correcta, aumentá la carga."
  },
  "comparacion_rutina_anterior": {
    "rutina_anterior_detectada": false,
    "similitud_estimativa": "baja",
    "cambios_aplicados": []
  },
  "advertencias": [
    "Esta guía no reemplaza evaluación profesional personalizada."
  ],
  "mensaje_final_socio": "Tu rutina fue generada en base a lo que me pediste. Dirigite al menú Rutinas y allí la encontrarás."
}
```

## Reglas

- `id_ejercicio` debe mapearse a un ejercicio real antes de guardar.
- La cantidad de días debe coincidir con lo solicitado.
- El orden debe ser explícito.
- Los motivos deben ser breves y técnicos.
- Debe existir mensaje final al socio.
- Si faltan datos críticos, el RAG debe preguntar antes de generar.

## Campos bilingües futuros

Para soporte i18n, se podrá extender con:

```json
{
  "nombre_es": "Press banca plano",
  "nombre_en": "Flat bench press"
}
```
