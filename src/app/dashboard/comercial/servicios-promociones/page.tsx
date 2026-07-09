'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgePercent, Gift, Loader2, Package, Plus, RefreshCw, Save, Store, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';
import type { ComercialServiciosPromocionesDashboard, CreateComercialPackItemDTO } from '@/interfaces/comercialServiciosPromociones.interface';
import {
  createComercialCupon,
  createComercialPack,
  createComercialPromocion,
  getComercialServiciosPromocionesDashboard,
} from '@/services/comercialServiciosPromocionesService';
import { formatCurrencyARS } from '@/lib/comercial/productos';

const emptyDashboard: ComercialServiciosPromocionesDashboard = {
  productos: [],
  servicios: [],
  canales: [],
  grupos: [],
  packs: [],
  promociones: [],
  cupones: [],
  items: [],
  metricas: {
    serviciosActivos: 0,
    packsActivos: 0,
    promocionesActivas: 0,
    cuponesActivos: 0,
    itemsVendibles: 0,
  },
};

type PackItemForm = {
  item_tipo: 'producto' | 'servicio';
  source_id: string;
  cantidad: string;
  precio_referencia: string;
};

function emptyPackItem(): PackItemForm {
  return { item_tipo: 'servicio', source_id: '', cantidad: '1', precio_referencia: '' };
}

function toNumber(value: string | number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function codeFrom(value: string, prefix: string) {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return base ? `${prefix}-${base}` : '';
}

function MetricCard({ title, value, description, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className='flex items-center justify-between gap-4 p-5'>
        <div className='space-y-1'>
          <p className='text-sm text-muted-foreground'>{title}</p>
          <p className='text-2xl font-bold'>{value}</p>
          <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
        <div className='rounded-full bg-sky-50 p-3 text-sky-600'><Icon className='h-5 w-5' /></div>
      </CardContent>
    </Card>
  );
}

export default function ComercialServiciosPromocionesPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ComercialServiciosPromocionesDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [savingPack, setSavingPack] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [savingCupon, setSavingCupon] = useState(false);

  const [packNombre, setPackNombre] = useState('');
  const [packPrecio, setPackPrecio] = useState('');
  const [packDescripcion, setPackDescripcion] = useState('');
  const [packCanalId, setPackCanalId] = useState('');
  const [packGrupoId, setPackGrupoId] = useState('');
  const [packItems, setPackItems] = useState<PackItemForm[]>([emptyPackItem()]);

  const [promoNombre, setPromoNombre] = useState('');
  const [promoTipo, setPromoTipo] = useState<'descuento_porcentaje' | 'descuento_fijo' | 'combo' | 'beneficio'>('descuento_porcentaje');
  const [promoValor, setPromoValor] = useState('');
  const [promoInicio, setPromoInicio] = useState('');
  const [promoFin, setPromoFin] = useState('');
  const [promoCanalId, setPromoCanalId] = useState('');
  const [promoGrupoId, setPromoGrupoId] = useState('');

  const [cuponPromocionId, setCuponPromocionId] = useState('');
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [cuponMaxUsos, setCuponMaxUsos] = useState('');
  const [cuponExpira, setCuponExpira] = useState('');

  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => { if (isInitialized && !isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, isInitialized, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await getComercialServiciosPromocionesDashboard();
      setDashboard(data);
      if (!packCanalId && data.canales[0]?.id) setPackCanalId(data.canales[0].id);
      if (!promoCanalId && data.canales[0]?.id) setPromoCanalId(data.canales[0].id);
      if (!packGrupoId && data.grupos[0]?.id) setPackGrupoId(data.grupos[0].id);
      if (!promoGrupoId && data.grupos[0]?.id) setPromoGrupoId(data.grupos[0].id);
      if (!cuponPromocionId && data.promociones[0]?.id) setCuponPromocionId(data.promociones[0].id);
    } catch (error: any) {
      toast.error(error.message || c('No se pudo cargar servicios y promociones'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isInitialized && isAuthenticated) loadDashboard(); }, [isInitialized, isAuthenticated]);

  const productosById = useMemo(() => new Map(dashboard.productos.map((p) => [p.id, p])), [dashboard.productos]);
  const serviciosById = useMemo(() => new Map(dashboard.servicios.map((s) => [s.id, s])), [dashboard.servicios]);
  const packTotalReferencia = useMemo(() => packItems.reduce((sum, item) => sum + toNumber(item.cantidad) * toNumber(item.precio_referencia), 0), [packItems]);

  function updatePackItem(index: number, next: Partial<PackItemForm>) {
    setPackItems((current) => current.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, ...next };
      if (next.source_id) {
        const source = updated.item_tipo === 'producto' ? productosById.get(next.source_id) : serviciosById.get(next.source_id);
        updated.precio_referencia = String(Number(source?.precio ?? 0) || '');
      }
      if (next.item_tipo) {
        updated.source_id = '';
        updated.precio_referencia = '';
      }
      return updated;
    }));
  }

  async function handleCreatePack(event: React.FormEvent) {
    event.preventDefault();
    setSavingPack(true);
    try {
      const items: CreateComercialPackItemDTO[] = packItems.filter((item) => item.source_id).map((item) => ({
        item_tipo: item.item_tipo,
        producto_id: item.item_tipo === 'producto' ? item.source_id : null,
        servicio_id: item.item_tipo === 'servicio' ? item.source_id : null,
        cantidad: Number(item.cantidad || 1),
        precio_referencia: Number(item.precio_referencia || 0),
      }));
      await createComercialPack({
        codigo: codeFrom(packNombre, 'PACK'),
        nombre: packNombre,
        descripcion: packDescripcion || null,
        precio: Number(packPrecio),
        canal_venta_id: packCanalId || null,
        grupo_cliente_id: packGrupoId || null,
        disponible_pos: true,
        disponible_online: false,
        items,
      });
      toast.success(c('Pack creado correctamente'));
      setPackNombre(''); setPackPrecio(''); setPackDescripcion(''); setPackItems([emptyPackItem()]);
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo crear el pack'));
    } finally {
      setSavingPack(false);
    }
  }

  async function handleCreatePromo(event: React.FormEvent) {
    event.preventDefault();
    setSavingPromo(true);
    try {
      await createComercialPromocion({
        codigo: codeFrom(promoNombre, 'PROMO'),
        nombre: promoNombre,
        tipo: promoTipo,
        valor: Number(promoValor),
        fecha_inicio: promoInicio || null,
        fecha_fin: promoFin || null,
        canal_venta_id: promoCanalId || null,
        grupo_cliente_id: promoGrupoId || null,
        acumulable: false,
      });
      toast.success(c('Promoción creada correctamente'));
      setPromoNombre(''); setPromoValor(''); setPromoInicio(''); setPromoFin('');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo crear la promoción'));
    } finally {
      setSavingPromo(false);
    }
  }

  async function handleCreateCupon(event: React.FormEvent) {
    event.preventDefault();
    setSavingCupon(true);
    try {
      await createComercialCupon({
        promocion_id: cuponPromocionId,
        codigo: cuponCodigo,
        max_usos: cuponMaxUsos ? Number(cuponMaxUsos) : null,
        fecha_expiracion: cuponExpira || null,
      });
      toast.success(c('Cupón creado correctamente'));
      setCuponCodigo(''); setCuponMaxUsos(''); setCuponExpira('');
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.message || c('No se pudo crear el cupón'));
    } finally {
      setSavingCupon(false);
    }
  }

  if (!isInitialized) return <div>{c('Cargando...')}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c('Servicios / Packs / Promociones')} />
          <main className='flex-1 space-y-6 p-6'>
            <section className='rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm dark:border-cyan-800/70'>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-600'>{c('Comercial y Stock')}</p>
                  <h1 className='text-2xl font-bold'>{c('Servicios, packs y promociones')}</h1>
                  <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>
                    {c('Armá servicios vendibles, packs comerciales, promociones, cupones, canales de venta y grupos de cliente.')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20' onClick={loadDashboard} disabled={loading}>{loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}{c('Actualizar')}</Button>
                  <Button asChild variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20'><Link href='/dashboard/servicios'>{c('Servicios base')}</Link></Button>
                  <Button asChild variant='outline' className='border-white/30 bg-white/10 text-white hover:bg-white/20'><Link href='/dashboard/comercial/kiosco'>{c('POS / Kiosco')}</Link></Button>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
              <MetricCard title={c('Servicios')} value={String(dashboard.metricas.serviciosActivos)} description={c('Servicios base activos.')} icon={Store} />
              <MetricCard title={c('Packs')} value={String(dashboard.metricas.packsActivos)} description={c('Packs comerciales activos.')} icon={Package} />
              <MetricCard title={c('Promos')} value={String(dashboard.metricas.promocionesActivas)} description={c('Promociones activas.')} icon={BadgePercent} />
              <MetricCard title={c('Cupones')} value={String(dashboard.metricas.cuponesActivos)} description={c('Cupones disponibles.')} icon={Gift} />
              <MetricCard title={c('Items')} value={String(dashboard.metricas.itemsVendibles)} description={c('Productos, servicios y packs.')} icon={Tags} />
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
              <Card>
                <CardHeader><CardTitle>{c('Crear pack comercial')}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePack} className='space-y-4'>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      <div className='space-y-1.5'><Label>{c('Nombre')}</Label><Input value={packNombre} onChange={(e) => setPackNombre(e.target.value)} required /></div>
                      <div className='space-y-1.5'><Label>{c('Precio final')}</Label><Input type='number' min='0' step='0.01' value={packPrecio} onChange={(e) => setPackPrecio(e.target.value)} required /></div>
                      <div className='space-y-1.5'><Label>{c('Canal')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={packCanalId} onChange={(e) => setPackCanalId(e.target.value)}>{dashboard.canales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                      <div className='space-y-1.5'><Label>{c('Grupo')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={packGrupoId} onChange={(e) => setPackGrupoId(e.target.value)}>{dashboard.grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select></div>
                    </div>
                    <div className='space-y-1.5'><Label>{c('Descripción')}</Label><Input value={packDescripcion} onChange={(e) => setPackDescripcion(e.target.value)} placeholder={c('Ej: pack 8 clases + evaluación inicial')} /></div>
                    <div className='space-y-3'>
                      {packItems.map((item, index) => (
                        <div key={index} className='grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[0.55fr_1.2fr_0.35fr_0.45fr_auto] md:items-end'>
                          <div className='space-y-1.5'><Label>{c('Tipo')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={c(item.item_tipo === "servicio" ? "Servicio" : "Producto")} onChange={(e) => updatePackItem(index, { item_tipo: e.target.value as 'producto' | 'servicio' })}><option value='servicio'>{c('Servicio')}</option><option value='producto'>{c('Producto')}</option></select></div>
                          <div className='space-y-1.5'><Label>{c('Ítem')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={item.source_id} onChange={(e) => updatePackItem(index, { source_id: e.target.value })} required><option value=''>{c('Seleccionar')}</option>{item.item_tipo === 'producto' ? dashboard.productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>) : dashboard.servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
                          <div className='space-y-1.5'><Label>{c('Cant.')}</Label><Input type='number' min='1' value={item.cantidad} onChange={(e) => updatePackItem(index, { cantidad: e.target.value })} /></div>
                          <div className='space-y-1.5'><Label>{c('Ref.')}</Label><Input type='number' min='0' step='0.01' value={item.precio_referencia} onChange={(e) => updatePackItem(index, { precio_referencia: e.target.value })} /></div>
                          <Button type='button' variant='ghost' onClick={() => setPackItems((prev) => prev.filter((_, i) => i !== index))} disabled={packItems.length === 1}>{c('Quitar')}</Button>
                        </div>
                      ))}
                    </div>
                    <div className='flex flex-col justify-between gap-3 rounded-lg border bg-sky-50 p-3 md:flex-row md:items-center dark:border-sky-900/60 dark:bg-sky-950/20'>
                      <p className='text-sm'>{c('Valor referencia:')} <b>{formatCurrencyARS(packTotalReferencia)}</b></p>
                      <div className='flex gap-2'><Button type='button' variant='outline' onClick={() => setPackItems((prev) => [...prev, emptyPackItem()])}><Plus className='mr-2 h-4 w-4' />{c('Ítem')}</Button><Button type='submit' disabled={savingPack}>{savingPack ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}{c('Crear pack')}</Button></div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>{c('Crear promoción')}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePromo} className='space-y-4'>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      <div className='space-y-1.5'><Label>{c('Nombre')}</Label><Input value={promoNombre} onChange={(e) => setPromoNombre(e.target.value)} required /></div>
                      <div className='space-y-1.5'><Label>{c('Tipo')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={promoTipo} onChange={(e) => setPromoTipo(e.target.value as any)}><option value='descuento_porcentaje'>{c('% descuento')}</option><option value='descuento_fijo'>{c('$ descuento')}</option><option value='combo'>{c('Combo')}</option><option value='beneficio'>{c('Beneficio')}</option></select></div>
                      <div className='space-y-1.5'><Label>{c('Valor')}</Label><Input type='number' min='0' step='0.01' value={promoValor} onChange={(e) => setPromoValor(e.target.value)} required /></div>
                      <div className='space-y-1.5'><Label>{c('Canal')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={promoCanalId} onChange={(e) => setPromoCanalId(e.target.value)}>{dashboard.canales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                      <div className='space-y-1.5'><Label>{c('Grupo')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={promoGrupoId} onChange={(e) => setPromoGrupoId(e.target.value)}>{dashboard.grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select></div>
                      <div className='grid grid-cols-2 gap-2'><div className='space-y-1.5'><Label>{c('Inicio')}</Label><Input type='date' value={promoInicio} onChange={(e) => setPromoInicio(e.target.value)} /></div><div className='space-y-1.5'><Label>{c('Fin')}</Label><Input type='date' value={promoFin} onChange={(e) => setPromoFin(e.target.value)} /></div></div>
                    </div>
                    <Button type='submit' disabled={savingPromo}>{savingPromo ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <BadgePercent className='mr-2 h-4 w-4' />}{c('Crear promoción')}</Button>
                  </form>

                  <form onSubmit={handleCreateCupon} className='mt-6 space-y-4 rounded-xl border p-4'>
                    <h3 className='font-semibold'>{c('Crear cupón')}</h3>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      <div className='space-y-1.5'><Label>{c('Promoción')}</Label><select className='h-10 w-full rounded-md border px-3 text-sm' value={cuponPromocionId} onChange={(e) => setCuponPromocionId(e.target.value)}>{dashboard.promociones.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className='space-y-1.5'><Label>{c('Código')}</Label><Input value={cuponCodigo} onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())} placeholder='VERANO10' required /></div>
                      <div className='space-y-1.5'><Label>{c('Máx. usos')}</Label><Input type='number' min='1' value={cuponMaxUsos} onChange={(e) => setCuponMaxUsos(e.target.value)} /></div>
                      <div className='space-y-1.5'><Label>{c('Expira')}</Label><Input type='date' value={cuponExpira} onChange={(e) => setCuponExpira(e.target.value)} /></div>
                    </div>
                    <Button type='submit' variant='outline' disabled={savingCupon}>{savingCupon ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Gift className='mr-2 h-4 w-4' />}{c('Crear cupón')}</Button>
                  </form>
                </CardContent>
              </Card>
            </section>

            <section className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
              <Card><CardHeader><CardTitle>{c('Packs recientes')}</CardTitle></CardHeader><CardContent className='space-y-2'>{dashboard.packs.slice(0, 8).map((pack) => <div key={pack.id} className='rounded-lg border p-3'><p className='font-semibold'>{pack.nombre}</p><p className='text-sm text-muted-foreground'>{pack.codigo} · {formatCurrencyARS(pack.precio)} · {pack.items?.length ?? 0} {c('ítems')}</p></div>)}</CardContent></Card>
              <Card><CardHeader><CardTitle>{c('Promociones')}</CardTitle></CardHeader><CardContent className='space-y-2'>{dashboard.promociones.slice(0, 8).map((promo) => <div key={promo.id} className='rounded-lg border p-3'><p className='font-semibold'>{promo.nombre}</p><p className='text-sm text-muted-foreground'>{promo.codigo} · {promo.tipo} · {promo.valor}</p></div>)}</CardContent></Card>
              <Card><CardHeader><CardTitle>{c('Items vendibles')}</CardTitle></CardHeader><CardContent className='space-y-2'>{dashboard.items.slice(0, 10).map((item) => <div key={`${c(item.item_tipo === "servicio" ? "Servicio" : "Producto")}-${item.source_id}`} className='flex justify-between gap-3 rounded-lg border p-3 text-sm'><span>{item.nombre}<br/><span className='text-xs text-muted-foreground'>{c(item.item_tipo === "servicio" ? "Servicio" : "Producto")}</span></span><b>{formatCurrencyARS(item.precio)}</b></div>)}</CardContent></Card>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
