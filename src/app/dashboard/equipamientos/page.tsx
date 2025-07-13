"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Equipamento } from "@/interfaces/equipamiento.interface";
import {
  getAllEquipamientos,
  deleteEquipamiento,
} from "@/services/equipamientoService";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import EquipamientoModal from "@/components/modal/EquipamientoModal";
import EquipamientoViewModal from "@/components/modal/EquipamientoViewModal";
import EquipamientoTable from "@/components/tables/EquipamientoTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Search, Printer, FileSpreadsheet } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import ExcelJS from "exceljs";

export default function EquipamientosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [equipos, setEquipos] = useState<Equipamento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipamento | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [equipoVer, setEquipoVer] = useState<Equipamento | null>(null);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedUbicaciones, setSelectedUbicaciones] = useState<string[]>([]);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const tipos = ["Cardio", "Fuerza", "Funcional", "Otro"];
  const estados = ["operativo", "en mantenimiento", "fuera de servicio"];
  const ubicaciones = ["Zona A", "Zona B", "Zona C", "Zona D"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const loadEquipos = async () => {
    setLoading(true);
    const data = await getAllEquipamientos();
    setEquipos(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadEquipos();
    }
  }, [status]);

  const getFilteredEquipos = () => {
    let equiposFiltrados = [...equipos];
    if (selectedTipos.length > 0) {
      equiposFiltrados = equiposFiltrados.filter((e) =>
        selectedTipos.includes(e.tipo)
      );
    }
    if (selectedEstados.length > 0) {
      equiposFiltrados = equiposFiltrados.filter((e) =>
        selectedEstados.includes(e.estado)
      );
    }
    if (selectedUbicaciones.length > 0) {
      equiposFiltrados = equiposFiltrados.filter((e) =>
        selectedUbicaciones.includes(e.ubicacion)
      );
    }
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      equiposFiltrados = equiposFiltrados.filter(
        (e) =>
          e.nombre.toLowerCase().includes(lower) ||
          e.tipo.toLowerCase().includes(lower) ||
          e.estado.toLowerCase().includes(lower) ||
          e.ubicacion.toLowerCase().includes(lower)
      );
    }
    return equiposFiltrados;
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Equipamientos");
    worksheet.columns = [
      { header: "ID", key: "id", width: 20 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Tipo", key: "tipo", width: 20 },
      { header: "Estado", key: "estado", width: 20 },
      { header: "Ubicación", key: "ubicacion", width: 20 },
    ];
    getFilteredEquipos().forEach((e) => {
      worksheet.addRow({
        id: e.id,
        nombre: e.nombre,
        tipo: e.tipo,
        estado: e.estado,
        ubicacion: e.ubicacion,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Equipamientos.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (status === "loading" || loading) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Equipamientos" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Equipamientos</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <Popover open={filtrosOpen} onOpenChange={setFiltrosOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[120px]">
                          <Filter className="w-4 h-4 mr-2" />
                          Filtros
                          {selectedTipos.length +
                            selectedEstados.length +
                            selectedUbicaciones.length >
                            0 && (
                            <span className="px-1 ml-1 text-xs text-blue-600 bg-blue-100 rounded-full">
                              {selectedTipos.length +
                                selectedEstados.length +
                                selectedUbicaciones.length}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-72" align="start">
                        <div className="p-4 space-y-4">
                          <div>
                            <div className="pb-2 text-sm font-medium text-gray-700">
                              Tipo
                            </div>
                            <div className="space-y-2">
                              {tipos.map((tipo) => (
                                <div
                                  key={tipo}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tipo-${tipo}`}
                                    checked={selectedTipos.includes(tipo)}
                                    onCheckedChange={() =>
                                      setSelectedTipos((prev) =>
                                        prev.includes(tipo)
                                          ? prev.filter((t) => t !== tipo)
                                          : [...prev, tipo]
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`tipo-${tipo}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {tipo}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="pt-4 border-t">
                            <div className="pb-2 text-sm font-medium text-gray-700">
                              Estado
                            </div>
                            <div className="space-y-2">
                              {estados.map((estado) => (
                                <div
                                  key={estado}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`estado-${estado}`}
                                    checked={selectedEstados.includes(estado)}
                                    onCheckedChange={() =>
                                      setSelectedEstados((prev) =>
                                        prev.includes(estado)
                                          ? prev.filter((e) => e !== estado)
                                          : [...prev, estado]
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`estado-${estado}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {estado}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="pt-4 border-t">
                            <div className="pb-2 text-sm font-medium text-gray-700">
                              Ubicación
                            </div>
                            <div className="space-y-2">
                              {ubicaciones.map((ubicacion) => (
                                <div
                                  key={ubicacion}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`ubicacion-${ubicacion}`}
                                    checked={selectedUbicaciones.includes(
                                      ubicacion
                                    )}
                                    onCheckedChange={() =>
                                      setSelectedUbicaciones((prev) =>
                                        prev.includes(ubicacion)
                                          ? prev.filter((u) => u !== ubicacion)
                                          : [...prev, ubicacion]
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`ubicacion-${ubicacion}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {ubicacion}
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
                        placeholder="Buscar por nombre, tipo..."
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setOpenModal(true);
                      setSelectedEquipo(null);
                    }}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Añadir Equipo</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <EquipamientoTable
                    equipos={getFilteredEquipos()}
                    onEdit={(equipo) => {
                      setSelectedEquipo(equipo);
                      setOpenModal(true);
                    }}
                    onView={(equipo) => {
                      setEquipoVer(equipo);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (equipo) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar el equipo?"
                      );
                      if (!confirmar) return;
                      await deleteEquipamiento(equipo.id);
                      loadEquipos();
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <EquipamientoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedEquipo(null);
        }}
        onCreated={loadEquipos}
        equipoId={selectedEquipo ? selectedEquipo.id : null}
      />
      <EquipamientoViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setEquipoVer(null);
        }}
        equipoId={equipoVer ? equipoVer.id : null}
      />
    </SidebarProvider>
  );
}
