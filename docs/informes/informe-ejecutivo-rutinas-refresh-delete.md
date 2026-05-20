# Informe ejecutivo — Corrección de refresco y eliminación de rutinas

## Proyecto

Gym Master

## Rama sugerida

`feature/rutinas-refresh-delete-fix`

## Resumen ejecutivo

Se corrigió el flujo funcional del módulo Rutinas para mejorar la experiencia del socio y asegurar consistencia entre las operaciones realizadas y la información mostrada en pantalla.

Durante pruebas funcionales se detectó que, al crear una rutina, el sistema informaba éxito pero no actualizaba el listado automáticamente. También se detectó que la acción de eliminar mostraba confirmación, pero no ejecutaba una eliminación real ni actualizaba el estado visual.

Esta mejora incorpora un flujo completo de creación/refresco y eliminación real de rutinas.

## Problemas detectados

1. Rutina creada sin refresco automático del historial.
2. Eliminación de rutina sin operación real en backend.
3. Falta de feedback visual durante la eliminación.
4. Separación incompleta entre confirmación UI y persistencia real en base.

## Solución implementada

- Se agregó refresco automático del listado luego de crear una rutina.
- Se agregó endpoint `DELETE` para eliminar rutinas.
- Se agregó un servicio server-side para validar permisos y ejecutar la eliminación.
- Se actualizó el componente de visualización para recargar datos y mostrar estado de eliminación.
- Se incorporó documentación técnica del flujo corregido.

## Impacto funcional

- El socio puede generar una rutina y verla inmediatamente sin presionar F5.
- El socio puede eliminar una rutina propia y verla desaparecer del listado.
- El sistema valida permisos antes de eliminar.
- El flujo queda más alineado con un comportamiento esperado de aplicación SaaS moderna.

## Riesgos y consideraciones

- La ruta dinámica existente `api/rutina/[idSocio]` se reutiliza para `DELETE`, interpretando el parámetro como `idRutina`. A futuro puede evaluarse crear una ruta más explícita, por ejemplo `api/rutina/by-id/[idRutina]`, para mayor claridad semántica.
- La eliminación actual es física. Si el negocio requiere auditoría/historial completo, se recomienda evaluar borrado lógico mediante campos como `eliminado_en` o `activo`.

## Próximos pasos recomendados

1. Validar con `npm run build`.
2. Probar generación y eliminación con usuario socio.
3. Probar permisos entre socios.
4. Evaluar a futuro si conviene implementar borrado lógico.
5. Continuar con la rama pendiente de imágenes/gifs para ejercicios iniciales e intermedios.
