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
import RutinaModal from "@/components/modal/RutinaModal";
import RutinaModalView from "@/components/modal/RutinaModalView";
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
} from "@/services/apiClient";
import RutinaDisplay from "@/components/dashboard/rutinas/RutinaDisplay";

interface RutinaDisplay {
  id_rutina: string;
  rutina_desc?: any;
  creado_en: string;
}

export default function RutinasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized, token } =
    useAuthStore();
  const router = useRouter();
  const [rutinas, setRutinas] = useState<RutinaDisplay[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRutina, setSelectedRutina] = useState<RutinaDisplay | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [rutinaVer, setRutinaVer] = useState<RutinaDisplay | null>(null);
  const [selectedNiveles, setSelectedNiveles] = useState<string[]>([]);
  const [selectedObjetivos, setSelectedObjetivos] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);

  const fetchRutinas = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    try {
      const response = await getHistorialRutinas();

      if (!response.ok) {
        throw new Error("Error al cargar rutinas");
      }

      const rutinasData: Rutina[] = response.data;

      const rutinasDisplay: RutinaDisplay[] = rutinasData.map((rutina) => {
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
      toast.error("Error al cargar rutinas");
      setRutinas([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

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
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Rutinas" />
          <main className="flex-1">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Mis Rutinas</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Filter className="w-4 h-4" />
                          Filtros
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-medium">Niveles</h4>
                            <div className="space-y-2">
                              {niveles.map((nivel) => (
                                <div
                                  key={nivel.id_nivel}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`nivel-${nivel.id_nivel}`}
                                    checked={selectedNiveles.includes(
                                      nivel.nombre_nivel
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleNivelChange(
                                        nivel.nombre_nivel,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`nivel-${nivel.id_nivel}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {nivel.nombre_nivel}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 font-medium">Objetivos</h4>
                            <div className="space-y-2">
                              {objetivos.map((objetivo) => (
                                <div
                                  key={objetivo.id_objetivo}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`objetivo-${objetivo.id_objetivo}`}
                                    checked={selectedObjetivos.includes(
                                      objetivo.nombre_objetivo
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleObjetivoChange(
                                        objetivo.nombre_objetivo,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`objetivo-${objetivo.id_objetivo}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {objetivo.nombre_objetivo}
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
                        placeholder="Buscar rutinas..."
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Generar Rutina</span>
                    <span className="sm:hidden">Generar</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <RutinaDisplay
                  onView={(rutina) => {
                    setRutinaVer(rutina);
                    setOpenModalVer(true);
                  }}
                  onEdit={(rutina) => {
                    setSelectedRutina(rutina);
                    setOpenModal(true);
                  }}
                  onDelete={async () => {
                    const confirmar = window.confirm(
                      "¿Está seguro de eliminar la rutina?"
                    );
                    if (!confirmar) return;
                    await fetchRutinas();
                  }}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <RutinaModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedRutina(null);
        }}
        onCreated={fetchRutinas}
        rutina={selectedRutina}
        objetivos={objetivos}
        niveles={niveles}
      />
      <RutinaModalView
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setRutinaVer(null);
        }}
        rutina={rutinaVer}
      />
    </SidebarProvider>
  );
}
