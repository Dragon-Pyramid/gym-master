"use client";

import React from "react";
import { useSidebar } from "../ui/sidebar";
import { Search, Bell, Settings, Sun, Moon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import FechaHora from "../ui/FechaHora";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";

/* ----------------------------------------------------------------
   Hook: Dark Mode (toggle y persistencia en localStorage)
   ---------------------------------------------------------------- */
function useDarkMode() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const savedSessionTheme = sessionStorage.getItem("theme");
    const initialDark = savedSessionTheme === "dark";

    setDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  const toggle = React.useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      sessionStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { dark, toggle };
}

interface AppHeaderProps {
  title: string;
}

export const AppHeader = ({ title }: AppHeaderProps) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isMobile } = useSidebar();
  const { dark, toggle } = useDarkMode();

  /* --------------------------------------------------------------
     Util: genera iniciales para el avatar cuando no hay imagen
     -------------------------------------------------------------- */
  const getInitials = (email = "") => {
    const parts = email.split("@")[0].split(".");
    return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const userEmail = user?.email ?? "";
  const initials = getInitials(userEmail);

  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center py-3 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* ---------- Logo y Título ---------- */}
      <div className="flex items-center gap-3 mb-4 md:w-auto md:mb-0">
        <Image
          src="/gm_logo.svg"
          alt="Gym Master Logo"
          width={isMobile ? 60 : 120}
          height={isMobile ? 60 : 120}
          className="rounded-sm dark:invert"
        />
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>

      {/* ---------- Iconos/acciones ---------- */}
      <div className="flex items-center gap-4">
        {/* Dark Mode */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggle}
                aria-label="Cambiar modo claro/oscuro"
              >
                {dark ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {dark ? "Modo claro" : "Modo oscuro"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Fecha y hora en tiempo real */}
        <FechaHora />

        {/* Búsqueda */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Search className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Buscar</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Notificaciones */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notificaciones</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Configuración */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/dashboard/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configuración</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Avatar usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <Avatar size={32} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
