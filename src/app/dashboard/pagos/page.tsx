"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import {
  deletePagoApi,
  fetchPagosApi,
} from "@/services/browser/pagoApiClient";
import PagoModal from "@/components/modal/PagoModal";
import PagoViewModal from "@/components/modal/PagoViewModal";
import PagoTable from "@/components/tables/PagoTable";
import { ResponsePago } from "@/interfaces/pago.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { descargarPagoReciboPdf } from "@/utils/pagoReciboPdf";

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function PagosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [pagos, setPagos] = useState<ResponsePago[]>([]);
  const [filteredPagos, setFilteredPagos] = useState<ResponsePago[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<ResponsePago | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [pagoVer, setPagoVer] = useState<ResponsePago | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadPagos = async () => {
    try {
      setLoading(true);
      const data = await fetchPagosApi();
      setPagos(data ?? []);
      setFilteredPagos(data ?? []);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Pagos");

    worksheet.columns = [
      { header: "Socio", key: "socio", width: 28 },
      { header: "Cuota", key: "cuota", width: 24 },
      { header: "Fecha Pago", key: "fecha_pago", width: 16 },
      { header: "Periodo Desde", key: "periodo_desde", width: 16 },
      { header: "Periodo Hasta", key: "periodo_hasta", width: 16 },
      { header: "Meses", key: "meses", width: 10 },
      { header: "Método", key: "metodo", width: 14 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Descuento %", key: "descuento_porcentaje", width: 14 },
      { header: "Descuento Monto", key: "descuento_monto", width: 18 },
      { header: "Monto Pagado", key: "monto_pagado", width: 15 },
      { header: "Registrado Por", key: "registrado_por", width: 20 },
    ];

    filteredPagos.forEach((p) => {
      worksheet.addRow({
        socio: p.socio?.nombre_completo || "",
        cuota: p.cuota?.descripcion || "",
        fecha_pago: p.fecha_pago,
        periodo_desde: p.periodo_desde || p.fecha_pago,
        periodo_hasta: p.periodo_hasta || p.fecha_vencimiento,
        meses: p.meses_cubiertos || 1,
        metodo: p.metodo_pago || "",
        estado: p.estado || "",
        subtotal: p.subtotal ?? p.monto_pagado,
        descuento_porcentaje: p.descuento_porcentaje ?? 0,
        descuento_monto: p.descuento_monto ?? 0,
        monto_pagado: p.monto_pagado,
        registrado_por: p.registrado_por?.nombre || "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Pagos.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleDownloadReceipt = async (pago: ResponsePago) => {
    try {
      await descargarPagoReciboPdf(pago);
      toast.success("Recibo PDF generado correctamente");
    } catch (error: any) {
      toast.error(error?.message || "Error al generar el recibo PDF");
    }
  };


  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadPagos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPagos(pagos);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = pagos.filter(
      (p) =>
        (p.socio?.nombre_completo || "")
          .toLowerCase()
          .includes(lowercaseSearch) ||
        (p.cuota?.descripcion || "").toLowerCase().includes(lowercaseSearch) ||
        (p.registrado_por?.nombre || "").toLowerCase().includes(lowercaseSearch) ||
        (p.metodo_pago || "").toLowerCase().includes(lowercaseSearch) ||
        (p.estado || "").toLowerCase().includes(lowercaseSearch)
    );

    setFilteredPagos(filtered);
  }, [searchTerm, pagos]);

  const totalEfectivo = filteredPagos
    .filter((p) => p.metodo_pago === "efectivo" && p.estado !== "cancelado")
    .reduce((acc, pago) => acc + numberOrZero(pago.monto_pagado), 0);

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
          <AppHeader title="Pagos" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">Listado de Pagos</h2>
                  <p className="text-sm text-muted-foreground">
                    Total efectivo filtrado: ${totalEfectivo.toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por socio, cuota, método..."
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Registrar Pago Manual</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <PagoTable
                    pagos={filteredPagos}
                    loading={loading}
                    onEdit={(pago) => {
                      setSelectedPago(pago);
                      setOpenModal(true);
                    }}
                    onView={(pago) => {
                      setPagoVer(pago);
                      setOpenModalVer(true);
                    }}
                    onReceipt={handleDownloadReceipt}
                    onDelete={async (pago) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar el pago?"
                      );
                      if (!confirmar) return;

                      try {
                        await deletePagoApi(pago.id);
                        toast.success("Pago eliminado correctamente");
                        await loadPagos();
                      } catch (err: any) {
                        toast.error(err.message || "Error al eliminar pago");
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <PagoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedPago(null);
        }}
        onCreated={loadPagos}
        pago={selectedPago}
      />

      <PagoViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setPagoVer(null);
        }}
        pago={pagoVer}
        onReceiptDownload={handleDownloadReceipt}
      />
    </SidebarProvider>
  );
}
