# Informe ejecutivo — Auditoría inicial Gym Master

**Fecha:** 2026-05-19  
**Bloque:** Auditoría técnica inicial posterior a checkpoint single-tenant.

---

## 1. Situación actual

Gym Master ya superó un punto crítico: dejó de funcionar con una lógica multi-tenant basada en `dbName` y ahora opera como una aplicación single-tenant por instancia/deploy, con una base Supabase/PostgreSQL por gimnasio.

El checkpoint fue validado funcionalmente con login de administrador, creación/login de usuario administrador, creación/login de socio y generación de rutina para socio. Esto permite continuar desde una base real, no desde cero.

---

## 2. Resultado de la auditoría inicial

El repositorio contiene una cantidad importante de módulos y pantallas. La base SQL también tiene tablas, funciones, datos de prueba y procedimientos almacenados avanzados.

Sin embargo, el sistema todavía no está listo para escalar o vender sin una etapa de ordenamiento. Los principales puntos de atención son:

- Seguridad/RLS todavía en modo desarrollo.
- Módulos funcionales pero incompletos.
- Endpoints de métricas/Data Science parcialmente implementados.
- Duplicidad o inconsistencias en algunas entidades de base de datos.
- Ausencia de testing automatizado.
- Pagos Stripe con hardcodes/mocks pendientes de producción.

---

## 3. Decisión estratégica recomendada

No agregar nuevas funcionalidades todavía. Primero consolidar el producto base:

1. DER real y limpieza de base.
2. Seguridad por roles.
3. Usuarios/socios/login/perfil.
4. Rutinas e historial.
5. Pagos/cuotas/asistencia.
6. QR operativo.
7. Ficha médica/dieta/evolución.
8. Dashboard/Data Science.
9. RAG y mobile como fases posteriores.

---

## 4. Próximas ramas sugeridas

```bash
docs/audit-current-system
chore/database-der-and-rls-audit
fix/auth-roles-and-permissions
fix/stripe-payment-flow
fix/rutinas-json-and-history
feature/asistencia-qr-hardening
feature/dieta-evolucion-stabilization
feature/ficha-medica-hardening
```

---

## 5. Conclusión

Gym Master tiene una base valiosa y ya recuperó una funcionalidad central: login + socio + generación de rutina. El siguiente objetivo no debe ser crecer en alcance, sino convertir esta base en un sistema confiable, documentado, seguro y mantenible.

La documentación agregada en este bloque deja listo el mapa inicial para trabajar con orden y trazabilidad.
