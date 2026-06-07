# Gym Master — YouTube Auto Discovery Hardening

## Objetivo

Este ajuste refina el descubrimiento automático de videos YouTube para ejercicios, reduciendo consumo de cuota y evitando guardar candidatos incorrectos.

## Cambios principales

- La corrida por defecto baja a 10 pendientes por ejecución.
- El límite máximo también queda en 10 pendientes por corrida.
- 10 pendientes equivalen aproximadamente a 5 ejercicios cuando se buscan ES + EN.
- El límite ahora se aplica sobre tareas reales por idioma, no sobre ejercicios completos.
- Si YouTube responde 429 por cuota excedida, se detiene inmediatamente toda la corrida.
- Se muestra mensaje claro de cuota agotada.
- El preview permite desmarcar candidatos incorrectos.
- Solo se guardan los candidatos seleccionados con “Aplicar seleccionados”.
- Los descartados en preview no se guardan.
- Se mantiene regla anti-pisado: no sobrescribir videos ES/EN existentes.

## Scoring reforzado

Se agregan penalizaciones para evitar casos incorrectos como:

- Press banca / pecho → leg press / prensa de piernas.
- Press inclinado con barra → barbell bent-over row.
- Press pecho → shoulder press / press militar.
- Barra vs mancuernas cuando el título contradice claramente el ejercicio.
- Videos de motivación, música, fails o compilaciones.

## Flujo recomendado

1. Ejecutar preview con 10 pendientes.
2. Revisar candidatos.
3. Desmarcar videos incorrectos.
4. Aplicar solo seleccionados.
5. Repetir al día siguiente o cuando haya cuota disponible.

## Variables sugeridas

```env
YOUTUBE_DATA_API_KEY=tu_api_key
YOUTUBE_AUTO_DISCOVERY_BATCH_SIZE=10
YOUTUBE_AUTO_DISCOVERY_REGION_ES=AR
YOUTUBE_AUTO_DISCOVERY_REGION_EN=US
```

## Nota

Los videos cargados automáticamente quedan como `sugerido`, no como `validado`. La validación final queda a criterio administrativo.
