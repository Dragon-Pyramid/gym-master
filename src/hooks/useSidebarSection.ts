import { SidebarItemType } from "@/components/sidebar/sidebarConfig";
import {
  SidebarSectionType,
  sections,
} from "../components/sidebar/sidebarConfig";

export const useSidebarMenu = (
  userType: string | undefined
): SidebarSectionType[] => {
  if (!userType) {
    return [];
  }

  const filteredSections: SidebarSectionType[] = [];

  const menuTitlesMap: { [key: string]: string } = {
    Rutinas: "Rutina",
    Dietas: "Dieta",
    Cuotas: "Cuota - Precio",
  };
  if (userType === "socio") {
    const socioAllowedTitles = [
      "Inicio",
      "Control de Asistencia",
      "Rutinas",
      "Dietas",
      "Evolución Física",
      "Cuotas",
      "Perfil",
      "Preferencias",
    ];

    sections.forEach((section: SidebarSectionType) => {
      const itemsForSocio = section.items.filter((item: SidebarItemType) =>
        socioAllowedTitles.includes(item.title)
      );
      if (itemsForSocio.length > 0) {
        filteredSections.push({
          ...section,
          items: itemsForSocio.map((item) => ({
            ...item,
            title: menuTitlesMap[item.title] || item.title,
          })),
        });
      }
    });
  } else if (userType === "usuario") {
    const usuarioAllowedTitles = [
      "Inicio",
      "Asistencias",
      "Socios",
      "Pagos",
      "Ventas",
      "Rutinas",
      "Dietas",
      "Perfil",
      "Preferencias",
    ];

    sections.forEach((section: SidebarSectionType) => {
      const itemsForUser = section.items.filter((item: SidebarItemType) =>
        usuarioAllowedTitles.includes(item.title)
      );
      if (itemsForUser.length > 0) {
        filteredSections.push({
          ...section,
          items: itemsForUser.map((item) => ({
            ...item,
            title: menuTitlesMap[item.title] || item.title,
          })),
        });
      }
    });
  } else if (userType === "admin") {
    const adminAllowedTitles = [
      "Inicio",
      "Asistencias",
      "Gestión de Rutinas",
      "Gestión de Dietas",
      "Socios",
      "Pagos",
      "Ventas",
      "Avisos",
      "Rutinas",
      "Dietas",
      "Equipamientos",
      "Actividades",
      "Entrenadores",
      "Cuotas",
      "Proveedores",
      "Usuarios",
      "Productos",
      "Servicios",
      "Otros gastos",
      "Perfil",
      "Preferencias",
    ];

    sections.forEach((section: SidebarSectionType) => {
      const itemsForAdmin = section.items.filter((item: SidebarItemType) =>
        adminAllowedTitles.includes(item.title)
      );
      if (itemsForAdmin.length > 0) {
        filteredSections.push({
          ...section,
          items: itemsForAdmin.map((item) => ({
            ...item,
            title: menuTitlesMap[item.title] || item.title,
          })),
        });
      }
    });
  }

  return filteredSections.filter((section) => section.items.length > 0);
};
