import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  registrarAsistenciaQR,
  RegistroAsistenciaQRResponse,
} from '@/services/qrService';
import BienvenidaSocio from './BienvenidaSocio';
import { Socio } from '@/interfaces/socio.interface';
import { Usuario } from '@/interfaces/usuario.interface';
import { supabaseBrowser } from '@/lib/supabase-browser';

type BrowserBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BrowserBarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BrowserBarcodeDetector;

function getBarcodeDetectorConstructor() {
  if (typeof window === 'undefined') return null;

  return (
    window as Window & {
      BarcodeDetector?: BrowserBarcodeDetectorConstructor;
    }
  ).BarcodeDetector ?? null;
}

function getSocioDisplayData(res: RegistroAsistenciaQRResponse) {
  let id_socio: string | undefined;
  let nombre: string | undefined;
  let foto: string | null | undefined;

  if (res.asistencia?.socio) {
    const socio = res.asistencia.socio as Socio & {
      usuario_id?: { foto?: string | null; nombre?: string | null };
    };
    id_socio = socio.id_socio || undefined;
    nombre = socio.nombre_completo || undefined;
    foto = socio.usuario_id?.foto || undefined;
  }

  if ((!nombre || !id_socio) && res.socio) {
    id_socio = res.socio.id_socio || id_socio;
    nombre = res.socio.nombre_completo || nombre;
    foto = res.socio.foto ?? foto;
  }

  return { id_socio, nombre, foto };
}

function broadcastAdminAccessEvent(payload: {
  event_id: string;
  access_status?: string;
  alert_type?: 'success' | 'debt' | 'inactive' | 'error';
  mensaje_acceso?: string | null;
  socio?: {
    id_socio?: string;
    nombre_completo?: string;
    foto?: string | null;
  };
}) {
  const channel = supabaseBrowser.channel('gym-master-asistencia-access-events');
  const timeout = window.setTimeout(() => {
    supabaseBrowser.removeChannel(channel);
  }, 2000);

  channel.subscribe(async (status) => {
    if (status !== 'SUBSCRIBED') return;

    window.clearTimeout(timeout);
    await channel.send({
      type: 'broadcast',
      event: 'access_event',
      payload,
    });

    window.setTimeout(() => {
      supabaseBrowser.removeChannel(channel);
    }, 300);
  });
}

export function RegistrarAsistenciaQR() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraHint, setCameraHint] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const loadingRef = useRef(false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    nombre?: string;
    foto?: string | null;
    variant?: 'success' | 'debt' | 'inactive';
    message?: string | null;
  }>({});

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  const handleScan = async (data: string | null) => {
    if (!data || loadingRef.current) return;

    const now = Date.now();
    if (
      lastScanRef.current?.value === data &&
      now - lastScanRef.current.at < 3000
    ) {
      return;
    }
    lastScanRef.current = { value: data, at: now };

    loadingRef.current = true;
    setLoading(true);
    setError('');
    setMessage('');
    setCameraHint('');

    try {
      const res = await registrarAsistenciaQR(data);

      const { id_socio, nombre: responseNombre, foto } = getSocioDisplayData(res);
      let nombre = responseNombre;

      if (!nombre && 'usuario' in res && res.usuario) {
        const usuario = res.usuario as Usuario;
        nombre = usuario.nombre || undefined;
      }

      if (!nombre) {
        try {
          const url = new URL(data);
          const qname = url.searchParams.get('nombre');
          if (qname) nombre = qname;
        } catch {}
      }

      const shouldNotifyAdmin =
        res.alert_type === 'debt' ||
        res.alert_type === 'inactive' ||
        res.access_status === 'deuda' ||
        res.access_status === 'desactivado';

      if (shouldNotifyAdmin) {
        broadcastAdminAccessEvent({
          event_id: `${res.access_status ?? res.alert_type ?? 'access'}-${
            id_socio ?? 'socio'
          }-${Date.now()}`,
          access_status: res.access_status,
          alert_type: res.alert_type,
          mensaje_acceso:
            res.mensaje_acceso ||
            res.error ||
            'El socio debe dirigirse a administración para regularizar su situación.',
          socio: {
            id_socio,
            nombre_completo: nombre,
            foto,
          },
        });
      }

      if (res.alert_type === 'inactive' || res.access_status === 'desactivado') {
        setWelcomeData({
          nombre,
          foto,
          variant: 'inactive',
          message:
            res.error ||
            'Usted está desactivado. Regularice su situación en administración.',
        });
        setError(res.error || 'Socio desactivado.');
        setShowWelcome(true);
        return;
      }

      if (res.error && !res.valido) {
        setError(res.error || 'No se pudo registrar la asistencia.');
        return;
      }

      if (res.valido || res.message) {
        const variant = res.alert_type === 'debt' ? 'debt' : 'success';
        const finalMessage =
          res.mensaje_acceso ||
          res.message ||
          'Asistencia registrada correctamente.';

        setMessage(finalMessage);
        setWelcomeData({
          nombre,
          foto,
          variant,
          message: variant === 'debt' ? finalMessage : null,
        });
        setShowWelcome(true);
      } else {
        setError('No se pudo registrar la asistencia.');
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      stopCamera();
      setError('');
      setMessage('');
      setCameraHint('Iniciando cámara...');
      setCameraReady(false);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraHint('Este navegador no permite acceder a la cámara desde esta página.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        await video.play();

        if (cancelled) return;

        setCameraReady(true);
        setCameraHint('');

        const BarcodeDetectorClass = getBarcodeDetectorConstructor();

        if (!BarcodeDetectorClass) {
          setCameraHint(
            'La cámara está activa, pero este navegador no soporta detección QR nativa. Probá con Chrome actualizado.'
          );
          return;
        }

        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });

        scanTimerRef.current = window.setInterval(async () => {
          const currentVideo = videoRef.current;

          if (
            !currentVideo ||
            currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
            loadingRef.current
          ) {
            return;
          }

          try {
            const codes = await detector.detect(currentVideo);
            const text = codes.find((code) => code.rawValue)?.rawValue;

            if (text) {
              await handleScan(text);
            }
          } catch {
            // Error transitorio de frame: no se corta la cámara.
          }
        }, 450);
      } catch (cameraError: any) {
        const name = cameraError?.name;

        if (name === 'NotAllowedError') {
          setCameraHint('No se pudo acceder a la cámara. Revisá los permisos del navegador.');
          return;
        }

        if (name === 'NotFoundError') {
          setCameraHint('No se encontró una cámara disponible para escanear.');
          return;
        }

        if (name === 'NotReadableError') {
          setCameraHint('La cámara está ocupada por otra aplicación o el navegador no pudo iniciarla.');
          return;
        }

        setCameraHint('No se pudo iniciar la cámara. Reintentá o actualizá la página.');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraKey]);

  return (
    <Card className='w-full max-w-xl mx-auto'>
      <CardHeader>
        <CardTitle>Escanear QR para registrar asistencia</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-6'>
        <div className='relative flex items-center justify-center w-full max-w-xs overflow-hidden bg-slate-900 border rounded-lg aspect-square'>
          <video
            ref={videoRef}
            className='absolute inset-0 object-cover w-full h-full'
            playsInline
            muted
            autoPlay
          />

          {!cameraReady && (
            <div className='absolute inset-0 flex items-center justify-center px-6 text-sm text-center text-white bg-slate-900'>
              Iniciando cámara...
            </div>
          )}

          <div className='absolute inset-8 border-2 border-white/80 rounded-2xl shadow-[0_0_0_999px_rgba(15,23,42,0.28)]' />
          <div className='absolute w-12 h-1 -translate-x-1/2 bg-[#02a8e1] rounded-full top-8 left-1/2' />
          <div className='absolute w-12 h-1 -translate-x-1/2 bg-[#02a8e1] rounded-full bottom-8 left-1/2' />
        </div>

        <p className='max-w-sm text-xs text-center text-muted-foreground'>
          Apuntá la cámara al QR del día. El lector usa la cámara nativa del navegador
          para mostrar el preview y detectar el código.
        </p>

        {cameraHint && (
          <div className='max-w-sm text-sm font-medium text-center text-amber-700'>
            {cameraHint}
          </div>
        )}

        {loading && <div className='text-blue-600'>Registrando...</div>}
        {message && (
          <div
            className={`font-semibold text-center ${
              welcomeData.variant === 'debt' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message}
          </div>
        )}
        {error && <div className='font-semibold text-center text-red-600'>{error}</div>}
        <Button
          onClick={() => {
            setError('');
            setMessage('');
            setShowWelcome(false);
            setCameraHint('');
            setCameraReady(false);
            setCameraKey((value) => value + 1);
            lastScanRef.current = null;
          }}
        >
          Reintentar
        </Button>
      </CardContent>
      {showWelcome && (
        <BienvenidaSocio
          nombre={welcomeData.nombre}
          foto={welcomeData.foto}
          variant={welcomeData.variant}
          message={welcomeData.message}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </Card>
  );
}
