'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, CheckCircle2, Download, FileJson, FileSpreadsheet, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  downloadRespaldoNegocio,
  fetchRespaldoNegocioMeta,
  RespaldoHistorialItem,
  RespaldoModulo,
} from '@/services/browser/respaldoNegocioApiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDateTime } from '@/utils/dateFormat';

function estadoLabel(estado: string) {
  if (estado === 'completado') return 'Completado';
  if (estado === 'generando') return 'Generando';
  if (estado === 'error') return 'Error';
  return estado;
}

export default function RespaldoNegocioPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const [modulos, setModulos] = useState<RespaldoModulo[]>([]);
  const [historial, setHistorial] = useState<RespaldoHistorialItem[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'xlsx' | 'json' | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isInitialized, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRespaldoNegocioMeta();
      setModulos(data.modulos || []);
      setHistorial(data.historial || []);
      setSelectedModules((current) => (current.length ? current : (data.modulos || []).map((item) => item.key)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar respaldo de negocio';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) loadData();
  }, [isAuthenticated, isInitialized]);

  const selectedCount = selectedModules.length;
  const allSelected = selectedCount === modulos.length && modulos.length > 0;

  const lastExport = useMemo(() => historial[0], [historial]);

  const toggleModule = (key: string) => {
    setSelectedModules((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const toggleAll = () => {
    setSelectedModules(allSelected ? [] : modulos.map((item) => item.key));
  };

  const handleExport = async (format: 'xlsx' | 'json') => {
    if (!selectedModules.length) {
      toast.error('Seleccioná al menos un módulo para exportar.');
      return;
    }

    setExporting(format);
    try {
      await downloadRespaldoNegocio(format, selectedModules);
      toast.success('Respaldo generado correctamente.');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el respaldo';
      toast.error(message);
    } finally {
      setExporting(null);
    }
  };

  if (!isInitialized || !isAuthenticated) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader title='Respaldo / Exportación' />
        <main className='min-h-screen p-4 md:p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900'>
          <section className='mx-auto max-w-7xl space-y-6'>
            <Card>
              <CardHeader className='space-y-3'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div>
                    <div className='flex items-center gap-2 text-sm font-semibold text-[#02a8e1]'>
                      <ShieldCheck className='h-4 w-4' />
                      Exportación segura de datos operativos
                    </div>
                    <h1 className='mt-2 text-2xl font-bold'>Respaldo del negocio</h1>
                    <p className='mt-2 max-w-3xl text-sm text-muted-foreground'>
                      Descargá los datos operativos del gimnasio en Excel o JSON. Esta exportación excluye contraseñas, tokens, secretos, migraciones privadas, datasets propietarios y know-how interno de Dragon Pyramid.
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Button type='button' variant='outline' onClick={loadData} disabled={loading}>
                      <RefreshCw className='mr-2 h-4 w-4' /> Actualizar
                    </Button>
                    <Button type='button' variant='outline' onClick={() => handleExport('json')} disabled={Boolean(exporting)}>
                      <FileJson className='mr-2 h-4 w-4' /> {exporting === 'json' ? 'Generando...' : 'JSON'}
                    </Button>
                    <Button type='button' onClick={() => handleExport('xlsx')} disabled={Boolean(exporting)} className='bg-[#02a8e1] hover:bg-[#028fc0]'>
                      <FileSpreadsheet className='mr-2 h-4 w-4' /> {exporting === 'xlsx' ? 'Generando...' : 'Excel'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950'>
                  <p className='text-xs text-muted-foreground'>Módulos disponibles</p>
                  <p className='mt-2 text-3xl font-bold'>{modulos.length}</p>
                </div>
                <div className='rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950'>
                  <p className='text-xs text-muted-foreground'>Seleccionados</p>
                  <p className='mt-2 text-3xl font-bold'>{selectedCount}</p>
                </div>
                <div className='rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950'>
                  <p className='text-xs text-muted-foreground'>Última exportación</p>
                  <p className='mt-2 text-sm font-semibold'>{lastExport ? formatFrontendDateTime(lastExport.creado_en) : 'Sin registros'}</p>
                </div>
              </CardContent>
            </Card>

            <div className='grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between gap-3'>
                  <div>
                    <h2 className='text-xl font-semibold'>Módulos exportables</h2>
                    <p className='text-sm text-muted-foreground'>Seleccioná qué datos del negocio querés incluir.</p>
                  </div>
                  <Button type='button' variant='outline' onClick={toggleAll}>
                    {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className='text-sm text-muted-foreground'>Cargando módulos...</p>
                  ) : (
                    <div className='grid gap-3 md:grid-cols-2'>
                      {modulos.map((modulo) => {
                        const checked = selectedModules.includes(modulo.key);
                        return (
                          <label
                            key={modulo.key}
                            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${checked ? 'border-[#02a8e1] bg-[#e6f7fd]' : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900'}`}
                          >
                            <input
                              type='checkbox'
                              checked={checked}
                              onChange={() => toggleModule(modulo.key)}
                              className='mt-1 h-4 w-4 accent-[#02a8e1]'
                            />
                            <span>
                              <span className='block font-semibold'>{modulo.label}</span>
                              <span className='mt-1 block text-xs leading-5 text-muted-foreground'>{modulo.description}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className='text-xl font-semibold'>Historial reciente</h2>
                  <p className='text-sm text-muted-foreground'>Auditoría de las últimas exportaciones realizadas.</p>
                </CardHeader>
                <CardContent>
                  {!historial.length ? (
                    <div className='rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground'>
                      <Archive className='mx-auto mb-2 h-8 w-8 opacity-60' />
                      Todavía no hay exportaciones registradas.
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {historial.map((item) => (
                        <article key={item.id} className='rounded-xl border bg-white p-3 text-sm shadow-sm dark:bg-slate-950'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <p className='font-semibold'>{item.archivo_nombre || 'Respaldo generado'}</p>
                              <p className='text-xs text-muted-foreground'>{formatFrontendDateTime(item.creado_en)}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.estado === 'completado' ? 'bg-emerald-50 text-emerald-700' : item.estado === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                              {estadoLabel(item.estado)}
                            </span>
                          </div>
                          <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                            <span>Formato: {item.formato.toUpperCase()}</span>
                            <span>Registros: {item.registros_totales}</span>
                            <span className='col-span-2'>Módulos: {item.modulos?.length ?? 0}</span>
                          </div>
                          {item.error && <p className='mt-2 text-xs text-red-600'>{item.error}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
