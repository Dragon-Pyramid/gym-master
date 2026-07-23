'use client';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getFichaMedicaHistorial,
  getSocioByUsuarioId,
} from '../../services/apiClient';
import { useAuthStore } from '../../stores/authStore';
import HistorialViewModal from '../modal/HistorialViewModal';
import { formatFrontendDate } from '@/utils/dateFormat';
import { ExternalLink, FileText, History } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

type HistItem = {
  fecha_ultimo_control?: string;
  created_at?: string;
  fecha?: string;
  usuario_id?: number | string;
  peso?: number;
  altura?: number;
  presion_arterial?: string;
  observaciones_medico?: string;
  observaciones_entrenador?: string;
  archivos_adjuntos?: string | string[];
  archivo_aprobacion?: string | string[];
};

export default function TabHistorial({
  socioId,
  active,
  socioLabel,
  isAdminReview = false,
}: {
  socioId?: number | string;
  active: boolean;
  socioLabel?: string;
  isAdminReview?: boolean;
}) {
  const authUser = useAuthStore((s) => s.user);
  const { locale } = useI18n();
  const tx = useCallback((es: string, en: string) => (locale === 'en' ? en : es), [locale]);
  const [historial, setHistorial] = useState<HistItem[]>([]);
  const [histPage, setHistPage] = useState<number>(1);
  const [histLoading, setHistLoading] = useState<boolean>(false);
  const [histError, setHistError] = useState<string | null>(null);
  const [histMeta, setHistMeta] = useState<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [selected, setSelected] = useState<HistItem | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!active) return;
    setHistLoading(true);
    setHistError(null);
    let cancelled = false;
    (async () => {
      try {
        let targetId: number | string | null | undefined = socioId;
        if (!targetId && authUser?.id) {
          const posible = await getSocioByUsuarioId(authUser.id);
          if (posible && posible.id_socio) {
            targetId = posible.id_socio;
          }
        }
        if (!targetId) {
          if (cancelled) return;
          setHistorial([]);
          setHistError(tx('Socio no especificado', 'Member not specified'));
          return;
        }
        const res = await getFichaMedicaHistorial(targetId, histPage);
        if (cancelled) return;
        if (res.ok) {
          const payload = res.data || {};
          const list: HistItem[] = Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload)
            ? payload
            : [];
          setHistorial(list);
          setHistMeta(payload.meta || null);
        } else {
          setHistorial([]);
          setHistError(tx('No se pudo cargar historial', 'Could not load history'));
        }
      } catch {
        if (cancelled) return;
        setHistorial([]);
        setHistError(tx('No se pudo cargar historial', 'Could not load history'));
      } finally {
        if (cancelled) return;
        setHistLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, socioId, authUser?.id, histPage, tx]);

  const formatDate = (v: unknown) => {
    if (!v) return '—';
    try {
      return formatFrontendDate(String(v), locale === 'en' ? 'en-US' : 'es-AR');
    } catch {
      return String(v);
    }
  };

  return (
    <div className='w-full rounded-2xl border bg-background p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 md:p-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <div className='inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'>
            <History className='h-3.5 w-3.5' />
            {isAdminReview ? tx('Auditoría admin', 'Admin audit') : tx('Historial personal', 'Personal history')}
          </div>
          <h3 className='mt-3 text-xl font-black'>{tx('Historial de fichas', 'Record history')}</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            {tx('Registros anteriores ordenados por fecha', 'Previous records sorted by date')}{socioLabel ? ` ${tx('para', 'for')} ${socioLabel}` : ''}.
          </p>
        </div>
      </div>
      {histLoading ? (
        <div className='mt-4 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground'>{tx('Cargando historial...', 'Loading history...')}</div>
      ) : histError ? (
        <div className='mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300'>{histError}</div>
      ) : historial.length === 0 ? (
        <div className='mt-4 rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40'>{tx('No se encontraron registros anteriores para este socio.', 'No previous records were found for this member.')}</div>
      ) : (
        <>
          <ul className='mt-4 grid w-full gap-3'>
            {historial.map((item: HistItem, idx: number) => (
              <li key={idx} className='w-full rounded-2xl border bg-muted/20 p-4 dark:border-slate-800 dark:bg-slate-900/60'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-sm'>
                    {formatDate(
                      item.fecha_ultimo_control ?? item.created_at ?? item.fecha
                    )}
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-sm'>
                      {item.usuario_id ? `${tx('Usuario', 'User')} ${item.usuario_id}` : ''}
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        setSelected(item);
                        setModalOpen(true);
                      }}
                      className='rounded-xl border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted dark:border-slate-700 dark:bg-slate-950'
                    >
                      {tx('Ver', 'View')}
                    </button>
                  </div>
                </div>
                <div className='mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3'>
                  <div>
                    <div className='text-xs text-muted-foreground'>{tx('Peso', 'Weight')}</div>
                    <div className='text-sm'>
                      {item.peso ? `${item.peso} kg` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground'>{tx('Altura', 'Height')}</div>
                    <div className='text-sm'>
                      {item.altura ? `${item.altura} cm` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground'>{tx('Presión', 'Blood pressure')}</div>
                    <div className='text-sm'>
                      {item.presion_arterial ?? '—'}
                    </div>
                  </div>
                </div>
                <div className='mt-2 text-sm'>
                  {item.observaciones_medico ??
                    item.observaciones_entrenador ??
                    '—'}
                </div>
                <div className='mt-2'>
                  {(() => {
                    const val =
                      item.archivos_adjuntos ?? item.archivo_aprobacion;
                    if (!val) return null;
                    if (Array.isArray(val)) {
                      return val.map((u: string, i: number) => (
                        <a
                          key={i}
                          href={u}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='mr-2 mt-2 inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted dark:border-slate-700 dark:bg-slate-950'
                        >
                          <FileText className='h-4 w-4 text-blue-600' /> {tx('Ver archivo', 'View file')} {i + 1} <ExternalLink className='h-3.5 w-3.5' />
                        </a>
                      ));
                    }
                    return (
                      <a
                        href={String(val)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-2 inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted dark:border-slate-700 dark:bg-slate-950'
                      >
                        <FileText className='h-4 w-4 text-blue-600' /> {tx('Ver archivo', 'View file')} <ExternalLink className='h-3.5 w-3.5' />
                      </a>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ul>
          <div className='mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-sm'>
              {histMeta
                ? `${tx('Página', 'Page')} ${histMeta.page} ${tx('de', 'of')} ${histMeta.totalPages} — ${histMeta.total} ${tx('registros', 'records')}`
                : ''}
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={!histMeta || histMeta.page <= 1}
                onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                className='rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50'
              >
                {tx('Anterior', 'Previous')}
              </button>
              <button
                type='button'
                disabled={
                  !histMeta || histMeta.page >= (histMeta.totalPages || 1)
                }
                onClick={() => setHistPage((p) => p + 1)}
                className='rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50'
              >
                {tx('Siguiente', 'Next')}
              </button>
            </div>
          </div>
        </>
      )}
      <HistorialViewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selected}
      />
    </div>
  );
}
