'use client';
import React, { useEffect, useState } from 'react';
import {
  getFichaMedicaHistorial,
  getSocioByUsuarioId,
} from '../../services/apiClient';
import { useAuthStore } from '../../stores/authStore';
import HistorialViewModal from '../modal/HistorialViewModal';

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
}: {
  socioId?: number | string;
  active: boolean;
}) {
  const authUser = useAuthStore((s) => s.user);
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
          setHistError('Socio no especificado');
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
          setHistError('No se pudo cargar historial');
        }
      } catch {
        if (cancelled) return;
        setHistorial([]);
        setHistError('No se pudo cargar historial');
      } finally {
        if (cancelled) return;
        setHistLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, socioId, authUser?.id, histPage]);

  const formatDate = (v: unknown) => {
    if (!v) return '—';
    try {
      const d = new Date(String(v));
      return d.toLocaleDateString('es-AR');
    } catch {
      return String(v);
    }
  };

  return (
    <div className='w-full p-4 rounded-lg page-bg'>
      <h3 className='text-lg font-semibold'>Historial</h3>
      <p className='mt-2 text-sm'>Registros anteriores ordenados por fecha.</p>
      {histLoading ? (
        <div className='mt-4 text-sm'>Cargando historial...</div>
      ) : histError ? (
        <div className='mt-4 text-sm'>{histError}</div>
      ) : historial.length === 0 ? (
        <div className='mt-4 text-sm'>No se encontraron registros</div>
      ) : (
        <>
          <ul className='w-full mt-4 space-y-3'>
            {historial.map((item: HistItem, idx: number) => (
              <li key={idx} className='w-full p-3 rounded-md panel'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm'>
                    {formatDate(
                      item.fecha_ultimo_control ?? item.created_at ?? item.fecha
                    )}
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-sm'>
                      {item.usuario_id ? `Usuario ${item.usuario_id}` : ''}
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        setSelected(item);
                        setModalOpen(true);
                      }}
                      className='px-3 py-1 text-sm border rounded-md'
                    >
                      Ver
                    </button>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-2 mt-2 sm:grid-cols-3'>
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
                    <div className='text-xs'>Presión</div>
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
                  })()}
                </div>
              </li>
            ))}
          </ul>
          <div className='flex items-center justify-between w-full mt-4'>
            <div className='text-sm'>
              {histMeta
                ? `Página ${histMeta.page} de ${histMeta.totalPages} — ${histMeta.total} registros`
                : ''}
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                disabled={!histMeta || histMeta.page <= 1}
                onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                className='px-3 py-1 text-sm border rounded-md disabled:opacity-50'
              >
                Anterior
              </button>
              <button
                type='button'
                disabled={
                  !histMeta || histMeta.page >= (histMeta.totalPages || 1)
                }
                onClick={() => setHistPage((p) => p + 1)}
                className='px-3 py-1 text-sm border rounded-md disabled:opacity-50'
              >
                Siguiente
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
