"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Sun, Moon, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import GymSelector from "@/components/ui/gym-selector";

const userTypes = [
  {
    value: "admin",
    label: "Administrador",
  },
  {
    value: "socio",
    label: "Socio",
  },
  {
    value: "usuario",
    label: "Usuario",
  },
];

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersSystem = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initial = saved ? saved === "dark" : prefersSystem;
    setDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { dark, toggle };
}

export default function LoginPage() {
  const router = useRouter();
  const {
    login: authLogin,
    isLoading,
    error,
    isAuthenticated,
    initializeAuth,
    clearError,
    isInitialized,
  } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"admin" | "socio" | "usuario" | "">(
    ""
  );
  const [dbName, setDbName] = useState("");
  const [userTypeOpen, setUserTypeOpen] = useState(false);
  const { dark, toggle } = useDarkMode();

  useEffect(() => {
    initializeAuth();
    if (isInitialized && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [initializeAuth, isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("El campo Usuario es obligatorio");
      return;
    }

    if (!password.trim()) {
      toast.error("El campo Contraseña es obligatorio");
      return;
    }

    if (!userType) {
      toast.error("Debe seleccionar un tipo de usuario");
      return;
    }

    if (!dbName) {
      toast.error("Debe seleccionar una base de datos");
      return;
    }

    const success = await authLogin({
      email: email.trim(),
      password: password.trim(),
      rol: userType,
      dbName,
    });

    if (success) {
      toast.success("Inicio de sesión exitoso");
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative inset-0 flex flex-col items-center justify-center gap-4 bg-background">
      <div className="absolute top-4 right-4">
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
                  <Moon className="size-7" />
                ) : (
                  <Sun className="size-7" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {dark ? "Modo claro" : "Modo oscuro"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="text-center">
        <div className="relative mx-auto w-70 h-70">
          <Image
            src="/gm_logo.svg"
            alt="Gym Master Logo"
            fill
            className="object-contain dark:invert"
            priority
          />
        </div>
      </div>

      <div className="w-[400px] px-4">
        <Card className="w-full overflow-hidden shadow-md rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center">
              Accedé con tu usuario y contraseña
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Usuario</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Tipo de Usuario</Label>
                <Popover open={userTypeOpen} onOpenChange={setUserTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userTypeOpen}
                      className="justify-between w-full"
                    >
                      {userType
                        ? userTypes.find((type) => type.value === userType)
                            ?.label
                        : "Seleccione el tipo de usuario..."}
                      <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background">
                    <Command>
                      <CommandInput
                        placeholder="Buscar tipo de usuario..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          No se encontró ningún tipo de usuario.
                        </CommandEmpty>
                        <CommandGroup>
                          {userTypes.map((type) => (
                            <CommandItem
                              key={type.value}
                              value={type.value}
                              onSelect={(currentValue) => {
                                setUserType(
                                  currentValue === userType
                                    ? ""
                                    : (currentValue as
                                        | "admin"
                                        | "socio"
                                        | "usuario"
                                        | "")
                                );
                                setUserTypeOpen(false);
                              }}
                            >
                              {type.label}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  userType === type.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Base de Datos</Label>
                <GymSelector value={dbName} onChange={setDbName} />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
                    <span>Ingresando...</span>
                  </div>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
