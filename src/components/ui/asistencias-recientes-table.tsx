import { useEffect, useState } from 'react';
import { fetchAsistenciasRecientes } from '@/services/qrService';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User } from 'lucide-react';

interface AsistenciaReciente {
  id: string;
  socio_id: string;
  fecha: string;
  creado_en: string;
}

interface AsistenciasRecientesTableProps {
  refreshTrigger?: number;
}

export default function AsistenciasRecientesTable({
  refreshTrigger,
}: AsistenciasRecientesTableProps) {
  const [asistencias, setAsistencias] = useState<AsistenciaReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAsistencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAsistenciasRecientes();
      setAsistencias(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAsistencias();
  }, [refreshTrigger]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className='w-full h-full'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
            <Clock className='w-6 h-6 sm:w-7 sm:h-7' />
            Asistencias Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 sm:space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='flex items-center justify-between p-4 border rounded-lg sm:p-5'
            >
              <div className='flex items-center gap-3 sm:gap-4'>
                <Skeleton className='w-10 h-10 rounded-full sm:w-12 sm:h-12' />
                <div className='space-y-2'>
                  <Skeleton className='w-32 h-5 sm:w-40 sm:h-6' />
                  <Skeleton className='w-20 h-4 sm:w-24 sm:h-5' />
                </div>
              </div>
              <Skeleton className='w-16 h-7 sm:w-20 sm:h-8' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='w-full h-full'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl text-destructive'>
            <Clock className='w-6 h-6 sm:w-7 sm:h-7' />
            Asistencias Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-base sm:text-lg text-destructive'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full h-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
          <Clock className='w-6 h-6 sm:w-7 sm:h-7' />
          Asistencias Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 sm:space-y-4'>
        {asistencias.length === 0 ? (
          <p className='py-6 text-base text-center sm:text-lg text-muted-foreground'>
            No hay asistencias recientes
          </p>
        ) : (
          asistencias.map((asistencia) => (
            <div
              key={asistencia.id}
              className='flex items-center justify-between p-4 transition-colors border rounded-lg sm:p-5 hover:bg-muted/50'
            >
              <div className='flex items-center flex-1 min-w-0 gap-3 sm:gap-4'>
                <div className='flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full sm:w-12 sm:h-12 bg-primary/10'>
                  <User className='w-5 h-5 sm:w-6 sm:h-6 text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-base font-medium truncate sm:text-lg'>
                    Socio {asistencia.socio_id}
                  </p>
                  <p className='text-sm sm:text-base text-muted-foreground'>
                    {formatFecha(asistencia.fecha)}
                  </p>
                </div>
              </div>
              <span className='flex-shrink-0 px-3 py-2 ml-3 text-sm rounded-md bg-secondary text-secondary-foreground sm:px-4 sm:text-base'>
                {formatHora(asistencia.creado_en)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
