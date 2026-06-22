'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Barcode, Camera, CheckCircle2, Loader2, Send, Smartphone, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getPublicComercialScannerSession,
  sendPublicComercialScannerCode,
} from '@/services/comercialMobileScannerService';
import type { PublicComercialScannerSessionInfo } from '@/interfaces/comercialMobileScanner.interface';
import { toast } from 'sonner';

type PageProps = {
  params: {
    token: string;
  };
};

export default function ComercialMobileScannerPage({ params }: PageProps) {
  const token = params.token;
  const [session, setSession] = useState<PublicComercialScannerSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'unsupported' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string>('');
  const lastScannedAtRef = useRef<number>(0);

  async function loadSession() {
    setLoading(true);
    try {
      const info = await getPublicComercialScannerSession(token);
      setSession(info);
    } catch (error: any) {
      setSession(null);
      toast.error(error?.message || 'No se pudo cargar la sesión de scanner');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function sendCode(code: string) {
    const clean = code.trim();
    if (!clean) return;
    if (!session?.puede_escanear) {
      toast.error('La sesión no está activa');
      return;
    }

    setSaving(true);
    try {
      const result = await sendPublicComercialScannerCode(token, clean);
      const message = result.message || 'Código enviado al POS';
      setLastMessage(message);
      setManualCode('');
      toast.success(message);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar el código');
    } finally {
      setSaving(false);
    }
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendCode(manualCode);
  }

  function stopCamera() {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus((current) => (current === 'active' ? 'idle' : current));
  }

  async function startCamera() {
    setCameraError(null);

    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setCameraStatus('unsupported');
      setCameraError('Este navegador no soporta BarcodeDetector. Usá la carga manual o actualizá Chrome/Edge.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported');
      setCameraError('Este navegador no permite acceso a cámara. Usá la carga manual.');
      return;
    }

    setCameraStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('active');
      scanningRef.current = true;
      const detector = new Detector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'] });
      scanLoop(detector);
    } catch (error: any) {
      setCameraStatus('error');
      setCameraError(error?.message || 'No se pudo iniciar la cámara');
    }
  }

  async function scanLoop(detector: any) {
    if (!scanningRef.current || !videoRef.current) return;

    try {
      const codes = await detector.detect(videoRef.current);
      if (codes?.length) {
        const value = String(codes[0]?.rawValue ?? '').trim();
        const now = Date.now();
        if (value && (value !== lastScannedRef.current || now - lastScannedAtRef.current > 2500)) {
          lastScannedRef.current = value;
          lastScannedAtRef.current = now;
          await sendCode(value);
        }
      }
    } catch {
      // Detector can fail while video metadata is still warming up. Keep scanning.
    }

    window.setTimeout(() => scanLoop(detector), 650);
  }

  const inactive = !session?.puede_escanear;

  return (
    <main className='min-h-screen bg-slate-950 px-4 py-6 text-white'>
      <section className='mx-auto flex max-w-md flex-col gap-5'>
        <div className='rounded-3xl border border-sky-500/30 bg-slate-900 p-5 shadow-2xl shadow-sky-950/40'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='rounded-2xl bg-sky-500/15 p-3 text-sky-300'>
              <Smartphone className='h-7 w-7' />
            </div>
            <div>
              <p className='text-xs uppercase tracking-[0.24em] text-sky-300'>Gym Master</p>
              <h1 className='text-xl font-bold'>Scanner móvil POS</h1>
            </div>
          </div>

          {loading ? (
            <div className='flex items-center gap-2 rounded-2xl bg-slate-800 p-4 text-sm text-slate-300'>
              <Loader2 className='h-4 w-4 animate-spin' /> Cargando sesión...
            </div>
          ) : session ? (
            <div className={`rounded-2xl p-4 text-sm ${session.puede_escanear ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
              <div className='flex items-center gap-2 font-semibold'>
                {session.puede_escanear ? <CheckCircle2 className='h-4 w-4' /> : <XCircle className='h-4 w-4' />}
                {session.puede_escanear ? 'Sesión activa' : `Sesión ${session.estado}`}
              </div>
              <p className='mt-1 text-xs opacity-80'>Los códigos enviados aparecerán en el POS/Kiosco de la PC.</p>
            </div>
          ) : (
            <div className='rounded-2xl bg-red-500/10 p-4 text-sm text-red-200'>Sesión no encontrada.</div>
          )}
        </div>

        <div className='rounded-3xl border border-slate-700 bg-slate-900 p-5'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <h2 className='font-semibold'>Escanear con cámara</h2>
              <p className='text-xs text-slate-400'>Compatible con QR y códigos de barras si el navegador lo soporta.</p>
            </div>
            <Barcode className='h-6 w-6 text-sky-300' />
          </div>

          <video ref={videoRef} className='aspect-video w-full rounded-2xl bg-black object-cover' muted playsInline />

          {cameraError && <p className='mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200'>{cameraError}</p>}

          <div className='mt-4 flex gap-2'>
            {cameraStatus !== 'active' ? (
              <Button className='flex-1 bg-sky-500 hover:bg-sky-600' disabled={inactive || cameraStatus === 'starting'} onClick={startCamera}>
                {cameraStatus === 'starting' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Camera className='mr-2 h-4 w-4' />}
                Usar cámara
              </Button>
            ) : (
              <Button className='flex-1' variant='secondary' onClick={stopCamera}>Detener cámara</Button>
            )}
          </div>
        </div>

        <div className='rounded-3xl border border-slate-700 bg-slate-900 p-5'>
          <h2 className='mb-3 font-semibold'>Carga manual</h2>
          <form className='space-y-3' onSubmit={handleManualSubmit}>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Código / SKU / QR</Label>
              <Input value={manualCode} disabled={inactive} onChange={(event) => setManualCode(event.target.value)} placeholder='Ej: 7791234567890' className='border-slate-700 bg-slate-950 text-white' />
            </div>
            <Button className='w-full bg-emerald-500 hover:bg-emerald-600' disabled={inactive || saving || !manualCode.trim()} type='submit'>
              {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Send className='mr-2 h-4 w-4' />}
              Enviar al POS
            </Button>
          </form>
        </div>

        {lastMessage && (
          <div className='rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100'>
            {lastMessage}
          </div>
        )}
      </section>
    </main>
  );
}
