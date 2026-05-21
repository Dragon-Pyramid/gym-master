# Informe técnico - Evolución física data model

## 1. Resumen ejecutivo

Se amplió el modelo de datos de evolución física de Gym Master para soportar registros corporales profesionales por socio.

La tabla existente `public.evolucion_socio` ya tenía una base inicial, por lo que la decisión técnica fue extenderla de forma defensiva en lugar de crear una tabla paralela.

## 2. Alcance

La feature incorpora:

- métricas corporales avanzadas;
- clasificación por tipo corporal;
- sexo de referencia para futuras siluetas;
- fotos de progreso;
- marca de registro inicial;
- índices de consulta;
- trigger de actualización;
- constraints defensivos;
- script de validación.

## 3. Decisiones técnicas

### Mantener `evolucion_socio`

Se conserva la tabla existente para evitar duplicidad de información y mantener compatibilidad con código previo.

### No eliminar columnas legacy

Columnas como `bicep`, `tricep`, `pierna`, `gluteos` y `pantorrilla` se mantienen por compatibilidad.

### Registro inicial

Se agrega `es_registro_inicial` para representar el primer estado corporal del socio. Esto permitirá comparar la silueta inicial con la silueta actual.

## 4. Próximos pasos

Las próximas features recomendadas son:

1. `feature/evolucion-fisica-demo-seeds`
2. `feature/evolucion-fisica-silueta-dinamica`
3. `feature/evolucion-fisica-pdf-export`
