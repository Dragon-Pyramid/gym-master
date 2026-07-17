'use client';

import { useEffect, useMemo, useState } from 'react';
import { Barcode, Loader2, Printer, QrCode, RefreshCw, Search, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { translateCommercialUi } from '@/i18n/commercialUi';
import type { ComercialCodigoLabelItem, ComercialCodigoTargetType, ComercialCodigosLabelsDashboard } from '@/interfaces/comercialCodigos.interface';
import { generateComercialQrCodeClient, getComercialCodigosLabelsDashboardClient } from '@/services/comercialCodigosService';

const emptyDashboard: ComercialCodigosLabelsDashboard = {
  generated_at: new Date().toISOString(),
  productos: [],
  servicios: [],
  packs: [],
  qrCodes: [],
  metricas: {
    productosConCodigo: 0,
    productosSinCodigo: 0,
    serviciosConCodigo: 0,
    serviciosSinCodigo: 0,
    packsConCodigo: 0,
    etiquetasQrGeneradas: 0,
  },
};

function formatCurrency(value?: number | null) {
  return `$ ${Math.round(Number(value ?? 0)).toLocaleString('es-AR')}`;
}

function buildQrImageUrl(value?: string | null, size = 210) {
  const clean = String(value ?? '').trim();
  if (!clean) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(clean)}`;
}

function escapeHtml(value?: string | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function commercialLabelsPrintTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function commercialLabelTypeForPrint(locale: GymMasterLocale, type: string) {
  if (type === 'producto') return commercialLabelsPrintTx(locale, 'Producto', 'Product');
  if (type === 'servicio') return commercialLabelsPrintTx(locale, 'Servicio', 'Service');
  if (type === 'pack') return 'Pack';
  return type;
}

function typeLabel(type: string, c?: (text: string) => string) {
  if (type === 'producto') return c ? c('Producto') : 'Producto';
  if (type === 'servicio') return c ? c('Servicio') : 'Servicio';
  if (type === 'pack') return c ? c('Pack') : 'Pack';
  return type;
}

function MetricCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <Card>
      <CardContent className='flex items-center justify-between gap-4 p-5'>
        <div>
          <p className='text-sm text-muted-foreground'>{title}</p>
          <p className='text-2xl font-bold'>{value}</p>
          <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
        <Tags className='h-5 w-5 text-sky-600' />
      </CardContent>
    </Card>
  );
}

function printLabels(items: ComercialCodigoLabelItem[], columns: number, locale: GymMasterLocale) {
  const labelWidth = columns === 3 ? '62mm' : '92mm';
  const htmlLabels = items
    .map((item) => {
      const code = item.codigo_principal || item.qr_codigo || item.sku || item.codigo_barras || '';
      const qrUrl = buildQrImageUrl(code, 210);
      return `
        <article class="label-card">
          <div class="brand">Gym Master</div>
          <div class="type">${escapeHtml(commercialLabelTypeForPrint(locale, item.target_type))}</div>
          <div class="title">${escapeHtml(item.nombre)}</div>
          <div class="price">${escapeHtml(formatCurrency(item.precio))}</div>
          ${qrUrl ? `<img class="qr" src="${escapeHtml(qrUrl)}" alt="QR ${escapeHtml(code)}" />` : '<div class="no-code">' + escapeHtml(commercialLabelsPrintTx(locale, 'Sin código', 'No code')) + '</div>'}
          <div class="code">${escapeHtml(code || commercialLabelsPrintTx(locale, 'SIN CÓDIGO', 'NO CODE'))}</div>
          ${item.sku ? `<div class="small">SKU: ${escapeHtml(item.sku)}</div>` : ''}
          ${item.codigo_barras ? `<div class="small">${escapeHtml(commercialLabelsPrintTx(locale, 'Barra', 'Barcode'))}: ${escapeHtml(item.codigo_barras)}</div>` : ''}
        </article>
      `;
    })
    .join('');

  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return;
  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(commercialLabelsPrintTx(locale, 'Etiquetas comerciales Gym Master', 'Gym Master commercial labels'))}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
    .toolbar { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .toolbar button { border: 1px solid #0f172a; background: #0f172a; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
    .sheet { width: 190mm; margin: 0 auto; padding: 8mm 0; display: grid; grid-template-columns: repeat(${columns}, ${labelWidth}); gap: 6mm; align-items: start; justify-content: center; }
    .label-card { min-height: 72mm; border: 1px dashed #94a3b8; border-radius: 10px; padding: 5mm; text-align: center; overflow: hidden; page-break-inside: avoid; }
    .brand { font-size: 10px; text-transform: uppercase; letter-spacing: .18em; color: #64748b; font-weight: 700; }
    .type { margin-top: 2px; font-size: 9px; color: #0284c7; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; }
    .title { margin-top: 4px; font-size: 13px; font-weight: 700; min-height: 28px; line-height: 1.2; display: flex; align-items: center; justify-content: center; }
    .price { margin-top: 2px; font-size: 13px; font-weight: 800; }
    .qr { width: 36mm; height: 36mm; margin-top: 5px; }
    .no-code { width: 36mm; height: 36mm; margin: 5px auto 0; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; }
    .code { margin-top: 4px; font-family: Consolas, monospace; font-size: 10px; font-weight: 700; word-break: break-all; }
    .small { margin-top: 2px; font-size: 8px; color: #64748b; word-break: break-all; }
    @media print { .toolbar { display: none; } .sheet { padding-top: 0; } .label-card { border: 1px solid #cbd5e1; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>${escapeHtml(commercialLabelsPrintTx(locale, 'Etiquetas comerciales Gym Master', 'Gym Master commercial labels'))} · ${items.length} ${escapeHtml(commercialLabelsPrintTx(locale, 'etiquetas', 'labels'))}</strong>
    <button onclick="window.print()">${escapeHtml(commercialLabelsPrintTx(locale, 'Imprimir / Guardar PDF', 'Print / Save PDF'))}</button>
  </div>
  <main class="sheet">${htmlLabels}</main>
</body>
</html>`);
  win.document.close();
  win.focus();
}

export default function ComercialCodigosEtiquetasPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const [dashboard, setDashboard] = useState<ComercialCodigosLabelsDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ComercialCodigoTargetType | 'todos'>('todos');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [columns, setColumns] = useState(3);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialCodigosLabelsDashboardClient();
      setDashboard(data);
    } catch (error: any) {
      toast.error(error?.message || c('No se pudieron cargar códigos comerciales'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isInitialized && isAuthenticated) loadDashboard(); }, [isInitialized, isAuthenticated]);

  const allItems = useMemo(() => [
    ...dashboard.productos,
    ...dashboard.servicios,
    ...dashboard.packs,
  ], [dashboard.productos, dashboard.servicios, dashboard.packs]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allItems.filter((item) => {
      if (typeFilter !== 'todos' && item.target_type !== typeFilter) return false;
      if (!term) return true;
      return [item.nombre, item.descripcion, item.codigo_principal, item.sku, item.codigo_barras, item.qr_codigo, item.subtitulo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [allItems, search, typeFilter]);

  const selectedItems = useMemo(() => {
    const selected = new Set(selectedKeys);
    return allItems.filter((item) => selected.has(`${item.target_type}:${item.id}`));
  }, [allItems, selectedKeys]);

  function toggleSelected(item: ComercialCodigoLabelItem) {
    const key = `${item.target_type}:${item.id}`;
    setSelectedKeys((current) => current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]);
  }

  async function handleGenerateQr(item: ComercialCodigoLabelItem) {
    if (item.target_type === 'pack') {
      toast.info(c('Los packs ya usan su código comercial como QR/código escaneable.'));
      return;
    }
    const key = `${item.target_type}:${item.id}`;
    setSavingKey(key);
    try {
      const qr = await generateComercialQrCodeClient({ target_type: item.target_type, target_id: item.id });
      toast.success(`${c('QR generado:')} ${qr.codigo}`);
      await loadDashboard();
    } catch (error: any) {
      toast.error(error?.message || c('No se pudo generar QR comercial'));
    } finally {
      setSavingKey(null);
    }
  }

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c('Códigos y etiquetas comerciales')} />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm dark:border-cyan-800/70'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>{c('Comercial y Stock')}</p>
                  <h1 className='text-2xl font-bold'>{c('Códigos, QR y etiquetas para POS')}</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    {c('Relacioná productos, servicios y packs con códigos reales para que el scanner móvil y el POS puedan agregarlos al carrito.')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20' onClick={loadDashboard} disabled={loading}>
                    {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}{c('Actualizar')}
                  </Button>
                  <Button onClick={() => printLabels(selectedItems.length ? selectedItems : filteredItems.slice(0, 24), columns, locale)} disabled={!filteredItems.length}>
                    <Printer className='mr-2 h-4 w-4' /> {c('Imprimir etiquetas')}
                  </Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6'>
              <MetricCard title={c('Productos con código')} value={dashboard.metricas.productosConCodigo} description={c('SKU, barra o QR')} />
              <MetricCard title={c('Productos sin código')} value={dashboard.metricas.productosSinCodigo} description={c('Pendientes para scanner')} />
              <MetricCard title={c('Servicios con código')} value={dashboard.metricas.serviciosConCodigo} description={c('Código o QR')} />
              <MetricCard title={c('Servicios sin código')} value={dashboard.metricas.serviciosSinCodigo} description={c('Pendientes POS')} />
              <MetricCard title={c('Packs con código')} value={dashboard.metricas.packsConCodigo} description={c('Código comercial')} />
              <MetricCard title={c('QR generados')} value={dashboard.metricas.etiquetasQrGeneradas} description={c('Productos/servicios')} />
            </section>

            <section className='rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80'>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_160px]'>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input className='pl-9' value={search} onChange={(event) => setSearch(event.target.value)} placeholder={c('Buscar por nombre, SKU, código de barras o QR')} />
                </div>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as any)} className='h-10 rounded-md border border-input bg-background px-3 text-sm'>
                  <option value='todos'>{c('Todos')}</option>
                  <option value='producto'>{c('Productos')}</option>
                  <option value='servicio'>{c('Servicios')}</option>
                  <option value='pack'>{c('Packs')}</option>
                </select>
                <select value={columns} onChange={(event) => setColumns(Number(event.target.value))} className='h-10 rounded-md border border-input bg-background px-3 text-sm'>
                  <option value={3}>{c('A4 · 3 columnas')}</option>
                  <option value={2}>{c('A4 · 2 columnas')}</option>
                </select>
              </div>
            </section>

            <section className='rounded-2xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80'>
              <div className='border-b p-4 text-sm text-muted-foreground'>
                {selectedItems.length ? `${selectedItems.length} ${c('seleccionados para imprimir')}` : c('Seleccioná etiquetas o imprimí el listado filtrado.')}
              </div>
              <div className='divide-y'>
                {loading ? (
                  <div className='p-6 text-sm text-muted-foreground'>{c('Cargando códigos comerciales...')}</div>
                ) : filteredItems.length === 0 ? (
                  <div className='p-6 text-sm text-muted-foreground'>{c('No hay ítems para el filtro seleccionado.')}</div>
                ) : filteredItems.map((item) => {
                  const key = `${item.target_type}:${item.id}`;
                  const selected = selectedKeys.includes(key);
                  const code = item.codigo_principal || item.qr_codigo || item.sku || item.codigo_barras || '';
                  return (
                    <article key={key} className={`grid grid-cols-1 gap-4 p-4 md:grid-cols-[36px_1fr_260px_220px] md:items-center ${selected ? 'bg-sky-50/60 dark:bg-sky-950/20' : ''}`}>
                      <input type='checkbox' checked={selected} onChange={() => toggleSelected(item)} className='h-4 w-4' />
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='font-semibold'>{item.nombre}</p>
                          <span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'>{typeLabel(item.target_type, c)}</span>
                          {!code && <span className='rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800'>{c('Sin código')}</span>}
                        </div>
                        <p className='text-sm text-muted-foreground'>{item.subtitulo || item.descripcion || c('Sin detalle')}</p>
                      </div>
                      <div className='space-y-1 text-xs'>
                        <p><span className='text-muted-foreground'>{c('Principal')}:</span> <span className='font-mono font-semibold'>{code || '-'}</span></p>
                        {item.sku && <p><span className='text-muted-foreground'>SKU:</span> <span className='font-mono'>{item.sku}</span></p>}
                        {item.codigo_barras && <p><span className='text-muted-foreground'>{c('Barra')}:</span> <span className='font-mono'>{item.codigo_barras}</span></p>}
                      </div>
                      <div className='flex flex-wrap justify-end gap-2'>
                        <Button type='button' size='sm' variant='outline' onClick={() => handleGenerateQr(item)} disabled={item.target_type === 'pack' || savingKey === key}>
                          {savingKey === key ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <QrCode className='mr-2 h-4 w-4' />}{c('Generar QR')}
                        </Button>
                        <Button type='button' size='sm' variant='outline' onClick={() => printLabels([item], columns, locale)} disabled={!code}>
                          <Barcode className='mr-2 h-4 w-4' />{c('Etiqueta')}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
