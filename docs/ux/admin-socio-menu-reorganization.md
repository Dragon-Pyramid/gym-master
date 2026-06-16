# Gym Master - Reorganización de menú Admin/Socio

## Rama

`feature/admin-socio-menu-reorganization`

## Objetivo

Reordenar el menú lateral de Gym Master por áreas funcionales para mejorar la navegación, la demo comercial y la escalabilidad del dashboard, sin eliminar rutas, módulos ni permisos existentes.

## Criterio aplicado

La feature reorganiza visualmente el sidebar y el selector de permisos en grupos más claros. No cambia las rutas ni las claves de permisos (`key`) para mantener compatibilidad con usuarios y socios existentes.

## Menú socio

- General
  - Inicio
- Mi Gimnasio
  - Control de Asistencia
  - Pagar cuota
  - Historial de pagos
- Mi Coach
  - Coach IA
  - Asistente de Rutinas
  - Asistente de Dietas
  - Evolución Física
- Mi Salud
  - Ficha Médica
- Comunicación
  - Mensajes
- Configuración Personal
  - Perfil
  - Preferencias

## Menú administración / usuario interno

- General
  - Inicio
- Personal y Operaciones
  - Socios
  - Actividades
  - Empleados
  - Sueldos
  - Asistencias
  - Salida / Aforo
  - Equipamientos
- Entrenamiento y Salud
  - Gestión de Rutinas
  - Gestión de Dietas
  - Gestión Evolución Física
  - Media de Ejercicios
- Comercial y Stock
  - Comercial / Kiosco
  - Ventas
  - Compras
  - Productos
  - Proveedores
  - Servicios
- Finanzas y BI
  - Pagos
  - Cuota - Precio
  - Gastos / Egresos
  - Finanzas / BI
  - BI Socios / Promociones
  - Ranking / Bonificación
- IA y RAG
  - RAG Corpus
- Comunicación y Soporte
  - Notificaciones
  - Mensajes Socios
  - Avisos
  - Soporte Dragon Pyramid
  - Respaldo / Exportación
- Administración del Sistema
  - Usuarios
  - Datos del Gimnasio
  - Parametrización
- Configuración Personal
  - Perfil
  - Preferencias

## Compatibilidad

Se mantienen todas las claves de permisos actuales para no invalidar `permisos_menu` existentes. Los cambios son de agrupamiento visual y organización funcional.

## Validación recomendada

- Verificar menú como admin.
- Verificar menú como usuario interno.
- Verificar menú como socio.
- Entrar a cada ruta desde el menú.
- Validar dashboard mobile y accesos rápidos.
- Ejecutar `npm run build`.
