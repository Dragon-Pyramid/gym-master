# Evolución Física — Muscle Transforms v13

## Objetivo

Agregar una forma segura de mover figuras geométricas por grupo muscular, sin tocar los dos bloques visuales congelados por Gustavo:

1. el `<image />` de la silueta humana de fondo;
2. el `overlayTransform` general.

## Archivo modificado

- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`

## Qué se agregó

### Constante editable por músculo

```ts
const MUSCLE_TRANSFORMS: Partial<Record<BodyGroupId, string>> = {
  hombros: "translate(0 0) scale(1)",
  pecho: "translate(0 0) scale(1)",
  abdomen: "translate(0 0) scale(1)",
  cintura: "translate(0 0) scale(1)",
  cadera: "translate(0 0) scale(1)",
  biceps: "translate(0 0) scale(1)",
  triceps: "translate(0 0) scale(1)",
  antebrazo: "translate(0 0) scale(1)",
  muslo: "translate(0 0) scale(1)",
  pantorrilla: "translate(0 0) scale(1)",
};
```

### Uso en cada grupo

Cada `BodyPart` ahora toma:

```tsx
transform={MUSCLE_TRANSFORMS[groupId]}
```

## Cómo editar

- `translate(-5 0)` = mover a la izquierda
- `translate(5 0)` = mover a la derecha
- `translate(0 -5)` = subir
- `translate(0 5)` = bajar
- `scale(0.9)` = achicar
- `scale(1.1)` = agrandar

## Ejemplos

```ts
abdomen: "translate(0 -4) scale(0.92)",
cintura: "translate(0 5) scale(0.85)",
cadera: "translate(0 8) scale(0.92)",
muslo: "translate(0 6) scale(0.94)",
pantorrilla: "translate(0 10) scale(0.88)",
```
