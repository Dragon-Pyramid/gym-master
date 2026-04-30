'use client';

import { useState } from 'react';
import { Socio } from '@/interfaces/socio.interface';
import { Dieta } from '@/interfaces/dieta.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, User, Calendar, FileText } from 'lucide-react';
import DietasViewModal from '@/components/modal/DietasViewModal';

interface SocioDietaCardProps {
  socio: Socio;
  dieta?: Dieta | null;
  loadingDieta?: boolean;
}

export default function SocioDietaCard({
  socio,
  dieta,
  loadingDieta,
}: SocioDietaCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const obtenerNombreDieta = (dieta?: Dieta | null) => {
    if (!dieta) return 'Sin dieta asignada';
    return dieta.nombre_plan || 'Dieta sin nombre';
  };

  const calcularDuracionDias = (dieta?: Dieta | null) => {
    if (!dieta || !dieta.fecha_inicio || !dieta.fecha_fin) return 0;
    try {
      const inicio = new Date(dieta.fecha_inicio);
      const fin = new Date(dieta.fecha_fin);
      const diffMs = fin.getTime() - inicio.getTime();
      if (isNaN(diffMs) || diffMs < 0) return 0;
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive
      return dias;
    } catch (error) {
      console.error('Error al calcular duración de dieta:', error);
      return 0;
    }
  };

  return (
    <>
      <Card className='h-full transition-shadow duration-200 cursor-pointer hover:shadow-lg border-border hover:border-primary/20'>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center flex-1 min-w-0 gap-2'>
              <User className='flex-shrink-0 w-5 h-5 text-primary' />
              <CardTitle className='text-base font-semibold truncate'>
                {socio.nombre_completo}
              </CardTitle>
            </div>
            <span
              className={`ml-2 flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                socio.activo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {socio.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className='text-sm text-muted-foreground'>DNI: {socio.dni}</p>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <FileText className='w-4 h-4 text-primary' />
              <span className='text-sm font-medium'>Última Dieta</span>
            </div>

            {loadingDieta ? (
              <div className='space-y-2'>
                <Skeleton className='w-full h-4' />
                <Skeleton className='w-3/4 h-4' />
              </div>
            ) : (
              <div className='space-y-2'>
                <p className='text-sm font-medium text-foreground'>
                  {obtenerNombreDieta(dieta)}
                </p>

                {dieta ? (
                  <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-3 h-3' />
                      <span>{calcularDuracionDias(dieta)} días</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <FileText className='w-3 h-3' />
                      <span className='truncate'>{dieta.objetivo || '-'}</span>
                    </div>
                  </div>
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    Este socio no tiene dietas asignadas
                  </p>
                )}

                {dieta?.fecha_inicio && (
                  <p className='text-xs text-muted-foreground'>
                    Inicio: {formatearFecha(dieta.fecha_inicio)}
                  </p>
                )}

                {dieta?.observaciones && (
                  <p className='text-xs truncate text-muted-foreground'>
                    Observaciones: {dieta.observaciones}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className='pt-2 space-y-2'>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              disabled={!dieta || loadingDieta}
              onClick={() => setModalOpen(true)}
            >
              <Eye className='w-4 h-4 mr-2' />
              Ver Dieta
            </Button>
            <Button variant='default' size='sm' className='w-full'>
              Nueva Dieta
            </Button>
          </div>
        </CardContent>
      </Card>
      <DietasViewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        dieta={dieta}
      />
    </>
  );
}
