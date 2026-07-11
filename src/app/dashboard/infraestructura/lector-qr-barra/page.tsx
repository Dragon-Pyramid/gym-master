'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Camera, Loader2, QrCode, ScanLine } from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { InfraestructuraQrResolveResult } from '@/interfaces/infraestructuraMantenimiento.interface';
import { resolveInfraestructuraQrCodeClient } from '@/services/infraestructuraMantenimientoClient';

function labelFromValue(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function targetTypeLabel(value?: string | null, isEnglish = false) {
  if (!value) return '-';
  if (!isEnglish) return labelFromValue(value);

  const labels: Record<string, string> = {
    infra_activo: 'Building asset',
    infra_sector: 'Building sector',
    equipamiento: 'Equipment',
    producto: 'Product',
    servicio: 'Service',
    pack: 'Pack',
  };

  return labels[value] ?? labelFromValue(value);
}

function buildQrImageUrl(codigo?: string | null, size = 180) {
  const value = String(codigo ?? '').trim();
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;
}

export default function InfraestructuraLectorQrBarraPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === 'en';
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState<InfraestructuraQrResolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const stopCamera = () => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const resolveCode = async (rawCode?: string) => {
    const value = String(rawCode ?? codigo).trim();
    if (!value) {
      setError(tx('Ingresá o escaneá un código.', 'Enter or scan a code.'));
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const response = await resolveInfraestructuraQrCodeClient(value);
      setResultado(response.data);
      setCodigo(response.data.codigo || value);
      if (!response.data.found) {
        setError(tx('El código fue leído, pero todavía no está vinculado a un activo, sector, equipamiento, producto o servicio en Gym Master.', 'The code was read, but it is not linked to an asset, sector, equipment, product, or service in Gym Master yet.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo resolver el código.', 'The code could not be resolved.'));
    } finally {
      setLoading(false);
    }
  };

  const startCameraScan = async () => {
    setError(null);
    setResultado(null);

    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (!BarcodeDetectorCtor) {
      setError(tx('Este navegador no soporta BarcodeDetector. Usá Chrome/Edge actualizado o ingresá el código manualmente.', 'This browser does not support BarcodeDetector. Use an updated Chrome/Edge version or enter the code manually.'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      scanningRef.current = true;

      const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] });
      const scan = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const firstCode = codes?.[0]?.rawValue;
          if (firstCode) {
            stopCamera();
            setCodigo(firstCode);
            await resolveCode(firstCode);
            return;
          }
        } catch {
          // Keep trying while the camera is active.
        }
        window.setTimeout(scan, 450);
      };
      scan();
    } catch (err) {
      setError(err instanceof Error ? err.message : tx('No se pudo abrir la cámara del dispositivo.', 'The device camera could not be opened.'));
      stopCamera();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx('Lector QR/barra', 'QR/barcode reader')} />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <QrCode className="mt-1 h-7 w-7 text-sky-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">{tx('Lector código barra / QR', 'Barcode / QR code reader')}</h1>
                  <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
                    {tx('Base reutilizable para leer QR o códigos de barra con cámara. En esta etapa resuelve activos edilicios, sectores, equipamientos, productos o servicios ya vinculados a un código Gym Master. La sincronización celular → PC para kiosco quedará sobre esta misma base.', 'Reusable base to read QR or barcode codes with the camera. At this stage it resolves building assets, sectors, equipment, products, or services already linked to a Gym Master code. Mobile → PC synchronization for the kiosk will remain on this same base.')}
                  </p>
                </div>
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

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">{tx('Escanear o ingresar código', 'Scan or enter code')}</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    value={codigo}
                    onChange={(event) => setCodigo(event.target.value)}
                    placeholder={tx('Ej: GM-INFRA-ACTIVO-AB12CD34, EAN13, QR...', 'Ex: GM-INFRA-ACTIVO-AB12CD34, EAN13, QR...')}
                  />
                  <Button type="button" onClick={() => resolveCode()} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                    {tx('Resolver', 'Resolve')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={startCameraScan} disabled={cameraActive || loading}>
                    <Camera className="mr-2 h-4 w-4" />
                    {tx('Usar cámara', 'Use camera')}
                  </Button>
                  {cameraActive ? (
                    <Button type="button" variant="ghost" onClick={stopCamera}>{tx('Detener cámara', 'Stop camera')}</Button>
                  ) : null}
                </div>
                <video ref={videoRef} className={`w-full rounded-lg border bg-black ${cameraActive ? 'block' : 'hidden'}`} muted playsInline />
              </Card>

              <Card className="space-y-4 p-5">
                <h2 className="text-lg font-semibold">{tx('Resultado', 'Result')}</h2>
                {!resultado ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{tx('Todavía no hay código resuelto.', 'No code has been resolved yet.')}</p>
                ) : resultado.found ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{tx('Código', 'Code')}</p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <img
                          src={buildQrImageUrl(resultado.codigo, 144)}
                          alt={`QR ${resultado.codigo}`}
                          className="h-32 w-32 rounded border bg-white p-2"
                        />
                        <p className="break-all font-mono text-sm font-semibold text-slate-950">{resultado.codigo}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="font-semibold text-slate-950">{resultado.titulo}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tx('Destino:', 'Destination:')} {targetTypeLabel(resultado.target_type, isEnglish)}</p>
                    </div>
                    <Button type="button" className="w-full" onClick={() => resultado.route && router.push(resultado.route)}>
                      {tx('Abrir módulo vinculado', 'Open linked module')}
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{tx('Código leído sin vínculo activo en Gym Master.', 'Code read without an active Gym Master link.')}</p>
                )}
              </Card>
            </section>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
