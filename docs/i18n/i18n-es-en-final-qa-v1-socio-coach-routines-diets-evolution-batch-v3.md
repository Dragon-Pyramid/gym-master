# QA final ES/EN — Socios, Coach IA, rutinas, dietas y evolución — lote v3

## Rama

`feature/i18n-es-en-final-qa-v1`

## Fecha

22 de julio de 2026

## Objetivo

Cerrar el tercer lote del recorrido final ES/EN sobre la experiencia del socio y los módulos relacionados con seguimiento, salud y asistencia inteligente, sin traducir automáticamente datos ingresados por gimnasios, administradores o socios.

## Alcance funcional

- Listado administrativo de socios, filtros, métricas, paginación, tabla, acciones y exportables.
- Alta y edición de socios.
- Perfil 360 del socio y alertas de riesgo generadas por Gym Master.
- Resumen transversal de cuota, ficha médica, rutinas, dietas, evolución, mensajes y actividades.
- Ficha médica actual, historial, modal de detalle, fechas y nombre del PDF.
- Coach IA: interfaz, estados, fuentes RAG, acciones, memoria contextual, QA, seguridad y mensajes auxiliares.
- Asistente de rutinas: dictado ES/EN, interpretación de intención, revisión previa y resultado generado.
- Catálogo de media de rutinas: estados, confirmaciones, errores, importaciones, descubrimiento YouTube y notas de revisión generadas por el sistema.
- Gestión heredada de dietas: listado, tarjetas, estados, fechas, modales y estados vacíos.
- Evolución física: exportación Excel, nombre de archivo, fechas y leyendas de gráficos incorporadas al PDF.
- Fecha y hora compartidas según el idioma activo.

## Reglas de gobernanza aplicadas

- Los textos de interfaz, wrappers, estados conocidos, advertencias, alertas y mensajes generados por Gym Master respetan `es` o `en`.
- Los nombres, observaciones, diagnósticos, objetivos personalizados, planes, títulos y demás datos aportados por usuarios o gimnasios se conservan en su idioma original.
- Los nombres core de objetivos, niveles y grupos musculares se muestran mediante los helpers centralizados cuando corresponde.
- Las fuentes RAG y su contenido recuperado permanecen en el idioma original.
- Español continúa siendo el fallback seguro.
- Los estados internos y contratos existentes no cambian; solamente se localiza su presentación.

## Cambios técnicos relevantes

- `fetchSocio360Api` acepta un locale opcional y envía `Accept-Language` a los módulos consultados.
- Las respuestas parciales del Perfil 360 conservan la misma estructura.
- Las alertas de riesgo mantienen los niveles internos `alto`, `medio`, `bajo` y `ok`; sus textos visibles se localizan.
- El asistente de rutinas reconoce expresiones ES/EN para objetivos, niveles, días, prioridades musculares y restricciones frecuentes.
- Los encabezados y nombres de archivos de evolución física respetan el idioma activo.
- `FechaHora` actualiza su locale al cambiar ES/EN.

## Archivos modificados

1. `src/app/dashboard/coach/page.tsx`
2. `src/app/dashboard/evolucion-fisica/page.tsx`
3. `src/app/dashboard/gestion-dietas/page.tsx`
4. `src/app/dashboard/rutinas/asistente/page.tsx`
5. `src/app/dashboard/rutinas/media/page.tsx`
6. `src/app/dashboard/socios/page.tsx`
7. `src/components/ficha-medica/TabActual.tsx`
8. `src/components/ficha-medica/TabHistorial.tsx`
9. `src/components/forms/SocioForm.tsx`
10. `src/components/gestion-dietas/SocioDietaCard.tsx`
11. `src/components/gestion-dietas/SociosDietasGrid.tsx`
12. `src/components/modal/DietaModalView.tsx`
13. `src/components/modal/HistorialViewModal.tsx`
14. `src/components/modal/SocioModal.tsx`
15. `src/components/modal/SocioViewModal.tsx`
16. `src/components/tables/SociosTable.tsx`
17. `src/components/ui/FechaHora.tsx`
18. `src/services/browser/socio360ApiClient.ts`
19. `src/utils/socioRiskAlerts.ts`
20. `docs/i18n/i18n-es-en-final-qa-v1-socio-coach-routines-diets-evolution-batch-v3.md`

## Fuera de alcance

- Base de datos, migraciones, RLS, RPC y seeds.
- Roles, permisos o guards de autorización.
- Cambios en contratos de respuesta de APIs.
- Traducción automática de contenido del cliente.
- Reemplazo o traducción de documentos y fuentes RAG existentes.

## Validaciones realizadas antes de empaquetar

- `git diff --check`: sin errores de espacios o conflictos.
- Parseo estático de los 19 archivos TypeScript/TSX modificados: sin errores de sintaxis.
- Revisión de imports modificados: sin imports nuevos sin uso.
- Auditoría de rutas sensibles y artefactos generados: sin SQL, migraciones, backups, `.env` ni archivos PWA.
- Verificación de saltos de línea: se conserva el estilo original de cada archivo.
- Prueba aislada del reconocimiento de días en español e inglés: valores numéricos y palabras del uno al seis.

El build integral de Next.js debe ejecutarse en el repositorio local, donde están instaladas las dependencias del proyecto.

## QA manual recomendado

### Socios y Perfil 360

- Probar ES/EN en `/dashboard/socios`.
- Revisar filtros, búsqueda, métricas, tabla, paginación, alta, edición, activación e inactivación.
- Abrir perfiles con datos completos, datos parciales, cuota vencida, ficha pendiente y módulos vacíos.
- Confirmar que las alertas cambien de idioma y que los datos del socio no se traduzcan.

### Ficha médica

- Revisar ficha actual, historial, modal de detalle y PDF en ES/EN.
- Validar fechas, estados, adjuntos, apto médico y estados vacíos.

### Coach IA

- Probar como socio y como administrador con socio seleccionado.
- Validar respuesta, acciones, fuentes, QA, seguridad, memoria, sugerencias, errores y reinicio en ES/EN.

### Rutinas

- Probar el asistente escrito y por voz en ES/EN.
- Usar días expresados con números y palabras.
- Revisar detección de objetivo, nivel, músculos y restricciones.
- En media, probar previsualizaciones y mensajes sin aplicar cambios destructivos fuera de datos de prueba.

### Dietas y evolución

- Revisar `/dashboard/gestion-dietas` en ES/EN.
- Exportar Excel y PDF desde evolución física y validar encabezados, fechas, leyendas y nombres de archivo.

### Regresión transversal

- Mobile, desktop y dark mode.
- Cambio de idioma sin recarga.
- Persistencia del locale al navegar.
- Sin errores de consola ni textos mezclados.
