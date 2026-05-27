# Prompt — Generación de PDF de rutina

Usar después de tener validada la rutina en texto/JSON.

---

Generá un documento PDF de rutina con diseño claro y profesional para Gym Master.

Contenido requerido:

```txt
Título: Rutina {{OBJETIVO}} - {{NIVEL}} - {{DIAS}} días
Perfil: {{SEXO}}, {{EDAD}} años, {{PESO_KG}} kg, {{ALTURA_CM}} cm
Objetivo: {{OBJETIVO}}
Nivel: {{NIVEL}}
Días: {{DIAS}}
```

El PDF debe incluir:

1. Encabezado con nombre Gym Master.
2. Resumen del objetivo.
3. Indicaciones generales.
4. Rutina dividida por día.
5. Tabla por día con:
   - ejercicio;
   - grupo muscular;
   - series;
   - repeticiones;
   - descanso;
   - RPE/intensidad;
   - observaciones.
6. Progresión sugerida.
7. Recomendaciones de calentamiento.
8. Advertencia de seguridad.

No incluyas JSON en el PDF de rutina.
