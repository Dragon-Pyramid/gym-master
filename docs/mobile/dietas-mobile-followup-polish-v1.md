# Dietas mobile follow-up polish v1

Feature: `feature/dietas-mobile-followup-polish-v1`

## Objetivo

Pulir la experiencia mobile del socio en el módulo de dietas para que el plan alimentario no sea solo lectura estática, sino una guía diaria de seguimiento comida por comida.

## Alcance

- Ajuste de layout en `/dashboard/dietas` con shell vertical `Header / Contenido / Footer`.
- Mejora de contraste claro/oscuro en la vista de dietas.
- Resumen mobile del historial de dietas del socio.
- Indicadores de estado: vigente, próxima, finalizada o manual.
- Métricas de planes y comidas cargadas.
- Seguimiento diario local por dieta.
- Marcado de comidas revisadas/cumplidas desde el detalle de la dieta.
- Barra de avance diario.
- Acciones para marcar, reabrir y reiniciar seguimiento del día.
- Refuerzo de la card del dashboard socio con progreso de comidas del día cuando existe información local.

## Persistencia

Esta feature no agrega migración ni tablas nuevas. El seguimiento diario de comidas se guarda en `localStorage` por dieta y fecha, como experiencia rápida del dispositivo actual.

Una persistencia nutricional formal multi-dispositivo queda fuera de este alcance y debería encararse en una feature posterior con DB/API específica.

## Archivos modificados

- `src/app/dashboard/dietas/page.tsx`
- `src/components/dashboard/dietas/DietaDisplay.tsx`
- `src/components/tables/DietaHistorial.tsx`
- `src/components/dashboard/socio/SocioMobileTodayPlan.tsx`

## QA sugerido

1. Entrar como socio a `/dashboard/dietas`.
2. Confirmar resumen de estado/planes/comidas.
3. Abrir una dieta.
4. Confirmar bloque `Seguimiento de hoy`.
5. Marcar una comida como cumplida.
6. Confirmar que sube el porcentaje.
7. Reabrir una comida y confirmar que baja el progreso.
8. Reiniciar seguimiento.
9. Recargar la página y confirmar que el seguimiento del día persiste en el dispositivo.
10. Volver al dashboard socio y confirmar que la card de dieta muestra el avance diario cuando corresponde.
11. Probar modo claro/oscuro.
12. Salir de F12 mobile y confirmar que no queda espacio blanco después del footer.
13. Entrar como admin/gestor y confirmar que el flujo de gestión de dietas no se rompe.
