# Infraestructura checklists final polish v1

## Objetivo
Pulir el módulo de infraestructura y mantenimiento edilicio para dejarlo listo como tablero operativo de sectores, activos, órdenes, checklists y QR.

## Alcance
- Shell controlado `Header / Contenido / Footer` para evitar espacio blanco posterior al footer.
- Hero ejecutivo de infraestructura final.
- Acciones rápidas para actualizar, ejecutar checklist y crear orden.
- Métricas de sectores, activos, críticos, vencidos, órdenes y costo mensual.
- Lectura ejecutiva edilicia con señales prioritarias.
- Próximo paso operativo con QR, checklists y órdenes conectadas.
- Mejoras de contraste claro/oscuro.
- Conserva formularios de sector, activo, orden, checklist y QR.
- Conserva alertas, órdenes abiertas e inventario edilicio.

## Seguridad / DB
No requiere migración de base de datos.
No modifica endpoints.
No modifica Swagger.
No incorpora SQL ni estructura privada al repositorio público.

## QA sugerido
1. Entrar como admin a `/dashboard/infraestructura/mantenimiento-edilicio`.
2. Validar hero ejecutivo y acciones rápidas.
3. Validar métricas, lectura ejecutiva y próximo paso operativo.
4. Crear sector, activo, orden y checklist de prueba si corresponde.
5. Generar QR y validar etiqueta.
6. Completar una orden abierta.
7. Revisar modo claro/oscuro.
8. Probar F12 mobile y desktop.
9. Confirmar que no hay scroll horizontal ni espacio blanco después del footer.
