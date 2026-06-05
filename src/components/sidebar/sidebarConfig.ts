import {
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings,
  ShieldBan,
} from 'lucide-react';
import React from 'react';

export interface SidebarItemType {
  title: string;
  link: string;
  level: number;
}

export interface SidebarSectionType {
  title: string;
  icon?: React.ElementType;
  items: SidebarItemType[];
}

export const sections: SidebarSectionType[] = [
  {
    title: 'General',
    icon: LayoutDashboard,
    items: [{ title: 'Inicio', link: '/dashboard', level: 2 }],
  },
  {
    title: 'Menú Personal',
    icon: Dumbbell,
    items: [
      {
        title: 'Control de Asistencia',
        link: '/dashboard/control-asistencia',
        level: 2,
      },
      { title: 'Ficha Médica', link: '/dashboard/ficha-medica', level: 2 },
      {
        title: 'Asistente de Rutinas',
        link: '/dashboard/rutinas/asistente',
        level: 2,
      },
      {
        title: 'Asistente de Dietas',
        link: '/dashboard/dietas',
        level: 2,
      },
      {
        title: 'Mensajes',
        link: '/dashboard/mensajes',
        level: 2,
      },
    ],
  },
  {
    title: 'Mi cuenta',
    icon: CreditCard,
    items: [
      {
        title: 'Pagar cuota',
        link: '/dashboard/mi-cuenta/pagar-cuota',
        level: 2,
      },
      {
        title: 'Historial de pagos',
        link: '/dashboard/mi-cuenta/historial-pagos',
        level: 2,
      },
    ],
  },
  {
    title: 'Gestión de Gimnasio',
    icon: Dumbbell,
    items: [
      { title: 'Socios', link: '/dashboard/socios', level: 2 },
      { title: 'Actividades', link: '/dashboard/actividades', level: 2 },
      { title: 'Empleados', link: '/dashboard/empleados', level: 2 },
      // Rutas legacy deshabilitadas del menú visual: Rutinas, Dietas y Evolución Física.
      // Se conservan los archivos/rutas para trazabilidad y compatibilidad, pero la operación actual usa los gestores administrativos.

    ],
  },
  {
    title: 'Administración',
    icon: ShieldBan,
    items: [
      { title: 'Asistencias', link: '/dashboard/asistencias', level: 2 },
      {
        title: 'Gestión de Rutinas',
        link: '/dashboard/gestor-rutinas',
        level: 2,
      },
      {
        title: 'Gestión de Dietas',
        link: '/dashboard/gestor-dietas',
        level: 2,
      },
      {
        title: 'Gestión Evolución Física',
        link: '/dashboard/gestor-evolucion-fisica',
        level: 2,
      },
      {
        title: 'Media de Ejercicios',
        link: '/dashboard/rutinas/media',
        level: 2,
      },
      { title: 'Pagos', link: '/dashboard/pagos', level: 2 },
      { title: 'Comercial / Kiosco', link: '/dashboard/comercial', level: 2 },
      { title: 'Ventas', link: '/dashboard/ventas', level: 2 },
      { title: 'Compras', link: '/dashboard/compras', level: 2 },
      { title: 'Cuotas', link: '/dashboard/cuotas', level: 2 },
      { title: 'Proveedores', link: '/dashboard/proveedores', level: 2 },
      { title: 'Usuarios', link: '/dashboard/usuarios', level: 2 },
      { title: 'Productos', link: '/dashboard/productos', level: 2 },
      { title: 'Servicios', link: '/dashboard/servicios', level: 2 },
      { title: 'Gastos / Egresos', link: '/dashboard/otros-gastos', level: 2 },
      { title: 'Finanzas / BI', link: '/dashboard/finanzas', level: 2 },
      { title: 'Sueldos', link: '/dashboard/empleados-sueldos', level: 2 },
      { title: 'Notificaciones', link: '/dashboard/notificaciones', level: 2 },
      { title: 'Mensajes Socios', link: '/dashboard/mensajes-admin', level: 2 },
      { title: 'Soporte Dragon Pyramid', link: '/dashboard/soporte-dragon-pyramid', level: 2 },
      { title: 'Avisos', link: '/dashboard/avisos', level: 2 },
      { title: 'Equipamientos', link: '/dashboard/equipamientos', level: 2 },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    items: [
      { title: 'Perfil', link: '/dashboard/perfil', level: 2 },
      {
        title: 'Preferencias',
        link: '/dashboard/settings/preferences',
        level: 2,
      },
      {
        title: 'Parametrización',
        link: '/dashboard/parametrizacion',
        level: 2,
      },
    ],
  },
];
