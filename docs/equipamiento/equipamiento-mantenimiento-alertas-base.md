# Equipamiento y mantenimiento - alertas base

## Objetivo

Crear una primera base operativa de alertas de mantenimiento para equipamientos.

La feature permite que administración vea, desde el módulo de Equipamientos, qué máquinas tienen revisión vencida, próxima a vencer, se encuentran en mantenimiento, están fuera de servicio o no tienen fecha de revisión configurada.

## Alcance

### Backend/API

Se agrega:

```txt
GET /api/equipamientos/alertas-mantenimiento
```

Parámetro opcional:

```txt
umbralDias
```

Valor por defecto:

```txt
5
```

El endpoint calcula alertas en base a:

- `equipamiento.proxima_revision`;
- `equipamiento.estado`;
- `equipamiento.activo`;
- umbral de anticipación.

### Frontend

En `/dashboard/equipamientos` se agregan:

- tarjetas resumen de vencidos, próximos, en mantenimiento, sin fecha y sin alerta;
- sección de alertas operativas;
- botón para actualizar alertas;
- filtros de tipo y ubicación generados desde los datos reales del equipamiento, evitando listas fijas.

### Swagger/OpenAPI

Se documenta el nuevo endpoint:

```txt
GET /api/equipamientos/alertas-mantenimiento
```

Incluye:

- descripción funcional;
- query param `umbralDias`;
- ejemplo de respuesta;
- schema específico de alerta de mantenimiento;
- schema de respuesta completa.

## Estados de alerta

```txt
vencido
proximo
ok
sin_fecha
en_mantenimiento
fuera_de_servicio
```

## Severidades

```txt
critica
alta
media
baja
ok
```

## Fuera de alcance

Esta feature no crea migraciones nuevas.

No implementa todavía:

- programación automática de mantenimientos recurrentes;
- historial avanzado de fallas;
- dashboard BI de costos;
- notificaciones automáticas;
- relación muchos-a-muchos entre máquina y múltiples tipos de mantenimiento con frecuencia individual.

Es una base operativa segura para avanzar hacia esas funcionalidades.
