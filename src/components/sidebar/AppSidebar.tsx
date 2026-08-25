"use client";
import React, { useEffect, useRef } from "react";
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
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const { user, isAuthenticated, isInitialized, initializeAuth } =
    useAuthStore();
  const userType = user?.rol;
  const menuSections = useSidebarMenu(userType, user?.permisos_menu ?? null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenMobile(false);
        return;
      }

      if (event.key !== "Tab") return;

      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      const focusableElements = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(","),
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusableElements.length === 0) {
        event.preventDefault();
        sidebar.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isMobile, isOpen, setOpenMobile]);

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
        ref={sidebarRef}
        role={isMobile && isOpen ? "dialog" : undefined}
        aria-modal={isMobile && isOpen ? true : undefined}
        aria-label={t('sidebar.aria.dashboardMenu')}
        aria-hidden={isMobile && !isOpen ? true : undefined}
        inert={isMobile && !isOpen ? true : undefined}
        tabIndex={isMobile ? -1 : undefined}
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
              ref={closeButtonRef}
              type="button"
              aria-label={t('sidebar.aria.closeDashboardMenu')}
              onClick={() => setOpenMobile(false)}
              className="sidebar-close"
            >
              <X
                size={24}
                className="text-black dark:text-white"
                aria-hidden="true"
              />
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
