"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Printer, Filter } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import { translateCoreLevel, translateCoreObjective } from "@/utils/coreSeedI18n";
import RutinaModal from "@/components/modal/RutinaModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Rutina } from "@/interfaces/rutina.interface";
import { Objetivo } from "@/interfaces/objetivo.interface";
import { Nivel } from "@/interfaces/niveles.interface";
import {
  getHistorialRutinas,
  getObjetivos,
  getNiveles,
  eliminarRutina,
} from "@/services/apiClient";
import RutinaDisplay from "@/components/dashboard/rutinas/RutinaDisplay";

interface RutinaDisplayData {
  id_rutina: number;
  rutina_desc?: any;
  creado_en: string;
}

const translateRoutineFilterLabel = (value: string, isEnglish: boolean): string => {
  const translatedLevel = translateCoreLevel(value, isEnglish);
  if (translatedLevel !== value) return translatedLevel;

  const translatedObjective = translateCoreObjective(value, isEnglish);
  if (translatedObjective !== value) return translatedObjective;

  return value;
};

export default function RutinasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized, token } =
    useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = useCallback((es: string, en: string) => (isEnglish ? en : es), [isEnglish]);
  const [rutinas, setRutinas] = useState<RutinaDisplayData[]>([]);
  const [rutinasRefreshKey, setRutinasRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRutina, setSelectedRutina] = useState<Rutina | null>(null);
  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedObjetivos, setSelectedObjetivos] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const usuarioEsAdmin =
    user?.rol?.trim().toLowerCase() === "admin" ||
    user?.rol?.trim().toLowerCase() === "administrador";

  const fetchRutinas = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await getHistorialRutinas();

      if (!response.ok) {
        throw new Error(tx("Error al cargar rutinas", "Error loading routines"));
      }

      const rutinasData: Rutina[] = response.data;

      const rutinasDisplay: RutinaDisplayData[] = rutinasData.map((rutina) => {
        let rutinaDesc = rutina.rutina_desc;

        if (typeof rutina.rutina_desc === "string") {
          try {
            rutinaDesc = JSON.parse(rutina.rutina_desc);
          } catch (e) {
            console.warn("Error parsing rutina_desc JSON:", e);
          }
        }

        return {
          id_rutina: rutina.id_rutina,
          rutina_desc: rutinaDesc,
          creado_en: rutina.creado_en || new Date().toISOString(),
        };
      });

      setRutinas(rutinasDisplay);
    } catch (error) {
      console.error("Error al cargar rutinas:", error);
      toast.error(tx("Error al cargar rutinas", "Error loading routines"));
      setRutinas([]);
    } finally {
      setLoading(false);
    }
  }, [user, token, tx]);

  const fetchObjetivos = useCallback(async () => {
    if (!user || !token) return;

    try {
      const response = await getObjetivos();

      if (response.ok) {
        setObjetivos(response.data);
      }
    } catch (error) {
      console.error("Error al cargar objetivos:", error);
    }
  }, [user, token]);

  const fetchNiveles = useCallback(async () => {
    if (!user || !token) return;

    try {
      const response = await getNiveles();

      if (response.ok) {
        setNiveles(response.data);
      }
    } catch (error) {
      console.error("Error al cargar niveles:", error);
    }
  }, [user, token]);

  const refreshRutinas = useCallback(async () => {
    await fetchRutinas();
    setRutinasRefreshKey((current) => current + 1);
  }, [fetchRutinas]);

  const handleDeleteRutina = useCallback(
    async (rutina: Rutina) => {
      const confirmar = window.confirm(
        tx("¿Está seguro de eliminar la rutina?", "Are you sure you want to delete this routine?"),
      );

      if (!confirmar) return;

      try {
        const response = await eliminarRutina(rutina.id_rutina);

        if (!response.ok) {
          throw new Error(response.error || tx("Error al eliminar rutina", "Error deleting routine"));
        }

        toast.success(tx("Rutina eliminada correctamente", "Routine deleted successfully"));
        await refreshRutinas();
      } catch (error) {
        console.error("Error al eliminar rutina:", error);
        toast.error(tx("Error al eliminar la rutina", "Error deleting the routine"));
        throw error;
      }
    },
    [refreshRutinas, tx],
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && token) {
      fetchRutinas();
      fetchObjetivos();
      fetchNiveles();
    }
  }, [
    isInitialized,
    isAuthenticated,
    user,
    token,
    fetchRutinas,
    fetchObjetivos,
    fetchNiveles,
  ]);
  const handlePrint = () => {
    window.print();
  };

  const handleNivelChange = (nivel: string, checked: boolean) => {
    if (checked) {
      setSelectedNiveles([...selectedNiveles, nivel]);
    } else {
      setSelectedNiveles(selectedNiveles.filter((n) => n !== nivel));
    }
  };

  const handleObjetivoChange = (objetivo: string, checked: boolean) => {
    if (checked) {
      setSelectedObjetivos([...selectedObjetivos, objetivo]);
    } else {
      setSelectedObjetivos(selectedObjetivos.filter((o) => o !== objetivo));
    }
  };

  if (!isInitialized) {
    return <div>{tx("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-[100dvh]">
        <AppSidebar />
        <SidebarInset className="!grid !min-h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
          <AppHeader title={tx("Rutinas", "Routines")} />
          <section className="min-h-0 overflow-y-auto bg-white dark:bg-black">
            <Card className="w-full border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-4 md:flex-nowrap dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-xl font-bold text-gray-950 dark:text-neutral-50">
                  {usuarioEsAdmin
                    ? tx("Rutinas asignadas a socios", "Routines assigned to members")
                    : tx("Mis rutinas", "My routines")}
                </h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 bg-white text-gray-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Filter className="w-4 h-4" />
                          {tx("Filtros", "Filters")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-gray-200 bg-white text-gray-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-medium">{tx("Niveles", "Levels")}</h4>
                            <div className="space-y-2">
                              {niveles.map((nivel) => (
                                <div
                                  key={nivel.id_nivel}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`nivel-${nivel.id_nivel}`}
                                    checked={selectedNiveles.includes(
                                      nivel.nombre_nivel,
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleNivelChange(
                                        nivel.nombre_nivel,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`nivel-${nivel.id_nivel}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {translateRoutineFilterLabel(nivel.nombre_nivel, isEnglish)}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 font-medium">{tx("Objetivos", "Goals")}</h4>
                            <div className="space-y-2">
                              {objetivos.map((objetivo) => (
                                <div
                                  key={objetivo.id_objetivo}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`objetivo-${objetivo.id_objetivo}`}
                                    checked={selectedObjetivos.includes(
                                      objetivo.nombre_objetivo,
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleObjetivoChange(
                                        objetivo.nombre_objetivo,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`objetivo-${objetivo.id_objetivo}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {translateRoutineFilterLabel(objetivo.nombre_objetivo, isEnglish)}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={tx("Buscar rutinas...", "Search routines...")}
                        className="w-full pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="hidden items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd] dark:border-cyan-500 dark:bg-neutral-900 dark:text-cyan-300 dark:hover:bg-cyan-950/40 sm:flex"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{tx("Imprimir listado", "Print list")}</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] text-white hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">{tx("Generar rutina", "Generate routine")}</span>
                    <span className="sm:hidden">{tx("Generar", "Generate")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 dark:bg-neutral-950">
                <RutinaDisplay
                  refreshKey={rutinasRefreshKey}
                  onEdit={
                    usuarioEsAdmin
                      ? (rutina: Rutina) => {
                          setSelectedRutina(rutina);
                          setOpenModal(true);
                        }
                      : undefined
                  }
                  onDelete={usuarioEsAdmin ? handleDeleteRutina : undefined}
                />
              </CardContent>
            </Card>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
      <RutinaModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedRutina(null);
        }}
        onCreated={refreshRutinas}
        rutina={selectedRutina}
        objetivos={objetivos}
        niveles={niveles}
      />
    </SidebarProvider>
  );
}
