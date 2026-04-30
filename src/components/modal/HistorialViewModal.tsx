'use client';
import React from 'react';

type HistItem = {
  fecha_ultimo_control?: string;
  created_at?: string;
  fecha?: string;
  usuario_id?: number | string;
  peso?: number;
  altura?: number;
  imc?: number | string;
  grupo_sanguineo?: string;
  presion_arterial?: string;
  frecuencia_cardiaca?: number;
  alergias?: string;
  medicacion?: string;
  lesiones_previas?: string;
  enfermedades_cronicas?: string;
  cirugias_previas?: string;
  observaciones_medico?: string;
  observaciones_entrenador?: string;
  archivos_adjuntos?: string | string[];
  archivo_aprobacion?: string | string[];
  proxima_revision?: string;
  aprobacion_medica?: boolean;
};

export default function HistorialViewModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: HistItem | null;
}) {
  if (!open || !item) return null;

  const formatDate = (v: unknown) => {
    if (!v) return '—';
    try {
      const d = new Date(String(v));
      return (
        d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR')
      );
    } catch {
      return String(v);
    }
  };

  const renderFiles = (val: string | string[] | undefined) => {
    if (!val) return null;
    if (Array.isArray(val)) {
      return val.map((u: string, i: number) => (
        <a
          key={i}
          href={u}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-block px-2 py-1 mt-1 mr-2 text-sm rounded-md'
        >
          Ver archivo {i + 1}
        </a>
      ));
    }
    return (
      <a
        href={String(val)}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-block px-2 py-1 mt-1 text-sm rounded-md'
      >
        Ver archivo
      </a>
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 backdrop-blur-sm' onClick={onClose} />
      <div className='relative w-full max-w-3xl p-4 rounded-lg shadow-lg page-bg'>
        <div className='relative p-6 rounded-lg panel'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='text-lg font-semibold'>Detalle de registro</h3>
              <div className='mt-1 text-sm'>
                {formatDate(
                  item.fecha_ultimo_control ?? item.created_at ?? item.fecha
                )}
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='px-3 py-1 text-sm border rounded-md'
            >
              Cerrar
            </button>
          </div>
          <div className='grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3'>
            <div>
              <div className='text-xs'>Peso</div>
              <div className='text-sm'>
                {item.peso ? `${item.peso} kg` : '—'}
              </div>
            </div>
            <div>
              <div className='text-xs'>Altura</div>
              <div className='text-sm'>
                {item.altura ? `${item.altura} cm` : '—'}
              </div>
            </div>
            <div>
              <div className='text-xs'>IMC</div>
              <div className='text-sm'>{item.imc ?? '—'}</div>
            </div>
            <div>
              <div className='text-xs'>Grupo sanguíneo</div>
              <div className='text-sm'>{item.grupo_sanguineo ?? '—'}</div>
            </div>
            <div>
              <div className='text-xs'>Presión arterial</div>
              <div className='text-sm'>{item.presion_arterial ?? '—'}</div>
            </div>
            <div>
              <div className='text-xs'>Frecuencia cardíaca</div>
              <div className='text-sm'>
                {item.frecuencia_cardiaca
                  ? `${item.frecuencia_cardiaca} bpm`
                  : '—'}
              </div>
            </div>
          </div>
          <div className='mt-4'>
            <div className='text-xs'>Alergias</div>
            <div className='mt-1 text-sm'>{item.alergias ?? '—'}</div>
          </div>
          <div className='mt-3'>
            <div className='text-xs'>Medicación</div>
            <div className='mt-1 text-sm'>{item.medicacion ?? '—'}</div>
          </div>
          <div className='mt-3'>
            <div className='text-xs'>Observaciones</div>
            <div className='mt-1 text-sm'>
              {item.observaciones_medico ??
                item.observaciones_entrenador ??
                '—'}
            </div>
          </div>
          <div className='mt-4'>
            <div className='text-xs'>Historial médico completo</div>
            <div className='mt-1 text-sm'>
              <div>
                <strong>Lesiones:</strong> {item.lesiones_previas ?? '—'}
              </div>
              <div className='mt-1'>
                <strong>Enfermedades crónicas:</strong>{' '}
                {item.enfermedades_cronicas ?? '—'}
              </div>
              <div className='mt-1'>
                <strong>Cirugías previas:</strong>{' '}
                {item.cirugias_previas ?? '—'}
              </div>
            </div>
          </div>
          {(item.aprobacion_medica !== undefined ||
            item.archivo_aprobacion) && (
            <div className='mt-4'>
              <div className='text-xs'>Aprobación médica</div>
              <div className='mt-1 text-sm'>
                {item.aprobacion_medica ? 'Sí' : 'No'}
              </div>
              <div className='mt-2'>{renderFiles(item.archivo_aprobacion)}</div>
            </div>
          )}
          {item.archivos_adjuntos && (
            <div className='mt-4'>
              <div className='text-xs'>Archivos adjuntos</div>
              <div className='mt-1'>{renderFiles(item.archivos_adjuntos)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
