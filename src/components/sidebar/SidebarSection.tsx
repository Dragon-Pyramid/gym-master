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
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm text-muted-foreground flex items-center gap-2">
        {icon && React.createElement(icon)} {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="flex flex-col gap-2 mt-2">
          {items.map((item, idx) => (
            <SidebarMenuItem key={idx}>
              <SidebarMenuButton
                onClick={() => isMobile && closeSidebar()}
                className={`flex items-center gap-2 text-sm pl-2 ${
                  item.level === 2 ? "pl-4" : item.level === 3 ? "pl-8" : ""
                }`}
              >
                <span className="text-muted-foreground">
                  {item.level === 2 ? "●" : item.level === 3 ? "○" : ""}
                </span>
                <Link href={item.link}>{item.title}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
