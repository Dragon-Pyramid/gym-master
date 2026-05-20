# Informe ejecutivo — RLS e integridad core Gym Master

## Resumen

Se inició la primera etapa de desarrollo/corrección real posterior a la migración single-tenant de Gym Master. El objetivo fue preparar una base más segura para usuarios y socios, evitando que el frontend dependa directamente de consultas Supabase en módulos core.

## Decisión técnica

Se adoptó una estrategia de acceso controlado:

```txt
Frontend → API Routes → servicios server-only → Supabase service role
```

Esto permite mantener el JWT propio de Gym Master como fuente de autorización de negocio y prepara el camino para cerrar policies RLS abiertas.

## Avances

- Nuevo cliente Supabase server-only.
- Servicios backend para usuarios y socios.
- API Routes de usuarios y socios actualizadas.
- Frontend de usuarios/socios migrado a clientes API browser.
- Script de preflight de integridad usuario/socio.
- Migración de integridad mínima con índices y constraint.
- Plan de hardening progresivo de RLS.

## Beneficio

El sistema empieza a separar correctamente:

- código cliente,
- lógica backend,
- acceso privilegiado a base de datos,
- autorización por rol.

Esto reduce riesgo de exponer datos sensibles y permite avanzar hacia una arquitectura más mantenible.

## Riesgos controlados

No se eliminaron todavía todas las policies abiertas porque hay módulos pendientes de revisar. El retiro se hará por módulo, después de validar que cada pantalla consuma API Routes y no Supabase directo.

## Próximo paso recomendado

Continuar migrando módulos críticos a API Routes server-only, priorizando:

1. pagos/cuotas,
2. rutinas,
3. asistencia/QR,
4. dietas/evolución,
5. ficha médica.

Luego se podrá endurecer RLS tabla por tabla.
