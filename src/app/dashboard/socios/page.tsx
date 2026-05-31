'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, FileSpreadsheet } from 'lucide-react';
import { fetchSociosApi, setSocioActivoApi } from '@/services/browser/socioApiClient';
import SocioModal from '@/components/modal/SocioModal';
import SocioViewModal from '@/components/modal/SocioViewModal';
import SociosTable from '@/components/tables/SociosTable';
import { Socio } from '@/interfaces/socio.interface';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { downloadCommercialReportPdf } from '@/utils/commercialReportPdf';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const SOCIOS_PAGE_SIZE = 10;

export default function SociosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [socioVer, setSocioVer] = useState<Socio | null>(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadSocios = async () => {
    setLoading(true);
    const data = await fetchSociosApi();
    setSocios(data ?? []);
    setFilteredSocios(data ?? []);
    setLoading(false);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: 'Listado de Socios',
        subtitle: 'Reporte de socios con datos de contacto, estado y ubicación.',
        fileName: 'listado-socios-gym-master',
        rows: filteredSocios,
        metrics: [
          { label: 'Socios filtrados', value: filteredSocios.length },
          { label: 'Activos', value: filteredSocios.filter((s) => s.activo).length },
          { label: 'Inactivos', value: filteredSocios.filter((s) => !s.activo).length },
        ],
        filtersLabel: `Estado: ${filtroLabel}${searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ''}`,
        columns: [
          { header: 'Socio', width: 40, getValue: (s) => s.nombre_completo },
          { header: 'DNI', width: 22, getValue: (s) => s.dni },
          { header: 'Sexo', width: 18, getValue: (s) => (s.sexo === 'M' ? 'Masculino' : s.sexo === 'F' ? 'Femenino' : '-') },
          { header: 'Nacimiento', width: 24, getValue: (s) => s.fecnac || '-' },
          { header: 'Teléfono', width: 26, getValue: (s) => s.telefono || '-' },
          { header: 'Email', width: 40, getValue: (s) => s.email || '-' },
          { header: 'Ciudad', width: 26, getValue: (s) => s.ciudad || '-' },
          { header: 'Provincia', width: 28, getValue: (s) => s.provincia || '-' },
          { header: 'Estado', width: 20, getValue: (s) => (s.activo ? 'Activo' : 'Inactivo') },
        ],
      });
    } catch {
      toast.error('No se pudo generar el PDF de socios');
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Socios');

    worksheet.columns = [
      { header: 'Nombre completo', key: 'nombre_completo', width: 30 },
      { header: 'DNI', key: 'dni', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Dirección', key: 'direccion', width: 40 },
      { header: 'Fecha Alta', key: 'fecha_alta', width: 20 },
    ];

    filteredSocios.forEach((s) => {
      worksheet.addRow({
        nombre_completo: s.nombre_completo,
        dni: s.dni,
        telefono: s.telefono,
        email: s.email,
        direccion: s.direccion,
        fecha_alta: s.fecha_alta,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildTimestampedDownloadFileName('listado-socios', 'xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadSocios();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    let sociosFiltrados = socios;
    if (filtroActivo === 'activos') {
      sociosFiltrados = sociosFiltrados.filter((s) => s.activo);
    } else if (filtroActivo === 'inactivos') {
      sociosFiltrados = sociosFiltrados.filter((s) => !s.activo);
    }
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      sociosFiltrados = sociosFiltrados.filter(
        (s) =>
          s.nombre_completo.toLowerCase().includes(lowercaseSearch) ||
          s.dni.toLowerCase().includes(lowercaseSearch) ||
          s.telefono?.toLowerCase().includes(lowercaseSearch) ||
          s.email?.toLowerCase().includes(lowercaseSearch)
      );
    }
    setFilteredSocios(sociosFiltrados);
  }, [searchTerm, socios, filtroActivo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroActivo]);

  const totalSocios = filteredSocios.length;
  const totalPages = Math.max(1, Math.ceil(totalSocios / SOCIOS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSocios = filteredSocios.slice(
    (safeCurrentPage - 1) * SOCIOS_PAGE_SIZE,
    safeCurrentPage * SOCIOS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filtroLabel =
    filtroActivo === 'todos'
      ? 'Todos'
      : filtroActivo === 'activos'
      ? 'Activos'
      : 'Inactivos';

  if (loading || !isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        Cargando datos de socios...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Socios' />
          <main className='flex-1 p-6 space-y-6'>
            <Card className='w-full'>
              <CardHeader className='flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap'>
                <h2 className='text-xl font-bold'>Listado de Socios</h2>
                <div className='flex flex-wrap items-center w-full gap-2 md:w-auto'>
                  <div className='flex items-center flex-grow gap-2 md:flex-grow-0'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='outline' className='min-w-[120px]'>
                          {filtroLabel}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='start'>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('todos')}
                          className={
                            filtroActivo === 'todos' ? 'font-bold' : ''
                          }
                        >
                          Todos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('activos')}
                          className={
                            filtroActivo === 'activos' ? 'font-bold' : ''
                          }
                        >
                          Activos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('inactivos')}
                          className={
                            filtroActivo === 'inactivos' ? 'font-bold' : ''
                          }
                        >
                          Inactivos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className='relative flex-grow md:flex-grow-0'>
                      <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        type='search'
                        placeholder='Buscar por nombre, DNI...'
                        className='pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant='outline'
                    className='flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]'
                  >
                    <FileText className='w-4 h-4' />
                    <span className='hidden sm:inline'>Descargar PDF</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleExportExcel}
                    className='flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]'
                  >
                    <FileSpreadsheet className='w-4 h-4' />
                    <span className='hidden sm:inline'>Exportar</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className='bg-[#02a8e1] hover:bg-[#0288b1]'
                  >
                    <span className='hidden sm:inline'>Añadir Socio</span>
                    <span className='sm:hidden'>Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-4 space-y-4'>
                <div className='overflow-x-auto'>
                  <SociosTable
                    socios={paginatedSocios}
                    loading={loading}
                    onEdit={(socio) => {
                      setSelectedSocio(socio);
                      setOpenModal(true);
                    }}
                    onView={(socio) => {
                      setSocioVer(socio);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (socio) => {
                      const confirmar = window.confirm(
                        socio.activo
                          ? '¿Está seguro de desactivar al socio?'
                          : '¿Está seguro de activar al socio?'
                      );
                      if (!confirmar) return;

                      try {
                        await setSocioActivoApi(socio.id_socio, !socio.activo);
                        toast.success(
                          `Socio ${
                            socio.activo ? 'desactivado' : 'activado'
                          } correctamente`
                        );
                        await loadSocios();
                      } catch (err) {
                        toast.error('Error al actualizar estado del socio');
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalSocios}
                  pageSize={SOCIOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="socios"
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <SocioModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedSocio(null);
        }}
        onCreated={loadSocios}
        socio={selectedSocio}
      />

      <SocioViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setSocioVer(null);
        }}
        socio={socioVer}
      />
    </SidebarProvider>
  );
}
