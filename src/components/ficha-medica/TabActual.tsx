'use client';
import React, { useEffect, useState } from 'react';
import {
  getFichaMedicaActual,
  getSocioByUsuarioId,
} from '../../services/apiClient';
import type { FichaMedica } from '../../interfaces/fichaMedica.interface';
import { useAuthStore } from '../../stores/authStore';

export default function TabActual({
  socioId,
  active,
}: {
  socioId?: number | string;
  active: boolean;
}) {
  const authUser = useAuthStore((s) => s.user);
  const [ficha, setFicha] = useState<FichaMedica | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setError(null);
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
          setFicha(null);
          setError('Socio no especificado');
          return;
        }
        const res = await getFichaMedicaActual(targetId);
        if (cancelled) return;
        if (res.ok) {
          const raw = res.data;
          const normalized = Array.isArray(raw)
            ? raw.length
              ? raw[raw.length - 1]
              : null
            : raw;
          setFicha((normalized as FichaMedica) ?? null);
        } else {
          setFicha(null);
          setError('No se pudo cargar la ficha');
        }
      } catch {
        if (cancelled) return;
        setFicha(null);
        setError('No se pudo cargar la ficha');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, socioId, authUser?.id]);

  const formatDate = (v: unknown) => {
    if (!v) return '—';
    try {
      const d = new Date(String(v));
      return d.toLocaleDateString('es-AR');
    } catch {
      return String(v);
    }
  };

  const fichaTieneDatos = (f: FichaMedica | null) => {
    if (!f) return false;
    const keys: (keyof FichaMedica)[] = [
      'peso',
      'altura',
      'imc',
      'presion_arterial',
      'frecuencia_cardiaca',
      'fecha_ultimo_control',
      'proxima_revision',
      'observaciones_entrenador',
      'observaciones_medico',
    ];
    const obj = f as Partial<Record<keyof FichaMedica, unknown>>;
    return keys.some((k) => {
      const v = obj[k];
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined && String(v).trim() !== '';
    });
  };

  const renderFileLinks = (val: string | string[] | null | undefined) => {
    if (!val) return null;
    if (Array.isArray(val) && val.length === 0) return null;
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
    <div className='w-full p-4 rounded-lg page-bg'>
      <h3 className='text-lg font-semibold'>Ficha actual</h3>
      <p className='mt-2 text-sm'>
        Aquí se muestran los datos médicos vigentes y valores recientes.
      </p>
      {loading ? (
        <div className='mt-4 text-sm'>Cargando...</div>
      ) : error ? (
        <div className='mt-4 text-sm'>{error}</div>
      ) : !fichaTieneDatos(ficha) ? (
        <div className='mt-4 text-sm'>Usted no tiene ficha medica</div>
      ) : (
        <div className='grid w-full grid-cols-1 gap-3 mt-4 sm:grid-cols-3'>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Peso</div>
            <div className='mt-1 text-xl font-semibold'>
              {ficha?.peso ? `${ficha.peso} kg` : '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Altura</div>
            <div className='mt-1 text-xl font-semibold'>
              {ficha?.altura ? `${ficha.altura} cm` : '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>IMC</div>
            <div className='mt-1 text-xl font-semibold'>
              {ficha?.imc ?? '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Grupo sanguíneo</div>
            <div className='mt-1 text-lg font-medium'>
              {ficha?.grupo_sanguineo ?? '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Presión</div>
            <div className='mt-1 text-lg font-medium'>
              {ficha?.presion_arterial ?? '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Frecuencia cardíaca</div>
            <div className='mt-1 text-lg font-medium'>
              {ficha?.frecuencia_cardiaca
                ? `${ficha.frecuencia_cardiaca} bpm`
                : '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Alergias</div>
            <div className='mt-1 text-sm'>{ficha?.alergias ?? '—'}</div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Medicación</div>
            <div className='mt-1 text-sm'>{ficha?.medicacion ?? '—'}</div>
          </div>
          <div className='col-span-1 p-3 rounded-md sm:col-span-2 panel'>
            <div className='text-xs'>Observaciones</div>
            <div className='mt-1 text-sm'>
              {ficha?.observaciones_medico ??
                ficha?.observaciones_entrenador ??
                '—'}
            </div>
          </div>
          <div className='p-3 rounded-md panel'>
            <div className='text-xs'>Último control</div>
            <div className='mt-1 text-sm'>
              {formatDate(ficha?.fecha_ultimo_control)}
            </div>
            <div className='mt-2 text-xs'>Próxima revisión</div>
            <div className='mt-1 text-sm'>
              {formatDate(ficha?.proxima_revision)}
            </div>
          </div>
          <div className='col-span-1 p-3 rounded-md sm:col-span-3 panel'>
            <div className='text-xs'>Historial médico completo</div>
            <div className='mt-1 text-sm'>
              <div>
                <strong>Lesiones:</strong> {ficha?.lesiones_previas ?? '—'}
              </div>
              <div className='mt-1'>
                <strong>Enfermedades crónicas:</strong>{' '}
                {ficha?.enfermedades_cronicas ?? '—'}
              </div>
              <div className='mt-1'>
                <strong>Cirugías previas:</strong>{' '}
                {ficha?.cirugias_previas ?? '—'}
              </div>
            </div>
          </div>
          {ficha?.archivo_aprobacion ? (
            <div className='col-span-1 p-3 rounded-md sm:col-span-3 panel'>
              <div className='text-xs'>Aprobación médica</div>
              <div className='mt-1 text-sm'>
                {ficha.aprobacion_medica ? 'Sí' : 'No'}
              </div>
              <div className='mt-2'>
                {renderFileLinks(ficha.archivo_aprobacion)}
              </div>
            </div>
          ) : null}
          {(ficha as unknown as { archivos_adjuntos?: string | string[] })
            ?.archivos_adjuntos ? (
            <div className='col-span-1 p-3 rounded-md sm:col-span-3 panel'>
              <div className='text-xs'>Archivos adjuntos</div>
              <div className='mt-1'>
                {renderFileLinks(
                  (
                    ficha as unknown as {
                      archivos_adjuntos?: string | string[];
                    }
                  ).archivos_adjuntos
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
