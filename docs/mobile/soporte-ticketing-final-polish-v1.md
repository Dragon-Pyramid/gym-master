# Soporte ticketing final polish v1

## Objetivo

Pulir la experiencia final del módulo de soporte Dragon Pyramid para que administradores y usuarios internos puedan registrar, priorizar y seguir tickets de incidencias operativas sin perder trazabilidad.

## Alcance

- Pantalla `/dashboard/soporte-dragon-pyramid`.
- Hero ejecutivo de mesa de ayuda interna.
- Métricas de tickets totales, abiertos, críticos/+48 h y cerrados.
- Lectura ejecutiva de soporte con próximo paso recomendado.
- Mejoras de filtros, búsqueda, actualización y detalle.
- Mejor visualización de prioridad, estado, email pendiente y tickets abiertos por más de 48 horas.
- Shell vertical `Header / Contenido / Footer` para evitar espacio blanco después del footer.
- Mejor contraste claro/oscuro y responsive mobile/desktop.

## Seguridad y datos

No requiere migración DB.
No modifica endpoints.
No modifica Swagger.
No expone SQL ni estructura privada.

## QA sugerido

1. Entrar como admin o usuario interno a `/dashboard/soporte-dragon-pyramid`.
2. Crear ticket con categoría, prioridad, asunto, descripción y URL opcional.
3. Confirmar que aparece en el listado.
4. Abrir detalle y verificar historial.
5. Agregar comentario.
6. Marcar en revisión.
7. Registrar respuesta.
8. Cerrar ticket.
9. Probar filtros por estado y búsqueda.
10. Probar modo claro/oscuro, F12 mobile y desktop.
11. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.
