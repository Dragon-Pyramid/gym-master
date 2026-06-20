import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";
import React from "react";

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

// Menú reorganizado por áreas funcionales.
// Importante: se conservan todas las rutas existentes; solo cambia el agrupamiento visual.
export const sections: SidebarSectionType[] = [
  {
    title: "General",
    icon: LayoutDashboard,
    items: [{ title: "Inicio", link: "/dashboard", level: 2 }],
  },
  {
    title: "Mi Gimnasio",
    icon: CreditCard,
    items: [
      {
        title: "Control de Asistencia",
        link: "/dashboard/control-asistencia",
        level: 2,
      },
      {
        title: "Pagar cuota",
        link: "/dashboard/mi-cuenta/pagar-cuota",
        level: 2,
      },
      {
        title: "Historial de pagos",
        link: "/dashboard/mi-cuenta/historial-pagos",
        level: 2,
      },
    ],
  },
  {
    title: "Mi Coach",
    icon: Bot,
    items: [
      {
        title: "Coach IA",
        link: "/dashboard/coach",
        level: 2,
      },
      {
        title: "Asistente de Rutinas",
        link: "/dashboard/rutinas/asistente",
        level: 2,
      },
      {
        title: "Asistente de Dietas",
        link: "/dashboard/dietas",
        level: 2,
      },
      {
        title: "Evolución Física",
        link: "/dashboard/evolucion-fisica",
        level: 2,
      },
    ],
  },
  {
    title: "Mi Salud",
    icon: HeartPulse,
    items: [
      { title: "Ficha Médica", link: "/dashboard/ficha-medica", level: 2 },
    ],
  },
  {
    title: "Comunicación",
    icon: MessageSquare,
    items: [
      {
        title: "Mensajes",
        link: "/dashboard/mensajes",
        level: 2,
      },
    ],
  },
  {
    title: "Personal y Operaciones",
    icon: Users,
    items: [
      { title: "Socios", link: "/dashboard/socios", level: 2 },
      { title: "Actividades", link: "/dashboard/actividades", level: 2 },
      { title: "Empleados", link: "/dashboard/empleados", level: 2 },
      { title: "Sueldos", link: "/dashboard/empleados-sueldos", level: 2 },
      { title: "Asistencias", link: "/dashboard/asistencias", level: 2 },
      {
        title: "Salida / Aforo",
        link: "/dashboard/asistencias/aforo",
        level: 2,
      },
    ],
  },
  {
    title: "Infraestructura",
    icon: Building2,
    items: [
      {
        title: "Mantenimiento Edilicio",
        link: "/dashboard/infraestructura/mantenimiento-edilicio",
        level: 2,
      },
      {
        title: "Lector QR/barra",
        link: "/dashboard/infraestructura/lector-qr-barra",
        level: 2,
      },
      {
        title: "Etiquetas QR",
        link: "/dashboard/infraestructura/etiquetas-qr",
        level: 2,
      },
      { title: "Equipamientos", link: "/dashboard/equipamientos", level: 2 },
      {
        title: "Preventivos Equipos",
        link: "/dashboard/infraestructura/equipamientos/preventivos",
        level: 2,
      },
    ],
  },
  {
    title: "Entrenamiento y Salud",
    icon: Dumbbell,
    items: [
      {
        title: "Gestión de Rutinas",
        link: "/dashboard/gestor-rutinas",
        level: 2,
      },
      {
        title: "Gestión de Dietas",
        link: "/dashboard/gestor-dietas",
        level: 2,
      },
      {
        title: "Gestión Evolución Física",
        link: "/dashboard/gestor-evolucion-fisica",
        level: 2,
      },
      {
        title: "Media de Ejercicios",
        link: "/dashboard/rutinas/media",
        level: 2,
      },
    ],
  },
  {
    title: "Comercial y Stock",
    icon: ShoppingCart,
    items: [
      { title: "Comercial / Kiosco", link: "/dashboard/comercial", level: 2 },
      { title: "POS / Kiosco", link: "/dashboard/comercial/kiosco", level: 2 },
      { title: "Caja / Cashup", link: "/dashboard/comercial/caja", level: 2 },
      { title: "Ventas", link: "/dashboard/ventas", level: 2 },
      { title: "Compras", link: "/dashboard/compras", level: 2 },
      { title: "Productos", link: "/dashboard/productos", level: 2 },
      { title: "Stock Ledger", link: "/dashboard/comercial/stock-ledger", level: 2 },
      { title: "Proveedores", link: "/dashboard/proveedores", level: 2 },
      { title: "Servicios", link: "/dashboard/servicios", level: 2 },
    ],
  },
  {
    title: "Finanzas y BI",
    icon: BarChart3,
    items: [
      { title: "Pagos", link: "/dashboard/pagos", level: 2 },
      { title: "Cuotas", link: "/dashboard/cuotas", level: 2 },
      { title: "Gastos / Egresos", link: "/dashboard/otros-gastos", level: 2 },
      { title: "Finanzas / BI", link: "/dashboard/finanzas", level: 2 },
      {
        title: "BI Socios / Promociones",
        link: "/dashboard/bi-socios-demografia-promociones",
        level: 2,
      },
      {
        title: "Ranking / Bonificación",
        link: "/dashboard/socios-ranking-bonificacion",
        level: 2,
      },
    ],
  },
  {
    title: "IA y RAG",
    icon: Bot,
    items: [
      {
        title: "RAG Corpus",
        link: "/dashboard/rag-corpus",
        level: 2,
      },
    ],
  },
  {
    title: "Comunicación y Soporte",
    icon: MessageSquare,
    items: [
      { title: "Notificaciones", link: "/dashboard/notificaciones", level: 2 },
      { title: "Mensajes Socios", link: "/dashboard/mensajes-admin", level: 2 },
      { title: "Avisos", link: "/dashboard/avisos", level: 2 },
      {
        title: "Soporte Dragon Pyramid",
        link: "/dashboard/soporte-dragon-pyramid",
        level: 2,
      },
      {
        title: "Respaldo / Exportación",
        link: "/dashboard/respaldo-negocio",
        level: 2,
      },
    ],
  },
  {
    title: "Administración del Sistema",
    icon: Wrench,
    items: [
      { title: "Usuarios", link: "/dashboard/usuarios", level: 2 },
      {
        title: "Datos del Gimnasio",
        link: "/dashboard/gimnasio-parametrizacion",
        level: 2,
      },
      {
        title: "Parametrización",
        link: "/dashboard/parametrizacion",
        level: 2,
      },
    ],
  },
  {
    title: "Configuración Personal",
    icon: Settings,
    items: [
      { title: "Perfil", link: "/dashboard/perfil", level: 2 },
      {
        title: "Preferencias",
        link: "/dashboard/settings/preferences",
        level: 2,
      },
    ],
  },
];
