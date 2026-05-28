# Gestor de Dietas — Review and Detail Flow

## Objetivo

Modernizar el flujo administrativo del Gestor de Dietas para alinearlo con el patrón ya usado en Gestor de Rutinas y Evolución Física.

La administración debe poder ver qué socio tiene dieta asignada, generar una nueva dieta para un socio específico y abrir el detalle real de la dieta en una pantalla completa, sin depender de modales viejos ni contenido hardcodeado.

## Alcance implementado

- Se mantiene el listado de socios del Gestor de Dietas.
- Cada card muestra la última dieta disponible del socio.
- El botón **Ver Dieta** navega a una pantalla moderna de detalle.
- El botón **Nueva Dieta** abre un formulario asociado al socio seleccionado.
- Al generar una dieta, el gestor actualiza la card y navega al detalle creado.
- Se agrega endpoint `GET /api/dieta/{id}` para consultar una dieta puntual.
- La consulta de dietas por socio devuelve lista vacía cuando no hay registros, evitando errores 404 innecesarios.
- Se evita el uso de modales obsoletos para el detalle principal.

## Rutas principales

```txt
/dashboard/gestor-dietas
/dashboard/gestor-dietas/dieta/[idDieta]
```

## APIs relacionadas

```txt
GET  /api/dieta/{id}
GET  /api/dieta/socio/{id}
POST /api/dieta/generar
```

## Criterio funcional

La pantalla de detalle muestra:

- nombre del plan;
- objetivo nutricional;
- fecha de inicio;
- fecha de fin;
- duración;
- plan alimentario interpretado desde `observaciones`;
- datos administrativos de la dieta;
- opción de imprimir/exportar como PDF usando el diálogo del navegador.

## Limitaciones conocidas

La tabla `dieta` todavía guarda el plan alimentario en `observaciones` como texto. La auditoría previa recomendó evolucionar esto a un campo JSONB formal como `plan_json` o `descripcion_json`.

Esta feature no modifica el DER para evitar romper el flujo actual. La normalización estructural de dietas debe evaluarse en una rama futura, especialmente cuando se integre con el RAG de rutina + nutrición complementaria.

## Relación con futuras features

Esta mejora prepara el terreno para:

- `feature/rag-dietas-dataset-prompts`;
- `feature/rag-dietas-coach-knowledge-base`;
- `feature/rag-rutinas-dietas-assistant`;
- `feature/dietas-pdf-modernization`;
- futura normalización de `dieta.plan_json`.


## Ajuste de PDF profesional

Se reemplaza el flujo anterior de impresión del navegador por una descarga PDF profesional para dietas.

El PDF de dieta debe evitar capturar el layout del dashboard, sidebar o navegación del sistema. La salida queda organizada como informe independiente con:

- membrete/logo Gym Master;
- título del plan alimentario;
- nombre del socio;
- objetivo nutricional;
- fechas de inicio y fin;
- duración;
- DNI/email si están disponibles;
- plan alimentario organizado por comidas/bloques;
- advertencia responsable de salud/nutrición.

Este criterio alinea el PDF de dietas con el estándar visual ya usado para rutinas y deja el módulo preparado para futuras dietas generadas por el RAG coach.

## Fechas

Los campos de fecha del formulario de dieta se mantienen como `type="date"`, permitiendo selector nativo de calendario según navegador/dispositivo. En una mejora posterior se podrá reemplazar por un date picker visual común para todo Gym Master si se define un componente estándar de calendario.


## Ajuste de presentación de dieta

Se corrigió el orden de visualización del plan alimentario en pantalla y PDF para respetar la secuencia funcional esperada: Desayuno, Colación media mañana, Almuerzo, Colación siesta, Merienda, Colación tarde y Cena.

La vista administrativa de detalle ya no expone identificadores técnicos internos como ID de dieta, ID de socio o usuario creador. La pantalla queda orientada a consulta operativa y el PDF mantiene formato profesional de informe, sin copiar el layout del dashboard.
