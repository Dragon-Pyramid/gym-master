# Prompt — Generación de PDF de dieta

Usar después de tener validada la dieta en texto/JSON.

---

Generá un documento PDF de dieta base para Gym Master.

Contenido requerido:

```txt
Título: Dieta base {{OBJETIVO}} - {{NIVEL}}
Perfil: {{SEXO}}, {{EDAD}} años, {{PESO_KG}} kg, {{ALTURA_CM}} cm
Objetivo: {{OBJETIVO}}
```

El PDF debe incluir:

1. Encabezado con nombre Gym Master.
2. Objetivo nutricional.
3. Calorías aproximadas.
4. Macronutrientes aproximados.
5. Menú ejemplo diario.
6. Opciones de reemplazo.
7. Lista de compras base.
8. Suplementos opcionales si corresponde.
9. Cómo ajustar según evolución.
10. Advertencia nutricional/médica.

No incluyas JSON en el PDF de dieta.
