'use client';
import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import React from 'react';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';

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
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === 'en' ? en : es);

  if (!open || !item) return null;

  const formatDate = (v: unknown) => {
    if (!v) return '—';
    try {
      const d = new Date(String(v));
      return (
        formatFrontendDateTime(d, locale === 'en' ? 'en-US' : 'es-AR')
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
          className='mt-1 mr-2 inline-block rounded-md border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900'
        >
          {tx('Ver archivo', 'View file')} {i + 1}
        </a>
      ));
    }
    return (
      <a
        href={String(val)}
        target='_blank'
        rel='noopener noreferrer'
        className='mt-1 inline-block rounded-md border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900'
      >
        {tx('Ver archivo', 'View file')}
      </a>
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 backdrop-blur-sm' onClick={onClose} />
      <div className='relative w-full max-w-3xl rounded-2xl border bg-background p-4 shadow-lg dark:border-slate-800 dark:bg-slate-950'>
        <QaFileNameBadge file="src/components/modal/HistorialViewModal.tsx" />
        <div className='relative rounded-xl border bg-background p-6 dark:border-slate-800 dark:bg-slate-950'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h3 className='text-lg font-semibold'>{tx('Detalle de registro', 'Record details')}</h3>
              <div className='mt-1 text-sm'>
                {formatDate(
                  item.fecha_ultimo_control ?? item.created_at ?? item.fecha
                )}
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='rounded-md border px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-900'
            >
              {tx('Cerrar', 'Close')}
            </button>
          </div>
          <div className='grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3'>
            <div>
              <div className='text-xs'>{tx('Peso', 'Weight')}</div>
              <div className='text-sm'>
                {item.peso ? `${item.peso} kg` : '—'}
              </div>
            </div>
            <div>
              <div className='text-xs'>{tx('Altura', 'Height')}</div>
              <div className='text-sm'>
                {item.altura ? `${item.altura} cm` : '—'}
              </div>
            </div>
            <div>
              <div className='text-xs'>IMC</div>
              <div className='text-sm'>{item.imc ?? '—'}</div>
            </div>
            <div>
              <div className='text-xs'>{tx('Grupo sanguíneo', 'Blood type')}</div>
              <div className='text-sm'>{item.grupo_sanguineo ?? '—'}</div>
            </div>
            <div>
              <div className='text-xs'>{tx('Presión arterial', 'Blood pressure')}</div>
              <div className='text-sm'>{item.presion_arterial ?? '—'}</div>
            </div>
            <div>
              <div className='text-xs'>{tx('Frecuencia cardíaca', 'Heart rate')}</div>
              <div className='text-sm'>
                {item.frecuencia_cardiaca
                  ? `${item.frecuencia_cardiaca} bpm`
                  : '—'}
              </div>
            </div>
          </div>
          <div className='mt-4'>
            <div className='text-xs'>{tx('Alergias', 'Allergies')}</div>
            <div className='mt-1 text-sm'>{item.alergias ?? '—'}</div>
          </div>
          <div className='mt-3'>
            <div className='text-xs'>{tx('Medicación', 'Medication')}</div>
            <div className='mt-1 text-sm'>{item.medicacion ?? '—'}</div>
          </div>
          <div className='mt-3'>
            <div className='text-xs'>{tx('Observaciones', 'Notes')}</div>
            <div className='mt-1 text-sm'>
              {item.observaciones_medico ??
                item.observaciones_entrenador ??
                '—'}
            </div>
          </div>
          <div className='mt-4'>
            <div className='text-xs'>{tx('Historial médico completo', 'Full medical history')}</div>
            <div className='mt-1 text-sm'>
              <div>
                <strong>{tx('Lesiones', 'Injuries')}:</strong> {item.lesiones_previas ?? '—'}
              </div>
              <div className='mt-1'>
                <strong>{tx('Enfermedades crónicas', 'Chronic diseases')}:</strong>{' '}
                {item.enfermedades_cronicas ?? '—'}
              </div>
              <div className='mt-1'>
                <strong>{tx('Cirugías previas', 'Previous surgeries')}:</strong>{' '}
                {item.cirugias_previas ?? '—'}
              </div>
            </div>
          </div>
          {(item.aprobacion_medica !== undefined ||
            item.archivo_aprobacion) && (
            <div className='mt-4'>
              <div className='text-xs'>{tx('Aprobación médica', 'Medical approval')}</div>
              <div className='mt-1 text-sm'>
                {item.aprobacion_medica ? tx('Sí', 'Yes') : tx('No', 'No')}
              </div>
              <div className='mt-2'>{renderFiles(item.archivo_aprobacion)}</div>
            </div>
          )}
          {item.archivos_adjuntos && (
            <div className='mt-4'>
              <div className='text-xs'>{tx('Archivos adjuntos', 'Attachments')}</div>
              <div className='mt-1'>{renderFiles(item.archivos_adjuntos)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
