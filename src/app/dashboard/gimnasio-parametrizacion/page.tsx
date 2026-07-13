'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CheckCircle2, CreditCard, Loader2, Palette, ReceiptText, Save, ShieldCheck, UploadCloud } from 'lucide-react';
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
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';

const DEFAULT_LOGO = '/gm_logo.svg';

function gymParamTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function normalizeGymParamText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const FISCAL_CONDITION_LABELS_EN: Record<string, string> = {
  responsable_inscripto: 'Registered VAT taxpayer',
  'responsable inscripto': 'Registered VAT taxpayer',
  monotributo: 'Monotributo',
  consumidor_final: 'Final consumer',
  'consumidor final': 'Final consumer',
  exento: 'Tax-exempt',
  no_responsable: 'Not liable',
  'no responsable': 'Not liable',
  otro: 'Other',
};

function translateFiscalCondition(locale: GymMasterLocale, value?: string | null) {
  const text = String(value ?? '');
  if (locale !== 'en') return text;
  return FISCAL_CONDITION_LABELS_EN[normalizeGymParamText(text)] ?? text;
}

const STRIPE_STATUS_LABELS: Record<string, { es: string; en: string }> = {
  no_configurado: { es: 'No configurado', en: 'Not configured' },
  configurado: { es: 'Configurado', en: 'Configured' },
  activo: { es: 'Activo', en: 'Active' },
  inactivo: { es: 'Inactivo', en: 'Inactive' },
};

function translateStripeStatus(locale: GymMasterLocale, value: string) {
  const labels = STRIPE_STATUS_LABELS[value];
  return labels ? gymParamTx(locale, labels.es, labels.en) : value;
}

function translateStripeMode(locale: GymMasterLocale, value: 'test' | 'live') {
  if (value === 'live') return gymParamTx(locale, 'Producción', 'Production');
  return gymParamTx(locale, 'Test / sandbox', 'Test / sandbox');
}


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
  stripe_habilitado: false,
  stripe_estado: 'no_configurado',
  stripe_modo: 'test',
  stripe_public_key: '',
  stripe_account_reference: '',
  stripe_observaciones: '',
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
    stripe_habilitado: data.stripe_habilitado === true,
    stripe_estado: data.stripe_estado ?? 'no_configurado',
    stripe_modo: data.stripe_modo ?? 'test',
    stripe_public_key: data.stripe_public_key ?? '',
    stripe_account_reference: data.stripe_account_reference ?? '',
    stripe_observaciones: data.stripe_observaciones ?? '',
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
  const { locale } = useI18n();
  const c = (es: string, en: string) => gymParamTx(locale, es, en);
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
        setError(err instanceof Error ? err.message : c('No se pudo cargar la parametrización.', 'Could not load gym settings.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const logoPreview = useMemo(() => {
    const value = textValue(form.logo_url).trim();
    if (!value || logoBroken) return DEFAULT_LOGO;
    return value;
  }, [form.logo_url, logoBroken]);

  const condicionesFiscales = useMemo(() => {
    const catalogo = catalogos.find((item) => String(item.key) === 'gimnasio_condicion_fiscal');
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

  const updateStripeEnabled = (enabled: boolean) => {
    setSuccessMessage(null);
    setLogoBroken(false);
    setForm((prev) => ({
      ...prev,
      stripe_habilitado: enabled,
      stripe_estado: enabled ? 'activo' : 'inactivo',
    }));
  };

  const updateStripeEstado = (estado: string) => {
    setSuccessMessage(null);
    setLogoBroken(false);
    setForm((prev) => ({
      ...prev,
      stripe_estado: estado,
      stripe_habilitado: estado === 'activo',
    }));
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
      setSuccessMessage(c('Logo subido a Cloudinary. Guardá la parametrización para persistirlo.', 'Logo uploaded to Cloudinary. Save the settings to persist the change.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : c('No se pudo subir el logo a Cloudinary.', 'Could not upload the logo to Cloudinary.'));
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
      setSuccessMessage(c('Parametrización del gimnasio actualizada correctamente.', 'Gym settings updated successfully.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : c('No se pudo guardar la parametrización.', 'Could not save gym settings.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
          <AppHeader title={c('Datos del Gimnasio', 'Gym data')} />
          <main className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8'>
            <section className='rounded-3xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-wide text-sky-600'>{c('Parametrización', 'Settings')}</p>
                  <h1 className='mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white'>
                    {c('Branding y datos legales del gimnasio', 'Branding and legal gym data')}
                  </h1>
                  <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                    {c('Configurá la identidad comercial y fiscal del gimnasio. Estos datos quedan listos para recibos, PDFs, reportes, exportaciones y futuras pantallas con branding propio del cliente.', "Configure the gym's commercial and tax identity. These data are ready for receipts, PDFs, reports, exports, and future screens with the client's own branding.")}
                  </p>
                </div>
                <div className='rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100'>
                  <div className='font-semibold'>{c('Administrador', 'Administrator')}</div>
                  <div>{user?.email ?? c('Usuario actual', 'Current user')}</div>
                </div>
              </div>
            </section>

            {loading ? (
              <Card>
                <CardContent className='flex items-center gap-3 p-6 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {c('Cargando parametrización del gimnasio...', 'Loading gym settings...')}
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className='grid gap-6 xl:grid-cols-[1fr_360px]'>
                <div className='space-y-6'>
                  {error && (
                    <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'>
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className='flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'>
                      <CheckCircle2 className='h-4 w-4' />
                      {successMessage}
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <div className='flex items-center gap-2 text-lg font-semibold'>
                        <Building2 className='h-5 w-5 text-sky-600' />
                        {c('Identidad comercial y legal', 'Commercial and legal identity')}
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='nombre_comercial'>{c('Nombre comercial', 'Trade name')}</Label>
                        <Input id='nombre_comercial' value={textValue(form.nombre_comercial)} onChange={(e) => updateField('nombre_comercial', e.target.value)} required />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='razon_social'>{c('Razón social', 'Legal name')}</Label>
                        <Input id='razon_social' value={textValue(form.razon_social)} onChange={(e) => updateField('razon_social', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='identificacion_fiscal'>{c('CUIT / DNI fiscal', 'Tax ID')}</Label>
                        <Input id='identificacion_fiscal' value={textValue(form.identificacion_fiscal)} onChange={(e) => updateField('identificacion_fiscal', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='condicion_fiscal'>{c('Condición fiscal', 'Tax condition')}</Label>
                        <select
                          id='condicion_fiscal'
                          value={textValue(form.condicion_fiscal)}
                          onChange={(e) => updateField('condicion_fiscal', e.target.value)}
                          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                        >
                          <option value=''>{c('Seleccionar condición fiscal', 'Select tax condition')}</option>
                          {condicionesFiscales.map((item) => (
                            <option key={item.codigo} value={item.nombre}>
                              {translateFiscalCondition(locale, item.nombre)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='domicilio_legal'>{c('Domicilio legal', 'Legal address')}</Label>
                        <Input id='domicilio_legal' value={textValue(form.domicilio_legal)} onChange={(e) => updateField('domicilio_legal', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='ciudad'>{c('Ciudad', 'City')}</Label>
                        <Input id='ciudad' value={textValue(form.ciudad)} onChange={(e) => updateField('ciudad', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='provincia'>{c('Provincia', 'Province')}</Label>
                        <Input id='provincia' value={textValue(form.provincia)} onChange={(e) => updateField('provincia', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='pais'>{c('País', 'Country')}</Label>
                        <Input id='pais' value={textValue(form.pais)} onChange={(e) => updateField('pais', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='telefono'>{c('Teléfono', 'Phone')}</Label>
                        <Input id='telefono' value={textValue(form.telefono)} onChange={(e) => updateField('telefono', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>{c('Email institucional', 'Institutional email')}</Label>
                        <Input id='email' type='email' value={textValue(form.email)} onChange={(e) => updateField('email', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='sitio_web'>{c('Sitio web', 'Website')}</Label>
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
                        {c('Branding visual', 'Visual branding')}
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='logo_url'>{c('Logo principal', 'Main logo')}</Label>
                        <div className='grid gap-2 md:grid-cols-[1fr_auto]'>
                          <Input
                            id='logo_url'
                            placeholder={c('/gm_logo.svg o https://...', '/gm_logo.svg or https://...')}
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
                            {c('Subir a Cloudinary', 'Upload to Cloudinary')}
                          </Button>
                        </div>
                        <input
                          ref={logoFileInputRef}
                          type='file'
                          accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
                          className='hidden'
                          onChange={handleLogoFileChange}
                        />
                        <p className='text-xs text-muted-foreground'>{c('Podés pegar una URL pública o subir el logo principal a Cloudinary. Luego guardá la parametrización para persistir el cambio.', 'You can paste a public URL or upload the main logo to Cloudinary. Then save the settings to persist the change.')}</p>
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='logo_alternativo_url'>{c('Logo alternativo', 'Alternative logo')}</Label>
                        <Input id='logo_alternativo_url' placeholder={c('Opcional: versión horizontal, blanco o membrete', 'Optional: horizontal, white, or letterhead version')} value={textValue(form.logo_alternativo_url)} onChange={(e) => updateField('logo_alternativo_url', e.target.value)} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='color_primario'>{c('Color primario', 'Primary color')}</Label>
                        <div className='flex gap-2'>
                          <Input id='color_primario' type='color' value={textValue(form.color_primario) || '#0EA5E9'} onChange={(e) => updateField('color_primario', e.target.value)} className='h-10 w-16 p-1' />
                          <Input value={textValue(form.color_primario)} onChange={(e) => updateField('color_primario', e.target.value)} />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='color_secundario'>{c('Color secundario', 'Secondary color')}</Label>
                        <div className='flex gap-2'>
                          <Input id='color_secundario' type='color' value={textValue(form.color_secundario) || '#111827'} onChange={(e) => updateField('color_secundario', e.target.value)} className='h-10 w-16 p-1' />
                          <Input value={textValue(form.color_secundario)} onChange={(e) => updateField('color_secundario', e.target.value)} />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='color_acento'>{c('Color de acento', 'Accent color')}</Label>
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
                        <CreditCard className='h-5 w-5 text-sky-600' />
                        {c('Pagos online Stripe', 'Stripe online payments')}
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2 md:col-span-2'>
                        <label className='flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm dark:border-sky-900/60 dark:bg-sky-950/30'>
                          <input
                            type='checkbox'
                            checked={form.stripe_habilitado === true}
                            onChange={(e) => updateStripeEnabled(e.target.checked)}
                            className='mt-1 h-4 w-4 rounded border-slate-300'
                          />
                          <span>
                            <span className='block font-semibold text-slate-900 dark:text-white'>{c('Habilitar pagos online con Stripe', 'Enable online payments with Stripe')}</span>
                            <span className='mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300'>
                              {c('Si está desactivado, los socios no verán disponible el checkout online y deberán abonar por medios manuales registrados por administración.', 'If disabled, members will not see online checkout available and must pay through manual methods registered by administration.')}
                            </span>
                          </span>
                        </label>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='stripe_estado'>{c('Estado de integración', 'Integration status')}</Label>
                        <select
                          id='stripe_estado'
                          value={textValue(form.stripe_estado) || 'no_configurado'}
                          onChange={(e) => updateStripeEstado(e.target.value)}
                          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                        >
                          <option value='no_configurado'>{translateStripeStatus(locale, 'no_configurado')}</option>
                          <option value='configurado'>{translateStripeStatus(locale, 'configurado')}</option>
                          <option value='activo'>{translateStripeStatus(locale, 'activo')}</option>
                          <option value='inactivo'>{translateStripeStatus(locale, 'inactivo')}</option>
                        </select>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='stripe_modo'>{c('Modo', 'Mode')}</Label>
                        <select
                          id='stripe_modo'
                          value={textValue(form.stripe_modo) || 'test'}
                          onChange={(e) => updateField('stripe_modo', e.target.value)}
                          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                        >
                          <option value='test'>{translateStripeMode(locale, 'test')}</option>
                          <option value='live'>{translateStripeMode(locale, 'live')}</option>
                        </select>
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='stripe_public_key'>{c('Publishable key / referencia pública', 'Publishable key / public reference')}</Label>
                        <Input
                          id='stripe_public_key'
                          placeholder={c('Opcional. No guardar claves secretas acá.', 'Optional. Do not store secret keys here.')}
                          value={textValue(form.stripe_public_key)}
                          onChange={(e) => updateField('stripe_public_key', e.target.value)}
                        />
                        <p className='text-xs text-muted-foreground'>
                          {c('Las claves secretas y webhooks se manejan por variables de entorno seguras. Este campo es solo referencia operativa.', 'Secret keys and webhooks are managed through secure environment variables. This field is only an operational reference.')}
                        </p>
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='stripe_account_reference'>{c('Referencia de cuenta Stripe', 'Stripe account reference')}</Label>
                        <Input
                          id='stripe_account_reference'
                          placeholder={c('Ej: cuenta conectada, cliente, alias o identificador interno', 'Example: connected account, client, alias, or internal identifier')}
                          value={textValue(form.stripe_account_reference)}
                          onChange={(e) => updateField('stripe_account_reference', e.target.value)}
                        />
                      </div>
                      <div className='space-y-2 md:col-span-2'>
                        <Label htmlFor='stripe_observaciones'>{c('Observaciones Stripe', 'Stripe notes')}</Label>
                        <textarea
                          id='stripe_observaciones'
                          value={textValue(form.stripe_observaciones)}
                          onChange={(e) => updateField('stripe_observaciones', e.target.value)}
                          className='min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                          placeholder={c('Notas internas sobre configuración, estado comercial o validaciones pendientes.', 'Internal notes about configuration, commercial status, or pending validations.')}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className='flex items-center gap-2 text-lg font-semibold'>
                        <ReceiptText className='h-5 w-5 text-sky-600' />
                        {c('Textos legales para documentos', 'Legal texts for documents')}
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='texto_legal_recibos'>{c('Texto legal para recibos', 'Legal text for receipts')}</Label>
                        <textarea id='texto_legal_recibos' value={textValue(form.texto_legal_recibos)} onChange={(e) => updateField('texto_legal_recibos', e.target.value)} className='min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm' />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='texto_legal_reportes'>{c('Texto legal para reportes/PDF', 'Legal text for reports/PDF')}</Label>
                        <textarea id='texto_legal_reportes' value={textValue(form.texto_legal_reportes)} onChange={(e) => updateField('texto_legal_reportes', e.target.value)} className='min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm' />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='pie_pagina_documentos'>{c('Pie de página institucional', 'Institutional footer')}</Label>
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
                        {c('Vista previa', 'Preview')}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                      <div className='rounded-2xl border bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950'>
                        <div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900'>
                          <img src={logoPreview} alt={c('Logo del gimnasio', 'Gym logo')} className='max-h-20 max-w-20 object-contain' onError={() => setLogoBroken(true)} />
                        </div>
                        <h2 className='text-xl font-bold'>{textValue(form.nombre_comercial) || 'Gym Master'}</h2>
                        <p className='text-sm text-muted-foreground'>{textValue(form.razon_social) || c('Razón social pendiente', 'Pending legal name')}</p>
                        <p className='text-xs text-muted-foreground'>{textValue(form.identificacion_fiscal) || c('CUIT/DNI fiscal pendiente', 'Pending tax ID')}</p>
                        <div className='mt-4 flex justify-center gap-2'>
                          <span className='h-8 w-8 rounded-full border' style={{ backgroundColor: textValue(form.color_primario) || '#0EA5E9' }} />
                          <span className='h-8 w-8 rounded-full border' style={{ backgroundColor: textValue(form.color_secundario) || '#111827' }} />
                          <span className='h-8 w-8 rounded-full border' style={{ backgroundColor: textValue(form.color_acento) || '#22C55E' }} />
                        </div>
                      </div>

                      <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'>
                        {c('La parametrización se usa como fuente única para recibos, reportes PDF comerciales y exportaciones. Los nuevos documentos deben consumir estos datos del gimnasio.', 'These settings are used as the single source for receipts, commercial PDF reports, and exports. New documents must consume these gym data.')}
                      </div>

                      <div className={`rounded-xl border px-4 py-3 text-xs leading-5 ${
                        form.stripe_habilitado && form.stripe_estado === 'activo'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}>
                        <strong>Stripe:</strong>{' '}
                        {form.stripe_habilitado && form.stripe_estado === 'activo'
                          ? c('pagos online habilitados para socios.', 'online payments enabled for members.')
                          : c('pagos online deshabilitados o pendientes de activación.', 'online payments disabled or pending activation.')}
                      </div>

                      <Button type='submit' disabled={saving} className='w-full'>
                        {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
                        {c('Guardar parametrización', 'Save settings')}
                      </Button>

                      {data?.actualizado_en && (
                        <p className='text-center text-xs text-muted-foreground'>{c('Última actualización:', 'Last update:')} {new Date(data.actualizado_en).toLocaleString(locale === 'en' ? 'en-US' : 'es-AR')}</p>
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
