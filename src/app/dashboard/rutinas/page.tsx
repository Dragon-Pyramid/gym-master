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
import { Search, Printer, FileSpreadsheet, Filter } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import RutinasTable from "@/components/tables/RutinasTable";
import RutinaModal from "@/components/modal/RutinaModal";
import RutinaModalView from "@/components/modal/RutinaModalView";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
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

pdfMake.vfs = pdfFonts.vfs;

interface RutinaDisplay {
  id_rutina: string;
  objetivo: string;
  nivel: string;
  fecha: string;
  dias: string;
  creado_en: string;
}

export default function RutinasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized, token } =
    useAuthStore();
  const router = useRouter();
  const [rutinas, setRutinas] = useState<RutinaDisplay[]>([]);
  const [filteredRutinas, setFilteredRutinas] = useState<RutinaDisplay[]>([]);
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
        let diasCalculados = "Sin definir";

        if (rutina.rutina_desc) {
          let rutinaDesc = rutina.rutina_desc;

          if (typeof rutina.rutina_desc === "string") {
            try {
              rutinaDesc = JSON.parse(rutina.rutina_desc);
            } catch (e) {
              console.warn("Error parsing rutina_desc JSON:", e);
            }
          }

          if (rutinaDesc && rutinaDesc.semana) {
            const diasSemana = Object.keys(rutinaDesc.semana);
            const diasFormateados = diasSemana.map(
              (dia) => dia.charAt(0).toUpperCase() + dia.slice(1)
            );
            diasCalculados = `${diasSemana.length} días (${diasFormateados.join(
              ", "
            )})`;
          }
        }

        return {
          id_rutina: rutina.id_rutina,
          socio: user.nombre || "Socio",
          objetivo: "Objetivo por definir",
          nivel: "Nivel por definir",
          fecha: rutina.creado_en
            ? new Date(rutina.creado_en).toLocaleDateString()
            : new Date().toLocaleDateString(),
          dias: diasCalculados,
          creado_en: rutina.creado_en || new Date().toISOString(),
        };
      });

      setRutinas(rutinasDisplay);
      setFilteredRutinas(rutinasDisplay);
    } catch (error) {
      console.error("Error al cargar rutinas:", error);
      toast.error("Error al cargar rutinas");
      setRutinas([]);
      setFilteredRutinas([]);
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

  const handleExportPDF = () => {
    const tableBody = [
      ["Socio", "Objetivo", "Nivel", "Fecha", "Días"],
      ...filteredRutinas.map((r) => [
        r.socio,
        r.objetivo,
        r.nivel,
        r.fecha,
        r.dias,
      ]),
    ];

    const docDefinition: import("pdfmake/interfaces").TDocumentDefinitions = {
      content: [
        {
          text: "Listado de Rutinas",
          style: "header",
          margin: [0, 0, 0, 12] as [number, number, number, number],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*", "*", "*"],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
      pageOrientation: "landscape",
    };

    pdfMake.createPdf(docDefinition).download("Listado_Rutinas.pdf");
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

  useEffect(() => {
    let rutinasFiltradas = rutinas;
    if (selectedNiveles.length > 0) {
      rutinasFiltradas = rutinasFiltradas.filter((r) =>
        selectedNiveles.includes(r.nivel)
      );
    }

    if (selectedObjetivos.length > 0) {
      rutinasFiltradas = rutinasFiltradas.filter((r) =>
        selectedObjetivos.includes(r.objetivo)
      );
    }

    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      rutinasFiltradas = rutinasFiltradas.filter(
        (r) =>
          r.socio.toLowerCase().includes(lowercaseSearch) ||
          r.objetivo.toLowerCase().includes(lowercaseSearch) ||
          r.nivel.toLowerCase().includes(lowercaseSearch)
      );
    }

    setFilteredRutinas(rutinasFiltradas);
  }, [searchTerm, rutinas, selectedNiveles, selectedObjetivos]);

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
          <main className="flex-1 p-6 space-y-6">
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
                    variant="outline"
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
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
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <RutinasTable
                    rutinas={filteredRutinas}
                    loading={loading}
                    onEdit={(rutina) => {
                      setSelectedRutina(rutina);
                      setOpenModal(true);
                    }}
                    onView={(rutina) => {
                      setRutinaVer(rutina);
                      setOpenModalVer(true);
                    }}
                    onDelete={async () => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar la rutina?"
                      );
                      if (!confirmar) return;
                      toast.success("Rutina eliminada correctamente");
                      fetchRutinas();
                    }}
                  />
                </div>
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
