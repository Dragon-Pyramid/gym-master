"use client";

import { useEffect, useState } from "react";
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
import DietasTable, { type Dieta } from "@/components/tables/DietasTable";
import DietasModal from "@/components/modal/DietasModal";
import DietasViewModal from "@/components/modal/DietasViewModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const dietasHardcodeadas: Dieta[] = [
  {
    id_dieta: "1",
    socio: "Juan Pérez",
    objetivo: "Definición",
    fecha: "2024-06-10",
  },
  {
    id_dieta: "2",
    socio: "María Gómez",
    objetivo: "Hipertrofia",
    fecha: "2024-06-11",
  },
  {
    id_dieta: "3",
    socio: "Carlos López",
    objetivo: "Fuerza",
    fecha: "2024-06-12",
  },
  {
    id_dieta: "4",
    socio: "Juan Pérez",
    objetivo: "Resistencia",
    fecha: "2024-06-13",
  },
  {
    id_dieta: "5",
    socio: "María Gómez",
    objetivo: "Definición",
    fecha: "2024-06-14",
  },
];

const objetivos = ["Hipertrofia", "Definición", "Fuerza", "Resistencia"];

export default function DietasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [dietas, setDietas] = useState<Dieta[]>([]);
  const [filteredDietas, setFilteredDietas] = useState<Dieta[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDieta, setSelectedDieta] = useState<Dieta | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [dietaVer, setDietaVer] = useState<Dieta | null>(null);
  const [selectedObjetivos, setSelectedObjetivos] = useState<string[]>([]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const fetchDietas = async () => {
    setLoading(true);
    const data = dietasHardcodeadas;
    setDietas(data ?? []);
    setFilteredDietas(data ?? []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const tableBody = [
      ["Socio", "Objetivo", "Fecha"],
      ...filteredDietas.map((d) => [d.socio, d.objetivo, d.fecha]),
    ];

    const docDefinition: import("pdfmake/interfaces").TDocumentDefinitions = {
      content: [
        {
          text: "Listado de Dietas",
          style: "header",
          margin: [0, 0, 0, 12] as [number, number, number, number],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*"],
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

    import("pdfmake/build/pdfmake").then((pdfMake) => {
      pdfMake.default.createPdf(docDefinition).download("Listado_Dietas.pdf");
    });
  };

  const handleObjetivoChange = (objetivo: string, checked: boolean) => {
    if (checked) {
      setSelectedObjetivos([...selectedObjetivos, objetivo]);
    } else {
      setSelectedObjetivos(selectedObjetivos.filter((o) => o !== objetivo));
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchDietas();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    let dietasFiltradas = dietas;

    if (selectedObjetivos.length > 0) {
      dietasFiltradas = dietasFiltradas.filter((d) =>
        selectedObjetivos.includes(d.objetivo)
      );
    }

    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      dietasFiltradas = dietasFiltradas.filter(
        (d) =>
          d.socio.toLowerCase().includes(lowercaseSearch) ||
          d.objetivo.toLowerCase().includes(lowercaseSearch)
      );
    }

    setFilteredDietas(dietasFiltradas);
  }, [searchTerm, dietas, selectedObjetivos]);

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
          <AppHeader title="Dietas" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Dietas</h2>
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
                            <h4 className="mb-2 font-medium">Objetivos</h4>
                            <div className="space-y-2">
                              {objetivos.map((objetivo) => (
                                <div
                                  key={objetivo}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`objetivo-${objetivo}`}
                                    checked={selectedObjetivos.includes(
                                      objetivo
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleObjetivoChange(
                                        objetivo,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`objetivo-${objetivo}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {objetivo}
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
                        placeholder="Buscar por socio, objetivo..."
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
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <DietasTable
                    dietas={filteredDietas}
                    loading={loading}
                    onEdit={(dieta) => {
                      setSelectedDieta(dieta);
                      setOpenModal(true);
                    }}
                    onView={(dieta) => {
                      setDietaVer(dieta);
                      setOpenModalVer(true);
                    }}
                    onDelete={async () => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar la dieta?"
                      );
                      if (!confirmar) return;
                      toast.success("Dieta eliminada correctamente");
                      fetchDietas();
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <DietasModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedDieta(null);
        }}
      />
      {openModalVer && dietaVer ? (
        <DietasViewModal
          open={openModalVer}
          onClose={() => {
            setOpenModalVer(false);
            setDietaVer(null);
          }}
          dieta={dietaVer}
          key={dietaVer.id_dieta}
        />
      ) : null}
    </SidebarProvider>
  );
}
