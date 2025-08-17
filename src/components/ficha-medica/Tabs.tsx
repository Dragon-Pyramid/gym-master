'use client';
import React, { useEffect, useState } from 'react';
import { getFichaMedicaActual } from '../../services/apiClient';

type TabKey = 'actual' | 'nueva' | 'historial';

export default function Tabs({ socioId }: { socioId?: number | string }) {
  const [active, setActive] = useState<TabKey>('actual');
  const [ficha, setFicha] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'actual',
      label: 'Actual',
      icon: (
        <svg
          className='w-4 h-4'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path
            d='M12 2v6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M12 22v-6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M2 12h6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M22 12h-6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      key: 'nueva',
      label: 'Nueva',
      icon: (
        <svg
          className='w-4 h-4'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path
            d='M12 5v14'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M5 12h14'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      key: 'historial',
      label: 'Historial',
      icon: (
        <svg
          className='w-4 h-4'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path
            d='M21 12a9 9 0 11-3-6.7'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M12 7v5l3 3'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (active !== 'actual') return;
    if (!socioId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getFichaMedicaActual(socioId)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          const raw = res.data;
          const normalized = Array.isArray(raw)
            ? raw.length
              ? raw[0]
              : null
            : raw;
          setFicha(normalized);
        } else {
          setFicha(null);
          setError('No se pudo cargar la ficha');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFicha(null);
        setError('No se pudo cargar la ficha');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, socioId]);

  const formatDate = (v: any) => {
    if (!v) return '—';
    try {
      const d = new Date(v);
      return d.toLocaleDateString('es-AR');
    } catch {
      return String(v);
    }
  };

  const fichaTieneDatos = (f: any) => {
    if (!f) return false;
    const keys = [
      'peso',
      'altura',
      'imc',
      'imc_valor',
      'presion',
      'presion_arterial',
      'frecuencia_cardiaca',
      'fc',
      'fecha_control',
      'proxima_revision',
      'observaciones',
      'flags',
    ];
    return keys.some((k) => {
      const v = f[k];
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined && String(v).trim() !== '';
    });
  };

  return (
    <div className='w-full max-w-4xl mx-auto'>
      <div className='overflow-hidden border shadow-sm page-bg dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl'>
        <div className='px-4 py-3'>
          <div className='flex items-center'>
            <nav
              className='flex gap-2'
              role='tablist'
              aria-label='Pestañas ficha médica'
            >
              {tabs.map((t) => {
                const isActive = t.key === active;
                return (
                  <button
                    key={t.key}
                    role='tab'
                    aria-selected={isActive}
                    aria-controls={`panel-${t.key}`}
                    onClick={() => setActive(t.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors focus:outline-none ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`opacity-90 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 dark:text-slate-300'
                      }`}
                    >
                      {t.icon}
                    </span>
                    <span className='text-sm font-medium'>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        <div className='px-4 py-6 border-t border-slate-100 dark:border-slate-800'>
          <div id='panel-actual' role='tabpanel' hidden={active !== 'actual'}>
            <div className='p-4 rounded-lg page-bg'>
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                Ficha actual
              </h3>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                Aquí se muestran los datos médicos vigentes y valores recientes.
              </p>
              {loading ? (
                <div className='mt-4 text-sm text-slate-500'>Cargando...</div>
              ) : error ? (
                <div className='mt-4 text-sm text-red-600'>{error}</div>
              ) : !fichaTieneDatos(ficha) ? (
                <div className='mt-4 text-sm text-slate-700 dark:text-slate-300'>
                  Usted no tiene ficha medica
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-3 mt-4 sm:grid-cols-3'>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Peso</div>
                    <div className='mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100'>
                      {ficha?.peso ? `${ficha.peso} kg` : '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Altura</div>
                    <div className='mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100'>
                      {ficha?.altura ? `${ficha.altura} m` : '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>IMC</div>
                    <div className='mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100'>
                      {ficha?.imc ?? ficha?.imc_valor ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Presión</div>
                    <div className='mt-1 text-lg font-medium text-slate-800 dark:text-slate-100'>
                      {ficha?.presion ?? ficha?.presion_arterial ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>
                      Frecuencia cardíaca
                    </div>
                    <div className='mt-1 text-lg font-medium text-slate-800 dark:text-slate-100'>
                      {ficha?.fc ?? ficha?.frecuencia_cardiaca
                        ? `${ficha.fc ?? ficha.frecuencia_cardiaca} bpm`
                        : '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Flags</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {Array.isArray(ficha?.flags)
                        ? ficha.flags.join(' · ')
                        : ficha?.flags ?? '—'}
                    </div>
                  </div>
                  <div className='col-span-1 p-3 bg-white border rounded-md sm:col-span-2 dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Observaciones</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {ficha?.observaciones ??
                        ficha?.observaciones_medico ??
                        ficha?.observaciones_entrenador ??
                        '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Último control</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {formatDate(
                        ficha?.fecha_control ?? ficha?.fecha_ultimo_control
                      )}
                    </div>
                    <div className='mt-2 text-xs text-slate-400'>
                      Próxima revisión
                    </div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {formatDate(ficha?.proxima_revision)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div id='panel-nueva' role='tabpanel' hidden={active !== 'nueva'}>
            <div className='p-4 rounded-lg page-bg'>
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                Nueva ficha
              </h3>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                Registra una nueva entrada médica.
              </p>
              <form className='grid grid-cols-1 gap-3 mt-4'>
                <input
                  className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  placeholder='Descripción breve'
                />
                <div className='grid grid-cols-2 gap-3'>
                  <input
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    placeholder='Peso (kg)'
                  />
                  <input
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    placeholder='Altura (m)'
                  />
                </div>
                <div className='flex justify-end'>
                  <button
                    type='button'
                    onClick={() => setActive('historial')}
                    className='px-4 py-2 text-white bg-indigo-600 rounded-md shadow-sm'
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div
            id='panel-historial'
            role='tabpanel'
            hidden={active !== 'historial'}
          >
            <div className='p-4 rounded-lg page-bg'>
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                Historial
              </h3>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                Registros anteriores ordenados por fecha.
              </p>
              <ul className='mt-4 space-y-3'>
                <li className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='text-sm font-medium text-slate-800 dark:text-slate-100'>
                        Control 12 ago 2025
                      </div>
                      <div className='text-xs text-slate-500 dark:text-slate-400'>
                        Peso 72 kg · Altura 1.78 m
                      </div>
                    </div>
                    <div className='text-xs text-slate-400'>Ver</div>
                  </div>
                </li>
                <li className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='text-sm font-medium text-slate-800 dark:text-slate-100'>
                        Control 05 jun 2025
                      </div>
                      <div className='text-xs text-slate-500 dark:text-slate-400'>
                        Peso 73 kg · Altura 1.78 m
                      </div>
                    </div>
                    <div className='text-xs text-slate-400'>Ver</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
