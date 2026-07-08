"use client";
import React, { useEffect } from "react";
import { Sidebar, useSidebar } from "../ui/sidebar";
import { X } from "lucide-react";
import { SidebarSection } from "./SidebarSection";
import { SidebarLogoutButton } from "./SidebarLogoutButton";
import { useIsMobile } from "@/hooks/use-mobile";
import "@/app/styles/scrollbar.css";
import { useAuthStore } from "@/stores/authStore";
import { useSidebarMenu } from "@/hooks/useSidebarSection";
import { useI18n } from "@/i18n/I18nProvider";

export const AppSidebar = () => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : true;
  const { user, isAuthenticated, isInitialized, initializeAuth } =
    useAuthStore();
  const userType = user?.rol;
  const menuSections = useSidebarMenu(userType, user?.permisos_menu ?? null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, isOpen]);

  if (!isInitialized || !isAuthenticated || !user) {
    return null;
  }

  return (
    <>

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]"
          onClick={() => setOpenMobile(false)}
        />
      )}

      <Sidebar
        role={isMobile ? "dialog" : undefined}
        aria-modal={isMobile ? true : undefined}
        aria-label={t('sidebar.aria.dashboardMenu')}
        className={`transition-transform duration-300 transform ${
          isMobile
            ? `fixed inset-y-0 left-0 h-[100dvh] max-h-[100dvh] w-[20rem] max-w-[88vw] overflow-y-auto overscroll-contain pb-[calc(6rem+env(safe-area-inset-bottom))] text-sidebar-foreground z-[60] ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              } bg-[var(--color-sidebar)] rounded-br-[27px] shadow-2xl`
            : `sticky top-0 h-[100dvh] max-h-[100dvh] w-64 min-w-[16rem] max-w-[16rem] border-r border-br z-40 overflow-y-auto overscroll-contain bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] rounded-br-[27px]`
        } sidebar-scrollbar`}
      >
        {isMobile && (
          <div className="sticky top-0 z-[70] flex justify-end bg-[var(--color-sidebar)] px-4 py-3">
            <button
              type="button"
              aria-label={t('sidebar.aria.closeDashboardMenu')}
              onClick={() => setOpenMobile(false)}
              className="sidebar-close"
            >
              <X size={24} className="text-black dark:text-white" />
            </button>
          </div>
        )}
        <div className="mt-2 text-xl font-semibold tracking-tight text-center">
          Gym Master
        </div>

        {menuSections.map((section, idx) => (
          <SidebarSection
            key={idx}
            title={section.title}
            icon={section.icon}
            items={section.items}
            isMobile={isMobile}
            closeSidebar={() => setOpenMobile(false)}
          />
        ))}

        <SidebarLogoutButton
          isMobile={isMobile}
          closeSidebar={() => setOpenMobile(false)}
        />
      </Sidebar>
    </>
  );
};
