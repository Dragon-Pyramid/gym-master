import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { registrarAsistenciaQR } from '@/services/qrService';
import BienvenidaSocio from './BienvenidaSocio';
import { Socio } from '@/interfaces/socio.interface';
import { Usuario } from '@/interfaces/usuario.interface';

const QrReader = dynamic(
  () => import('react-qr-reader').then((mod) => mod.QrReader),
  { ssr: false }
);

export function RegistrarAsistenciaQR() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    nombre?: string;
    foto?: string | null;
  }>({});

  const handleScan = async (data: string | null) => {
    if (!data || loading) return;
    setLoading(true);
    setError('');
    setMessage('');

    const result = (await registrarAsistenciaQR(data)) as unknown;
    const res = result as {
      message?: string;
      error?: string;
      valido?: boolean;
      asistencia?: { socio?: Socio };
      socio?: Socio;
      usuario?: Usuario;
    };

    if (res && (res.message || res.valido || !res.error)) {
      setMessage(res.message || 'Asistencia registrada correctamente.');
      let nombre: string | undefined;
      let foto: string | undefined;

      if (res.asistencia && res.asistencia.socio) {
        const socio = res.asistencia.socio as Socio & {
          usuario_id?: { foto?: string; nombre?: string };
        };
        nombre = socio.nombre_completo || undefined;
        foto = socio.usuario_id?.foto || undefined;
      }

      if (!nombre && res.socio) {
        const socio = res.socio as Socio & {
          usuario_id?: { foto?: string; nombre?: string };
        };
        nombre = socio.nombre_completo || undefined;
        foto = socio.usuario_id?.foto || undefined;
      }

      if (!nombre && res.usuario) {
        const usuario = res.usuario as Usuario;
        nombre = usuario.nombre || undefined;
        foto = usuario.foto || undefined;
      }

      if (!nombre) {
        try {
          const url = new URL(data);
          const qname = url.searchParams.get('nombre');
          if (qname) nombre = qname;
        } catch {}
      }

      setWelcomeData({ nombre, foto });
      setShowWelcome(true);

      // El evento ya se dispara automáticamente desde el servicio qrService
      // No necesitamos dispararlo manualmente aquí
    } else {
      const err = (res && res.error) || 'No se pudo registrar la asistencia.';
      setError(err);
    }

    setLoading(false);
  };

  return (
    <Card className='w-full max-w-xl mx-auto'>
      <CardHeader>
        <CardTitle>Escanear QR para registrar asistencia</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-6'>
        <div className='flex items-center justify-center w-full max-w-xs bg-gray-100 rounded-lg aspect-square'>
          <QrReader
            constraints={{ facingMode: 'environment' }}
            onResult={(result, error) => {
              if (result && typeof result.getText === 'function') {
                const text = result.getText();
                if (text) handleScan(text);
              }
              if (error && error.name === 'NotAllowedError')
                setError('No se pudo acceder a la cámara.');
            }}
          />
        </div>
        {loading && <div className='text-blue-600'>Registrando...</div>}
        {message && (
          <div className='font-semibold text-green-600'>{message}</div>
        )}
        {error && <div className='font-semibold text-red-600'>{error}</div>}
        <Button
          onClick={() => {
            setError('');
            setMessage('');
            setShowWelcome(false);
          }}
        >
          Reintentar
        </Button>
      </CardContent>
      {showWelcome && (
        <BienvenidaSocio
          nombre={welcomeData.nombre}
          foto={welcomeData.foto}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </Card>
  );
}
