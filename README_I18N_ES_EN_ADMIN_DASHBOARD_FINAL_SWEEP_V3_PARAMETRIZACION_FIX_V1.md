# I18N ES/EN Admin Dashboard Final Sweep V3 - Parametrización Fix V1

## Ruta cubierta

- `/dashboard/parametrizacion`

## Alcance

- Traduce al inglés la pantalla de parametrización de catálogos cuando el locale activo es `en`.
- Mantiene español cuando el locale activo es `es`.
- Corrige textos estáticos de hero, KPIs, descuento por pago adelantado, listado de catálogos, acciones y modal de alta/edición.
- Traduce etiquetas dinámicas de catálogos y registros persistidos solo a nivel presentación, sin modificar valores reales de DB.
- Traduce badges de estado/prioridad: `Disponible`, `Base existente`, `Planificado`, `Alta`, `Media`, `Futura`, `Activo`, `Inactivo`.
- Traduce contenido visible usado como opciones/valores de catálogos para combos: condiciones fiscales, tipos de empleado, contratación, puestos, áreas, turnos, horarios, medios de pago, tipos de gasto/ingreso, categorías de producto, equipamiento, ubicaciones y mantenimiento.
- Mejora dark mode local en cards, tablas/listas de registros, chips, contenedores, formulario y modal.

## Fuera de alcance

- No modifica DB.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No cambia lógica de creación, edición, activación/desactivación ni descuento.
- No traduce persistencia real de catálogos; eso queda para la futura feature DB i18n con campos `*_en` o tabla de traducciones.

## Validación sugerida

```bash
cd /e/gym-master-2026/sistema/gym-master
rm -rf .next
npm run build
```

Luego limpiar artefactos PWA si aparecen:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
git status --short
```
