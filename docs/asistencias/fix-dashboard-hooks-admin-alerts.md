# Fix dashboard hooks admin alerts

## Problema detectado

Después del patch de alertas de morosidad en asistencia, el dashboard comenzó a fallar con:

```txt
Rendered more hooks than during the previous render
```

El error se producía en `src/app/dashboard/page.tsx` porque se agregó un `useEffect` después de retornos condicionales (`return`) del componente.

## Causa

React exige que todos los hooks se ejecuten siempre en el mismo orden en cada render. El dashboard tenía retornos tempranos antes del nuevo `useEffect` de eventos/broadcast del admin.

## Corrección

Se movieron los retornos condicionales de loading/no autenticado después de todos los hooks del componente.

## Alcance

- Corrige crash del dashboard.
- No modifica reglas de negocio.
- No modifica base de datos.
- No modifica endpoints.
- Mantiene el fix de alertas admin por morosidad.
