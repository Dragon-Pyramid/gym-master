# Patch - Gestor rutinas dark mode polish v1

## Objetivo
Mejorar la experiencia de modo oscuro solo en rutinas, sin tocar estilos globales del dashboard.

## Alcance
- `/dashboard/gestor-rutinas/rutina/[idRutina]`
- `src/components/dashboard/rutinas/RutinaDisplay.tsx`

## Cambios principales
- El canvas interno de detalle usa dark mode nativo con superficies negras/neutras.
- Cards de métricas, tabs de días, paneles de día, ejercicios y modal de ayuda reciben variantes `dark:`.
- Se evita introducir azul como color dominante; la paleta queda negra/neutra, respetando el dashboard.
- Se mantienen las traducciones ES/EN previas.
- Se agregan traducciones de presentación para ejercicios semilla que seguían mezclados.
- Se corrige una duplicación accidental de variable en `traducirGrupoMuscular`.

## Rollback quirúrgico
Antes de commitear, si no convence el polish visual:

```bash
git restore src/app/dashboard/gestor-rutinas/rutina/[idRutina]/page.tsx src/components/dashboard/rutinas/RutinaDisplay.tsx
```

O volver a aplicar el patch anterior de rutina detalle i18n v2.
