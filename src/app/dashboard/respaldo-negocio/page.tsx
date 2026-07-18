'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, FileJson, FileSpreadsheet, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import {
  downloadRespaldoNegocio,
  fetchRespaldoNegocioMeta,
  RespaldoHistorialItem,
  RespaldoModulo,
} from '@/services/browser/respaldoNegocioApiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDateTime } from '@/utils/dateFormat';

function backupTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

type ModulePresentation = {
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
};

const BACKUP_MODULE_PRESENTATION: Record<string, ModulePresentation> = {
  gimnasio_parametrizacion: {
    labelEs: 'Datos del gimnasio',
    labelEn: 'Gym data',
    descriptionEs: 'Parametrización comercial, legal y visual del gimnasio cliente.',
    descriptionEn: 'Commercial, legal, and visual configuration for the client gym.',
  },
  socios: {
    labelEs: 'Socios',
    labelEn: 'Members',
    descriptionEs: 'Datos operativos de socios, contacto, estado y datos de emergencia.',
    descriptionEn: 'Operational member data, contact details, status, and emergency information.',
  },
  usuarios: {
    labelEs: 'Usuarios internos',
    labelEn: 'Internal users',
    descriptionEs: 'Identidades operativas sin contraseña ni hash.',
    descriptionEn: 'Operational identities without passwords or hashes.',
  },
  empleados: {
    labelEs: 'Empleados',
    labelEn: 'Employees',
    descriptionEs: 'Perfiles laborales internos del gimnasio.',
    descriptionEn: 'Internal employment profiles for the gym.',
  },
  empleados_sueldos: {
    labelEs: 'Sueldos',
    labelEn: 'Salaries',
    descriptionEs: 'Liquidaciones y pagos de sueldos de empleados.',
    descriptionEn: 'Employee salary settlements and payments.',
  },
  cuotas: {
    labelEs: 'Cuotas',
    labelEn: 'Fees',
    descriptionEs: 'Precios y vigencias de cuotas configuradas.',
    descriptionEn: 'Configured fee prices and validity periods.',
  },
  pagos: {
    labelEs: 'Pagos',
    labelEn: 'Payments',
    descriptionEs: 'Pagos de cuotas, períodos cubiertos y descuentos aplicados.',
    descriptionEn: 'Fee payments, covered periods, and applied discounts.',
  },
  asistencias: {
    labelEs: 'Asistencias',
    labelEn: 'Attendances',
    descriptionEs: 'Registros de ingreso y egreso de socios.',
    descriptionEn: 'Member check-in and check-out records.',
  },
  ventas: {
    labelEs: 'Ventas',
    labelEn: 'Sales',
    descriptionEs: 'Ventas de productos/servicios a socios, visitantes o consumidor final.',
    descriptionEn: 'Product/service sales to members, visitors, or final customers.',
  },
  venta_detalle: {
    labelEs: 'Detalle de ventas',
    labelEn: 'Sales details',
    descriptionEs: 'Ítems vendidos por operación comercial.',
    descriptionEn: 'Items sold per commercial transaction.',
  },
  compras: {
    labelEs: 'Compras',
    labelEn: 'Purchases',
    descriptionEs: 'Compras a proveedores y comprobantes asociados.',
    descriptionEn: 'Supplier purchases and related receipts.',
  },
  compra_detalle: {
    labelEs: 'Detalle de compras',
    labelEn: 'Purchase details',
    descriptionEs: 'Productos comprados, cantidades y costos unitarios.',
    descriptionEn: 'Purchased products, quantities, and unit costs.',
  },
  productos: {
    labelEs: 'Productos / stock',
    labelEn: 'Products / stock',
    descriptionEs: 'Catálogo comercial de productos, stock y precios vigentes.',
    descriptionEn: 'Commercial product catalog, stock, and current prices.',
  },
  proveedores: {
    labelEs: 'Proveedores',
    labelEn: 'Suppliers',
    descriptionEs: 'Datos comerciales y de contacto de proveedores.',
    descriptionEn: 'Supplier commercial and contact data.',
  },
  servicios: {
    labelEs: 'Servicios',
    labelEn: 'Services',
    descriptionEs: 'Servicios comerciales adicionales ofrecidos por el gimnasio.',
    descriptionEn: 'Additional commercial services offered by the gym.',
  },
  gastos_egresos: {
    labelEs: 'Gastos / egresos',
    labelEn: 'Expenses / outflows',
    descriptionEs: 'Gastos operativos, vencimientos y comprobantes.',
    descriptionEn: 'Operating expenses, due dates, and receipts.',
  },
  mensajes_socios: {
    labelEs: 'Mensajes de socios',
    labelEn: 'Member messages',
    descriptionEs: 'Consultas, reclamos y respuestas administrativas.',
    descriptionEn: 'Queries, complaints, and administrative replies.',
  },
  tickets_soporte: {
    labelEs: 'Tickets Dragon Pyramid',
    labelEn: 'Dragon Pyramid tickets',
    descriptionEs: 'Tickets enviados por el gimnasio a soporte Dragon Pyramid.',
    descriptionEn: 'Tickets sent by the gym to Dragon Pyramid support.',
  },
};

function getModulePresentation(modulo: RespaldoModulo): ModulePresentation {
  return (
    BACKUP_MODULE_PRESENTATION[modulo.key] ?? {
      labelEs: modulo.label,
      labelEn: modulo.label,
      descriptionEs: modulo.description,
      descriptionEn: modulo.description,
    }
  );
}

function getModuleLabel(locale: GymMasterLocale, modulo: RespaldoModulo) {
  const presentation = getModulePresentation(modulo);
  return locale === 'en' ? presentation.labelEn : presentation.labelEs;
}

function getModuleDescription(locale: GymMasterLocale, modulo: RespaldoModulo) {
  const presentation = getModulePresentation(modulo);
  return locale === 'en' ? presentation.descriptionEn : presentation.descriptionEs;
}

function estadoLabel(estado: string, locale: GymMasterLocale) {
  if (estado === 'completado') return backupTx(locale, 'Completado', 'Completed');
  if (estado === 'generando') return backupTx(locale, 'Generando', 'Generating');
  if (estado === 'error') return backupTx(locale, 'Error', 'Error');
  return estado;
}

export default function RespaldoNegocioPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const c = (es: string, en: string) => backupTx(locale, es, en);
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
      const message = error instanceof Error ? error.message : c('No se pudo cargar respaldo de negocio', 'Could not load business backup');
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
      toast.error(c('Seleccioná al menos un módulo para exportar.', 'Select at least one module to export.'));
      return;
    }

    setExporting(format);
    try {
      await downloadRespaldoNegocio(format, selectedModules, locale);
      toast.success(c('Respaldo generado correctamente.', 'Backup generated successfully.'));
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : c('No se pudo generar el respaldo', 'Could not generate the backup');
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
        <AppHeader title={c('Respaldo / Exportación', 'Backup / Export')} />
        <main className='min-h-screen p-4 md:p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900'>
          <section className='mx-auto max-w-7xl space-y-6'>
            <Card className='border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
              <CardHeader className='space-y-3'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div>
                    <div className='flex items-center gap-2 text-sm font-semibold text-[#02a8e1] dark:text-cyan-300'>
                      <ShieldCheck className='h-4 w-4' />
                      {c('Exportación segura de datos operativos', 'Secure operational data export')}
                    </div>
                    <h1 className='mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50'>{c('Respaldo del negocio', 'Business backup')}</h1>
                    <p className='mt-2 max-w-3xl text-sm text-muted-foreground dark:text-slate-300'>
                      {c(
                        'Descargá los datos operativos del gimnasio en Excel o JSON. Esta exportación excluye contraseñas, tokens, secretos, migraciones privadas, datasets propietarios y know-how interno de Dragon Pyramid.',
                        'Download the gym operational data in Excel or JSON. This export excludes passwords, tokens, secrets, private migrations, proprietary datasets, and Dragon Pyramid internal know-how.'
                      )}
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Button type='button' variant='outline' onClick={loadData} disabled={loading}>
                      <RefreshCw className='mr-2 h-4 w-4' /> {c('Actualizar', 'Refresh')}
                    </Button>
                    <Button type='button' variant='outline' onClick={() => handleExport('json')} disabled={Boolean(exporting)}>
                      <FileJson className='mr-2 h-4 w-4' /> {exporting === 'json' ? c('Generando...', 'Generating...') : 'JSON'}
                    </Button>
                    <Button type='button' onClick={() => handleExport('xlsx')} disabled={Boolean(exporting)} className='bg-[#02a8e1] hover:bg-[#028fc0] dark:bg-cyan-600 dark:hover:bg-cyan-500'>
                      <FileSpreadsheet className='mr-2 h-4 w-4' /> {exporting === 'xlsx' ? c('Generando...', 'Generating...') : 'Excel'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='grid gap-4 md:grid-cols-3'>
                <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80'>
                  <p className='text-xs text-muted-foreground dark:text-slate-400'>{c('Módulos disponibles', 'Available modules')}</p>
                  <p className='mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50'>{modulos.length}</p>
                </div>
                <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80'>
                  <p className='text-xs text-muted-foreground dark:text-slate-400'>{c('Seleccionados', 'Selected')}</p>
                  <p className='mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50'>{selectedCount}</p>
                </div>
                <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80'>
                  <p className='text-xs text-muted-foreground dark:text-slate-400'>{c('Última exportación', 'Last export')}</p>
                  <p className='mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50'>{lastExport ? formatFrontendDateTime(lastExport.creado_en) : c('Sin registros', 'No records')}</p>
                </div>
              </CardContent>
            </Card>

            <div className='grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]'>
              <Card className='border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
                <CardHeader className='flex flex-row items-center justify-between gap-3'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-950 dark:text-slate-50'>{c('Módulos exportables', 'Exportable modules')}</h2>
                    <p className='text-sm text-muted-foreground dark:text-slate-400'>{c('Seleccioná qué datos del negocio querés incluir.', 'Select which business data you want to include.')}</p>
                  </div>
                  <Button type='button' variant='outline' onClick={toggleAll}>
                    {allSelected ? c('Deseleccionar todos', 'Deselect all') : c('Seleccionar todos', 'Select all')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className='text-sm text-muted-foreground dark:text-slate-400'>{c('Cargando módulos...', 'Loading modules...')}</p>
                  ) : (
                    <div className='grid gap-3 md:grid-cols-2'>
                      {modulos.map((modulo) => {
                        const checked = selectedModules.includes(modulo.key);
                        return (
                          <label
                            key={modulo.key}
                            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${checked ? 'border-[#02a8e1] bg-[#e6f7fd] dark:border-cyan-400/70 dark:bg-cyan-950/40' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'}`}
                          >
                            <input
                              type='checkbox'
                              checked={checked}
                              onChange={() => toggleModule(modulo.key)}
                              className='mt-1 h-4 w-4 accent-[#02a8e1]'
                            />
                            <span>
                              <span className='block font-semibold text-slate-950 dark:text-slate-50'>{getModuleLabel(locale, modulo)}</span>
                              <span className='mt-1 block text-xs leading-5 text-muted-foreground dark:text-slate-400'>{getModuleDescription(locale, modulo)}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className='border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
                <CardHeader>
                  <h2 className='text-xl font-semibold text-slate-950 dark:text-slate-50'>{c('Historial reciente', 'Recent history')}</h2>
                  <p className='text-sm text-muted-foreground dark:text-slate-400'>{c('Auditoría de las últimas exportaciones realizadas.', 'Audit log of the latest exports.')}</p>
                </CardHeader>
                <CardContent>
                  {!historial.length ? (
                    <div className='rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground dark:border-slate-700 dark:text-slate-400'>
                      <Archive className='mx-auto mb-2 h-8 w-8 opacity-60' />
                      {c('Todavía no hay exportaciones registradas.', 'No exports registered yet.')}
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {historial.map((item) => (
                        <article key={item.id} className='rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/80'>
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <p className='font-semibold text-slate-950 dark:text-slate-50'>{item.archivo_nombre || c('Respaldo generado', 'Generated backup')}</p>
                              <p className='text-xs text-muted-foreground dark:text-slate-400'>{formatFrontendDateTime(item.creado_en)}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.estado === 'completado' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : item.estado === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                              {estadoLabel(item.estado, locale)}
                            </span>
                          </div>
                          <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground dark:text-slate-400'>
                            <span>{c('Formato', 'Format')}: {item.formato.toUpperCase()}</span>
                            <span>{c('Registros', 'Records')}: {item.registros_totales}</span>
                            <span className='col-span-2'>{c('Módulos', 'Modules')}: {item.modulos?.length ?? 0}</span>
                          </div>
                          {item.error && <p className='mt-2 text-xs text-red-600 dark:text-red-300'>{item.error}</p>}
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
