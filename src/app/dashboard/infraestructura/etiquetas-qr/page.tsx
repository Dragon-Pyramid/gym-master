'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckSquare, Loader2, Printer, QrCode, RefreshCw, Search, Tags } from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/I18nProvider';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type {
  CreateInfraestructuraQrDTO,
  InfraestructuraQrCodigo,
  InfraestructuraQrLabelTarget,
  InfraestructuraQrLabelsDashboard,
  InfraestructuraQrTargetType,
} from '@/interfaces/infraestructuraMantenimiento.interface';
import {
  createInfraestructuraQrCodeClient,
  getInfraestructuraQrLabelsDashboardClient,
} from '@/services/infraestructuraMantenimientoClient';

function buildQrImageUrl(codigo?: string | null, size = 180) {
  const value = String(codigo ?? '').trim();
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;
}

function labelFromValue(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value?: string | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function targetTypeLabel(targetType?: string | null, isEnglish = false) {
  switch (targetType) {
    case 'infra_activo':
      return isEnglish ? 'Building asset' : 'Activo edilicio';
    case 'infra_sector':
      return isEnglish ? 'Building sector' : 'Sector edilicio';
    case 'edilicio_orden':
      return isEnglish ? 'Building order' : 'Orden edilicia';
    case 'equipamiento':
      return isEnglish ? 'Equipment' : 'Equipamiento';
    case 'producto':
      return isEnglish ? 'Product' : 'Producto';
    case 'servicio':
      return isEnglish ? 'Service' : 'Servicio';
    default:
      return labelFromValue(targetType);
  }
}

function qrSubtitle(qr: InfraestructuraQrCodigo, isEnglish = false) {
  const metadata = qr.metadata ?? {};
  const parts = [
    targetTypeLabel(qr.target_type, isEnglish),
    String(metadata.sector ?? metadata.ubicacion ?? metadata.tipo ?? '').trim(),
  ].filter(Boolean);
  return parts.join(' · ');
}

function targetCollection(dashboard: InfraestructuraQrLabelsDashboard | null, type: string): InfraestructuraQrLabelTarget[] {
  if (!dashboard) return [];
  if (type === 'infra_activo') return dashboard.activos;
  if (type === 'infra_sector') return dashboard.sectores;
  if (type === 'equipamiento') return dashboard.equipamientos;
  return [];
}

function printLabels(qrCodes: InfraestructuraQrCodigo[], columns: number, isEnglish = false) {
  const labelWidth = columns === 3 ? '62mm' : '92mm';
  const htmlLabels = qrCodes
    .map((qr) => {
      const qrUrl = buildQrImageUrl(qr.codigo, 210);
      return `
        <article class="label-card">
          <div class="brand">Gym Master</div>
          <div class="title">${escapeHtml(qr.titulo)}</div>
          <div class="subtitle">${escapeHtml(qrSubtitle(qr, isEnglish))}</div>
          <img class="qr" src="${escapeHtml(qrUrl)}" alt="QR ${escapeHtml(qr.codigo)}" />
          <div class="code">${escapeHtml(qr.codigo)}</div>
          <div class="hint">${escapeHtml(isEnglish ? 'Scan from Gym Master · QR/barcode scanner' : 'Escanear desde Gym Master · Lector QR/barra')}</div>
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
  <title>${isEnglish ? 'Gym Master QR labels' : 'Etiquetas QR Gym Master'}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
    .toolbar { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .toolbar button { border: 1px solid #0f172a; background: #0f172a; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
    .sheet { width: 190mm; margin: 0 auto; padding: 8mm 0; display: grid; grid-template-columns: repeat(${columns}, ${labelWidth}); gap: 6mm; align-items: start; justify-content: center; }
    .label-card { min-height: 70mm; border: 1px dashed #94a3b8; border-radius: 10px; padding: 5mm; text-align: center; overflow: hidden; page-break-inside: avoid; }
    .brand { font-size: 10px; text-transform: uppercase; letter-spacing: .18em; color: #64748b; font-weight: 700; }
    .title { margin-top: 4px; font-size: 13px; font-weight: 700; min-height: 32px; line-height: 1.2; display: flex; align-items: center; justify-content: center; }
    .subtitle { min-height: 18px; margin-top: 3px; font-size: 10px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qr { width: 38mm; height: 38mm; margin-top: 5px; }
    .code { margin-top: 4px; font-family: Consolas, monospace; font-size: 10px; font-weight: 700; word-break: break-all; }
    .hint { margin-top: 3px; font-size: 8px; color: #64748b; }
    @media print {
      .toolbar { display: none; }
      .sheet { padding-top: 0; }
      .label-card { border: 1px solid #cbd5e1; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>${isEnglish ? 'Gym Master QR labels' : 'Etiquetas QR Gym Master'} · ${qrCodes.length} ${isEnglish ? 'labels' : 'etiquetas'}</strong>
    <button onclick="window.print()">${isEnglish ? 'Print / Save PDF' : 'Imprimir / Guardar PDF'}</button>
  </div>
  <main class="sheet">${htmlLabels}</main>
</body>
</html>`);
  win.document.close();
  win.focus();
}

export default function InfraestructuraEtiquetasQrPage() {
  const { locale } = useI18n();
  const isEnglish = locale === 'en';
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [dashboard, setDashboard] = useState<InfraestructuraQrLabelsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [columns, setColumns] = useState(3);
  const [targetType, setTargetType] = useState<InfraestructuraQrTargetType | string>('equipamiento');
  const [targetId, setTargetId] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInfraestructuraQrLabelsDashboardClient();
      setDashboard(data);
      if (!targetId) {
        const firstTarget = targetCollection(data, targetType)[0];
        if (firstTarget) setTargetId(firstTarget.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudieron consultar etiquetas QR.', 'QR labels could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const options = targetCollection(dashboard, targetType);
    setTargetId(options[0]?.id ?? '');
    setCustomTitle('');
  }, [targetType, dashboard]);

  const filteredCodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    const codes = dashboard?.qrCodes ?? [];
    if (!term) return codes;
    return codes.filter((qr) =>
      [qr.codigo, qr.titulo, qr.target_type, qr.route, qr.metadata ? JSON.stringify(qr.metadata) : '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [dashboard?.qrCodes, search]);

  const selectedQrCodes = useMemo(() => {
    const selected = new Set(selectedCodes);
    return (dashboard?.qrCodes ?? []).filter((qr) => selected.has(qr.codigo));
  }, [dashboard?.qrCodes, selectedCodes]);

  const targetOptions = targetCollection(dashboard, targetType);

  const toggleCode = (codigo: string) => {
    setSelectedCodes((current) =>
      current.includes(codigo) ? current.filter((item) => item !== codigo) : [...current, codigo],
    );
  };

  const createCode = async () => {
    if (!targetId) {
      setError(tx('Seleccioná un destino para generar la etiqueta.', 'Select a destination to generate the label.'));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: CreateInfraestructuraQrDTO = {
        target_type: targetType,
        target_id: targetId,
        titulo: customTitle || null,
      };
      const response = await createInfraestructuraQrCodeClient(payload);
      await loadDashboard();
      setSelectedCodes((current) => Array.from(new Set([...current, response.data.codigo])));
      setSuccess(`${tx('Etiqueta generada', 'Generated label')}: ${response.data.codigo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo generar la etiqueta QR.', 'The QR label could not be generated.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx('Etiquetas QR', 'QR labels')} />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <Tags className="mt-1 h-7 w-7 text-sky-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-950">{tx('Etiquetas QR A4', 'A4 QR labels')}</h1>
                    <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
                      {tx('Generá etiquetas individuales o seleccioná varias para imprimirlas juntas en hoja A4. Esta base sirve para activos edilicios, sectores, equipamientos y luego productos/servicios.', 'Generate individual labels or select several to print them together on an A4 sheet. This base works for building assets, sectors, equipment, and later products/services.')}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={loadDashboard} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {tx('Actualizar', 'Refresh')}
                </Button>
              </div>
            </Card>

            {error ? (
              <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              </Card>
            ) : null}

            {success ? (
              <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex gap-2">
                  <CheckSquare className="mt-0.5 h-4 w-4" />
                  <span>{success}</span>
                </div>
              </Card>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="space-y-5 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{tx('Generar etiqueta QR', 'Generate QR label')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {tx('Creá una etiqueta nueva para equipamiento, activo edilicio o sector. Si ya existía un código para el mismo destino, se reutiliza o actualiza.', 'Create a new label for equipment, building assets, or sectors. If a code already existed for the same destination, it is reused or updated.')}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">{tx('Tipo', 'Type')}</span>
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={targetType}
                      onChange={(event) => setTargetType(event.target.value)}
                    >
                      <option value="equipamiento">{tx('Equipamiento', 'Equipment')}</option>
                      <option value="infra_activo">{tx('Activo edilicio', 'Building asset')}</option>
                      <option value="infra_sector">{tx('Sector edilicio', 'Building sector')}</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">{tx('Destino', 'Destination')}</span>
                    <select
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                      value={targetId}
                      onChange={(event) => setTargetId(event.target.value)}
                    >
                      {targetOptions.length === 0 ? <option value="">{tx('No hay destinos disponibles', 'No destinations available')}</option> : null}
                      {targetOptions.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.nombre}{target.subtitulo ? ` · ${target.subtitulo}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">{tx('Título opcional', 'Optional title')}</span>
                  <Input
                    value={customTitle}
                    onChange={(event) => setCustomTitle(event.target.value)}
                    placeholder={tx('Ej: QR Cinta 1 / QR Matafuego recepción', 'Ex: Treadmill QR 1 / Reception fire extinguisher QR')}
                  />
                </label>

                <Button type="button" onClick={createCode} disabled={saving || !targetId}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  {tx('Generar y seleccionar', 'Generate and select')}
                </Button>
              </Card>

              <Card className="space-y-5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{tx('Selección para hoja A4', 'A4 sheet selection')}</h2>
                    <p className="text-sm text-muted-foreground">
                      {tx('Seleccionadas', 'Selected')}: {selectedQrCodes.length}. {tx('Podés imprimir una o varias etiquetas en la misma hoja.', 'You can print one or several labels on the same sheet.')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="h-10 rounded-md border bg-white px-3 text-sm"
                      value={columns}
                      onChange={(event) => setColumns(Number(event.target.value))}
                    >
                      <option value={2}>{tx('A4 · 2 columnas', 'A4 · 2 columns')}</option>
                      <option value={3}>{tx('A4 · 3 columnas', 'A4 · 3 columns')}</option>
                    </select>
                    <Button type="button" onClick={() => printLabels(selectedQrCodes, columns, isEnglish)} disabled={selectedQrCodes.length === 0}>
                      <Printer className="mr-2 h-4 w-4" />
                      {tx('Imprimir / Guardar PDF', 'Print / Save PDF')}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedQrCodes.length === 0 ? (
                    <p className="col-span-full rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      {tx('Seleccioná etiquetas de la lista para ver la vista previa A4.', 'Select labels from the list to preview the A4 sheet.')}
                    </p>
                  ) : (
                    selectedQrCodes.map((qr) => (
                      <div key={qr.codigo} className="rounded-lg border bg-white p-3 text-center shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Gym Master</p>
                        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-950">{qr.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">{qrSubtitle(qr, isEnglish)}</p>
                        <img
                          src={buildQrImageUrl(qr.codigo, 160)}
                          alt={`QR ${qr.codigo}`}
                          className="mx-auto mt-3 h-28 w-28 rounded border bg-white p-2"
                        />
                        <p className="mt-2 break-all font-mono text-xs font-semibold">{qr.codigo}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </section>

            <Card className="space-y-4 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{tx('Códigos disponibles', 'Available codes')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {tx('Seleccioná etiquetas de edificios, sectores, equipamientos u otros módulos para imprimirlas juntas.', 'Select labels from buildings, sectors, equipment, or other modules to print them together.')}
                  </p>
                </div>
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={tx('Buscar por título, código, tipo...', 'Search by title, code, type...')}
                    className="pl-9"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tx('Cargando etiquetas...', 'Loading labels...')}
                </div>
              ) : filteredCodes.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {tx('Todavía no hay etiquetas QR generadas para imprimir.', 'No QR labels have been generated for printing yet.')}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCodes.map((qr) => {
                    const checked = selectedCodes.includes(qr.codigo);
                    return (
                      <label
                        key={qr.id}
                        className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${checked ? 'border-sky-400 bg-sky-50' : 'hover:border-slate-300'}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={checked}
                          onChange={() => toggleCode(qr.codigo)}
                        />
                        <img
                          src={buildQrImageUrl(qr.codigo, 96)}
                          alt={`QR ${qr.codigo}`}
                          className="h-20 w-20 rounded border bg-white p-1"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-950">{qr.titulo}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{qrSubtitle(qr, isEnglish)}</span>
                          <span className="mt-2 block break-all font-mono text-xs font-semibold">{qr.codigo}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
