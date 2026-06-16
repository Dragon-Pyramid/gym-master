# Gym Master - Infraestructura / Mantenimiento Edilicio v1

## Rama

`feature/infraestructura-mantenimiento-edilicio`

## Objetivo

Crear la primera base funcional del módulo **Infraestructura / Mantenimiento Edilicio**, separado del mantenimiento de equipamientos deportivos. El módulo permite inventariar y controlar activos propios del edificio del gimnasio, sus sectores, vencimientos, criticidad y órdenes de mantenimiento.

## Alcance de esta primera fase

- Nuevo submenú **Infraestructura**.
- Nuevo ítem **Mantenimiento Edilicio**.
- Reubicación visual de **Equipamientos** dentro de Infraestructura, sin modificar su funcionalidad actual.
- Página `/dashboard/infraestructura/mantenimiento-edilicio`.
- Dashboard con métricas de sectores, activos, criticidad, vencimientos, órdenes abiertas y costos del mes.
- Alta rápida de sectores edilicios.
- Alta rápida de activos edilicios.
- Alta de órdenes de mantenimiento edilicio.
- Marcado de órdenes como completadas.
- Alertas por activos críticos, vencidos o próximos a vencer.
- Swagger para endpoints de infraestructura.
- Permisos de menú y rutas integrados al sistema existente.

## Inspiración del benchmark

El diseño toma mejores prácticas de repos y sistemas de CMMS, asset management, facility management e inventario:

- Atlas CMMS: activos, ubicaciones, work orders, preventivos y métricas.
- Shelf.nu: tracking moderno, QR y ubicaciones jerárquicas.
- Snipe-IT: ficha de activo, asset tag, ciclo de vida y depreciación.
- ERPNext: activos fijos, compras, mantenimiento y baja.
- OCA Maintenance: modularidad de mantenimiento preventivo/correctivo.
- GLPI: tickets, contratos, garantías y documentos.
- InvenTree: materiales y repuestos.
- Grocy: tareas recurrentes y recordatorios simples.

## Tablas nuevas

El SQL de esta feature se entrega como archivo **privado** y no debe versionarse en el repositorio público.

Tablas previstas:

- `infraestructura_sector`
- `infraestructura_categoria_activo`
- `infraestructura_activo`
- `mantenimiento_edilicio_orden`
- `mantenimiento_edilicio_documento`

## Endpoints nuevos

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/api/infraestructura/mantenimiento-edilicio` | Dashboard completo del módulo |
| POST | `/api/infraestructura/sectores` | Crear sector edilicio |
| POST | `/api/infraestructura/activos` | Crear activo edilicio |
| POST | `/api/infraestructura/ordenes` | Crear orden de mantenimiento |
| PATCH | `/api/infraestructura/ordenes/{id}` | Actualizar/completar orden |

## Menú

Se crea el bloque:

```txt
Infraestructura
  ├─ Mantenimiento Edilicio
  └─ Equipamientos
```

`Equipamientos` conserva su ruta y funcionalidad actual:

```txt
/dashboard/equipamientos
```

El nuevo módulo usa:

```txt
/dashboard/infraestructura/mantenimiento-edilicio
```

## Ejemplos de sectores

- Recepción
- Salón principal
- Sala musculación
- Sala funcional
- Baños hombres
- Baños mujeres
- Duchas
- Depósito
- Oficina
- Pasillos
- Patio
- Sala máquinas

## Ejemplos de activos edilicios

- Matafuegos
- Luminarias
- Tableros eléctricos
- Cañerías
- Sanitarios
- Grifería
- Puertas
- Ventanas
- Pisos
- Pintura
- Aires acondicionados
- Extractores
- Lockers
- Mostradores
- Espejos
- Cartelería
- Mobiliario

## Fuera de alcance en esta fase

Quedan para fases posteriores:

- QR avanzado por activo y sector.
- Auditoría de inventario edilicio.
- Amortización completa y BI financiero.
- Integración profunda con compras, stock y proveedores.
- Gestión legal detallada de matafuegos y certificaciones.
- RAG administrativo de infraestructura.

## Validación recomendada

1. Aplicar SQL privado en Supabase local.
2. Aplicar patch de código.
3. Ejecutar `npm run build`.
4. Ingresar con rol admin.
5. Verificar menú **Infraestructura**.
6. Crear sector.
7. Crear activo edilicio.
8. Crear orden asociada a activo o sector.
9. Completar orden.
10. Verificar métricas, alertas e inventario.

## Notas de seguridad

- No se incluye SQL privado dentro del patch del repositorio.
- No se versionan dumps ni scripts privados.
- La feature no toca tablas existentes de equipamiento.
- La funcionalidad actual de Equipamientos se preserva y solo cambia su ubicación visual dentro del menú.
