"use client";

import React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";
import Link from "next/link";
import { SidebarItemType } from "./sidebarConfig";
import { useI18n } from "@/i18n/I18nProvider";
import {
  translateNavigationGroup,
  translateNavigationItem,
} from "@/i18n/navigationLabels";

interface Props {
  title: string;
  icon?: React.ElementType;
  items: SidebarItemType[];
  isMobile: boolean;
  closeSidebar: () => void;
}

export const SidebarSection: React.FC<Props> = ({
  title,
  icon,
  items,
  isMobile,
  closeSidebar,
}) => {
  const { t } = useI18n();
  const translatedTitle = translateNavigationGroup(title, t);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm text-muted-foreground flex items-center gap-2">
        {icon && React.createElement(icon)} {translatedTitle}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="flex flex-col gap-2 mt-2">
          {items.map((item, idx) => (
            <SidebarMenuItem key={idx}>
              <SidebarMenuButton
                asChild
                className={`min-h-10 touch-manipulation gap-2 text-sm ${
                  item.level === 2 ? "pl-4" : item.level === 3 ? "pl-8" : "pl-2"
                }`}
              >
                <Link href={item.link} onClick={() => isMobile && closeSidebar()}>
                  <span className="shrink-0 text-muted-foreground">
                    {item.level === 2 ? "●" : item.level === 3 ? "○" : ""}
                  </span>
                  <span className="truncate">{translateNavigationItem(item.title, t)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
