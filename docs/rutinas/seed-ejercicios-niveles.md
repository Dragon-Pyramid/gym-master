# Gym Master - Seed de ejercicios por niveles Inicial e Intermedio

## Contexto

Durante las pruebas se detectó que el RPC `generar_rutina_socio` funcionaba para nivel Avanzado, pero fallaba para objetivo `1` y niveles `1`/`2` con el mensaje:

```txt
No hay ejercicios definidos para objetivo 1 y nivel 1
No hay ejercicios definidos para objetivo 1 y nivel 2
```

## Solución

Se agrega una migración formal de Supabase para cargar ejercicios base de Volumen para:

- Nivel 1: Inicial
- Nivel 2: Intermedio
- Grupos musculares principales usados por el generador actual.

La migración también asegura los catálogos mínimos de `nivel`, `objetivo`, `grupo_muscular` y `dia`.

## Validación

Ejecutar en Supabase local:

```bash
npx supabase start
```

Luego validar con:

```sql
-- database/scripts/diagnostico_rutinas_ejercicios.sql
-- database/scripts/validar_generacion_rutinas_objetivo_volumen.sql
```

## Alcance

Este bloque no modifica frontend ni backend. Corrige datos base para que la lógica existente del RPC pueda operar con niveles Inicial e Intermedio.
