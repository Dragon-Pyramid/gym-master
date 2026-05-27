# Prompts RAG Rutinas

Esta carpeta contiene prompts base para generar corpus de rutina, dieta y JSON estructurado para el futuro `gym-master-rag-coach`.

## Orden de uso recomendado

1. Elegir una fila de `docs/rag-rutinas/datasets/rag-rutinas-matriz-prioritaria.csv`.
2. Copiar `prompt-maestro-rutina-dieta-json.md`.
3. Reemplazar variables por los valores de la fila.
4. Pedir primero salida en texto + JSON.
5. Revisar calidad.
6. Pedir PDF de rutina usando `prompt-generacion-pdf-rutina.md`.
7. Pedir PDF de dieta usando `prompt-generacion-pdf-dieta.md`.
8. Guardar resultado en el corpus curado.

## Variables comunes

```txt
{{OBJETIVO}}
{{NIVEL}}
{{DIAS}}
{{RANGO_PESO}}
{{PESO_KG}}
{{ALTURA_CM}}
{{EDAD}}
{{SEXO}}
{{LESIONES}}
{{EQUIPAMIENTO}}
{{IDIOMA}}
```

## Importante

El resultado debe ser revisado antes de integrarse a una knowledge base. No se debe cargar contenido sin curación técnica/deportiva.
