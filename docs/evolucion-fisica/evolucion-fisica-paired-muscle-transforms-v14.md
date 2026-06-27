# Evolución Física — Paired Muscle Transforms v14

## Objetivo

Permitir separar hacia adentro / afuera las figuras geométricas que vienen de a par:

- bíceps;
- tríceps;
- antebrazos;
- muslos;
- pantorrillas.

## Bloques congelados respetados

Este patch mantiene fijos los valores definidos por Gustavo para:

1. `<image />` de la silueta humana;
2. `overlayTransform` general de las figuras geométricas.

## Archivo principal

- `src/components/dashboard/evolucion-fisica/EvolucionFisicaBeforeAfterStudio.tsx`

## Nueva constante

```ts
const PAIRED_MUSCLE_TRANSFORMS = {
  biceps: {
    left: "translate(0 0)",
    right: "translate(0 0)",
  },
  triceps: {
    left: "translate(0 0)",
    right: "translate(0 0)",
  },
  antebrazo: {
    left: "translate(0 0)",
    right: "translate(0 0)",
  },
  muslo: {
    left: "translate(0 0)",
    right: "translate(0 0)",
  },
  pantorrilla: {
    left: "translate(0 0)",
    right: "translate(0 0)",
  },
} as const;
```

## Cómo separar hacia afuera

```ts
pantorrilla: {
  left: "translate(-4 0)",
  right: "translate(4 0)",
},
```

## Cómo acercar hacia adentro

```ts
pantorrilla: {
  left: "translate(4 0)",
  right: "translate(-4 0)",
},
```

## Cómo bajar y separar

```ts
pantorrilla: {
  left: "translate(-4 8)",
  right: "translate(4 8)",
},
```

## Regla

- Primer número: izquierda / derecha.
- Segundo número: arriba / abajo.
- Número negativo en X mueve hacia la izquierda.
- Número positivo en X mueve hacia la derecha.
- Número negativo en Y sube.
- Número positivo en Y baja.
