# Investigación técnica: prototipo 3D de silueta dinámica

## Objetivo

Agregar una primera base experimental de silueta corporal 3D dentro del módulo de Evolución Física de Gym Master, sin reemplazar la silueta 2.5D actual y sin afectar PDF, Excel, tabla, modal ni APIs.

## Alcance de esta rama

- Instalar y validar dependencias 3D:
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`
- Crear un componente aislado `EvolucionFisicaBody3DPrototype`.
- Renderizar una sección experimental “Silueta corporal 3D antes vs. ahora”.
- Usar registros reales de `evolucion_socio`:
  - peso
  - cintura
  - pecho
  - cadera
  - porcentaje de grasa
  - masa muscular
  - bíceps promedio
  - muslo promedio
  - pantorrilla promedio
- Mantener visible la silueta 2.5D existente como fallback funcional.
- No tocar base de datos.
- No tocar APIs.
- No tocar PDF.

## Decisión técnica

Para esta primera versión se usa una silueta 3D paramétrica construida con primitivas de Three.js:
- esferas escaladas para cabeza, torso, abdomen y cadera;
- cilindros wireframe para brazos y piernas;
- materiales translúcidos y wireframe cian/azul;
- rotación automática suave con `OrbitControls`.

Esta decisión permite validar integración, performance, compatibilidad con Next.js y lectura visual sin depender todavía de modelos 3D externos.

## Limitaciones conocidas

- No es una anatomía humana exacta.
- No utiliza huesos, rigging ni morph targets.
- No carga modelos GLB/GLTF.
- La diferencia corporal es aproximada y visual, no médica.
- Puede aumentar el bundle del módulo de evolución física.

## Próxima iteración recomendada

Crear una rama posterior orientada a silueta 3D humanizada:

`feature/evolucion-fisica-silueta-3d-human-model`

Objetivos sugeridos:
- buscar o crear un modelo humano base en formato GLB;
- cargarlo con `useGLTF` desde `@react-three/drei`;
- aplicar deformaciones controladas a torso, cintura, cadera, brazos y piernas;
- evaluar morph targets o skeleton/rig;
- agregar vista frontal fija y rotación 360°;
- definir versión estática para PDF futuro.

## Validaciones esperadas

- `npm run build` debe completar correctamente.
- La pantalla `/dashboard/evolucion-fisica` debe seguir funcionando.
- PDF, Excel, tabla y modal Ver no deben cambiar.
- La sección 3D debe aparecer como bloque experimental debajo de la silueta 2.5D.
