# Prompt maestro — Rutina + Dieta + JSON estructurado

Usá este prompt para cada combinación de la matriz prioritaria.

---

Actuá como un coach profesional de musculación, fuerza, composición corporal y planificación de entrenamiento. Necesito generar contenido para alimentar una base de conocimiento de un sistema llamado Gym Master.

Generá una rutina y una dieta base para el siguiente perfil:

```txt
Objetivo: {{OBJETIVO}}
Nivel: {{NIVEL}}
Días de entrenamiento por semana: {{DIAS}}
Rango físico: {{RANGO_PESO}}
Peso aproximado: {{PESO_KG}} kg
Altura aproximada: {{ALTURA_CM}} cm
Edad aproximada: {{EDAD}} años
Sexo: {{SEXO}}
Lesiones o restricciones: {{LESIONES}}
Equipamiento disponible: {{EQUIPAMIENTO}}
Idioma de salida: {{IDIOMA}}
```

Requisitos de la rutina:

1. Debe tener exactamente `{{DIAS}}` días de entrenamiento.
2. Debe respetar el objetivo `{{OBJETIVO}}`.
3. Debe estar adaptada al nivel `{{NIVEL}}`.
4. Debe ordenar los ejercicios con lógica profesional.
5. Los ejercicios compuestos o técnicos deben ir antes que accesorios o aislamiento.
6. Debe cubrir los grupos musculares relevantes durante la semana.
7. Debe indicar grupos musculares por día.
8. Debe indicar series, repeticiones, descanso e intensidad/RPE.
9. Debe incluir progresión semanal o mensual.
10. Debe evitar ser una rutina genérica sin criterio.
11. Debe poder adaptarse luego a ejercicios reales existentes en una base de datos.
12. Debe incluir alternativas por si un ejercicio no está disponible.

Requisitos de dieta:

1. Debe ser coherente con el objetivo `{{OBJETIVO}}`.
2. Debe incluir calorías aproximadas si corresponde.
3. Debe incluir proteína, carbohidratos y grasas aproximadas.
4. Debe incluir menú diario ejemplo.
5. Debe incluir reemplazos de alimentos.
6. Debe incluir criterios de ajuste semanal.
7. Debe incluir advertencia de que no reemplaza asesoramiento médico/nutricional personalizado.

Requisitos de JSON:

Después de la explicación, generá un JSON válido con esta estructura general:

```json
{
  "version_schema": "1.0.0",
  "idioma": "es",
  "tipo_salida": "rutina_dieta",
  "perfil_socio": {},
  "rutina": {},
  "dieta": {},
  "validacion": {},
  "mensaje_final_socio": "Tu rutina fue generada en base a lo que me pediste. Dirigite al menú Rutinas y allí la encontrarás."
}
```

El JSON debe incluir:

- objetivo;
- nivel;
- días por semana;
- rutina por día;
- ejercicios ordenados;
- series;
- repeticiones;
- descanso;
- RPE/intensidad;
- grupo muscular;
- tipo de ejercicio;
- patrón de movimiento;
- motivo del orden;
- alternativas;
- dieta;
- advertencias;
- criterios de validación.

No inventes IDs reales de ejercicios. Si no tenés IDs, usá `null` en `id_ejercicio`.

No incluyas recomendaciones médicas peligrosas. Si el perfil requiere evaluación profesional, marcá `requiere_revision_humana: true`.

La respuesta debe estar ordenada así:

1. Resumen del criterio.
2. Rutina semanal.
3. Dieta base.
4. Reglas de ajuste/progresión.
5. Advertencias.
6. JSON final válido.
