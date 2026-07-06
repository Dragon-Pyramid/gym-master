# Equipamiento mantenimiento final polish v1

## Contexto

Se realizó un pulido final del módulo de equipamientos y mantenimiento para dejarlo como una pantalla operativa de infraestructura, con lectura ejecutiva, radar técnico y navegación rápida a preventivos/QR.

## Alcance funcional

- Mejora de `/dashboard/equipamientos`.
- Shell vertical controlado `Header / Contenido / Footer` para evitar espacio blanco después del footer.
- Hero ejecutivo de infraestructura y salud operativa.
- Accesos rápidos a preventivos, etiquetas QR y actualización de métricas.
- Lectura ejecutiva del parque técnico.
- Próximo paso recomendado según riesgo, preventivos urgentes o equipos sin revisión.
- Mejor contraste en modo oscuro.
- Corrección de título duplicado en reporte PDF.

## Reglas respetadas

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger.
- No sube SQL ni estructura privada.
- Conserva altas, edición, vista, exportación PDF/Excel, filtros y paginación.

## QA sugerido

1. Entrar como admin a `/dashboard/equipamientos`.
2. Confirmar hero ejecutivo y acciones rápidas.
3. Confirmar métricas y radar técnico.
4. Probar filtros por tipo, estado, ubicación y búsqueda.
5. Abrir alta/edición/vista de equipamiento.
6. Probar PDF y Excel.
7. Probar modo claro/oscuro.
8. Probar F12 mobile y desktop.
9. Confirmar que no hay scroll horizontal ni espacio blanco debajo del footer.
