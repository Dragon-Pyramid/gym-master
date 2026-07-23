'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search, FileText, FileSpreadsheet, Radar, UserCheck, Users, UserX } from 'lucide-react';
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
import { buildSocioBaseRiskSummary, getSocioRiskToneClasses } from '@/utils/socioRiskAlerts';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const SOCIOS_PAGE_SIZE = 10;

function sociosExportTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function socioSexExportLabel(locale: GymMasterLocale, value?: string | null) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['m', 'masculino', 'male'].includes(normalized)) {
    return sociosExportTx(locale, 'Masculino', 'Male');
  }
  if (['f', 'femenino', 'female'].includes(normalized)) {
    return sociosExportTx(locale, 'Femenino', 'Female');
  }
  return '-';
}

function socioStatusExportLabel(locale: GymMasterLocale, active?: boolean | null) {
  return active ? sociosExportTx(locale, 'Activo', 'Active') : sociosExportTx(locale, 'Inactivo', 'Inactive');
}

function sociosFilterExportLabel(locale: GymMasterLocale, filter: string) {
  if (filter === 'activos') return sociosExportTx(locale, 'Activos', 'Active');
  if (filter === 'inactivos') return sociosExportTx(locale, 'Inactivos', 'Inactive');
  if (filter === 'riesgo_alto') return sociosExportTx(locale, 'Riesgo alto', 'High risk');
  if (filter === 'riesgo_medio') return sociosExportTx(locale, 'Riesgo medio', 'Medium risk');
  if (filter === 'seguimiento') return sociosExportTx(locale, 'Con alertas', 'With alerts');
  return sociosExportTx(locale, 'Todos', 'All');
}

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

function SocioRiskQuickCard({
  label,
  value,
  detail,
  level,
}: {
  label: string;
  value: string | number;
  detail: string;
  level: 'alto' | 'medio' | 'bajo' | 'ok';
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${getSocioRiskToneClasses(level)}`}>
      <div className='flex items-start gap-3'>
        <div className='rounded-full bg-black/5 p-2 dark:bg-white/10'>
          <AlertTriangle className='h-4 w-4' />
        </div>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wide opacity-75'>{label}</p>
          <p className='mt-1 text-2xl font-black'>{value}</p>
          <p className='mt-1 text-xs opacity-80'>{detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function SociosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const tx = (es: string, en: string) => sociosExportTx(locale, es, en);
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
        title: sociosExportTx(locale, 'Listado de Socios', 'Members list'),
        subtitle: sociosExportTx(locale, 'Reporte de socios con datos de contacto, estado y ubicación.', 'Members report with contact details, status, and location.'),
        fileName: sociosExportTx(locale, 'listado-socios-gym-master', 'members-list-gym-master'),
        locale: locale === 'en' ? 'en' : 'es',
        footerText: sociosExportTx(locale, 'Documento generado por Gym Master.', 'Document generated by Gym Master.'),
        rows: filteredSocios,
        metrics: [
          { label: sociosExportTx(locale, 'Socios filtrados', 'Filtered members'), value: filteredSocios.length },
          { label: sociosExportTx(locale, 'Activos', 'Active'), value: filteredSocios.filter((s) => s.activo).length },
          { label: sociosExportTx(locale, 'Inactivos', 'Inactive'), value: filteredSocios.filter((s) => !s.activo).length },
        ],
        filtersLabel: `${sociosExportTx(locale, 'Estado', 'Status')}: ${sociosFilterExportLabel(locale, filtroActivo)}${searchTerm.trim() ? ` · ${sociosExportTx(locale, 'Búsqueda', 'Search')}: ${searchTerm.trim()}` : ''}`,
        columns: [
          { header: sociosExportTx(locale, 'Socio', 'Member'), width: 40, getValue: (s) => s.nombre_completo },
          { header: 'DNI', width: 22, getValue: (s) => s.dni },
          { header: sociosExportTx(locale, 'Sexo', 'Sex'), width: 18, getValue: (s) => socioSexExportLabel(locale, s.sexo) },
          { header: sociosExportTx(locale, 'Nacimiento', 'Birth date'), width: 24, getValue: (s) => s.fecnac || '-' },
          { header: sociosExportTx(locale, 'Teléfono', 'Phone'), width: 26, getValue: (s) => s.telefono || '-' },
          { header: 'Email', width: 40, getValue: (s) => s.email || '-' },
          { header: sociosExportTx(locale, 'Ciudad', 'City'), width: 26, getValue: (s) => s.ciudad || '-' },
          { header: sociosExportTx(locale, 'Provincia', 'Province'), width: 28, getValue: (s) => s.provincia || '-' },
          { header: sociosExportTx(locale, 'Estado', 'Status'), width: 20, getValue: (s) => socioStatusExportLabel(locale, s.activo) },
        ],
      });
    } catch {
      toast.error(tx('No se pudo generar el PDF de socios', 'Could not generate the members PDF'));
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sociosExportTx(locale, 'Socios', 'Members'));

    worksheet.columns = [
      { header: sociosExportTx(locale, 'Nombre completo', 'Full name'), key: 'nombre_completo', width: 30 },
      { header: 'DNI', key: 'dni', width: 20 },
      { header: sociosExportTx(locale, 'Teléfono', 'Phone'), key: 'telefono', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: sociosExportTx(locale, 'Dirección', 'Address'), key: 'direccion', width: 40 },
      { header: sociosExportTx(locale, 'Fecha Alta', 'Registration date'), key: 'fecha_alta', width: 20 },
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
    a.download = buildTimestampedDownloadFileName(sociosExportTx(locale, 'listado-socios', 'members-list'), 'xlsx');
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
    } else if (filtroActivo === 'riesgo_alto') {
      sociosFiltrados = sociosFiltrados.filter((s) => buildSocioBaseRiskSummary(s, locale).level === 'alto');
    } else if (filtroActivo === 'riesgo_medio') {
      sociosFiltrados = sociosFiltrados.filter((s) => buildSocioBaseRiskSummary(s, locale).level === 'medio');
    } else if (filtroActivo === 'seguimiento') {
      sociosFiltrados = sociosFiltrados.filter((s) => ['alto', 'medio', 'bajo'].includes(buildSocioBaseRiskSummary(s, locale).level));
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
  }, [searchTerm, socios, filtroActivo, locale]);

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

  const filtroLabel = sociosFilterExportLabel(locale, filtroActivo);

  const totalRegistrados = socios.length;
  const totalActivos = socios.filter((s) => s.activo).length;
  const totalInactivos = totalRegistrados - totalActivos;
  const perfilesConEmergencia = socios.filter(
    (s) => s.contacto_emergencia_nombre || s.contacto_emergencia_telefono
  ).length;

  const riskSummaries = useMemo(
    () => socios.map((socio) => buildSocioBaseRiskSummary(socio, locale)),
    [socios, locale]
  );
  const totalRiesgoAlto = riskSummaries.filter((summary) => summary.level === 'alto').length;
  const totalRiesgoMedio = riskSummaries.filter((summary) => summary.level === 'medio').length;
  const totalSeguimiento = riskSummaries.filter((summary) => summary.level !== 'ok').length;

  if (loading || !isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        {tx('Cargando datos de socios...', 'Loading member data...')}
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
          <AppHeader title={tx('Socios', 'Members')} />
          <section className='min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 pb-8 md:p-6 md:pb-10'>
            <div className='rounded-3xl border bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 p-5 text-white shadow-sm'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-[0.25em] text-sky-300'>{tx('Socios · vista administrativa', 'Members · administrative view')}</p>
                  <h1 className='mt-2 text-3xl font-black'>{tx('Socios 360', 'Members 360')}</h1>
                  <p className='mt-2 max-w-3xl text-sm text-slate-300'>
                    {tx(
                      'Listado operativo con acceso rápido al perfil 360° del socio: cuota, ficha médica, rutinas, dietas, evolución, mensajes y actividades.',
                      'Operational list with quick access to each member’s 360° profile: fees, medical record, routines, diets, progress, messages, and activities.'
                    )}
                  </p>
                </div>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200'>
                  <div className='flex items-center gap-2 font-bold text-white'>
                    <Radar className='h-4 w-4 text-sky-300' />
                    {tx('Atención integral', 'Integrated support')}
                  </div>
                  <p className='mt-1'>{tx('Usá el botón 360 para revisar el estado completo antes de contactar o gestionar al socio.', 'Use the 360 button to review the complete status before contacting or managing a member.')}</p>
                </div>
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <SocioSummaryCard icon={Users} label={tx('Registrados', 'Registered')} value={totalRegistrados} detail={tx('Base total de socios', 'Total member base')} />
              <SocioSummaryCard icon={UserCheck} label={tx('Activos', 'Active')} value={totalActivos} detail={tx('Pueden operar normalmente', 'Can operate normally')} />
              <SocioSummaryCard icon={UserX} label={tx('Inactivos', 'Inactive')} value={totalInactivos} detail={tx('Requieren revisión administrativa', 'Require administrative review')} />
              <SocioSummaryCard icon={Radar} label={tx('Con emergencia', 'Emergency contact')} value={perfilesConEmergencia} detail={tx('Perfiles con contacto de respaldo', 'Profiles with a backup contact')} />
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              <SocioRiskQuickCard label={tx('Riesgo alto', 'High risk')} value={totalRiesgoAlto} detail={tx('Socios inactivos o con señales operativas críticas.', 'Inactive members or members with critical operational signals.')} level='alto' />
              <SocioRiskQuickCard label={tx('Riesgo medio', 'Medium risk')} value={totalRiesgoMedio} detail={tx('Requieren contacto o normalización administrativa.', 'Require contact or administrative normalization.')} level='medio' />
              <SocioRiskQuickCard label={tx('Con alertas', 'With alerts')} value={totalSeguimiento} detail={tx('Socios con alguna señal de seguimiento detectada.', 'Members with at least one follow-up signal.')} level={totalSeguimiento > 0 ? 'bajo' : 'ok'} />
            </div>

            <Card className='w-full overflow-hidden rounded-3xl border shadow-sm'>
              <CardHeader className='flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap'>
                <div><h2 className='text-xl font-bold'>{tx('Listado de socios', 'Member list')}</h2><p className='text-sm text-muted-foreground'>{tx('Filtrá, exportá y abrí el perfil 360° desde la acción de cada fila.', 'Filter, export, and open the 360° profile from each row action.')}</p></div>
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
                          {tx('Todos', 'All')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('activos')}
                          className={
                            filtroActivo === 'activos' ? 'font-bold' : ''
                          }
                        >
                          {tx('Activos', 'Active')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('inactivos')}
                          className={
                            filtroActivo === 'inactivos' ? 'font-bold' : ''
                          }
                        >
                          {tx('Inactivos', 'Inactive')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('riesgo_alto')}
                          className={filtroActivo === 'riesgo_alto' ? 'font-bold' : ''}
                        >
                          {tx('Riesgo alto', 'High risk')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('riesgo_medio')}
                          className={filtroActivo === 'riesgo_medio' ? 'font-bold' : ''}
                        >
                          {tx('Riesgo medio', 'Medium risk')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo('seguimiento')}
                          className={filtroActivo === 'seguimiento' ? 'font-bold' : ''}
                        >
                          {tx('Con alertas', 'With alerts')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className='relative flex-grow md:flex-grow-0'>
                      <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        type='search'
                        placeholder={tx('Buscar por nombre, DNI...', 'Search by name, DNI...')}
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
                    <span className='hidden sm:inline'>{tx('Descargar PDF', 'Download PDF')}</span>
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleExportExcel}
                    className='flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]'
                  >
                    <FileSpreadsheet className='w-4 h-4' />
                    <span className='hidden sm:inline'>{tx('Exportar', 'Export')}</span>
                  </Button>
                  <div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100'>
                    {tx('Alta de socios desde Usuarios → rol Socio', 'Create members from Users → Member role')}
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
                          ? tx('¿Está seguro de desactivar al socio?', 'Are you sure you want to deactivate this member?')
                          : tx('¿Está seguro de activar al socio?', 'Are you sure you want to activate this member?')
                      );
                      if (!confirmar) return;

                      try {
                        await setSocioActivoApi(socio.id_socio, !socio.activo);
                        toast.success(
                          socio.activo
                            ? tx('Socio desactivado correctamente', 'Member deactivated successfully')
                            : tx('Socio activado correctamente', 'Member activated successfully')
                        );
                        await loadSocios();
                      } catch (err) {
                        toast.error(tx('Error al actualizar estado del socio', 'Could not update the member status'));
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalSocios}
                  pageSize={SOCIOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={tx('socios', 'members')}
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
