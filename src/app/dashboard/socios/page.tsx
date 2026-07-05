'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, FileSpreadsheet, Radar, UserCheck, Users, UserX } from 'lucide-react';
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

function SocioSummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className='rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80'>
      <div className='flex items-start gap-3'>
        <div className='rounded-full bg-sky-100 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-200'>
          <Icon className='h-4 w-4' />
        </div>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{label}</p>
          <p className='mt-1 text-2xl font-black text-foreground'>{value}</p>
          {detail ? <p className='mt-1 text-xs text-muted-foreground'>{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}

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

  const totalRegistrados = socios.length;
  const totalActivos = socios.filter((s) => s.activo).length;
  const totalInactivos = totalRegistrados - totalActivos;
  const perfilesConEmergencia = socios.filter(
    (s) => s.contacto_emergencia_nombre || s.contacto_emergencia_telefono
  ).length;

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
      <div className='flex h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-hidden'>
        <AppSidebar />
        <SidebarInset className='!grid h-[100dvh] max-h-[100dvh] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title='Socios' />
          <section className='min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 pb-8 md:p-6 md:pb-10'>
            <div className='rounded-3xl border bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 p-5 text-white shadow-sm'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-[0.25em] text-sky-300'>Socios · vista administrativa</p>
                  <h1 className='mt-2 text-3xl font-black'>Socios 360</h1>
                  <p className='mt-2 max-w-3xl text-sm text-slate-300'>
                    Listado operativo con acceso rápido al perfil 360° del socio: cuota, ficha médica, rutinas, dietas, evolución, mensajes y actividades.
                  </p>
                </div>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200'>
                  <div className='flex items-center gap-2 font-bold text-white'>
                    <Radar className='h-4 w-4 text-sky-300' />
                    Atención integral
                  </div>
                  <p className='mt-1'>Usá el botón 360 para revisar el estado completo antes de contactar o gestionar al socio.</p>
                </div>
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <SocioSummaryCard icon={Users} label='Registrados' value={totalRegistrados} detail='Base total de socios' />
              <SocioSummaryCard icon={UserCheck} label='Activos' value={totalActivos} detail='Pueden operar normalmente' />
              <SocioSummaryCard icon={UserX} label='Inactivos' value={totalInactivos} detail='Requieren revisión administrativa' />
              <SocioSummaryCard icon={Radar} label='Con emergencia' value={perfilesConEmergencia} detail='Perfiles con contacto de respaldo' />
            </div>

            <Card className='w-full overflow-hidden rounded-3xl border shadow-sm'>
              <CardHeader className='flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap'>
                <div><h2 className='text-xl font-bold'>Listado de socios</h2><p className='text-sm text-muted-foreground'>Filtrá, exportá y abrí el perfil 360° desde la acción de cada fila.</p></div>
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
                  <div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100'>
                    Alta de socios desde Usuarios → rol Socio
                  </div>
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
          </section>
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
