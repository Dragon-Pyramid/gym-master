# Evolución Física - Silueta dinámica experimental

## Objetivo

Incorporar una primera visualización corporal antes/después dentro del dashboard de evolución física sin instalar dependencias 3D todavía y sin modificar base de datos, APIs ni PDF.

## Enfoque implementado

Se agregó un prototipo 2.5D basado en CSS y datos reales de `evolucion_socio`:

- peso
- cintura
- pecho
- cadera
- abdomen
- porcentaje de grasa
- masa muscular
- bíceps izquierdo/derecho
- muslos izquierdo/derecho
- pantorrillas izquierda/derecha

El objetivo no es reemplazar una silueta médica exacta, sino ofrecer una lectura visual rápida de progreso corporal para socios y administradores.

## Decisión técnica

No se instala Three.js en esta rama. El proyecto todavía no tiene `three`, `@react-three/fiber` ni `@react-three/drei`. Esta feature deja una base visual segura y liviana. Una próxima rama puede evaluar un prototipo 3D real.

## Próximos pasos sugeridos

- Evaluar Three.js / React Three Fiber en una rama separada.
- Diseñar silueta frontal estática para PDF.
- Agregar rotación 360° en prototipo futuro.
- Revisar criterios UX para que la visualización sea entendible y no invasiva.
