import { SidebarItemType } from '@/components/sidebar/sidebarConfig';
import {
  SidebarSectionType,
  sections,
} from '../components/sidebar/sidebarConfig';
import { getEffectiveMenuPermissions } from '@/lib/permissions/menuPermissions';

export const useSidebarMenu = (
  userType: string | undefined,
  menuPermissions?: string[] | null
): SidebarSectionType[] => {
  if (!userType) {
    return [];
  }

  const filteredSections: SidebarSectionType[] = [];

  const menuTitlesMap: { [key: string]: string } = {
    Rutinas: 'Rutina',
    Dietas: 'Dieta',
    Cuotas: 'Cuota - Precio',
  };

  const allowedTitles = new Set(
    getEffectiveMenuPermissions(userType, menuPermissions)
  );

  sections.forEach((section: SidebarSectionType) => {
    const items = section.items.filter((item: SidebarItemType) =>
      allowedTitles.has(item.title)
    );

    if (items.length > 0) {
      filteredSections.push({
        ...section,
        items: items.map((item) => ({
          ...item,
          title: menuTitlesMap[item.title] || item.title,
        })),
      });
    }
  });

  return filteredSections.filter((section) => section.items.length > 0);
};
