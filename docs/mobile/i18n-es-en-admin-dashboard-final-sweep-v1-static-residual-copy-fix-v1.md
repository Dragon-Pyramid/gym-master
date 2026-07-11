# i18n ES/EN admin dashboard final sweep v1 - static residual copy fix v1

## Objetivo

Cerrar fugas estáticas ES/EN detectadas en el recorrido administrativo final antes del QA visual ruta por ruta.

## Alcance

Se agregan traducciones exactas al sweep existente para textos visibles, estados, confirmaciones, placeholders y mensajes de error/toast en:

- `/dashboard/socios`
- `/dashboard/ficha-medica`
- `/dashboard/coach`
- `/dashboard/rutinas/asistente`
- `/dashboard/dietas`
- `/dashboard/actividades`
- `/dashboard/empleados`
- `/dashboard/empleados-sueldos`
- `/dashboard/asistencias`

## Ajustes principales

- Socios: activación/desactivación, errores y mensajes administrativos.
- Ficha médica: contexto personal del socio y carga del listado administrativo.
- Coach IA: acciones, intención detectada, errores y orientación.
- Asistente de Rutinas: dictado por voz, validaciones, restricciones y grupos musculares.
- Dietas: encabezados y descripción de la experiencia del socio.
- Actividades: cupos, inscripciones, turnos, estados vacíos, confirmaciones y mensajes operativos.
- Empleados/Sueldos/Asistencias: toasts y labels residuales que no tenían traducción exacta.

## Decisiones técnicas

- Se conserva `DashboardInlineI18nSweep` para mantener coherencia con el sweep anterior.
- Se usan entradas exactas para evitar traducciones parciales o Spanglish.
- No se cambian contratos, estados internos ni claves de negocio.
- Las traducciones de contenido dentro de PDF/Excel/tickets/etiquetas quedan para `feature/i18n-es-en-pdf-reports-v1`.

## Fuera de alcance

- Base de datos y migraciones.
- Endpoints y servicios.
- Swagger/OpenAPI.
- Permisos y RBAC.
- Lógica de QR, asistencia o generación IA.
- Coordenadas y animaciones de Evolución Física.

## QA requerido

1. Ejecutar `npm run build`.
2. Probar las rutas indicadas en Español e Inglés.
3. Validar desktop, F12/mobile y retorno a desktop.
4. Validar modo claro y oscuro.
5. Probar modales, confirmaciones, toasts, búsquedas y estados vacíos.
6. Confirmar ausencia de scroll horizontal y espacio blanco posterior al footer.
