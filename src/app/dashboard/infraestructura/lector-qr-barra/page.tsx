'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Camera, Loader2, QrCode, ScanLine } from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { InfraestructuraQrResolveResult } from '@/interfaces/infraestructuraMantenimiento.interface';
import { resolveInfraestructuraQrCodeClient } from '@/services/infraestructuraMantenimientoClient';

function labelFromValue(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildQrImageUrl(codigo?: string | null, size = 180) {
  const value = String(codigo ?? '').trim();
  if (!value) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;
}

export default function InfraestructuraLectorQrBarraPage() {
  const router = useRouter();
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
      setError('Ingresá o escaneá un código.');
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
        setError('El código fue leído, pero todavía no está vinculado a un activo, sector, equipamiento, producto o servicio en Gym Master.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resolver el código.');
    } finally {
      setLoading(false);
    }
  };

  const startCameraScan = async () => {
    setError(null);
    setResultado(null);

    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (!BarcodeDetectorCtor) {
      setError('Este navegador no soporta BarcodeDetector. Usá Chrome/Edge actualizado o ingresá el código manualmente.');
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
          // Seguimos intentando mientras la cámara esté activa.
        }
        window.setTimeout(scan, 450);
      };
      scan();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la cámara del dispositivo.');
      stopCamera();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Lector QR/barra" />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <QrCode className="mt-1 h-7 w-7 text-sky-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">Lector código barra / QR</h1>
                  <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
                    Base reutilizable para leer QR o códigos de barra con cámara. En esta etapa resuelve activos edilicios, sectores, equipamientos, productos o servicios ya vinculados a un código Gym Master. La sincronización celular → PC para kiosco quedará sobre esta misma base.
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
                  <h2 className="text-lg font-semibold">Escanear o ingresar código</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    value={codigo}
                    onChange={(event) => setCodigo(event.target.value)}
                    placeholder="Ej: GM-INFRA-ACTIVO-AB12CD34, EAN13, QR..."
                  />
                  <Button type="button" onClick={() => resolveCode()} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                    Resolver
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={startCameraScan} disabled={cameraActive || loading}>
                    <Camera className="mr-2 h-4 w-4" />
                    Usar cámara
                  </Button>
                  {cameraActive ? (
                    <Button type="button" variant="ghost" onClick={stopCamera}>Detener cámara</Button>
                  ) : null}
                </div>
                <video ref={videoRef} className={`w-full rounded-lg border bg-black ${cameraActive ? 'block' : 'hidden'}`} muted playsInline />
              </Card>

              <Card className="space-y-4 p-5">
                <h2 className="text-lg font-semibold">Resultado</h2>
                {!resultado ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Todavía no hay código resuelto.</p>
                ) : resultado.found ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Código</p>
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
                      <p className="mt-1 text-sm text-muted-foreground">Destino: {labelFromValue(resultado.target_type)}</p>
                    </div>
                    <Button type="button" className="w-full" onClick={() => resultado.route && router.push(resultado.route)}>
                      Abrir módulo vinculado
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Código leído sin vínculo activo en Gym Master.</p>
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
