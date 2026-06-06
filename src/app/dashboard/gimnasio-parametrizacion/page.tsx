'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CheckCircle2, Loader2, Palette, ReceiptText, Save, ShieldCheck, UploadCloud } from 'lucide-react';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type {
  GimnasioParametrizacion,
  GimnasioParametrizacionPayload,
} from '@/interfaces/gimnasioParametrizacion.interface';
import {
  getGimnasioParametrizacion,
  updateGimnasioParametrizacion,
  uploadGimnasioLogo,
} from '@/services/gimnasioParametrizacionService';
import { useAuthStore } from '@/stores/authStore';
import { useCatalogosParametrizables } from '@/hooks/useCatalogosParametrizables';

const DEFAULT_LOGO = '/gm_logo.svg';

const emptyForm: GimnasioParametrizacionPayload = {
  nombre_comercial: '',
  razon_social: '',
  identificacion_fiscal: '',
  condicion_fiscal: '',
  domicilio_legal: '',
  ciudad: '',
  provincia: '',
  pais: 'Argentina',
  telefono: '',
  email: '',
  sitio_web: '',
  instagram_url: '',
  facebook_url: '',
  logo_url: DEFAULT_LOGO,
  logo_alternativo_url: '',
  color_primario: '#0EA5E9',
  color_secundario: '#111827',
  color_acento: '#22C55E',
  texto_legal_recibos: '',
  texto_legal_reportes: '',
  pie_pagina_documentos: 'Documento generado por Gym Master.',
  activo: true,
};

function formFromData(data: GimnasioParametrizacion): GimnasioParametrizacionPayload {
  return {
    nombre_comercial: data.nombre_comercial ?? '',
    razon_social: data.razon_social ?? '',
    identificacion_fiscal: data.identificacion_fiscal ?? '',
    condicion_fiscal: data.condicion_fiscal ?? '',
    domicilio_legal: data.domicilio_legal ?? '',
    ciudad: data.ciudad ?? '',
    provincia: data.provincia ?? '',
    pais: data.pais ?? 'Argentina',
    telefono: data.telefono ?? '',
    email: data.email ?? '',
    sitio_web: data.sitio_web ?? '',
    instagram_url: data.instagram_url ?? '',
    facebook_url: data.facebook_url ?? '',
    logo_url: data.logo_url ?? DEFAULT_LOGO,
    logo_alternativo_url: data.logo_alternativo_url ?? '',
    color_primario: data.color_primario ?? '#0EA5E9',
    color_secundario: data.color_secundario ?? '#111827',
    color_acento: data.color_acento ?? '#22C55E',
    texto_legal_recibos: data.texto_legal_recibos ?? '',
    texto_legal_reportes: data.texto_legal_reportes ?? '',
    pie_pagina_documentos: data.pie_pagina_documentos ?? 'Documento generado por Gym Master.',
    activo: data.activo,
  };
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

const fallbackCondicionesFiscales = [
  { codigo: 'responsable_inscripto', nombre: 'Responsable inscripto' },
  { codigo: 'monotributo', nombre: 'Monotributo' },
  { codigo: 'consumidor_final', nombre: 'Consumidor final' },
  { codigo: 'exento', nombre: 'Exento' },
  { codigo: 'no_responsable', nombre: 'No responsable' },
  { codigo: 'otro', nombre: 'Otro' },
];

export default function GimnasioParametrizacionPage() {
  const { user } = useAuthStore();
  const { catalogos } = useCatalogosParametrizables();
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<GimnasioParametrizacionPayload>(emptyForm);
  const [data, setData] = useState<GimnasioParametrizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoBroken, setLogoBroken] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getGimnasioParametrizacion();
        if (!mounted) return;
        setData(response);
        setForm(formFromData(response));
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar la parametrización.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const logoPreview = useMemo(() => {
    const value = textValue(form.logo_url).trim();
    if (!value || logoBroken) return DEFAULT_LOGO;
    return value;
  }, [form.logo_url, logoBroken]);

  const condicionesFiscales = useMemo(() => {
    const catalogo = catalogos.find((item) => item.key === 'gimnasio_condicion_fiscal');
    const items = catalogo?.items.filter((item) => item.activo) ?? [];

    return items.length > 0
      ? items.map((item) => ({ codigo: item.codigo, nombre: item.nombre }))
      : fallbackCondicionesFiscales;
  }, [catalogos]);

  const updateField = (field: keyof GimnasioParametrizacionPayload, value: string | boolean) => {
    setSuccessMessage(null);
    setLogoBroken(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setUploadingLogo(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const uploaded = await uploadGimnasioLogo(file);
      updateField('logo_url', uploaded.secure_url || uploaded.url);
      setSuccessMessage('Logo subido a Cloudinary. Guardá la parametrización para persistirlo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el logo a Cloudinary.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const saved = await updateGimnasioParametrizacion(form);
      setData(saved);
      setForm(formFromData(saved));
      setSuccessMessage('Parametrización del gimnasio actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la parametrización.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
          <AppHeader title="Datos del Gimnasio" />
          <main className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8'>
            <section className='rounded-3xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-wide text-sky-600'>Parametrización</p>
                  <h1 className='mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white'>
                    Branding y datos legales del gimnasio
                  </h1>
                  <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                    Configurá la identidad comercial y fiscal del gimnasio. Estos datos quedan listos para recibos,
                    PDFs, reportes, exportaciones y futuras pantallas con branding propio del cliente.
                  </p>
                </div>
                <div className='rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100'>
                  <div className='font-semibold'>Administrador</div>
                  <div>{user?.email ?? 'Usuario actual'}</div>
                </div>
              </div>
            </section>

            {loading ? (
              <Card>
                <CardContent className='flex items-center gap-3 p-6 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Cargando parametrización del gimnasio...
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className='grid gap-6 xl:grid-cols-[1fr_360px]'>
                <div className='space-y-6'>
                  {error && (
                    <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className='flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
                      <CheckCircle2 className='h-4 w-4' />
                      {successMessage}
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <div className='flex items-center gap-2 text-lg font-semibold'>
                        <Building2 className='h-5 w-5 text-sky-600' />
                        Identidad comercial y legal
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='nombre_comercial'>Nombre comercial</Label>
                        <Input id='nombre_comercial' value={textValue(form.nombre_comercial)} onChange={(e) => updateField('nombre_comercial', e.target.value)} required />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='razon_social'>Razón social</Label>
                        <Input id='razon_social' value={textValue(form.razon_social)} onChange={(e) => updateField('razon_social', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='identificacion_fiscal'>CUIT / DNI fiscal</Label>
                        <Input id='identificacion_fiscal' value={textValue(form.identificacion_fiscal)} onChange={(e) => updateField('identificacion_fiscal', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='condicion_fiscal'>Condición fiscal</Label>
                        <select
                          id='condicion_fiscal'
                          value={textValue(form.condicion_fiscal)}
                          onChange={(e) => updateField('condicion_fiscal', e.target.value)}
                          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                        >
                          <option value=''>Seleccionar condición fiscal</option>
                          {condicionesFiscales.map((item) => (
                            <option key={item.codigo} value={item.nombre}>
                              {item.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='domicilio_legal'>Domicilio legal</Label>
                        <Input id='domicilio_legal' value={textValue(form.domicilio_legal)} onChange={(e) => updateField('domicilio_legal', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='ciudad'>Ciudad</Label>
                        <Input id='ciudad' value={textValue(form.ciudad)} onChange={(e) => updateField('ciudad', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='provincia'>Provincia</Label>
                        <Input id='provincia' value={textValue(form.provincia)} onChange={(e) => updateField('provincia', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='pais'>País</Label>
                        <Input id='pais' value={textValue(form.pais)} onChange={(e) => updateField('pais', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='telefono'>Teléfono</Label>
                        <Input id='telefono' value={textValue(form.telefono)} onChange={(e) => updateField('telefono', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email institucional</Label>
                        <Input id='email' type='email' value={textValue(form.email)} onChange={(e) => updateField('email', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='sitio_web'>Sitio web</Label>
                        <Input id='sitio_web' placeholder='https://...' value={textValue(form.sitio_web)} onChange={(e) => updateField('sitio_web', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='instagram_url'>Instagram</Label>
                        <Input id='instagram_url' placeholder='https://instagram.com/...' value={textValue(form.instagram_url)} onChange={(e) => updateField('instagram_url', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='facebook_url'>Facebook</Label>
                        <Input id='facebook_url' placeholder='https://facebook.com/...' value={textValue(form.facebook_url)} onChange={(e) => updateField('facebook_url', e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className='flex items-center gap-2 text-lg font-semibold'>
                        <Palette className='h-5 w-5 text-sky-600' />
                        Branding visual
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='logo_url'>Logo principal</Label>
                        <div className='grid gap-2 md:grid-cols-[1fr_auto]'>
                          <Input
                            id='logo_url'
                            placeholder='/gm_logo.svg o https://...'
                            value={textValue(form.logo_url)}
                            onChange={(e) => updateField('logo_url', e.target.value)}
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => logoFileInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className='whitespace-nowrap'
                          >
                            {uploadingLogo ? (
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <UploadCloud className='mr-2 h-4 w-4' />
                            )}
                            Subir a Cloudinary
                          </Button>
                        </div>
                        <input
                          ref={logoFileInputRef}
                          type='file'
                          accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
                          className='hidden'
                          onChange={handleLogoFileChange}
                        />
                        <p className='text-xs text-muted-foreground'>Podés pegar una URL pública o subir el logo principal a Cloudinary. Luego guardá la parametrización para persistir el cambio.</p>
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='logo_alternativo_url'>Logo alternativo</Label>
                        <Input id='logo_alternativo_url' placeholder='Opcional: versión horizontal, blanco o membrete' value={textValue(form.logo_alternativo_url)} onChange={(e) => updateField('logo_alternativo_url', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='color_primario'>Color primario</Label>
                        <div className='flex gap-2'>
                          <Input id='color_primario' type='color' value={textValue(form.color_primario) || '#0EA5E9'} onChange={(e) => updateField('color_primario', e.target.value)} className='h-10 w-16 p-1' />
                          <Input value={textValue(form.color_primario)} onChange={(e) => updateField('color_primario', e.target.value)} />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='color_secundario'>Color secundario</Label>
                        <div className='flex gap-2'>
                          <Input id='color_secundario' type='color' value={textValue(form.color_secundario) || '#111827'} onChange={(e) => updateField('color_secundario', e.target.value)} className='h-10 w-16 p-1' />
                          <Input value={textValue(form.color_secundario)} onChange={(e) => updateField('color_secundario', e.target.value)} />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='color_acento'>Color de acento</Label>
                        <div className='flex gap-2'>
                          <Input id='color_acento' type='color' value={textValue(form.color_acento) || '#22C55E'} onChange={(e) => updateField('color_acento', e.target.value)} className='h-10 w-16 p-1' />
                          <Input value={textValue(form.color_acento)} onChange={(e) => updateField('color_acento', e.target.value)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className='flex items-center gap-2 text-lg font-semibold'>
                        <ReceiptText className='h-5 w-5 text-sky-600' />
                        Textos legales para documentos
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='texto_legal_recibos'>Texto legal para recibos</Label>
                        <textarea id='texto_legal_recibos' value={textValue(form.texto_legal_recibos)} onChange={(e) => updateField('texto_legal_recibos', e.target.value)} className='min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm' />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='texto_legal_reportes'>Texto legal para reportes/PDF</Label>
                        <textarea id='texto_legal_reportes' value={textValue(form.texto_legal_reportes)} onChange={(e) => updateField('texto_legal_reportes', e.target.value)} className='min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm' />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='pie_pagina_documentos'>Pie de página institucional</Label>
                        <textarea id='pie_pagina_documentos' value={textValue(form.pie_pagina_documentos)} onChange={(e) => updateField('pie_pagina_documentos', e.target.value)} className='min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm' />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <aside className='space-y-6'>
                  <Card className='sticky top-6'>
                    <CardHeader>
                      <div className='flex items-center gap-2 text-lg font-semibold'>
                        <ShieldCheck className='h-5 w-5 text-sky-600' />
                        Vista previa
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                      <div className='rounded-2xl border bg-white p-5 text-center shadow-sm dark:bg-slate-950'>
                        <div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border bg-slate-50 p-3'>
                          <img src={logoPreview} alt='Logo del gimnasio' className='max-h-20 max-w-20 object-contain' onError={() => setLogoBroken(true)} />
                        </div>
                        <h2 className='text-xl font-bold'>{textValue(form.nombre_comercial) || 'Gym Master'}</h2>
                        <p className='text-sm text-muted-foreground'>{textValue(form.razon_social) || 'Razón social pendiente'}</p>
                        <p className='text-xs text-muted-foreground'>{textValue(form.identificacion_fiscal) || 'CUIT/DNI fiscal pendiente'}</p>
                        <div className='mt-4 flex justify-center gap-2'>
                          <span className='h-8 w-8 rounded-full border' style={{ backgroundColor: textValue(form.color_primario) || '#0EA5E9' }} />
                          <span className='h-8 w-8 rounded-full border' style={{ backgroundColor: textValue(form.color_secundario) || '#111827' }} />
                          <span className='h-8 w-8 rounded-full border' style={{ backgroundColor: textValue(form.color_acento) || '#22C55E' }} />
                        </div>
                      </div>

                      <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800'>
                        La parametrización se usa como fuente única para recibos, reportes PDF comerciales y exportaciones. Los nuevos documentos deben consumir estos datos del gimnasio.
                      </div>

                      <Button type='submit' disabled={saving} className='w-full'>
                        {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
                        Guardar parametrización
                      </Button>

                      {data?.actualizado_en && (
                        <p className='text-center text-xs text-muted-foreground'>Última actualización: {new Date(data.actualizado_en).toLocaleString('es-AR')}</p>
                      )}
                    </CardContent>
                  </Card>
                </aside>
              </form>
            )}
          </main>
          <AppFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
