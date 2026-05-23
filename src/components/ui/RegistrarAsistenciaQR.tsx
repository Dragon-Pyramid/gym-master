import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  registrarAsistenciaQR,
  RegistroAsistenciaQRResponse,
} from '@/services/qrService';
import BienvenidaSocio from './BienvenidaSocio';
import { Socio } from '@/interfaces/socio.interface';
import { Usuario } from '@/interfaces/usuario.interface';

const QrReader = dynamic(
  () => import('react-qr-reader').then((mod) => mod.QrReader),
  { ssr: false }
);

function getSocioDisplayData(res: RegistroAsistenciaQRResponse) {
  let nombre: string | undefined;
  let foto: string | null | undefined;

  if (res.asistencia?.socio) {
    const socio = res.asistencia.socio as Socio & {
      usuario_id?: { foto?: string | null; nombre?: string | null };
    };
    nombre = socio.nombre_completo || undefined;
    foto = socio.usuario_id?.foto || undefined;
  }

  if (!nombre && res.socio) {
    nombre = res.socio.nombre_completo || undefined;
    foto = res.socio.foto ?? undefined;
  }

  return { nombre, foto };
}

export function RegistrarAsistenciaQR() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    nombre?: string;
    foto?: string | null;
    variant?: 'success' | 'debt' | 'inactive';
    message?: string | null;
  }>({});

  const handleScan = async (data: string | null) => {
    if (!data || loading) return;

    const now = Date.now();
    if (
      lastScanRef.current?.value === data &&
      now - lastScanRef.current.at < 3000
    ) {
      return;
    }
    lastScanRef.current = { value: data, at: now };

    setLoading(true);
    setError('');
    setMessage('');

    const res = await registrarAsistenciaQR(data);

    const { nombre: responseNombre, foto } = getSocioDisplayData(res);
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
      setLoading(false);
      return;
    }

    if (res.error && !res.valido) {
      setError(res.error || 'No se pudo registrar la asistencia.');
      setLoading(false);
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

    setLoading(false);
  };

  return (
    <Card className='w-full max-w-xl mx-auto'>
      <CardHeader>
        <CardTitle>Escanear QR para registrar asistencia</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-6'>
        <div className='flex items-center justify-center w-full max-w-xs overflow-hidden bg-gray-100 border rounded-lg aspect-square'>
          <QrReader
            constraints={{ facingMode: 'environment' }}
            onResult={(result, scanError) => {
              if (result && typeof result.getText === 'function') {
                const text = result.getText();
                if (text) handleScan(text);
              }

              const cameraError = scanError as { name?: string; message?: string } | null;
              if (cameraError?.name === 'NotAllowedError') {
                setError('No se pudo acceder a la cámara. Revisá los permisos del navegador.');
              }

              if (cameraError?.name === 'NotFoundError') {
                setError('No se encontró una cámara disponible para escanear.');
              }

              if (cameraError?.name === 'NotReadableError') {
                setError('La cámara está ocupada por otra aplicación o el navegador no pudo iniciarla.');
              }
            }}
          />
        </div>

        <p className='max-w-sm text-xs text-center text-muted-foreground'>
          Si ves un cuadro gris, revisá permisos de cámara, que el sitio esté en
          HTTPS o localhost, y que ninguna otra aplicación esté usando la cámara.
        </p>

        {loading && <div className='text-blue-600'>Registrando...</div>}
        {message && (
          <div
            className={`font-semibold ${
              welcomeData.variant === 'debt' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message}
          </div>
        )}
        {error && <div className='font-semibold text-red-600'>{error}</div>}
        <Button
          onClick={() => {
            setError('');
            setMessage('');
            setShowWelcome(false);
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
