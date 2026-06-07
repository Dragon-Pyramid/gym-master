# QA demo database seed large — Gym Master

**Fecha:** 2026-06-07  
**Rama sugerida:** `feature/qa-demo-database-seed-large`  
**Tipo:** seed demo/QA privado, no versionar SQL en repositorio público.

## Objetivo

Crear una base demo amplia, realista y útil para:

- recorridos comerciales del sistema;
- pruebas QA integrales;
- dashboards de inicio, comercial, finanzas y asistencia;
- futuras métricas demográficas/promocionales;
- validación de socio, pagos, ventas, servicios, compras, stock, empleados, sueldos, mensajes, soporte, rutinas, dietas y evolución física.

## Archivos privados del patch

Estos archivos se copian al repo local, pero están ignorados por `.gitignore` y no deben commitearse:

```txt
supabase/migrations/202606071230_qa_demo_database_seed_large.sql
database/scripts/validar_qa_demo_database_seed_large.sql
```

## Alcance del seed

El script agrega datos demo idempotentes con el tag:

```txt
qa_demo_database_seed_large_20260607
```

Incluye:

- 120 socios demo.
- Distribución aproximada: 72 hombres / 48 mujeres.
- 5 socios nuevos sin movimientos operativos.
- Contraseña temporal por socio: `GymMaster` + DNI.
- `must_change_password = true` para usuarios socio demo.
- Fichas médicas demo.
- Cuotas mensuales desde enero del año actual hasta el mes actual.
- Pagos históricos con medios variados.
- Socios al día y algunos vencidos/morosos para BI.
- Asistencias históricas con entrada y salida.
- Evolución física mensual.
- Rutinas demo compactas.
- Dietas demo básicas.
- Ventas a socio.
- Ventas a consumidor final y visitante.
- Detalles de venta con productos y servicios.
- Movimientos de stock por venta y compra.
- Compras mensuales.
- Gastos/egresos mensuales.
- Sueldos mensuales de empleados.
- Notificaciones demo.
- Envíos de notificación.
- Tickets de soporte Dragon Pyramid.
- Mensajes socio/admin.

## Límites intencionales

Este seed **no toca**:

- catálogo de ejercicios;
- `ejercicio_media`;
- imágenes/Cloudinary;
- videos YouTube ES/EN;
- reglas del RAG;
- código fuente de aplicación.

El objetivo es poblar operación demo, no redefinir catálogos de entrenamiento/media.

## Flujo recomendado de validación

Desde Git Bash:

```bash
cd /e/gym-master-2026/sistema/gym-master

git branch --show-current
git status --short
```

Validar que los SQL sigan ignorados:

```bash
git check-ignore -v supabase/migrations/202606071230_qa_demo_database_seed_large.sql
git check-ignore -v database/scripts/validar_qa_demo_database_seed_large.sql
```

Validación QA local con dump actualizado:

```bash
/e/gym-master-2026/sistema/gm-db-qa-lab/gm-db-qa-restore.sh \
  /e/gym-master-2026/sistema/backups/local-baseline/backup_completo_gym_master_07062026.sql \
  supabase/migrations/202606071230_qa_demo_database_seed_large.sql \
  database/scripts/validar_qa_demo_database_seed_large.sql
```

Si el dump está en otra ruta, ajustar el primer parámetro.

## Aplicación remota

1. Generar backup remoto previo.
2. Confirmar migraciones:

```bash
npx supabase migration list
```

3. Si faltan placeholders locales del historial remoto, recrearlos en `supabase/migrations/`, siempre ignorados por Git.
4. Aplicar:

```bash
npx supabase db push
```

5. Confirmar:

```bash
npx supabase migration list
```

6. En Supabase Studio → SQL Editor:

```sql
select pg_notify('pgrst', 'reload schema');
```

7. Ejecutar el contenido de:

```txt
database/scripts/validar_qa_demo_database_seed_large.sql
```

Resultado esperado: `NOTICE: Validación OK...` y `ROLLBACK`.

## Pruebas funcionales sugeridas

### Dashboard / BI

- Ver crecimiento de socios.
- Ver socios activos/inactivos/morosos.
- Ver ingresos por cuotas, ventas y servicios.
- Ver egresos por gastos, compras y sueldos.
- Ver resultado neto mensual.

### Socios

- Buscar `QA Demo`.
- Buscar `Nuevo Demo`.
- Confirmar que hay 5 socios nuevos sin movimientos.
- Probar login con un socio demo:

```txt
Email: qa.demo.socio.001@gymmaster.local
Password: GymMaster88000001
```

Recordar que `must_change_password = true`, por lo que puede exigir cambio de contraseña según el flujo actual.

### Asistencia

- Ver histórico de asistencias.
- Ver asistencias con hora de ingreso y egreso.
- Usar datos para futura salida/aforo.

### Comercial

- Ver ventas a socio.
- Ver ventas a consumidor final.
- Ver ventas a visitante.
- Ver detalle de venta.
- Ver productos/servicios vendidos.
- Ver movimientos de stock.

### Finanzas

- Validar ingresos por pagos y ventas.
- Validar egresos por compras, gastos y sueldos.
- Exportar Excel/PDF si corresponde.

### Mensajes / soporte / notificaciones

- Validar mensajes socio/admin demo.
- Validar tickets de soporte `DP-QADEMO-*`.
- Validar notificaciones `QA Demo *`.

## Reglas de seguridad

- No commitear SQL.
- No subir dumps ni backups al repo público.
- No versionar migraciones reales de DB en el repositorio público.
- Mantener scripts privados en repo/carpeta DB privada o local ignorada.

## Próximo bloque recomendado después del seed

```txt
feature/qa-dashboard-socio-recorrido-general
```

El seed deja datos suficientes para recorrer el dashboard del socio con casos nuevos, activos, con pagos, con asistencia, con rutina, dieta, evolución, mensajes y cuotas.
