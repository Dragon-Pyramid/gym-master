# I18N core seeds governance v1

## Objetivo

Centralizar la gobernanza de traducciones ES/EN para datos core precargados por Gym Master sin traducir datos propios cargados por cada gimnasio.

## Auditoría realizada con repo ZIP y dump local 2026-07-21

Tablas core globales detectadas:

- `objetivo`: 10 registros, sin columnas `nombre_en`/`descripcion_en`.
- `nivel`: 3 registros, sin columnas `nombre_en`/`descripcion_en`.
- `dia`: 6 registros, sin columnas `nombre_en`/`descripcion_en`.
- `grupo_muscular`: 15 registros, sin columnas `nombre_en`/`descripcion_en`.
- `comida_base`: 28 registros, sin columnas EN.
- `rutina_generacion_regla`: 30 registros, sin columnas EN.
- `ejercicio`: 979 registros, ya contiene `nombre_en` completo; `descripcion_en` y media EN tienen cobertura parcial.

Catálogos parametrizables detectados con `codigo`, `nombre`, `descripcion` pero sin columnas EN:

- `medio_pago`, `tipo_gasto`, `tipo_ingreso`, `categoria_producto`.
- `tipo_equipamiento`, `ubicacion_equipamiento`, `ubicacion_gimnasio`, `tipo_mantenimiento`.
- `tipo_empleado`, `empleado_tipo_contratacion`, `empleado_puesto_responsabilidad`, `empleado_area`, `empleado_turno`, `empleado_horario_disponibilidad`.
- `comercial_canal_venta`, `comercial_grupo_cliente`, `comercial_ubicacion_stock`.
- `infraestructura_categoria_activo`, `infraestructura_sector`, `infraestructura_checklist_template`, `infraestructura_checklist_item`.

## Decisión técnica de esta etapa

Esta primera etapa implementa una capa de presentación centralizada en `src/utils/coreSeedI18n.ts`.

Reglas:

1. Datos core conocidos por Gym Master pueden mostrarse en ES/EN.
2. Datos propios del gimnasio no se traducen automáticamente.
3. Para catálogos editables, la traducción por ahora solo aplica si el `codigo` coincide con un seed conocido.
4. Si el código o texto no está reconocido, se devuelve el valor original.
5. No se agregan migraciones ni columnas nuevas en esta etapa.

## Archivos modificados

- `src/utils/coreSeedI18n.ts`: helper central ES/EN para core seeds.
- `src/utils/dietaI18nPresentation.ts`: pasa a delegar en el helper central.
- `src/components/forms/RutinasForm.tsx`: elimina mapas locales duplicados de objetivos/niveles.
- `src/app/dashboard/rutinas/page.tsx`: elimina mapa local duplicado de filtros.
- `src/utils/rutinaPdf.ts`: usa helper central para días, grupos musculares y nombres de rutina.

## Fuera de alcance

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No traduce productos, servicios ni textos propios creados por el gimnasio.
- No cambia generación IA/RAG; eso queda para `feature/i18n-ai-generated-content-language-governance-v1`.

## Próxima etapa recomendada

Implementar `feature/i18n-ai-generated-content-language-governance-v1` o una segunda pasada de esta feature para mapear catálogos parametrizables en pantallas específicas usando `translateCoreCatalogName` y `translateCoreCatalogDescription` donde corresponda.
