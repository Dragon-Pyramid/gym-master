'use client';
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  getFichaMedicaActual,
  crearFichaMedica,
  getSocioByUsuarioId,
  getFichaMedicaHistorial,
} from '../../services/apiClient';
import type { FichaMedica } from '../../interfaces/fichaMedica.interface';
import { useAuthStore } from '../../stores/authStore';

type TabKey = 'actual' | 'nueva' | 'historial';

type FormValues = {
  altura: number | null;
  peso: number | null;
  imc?: number | null;
  grupo_sanguineo: string;
  presion_arterial: string;
  frecuencia_cardiaca: number | null;
  alergias?: string | null;
  medicacion?: string | null;
  lesiones_previas?: string | null;
  enfermedades_cronicas?: string | null;
  cirugias_previas?: string | null;
  problemas_cardiacos: boolean;
  problemas_respiratorios: boolean;
  aprobacion_medica: boolean;
  archivo_aprobacion?: FileList | null;
  fecha_ultimo_control?: string | null;
  observaciones_entrenador?: string | null;
  observaciones_medico?: string | null;
  archivos_adjuntos?: FileList | null;
  proxima_revision?: string | null;
};

export default function Tabs({ socioId }: { socioId?: number | string }) {
  const authUser = useAuthStore((s) => s.user);
  const [active, setActive] = useState<TabKey>('actual');
  const [ficha, setFicha] = useState<FichaMedica | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [historial, setHistorial] = useState<any[]>([]);
  const [histPage, setHistPage] = useState<number>(1);
  const [histLoading, setHistLoading] = useState<boolean>(false);
  const [histError, setHistError] = useState<string | null>(null);
  const [histMeta, setHistMeta] = useState<{
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  } | null>(null);

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
              ? raw[0]
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

  useEffect(() => {
    if (active !== 'historial') return;
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
          const list = Array.isArray(payload.data)
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
      'flags' as keyof FichaMedica,
    ];
    return keys.some((k) => {
      const v = (f as any)[k];
      if (Array.isArray(v)) return v.length > 0;
      return v !== null && v !== undefined && String(v).trim() !== '';
    });
  };

  const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  const fileValidation = (value?: FileList | null) => {
    if (!value) return true;
    if (value.length === 0) return true;
    for (let i = 0; i < value.length; i++) {
      const f = value.item(i);
      if (!f) return false;
      if (!FILE_TYPES.includes(f.type)) return false;
    }
    return true;
  };

  const schema = yup.object().shape({
    altura: yup
      .number()
      .typeError('Altura debe ser número')
      .positive('Altura debe ser mayor que 0')
      .required('Altura obligatoria'),
    peso: yup
      .number()
      .typeError('Peso debe ser número')
      .positive('Peso debe ser mayor que 0')
      .required('Peso obligatorio'),
    imc: yup.number().nullable(),
    grupo_sanguineo: yup.string().required('Grupo sanguíneo obligatorio'),
    presion_arterial: yup
      .string()
      .matches(/^\d{2,3}\/\d{2,3}$/, 'Formato 120/80')
      .required('Presión arterial obligatoria'),
    frecuencia_cardiaca: yup
      .number()
      .typeError('Valor numérico')
      .positive('Debe ser mayor que 0')
      .integer('Entero')
      .required('Frecuencia cardíaca obligatoria'),
    alergias: yup.string().nullable(),
    medicacion: yup.string().nullable(),
    lesiones_previas: yup.string().nullable(),
    enfermedades_cronicas: yup.string().nullable(),
    cirugias_previas: yup.string().nullable(),
    problemas_cardiacos: yup.boolean().required('Debe indicar si/no'),
    problemas_respiratorios: yup.boolean().required('Debe indicar si/no'),
    aprobacion_medica: yup.boolean().required('Debe indicar si/no'),
    archivo_aprobacion: yup
      .mixed()
      .test(
        'requiredIfApproved',
        'Archivo requerido cuando aprobación es Sí',
        function (value) {
          const { aprobacion_medica } = this.parent as {
            aprobacion_medica?: boolean;
          };
          if (aprobacion_medica) {
            if (!value) return false;
            if ((value as FileList).length === 0) return false;
          }
          return true;
        }
      )
      .test('fileFormat', 'Formato inválido', function (value) {
        const { aprobacion_medica } = this.parent as {
          aprobacion_medica?: boolean;
        };
        if (!aprobacion_medica) return true;
        if (!value) return false;
        return fileValidation(value as FileList);
      }),
    fecha_ultimo_control: yup.date().nullable(),
    observaciones_entrenador: yup.string().nullable(),
    observaciones_medico: yup.string().nullable(),
    archivos_adjuntos: yup
      .mixed()
      .test(
        'fileFormatMultiple',
        'Algunos archivos tienen formato inválido',
        function (value) {
          if (!value) return true;
          if ((value as FileList).length === 0) return true;
          return fileValidation(value as FileList);
        }
      ),
    proxima_revision: yup.date().nullable(),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      altura: null,
      peso: null,
      imc: null,
      grupo_sanguineo: '',
      presion_arterial: '',
      frecuencia_cardiaca: null,
      alergias: null,
      medicacion: null,
      lesiones_previas: null,
      enfermedades_cronicas: null,
      cirugias_previas: null,
      problemas_cardiacos: false,
      problemas_respiratorios: false,
      aprobacion_medica: false,
      archivo_aprobacion: null,
      fecha_ultimo_control: null,
      observaciones_entrenador: null,
      observaciones_medico: null,
      archivos_adjuntos: null,
      proxima_revision: null,
    },
    validationSchema: schema,
    onSubmit: async (values, helpers) => {
      if (!socioId) return;
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        altura: values.altura,
        peso: values.peso,
        imc: values.imc ?? null,
        grupo_sanguineo: values.grupo_sanguineo,
        presion_arterial: values.presion_arterial,
        frecuencia_cardiaca: values.frecuencia_cardiaca,
        alergias: values.alergias ?? null,
        medicacion: values.medicacion ?? null,
        lesiones_previas: values.lesiones_previas ?? null,
        enfermedades_cronicas: values.enfermedades_cronicas ?? null,
        cirugias_previas: values.cirugias_previas ?? null,
        problemas_cardiacos: values.problemas_cardiacos,
        problemas_respiratorios: values.problemas_respiratorios,
        aprobacion_medica: values.aprobacion_medica,
        fecha_ultimo_control: values.fecha_ultimo_control ?? null,
        observaciones_entrenador: values.observaciones_entrenador ?? null,
        observaciones_medico: values.observaciones_medico ?? null,
        proxima_revision: values.proxima_revision ?? null,
        usuario_id: authUser?.id ?? null,
      };

      const files: (File | { fieldName?: string; file: File })[] = [];

      if (values.archivo_aprobacion && values.archivo_aprobacion.length > 0) {
        const f = values.archivo_aprobacion.item(0);
        if (f) files.push({ fieldName: 'archivo_aprobacion', file: f });
      }

      if (values.archivos_adjuntos && values.archivos_adjuntos.length > 0) {
        Array.from(values.archivos_adjuntos).forEach((f) => {
          files.push(f);
        });
      }

      try {
        const res = await crearFichaMedica(socioId, payload, files);
        if (res.ok) {
          helpers.resetForm();
          setActive('actual');
        } else {
          alert(res.data?.message || 'Error al guardar ficha');
        }
      } catch {
        alert('Error al guardar ficha');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const peso = formik.values.peso;
    const altura = formik.values.altura;
    if (!peso || !altura) {
      if (formik.values.imc !== null) formik.setFieldValue('imc', null, false);
      return;
    }
    const hMeters = Number(altura) / 100;
    if (!hMeters || hMeters <= 0) {
      if (formik.values.imc !== null) formik.setFieldValue('imc', null, false);
      return;
    }
    const imcVal = Number((Number(peso) / (hMeters * hMeters)).toFixed(2));
    if (!Number.isNaN(imcVal) && Number.isFinite(imcVal)) {
      if (formik.values.imc !== imcVal)
        formik.setFieldValue('imc', imcVal, false);
    } else {
      if (formik.values.imc !== null) formik.setFieldValue('imc', null, false);
    }
  }, [formik.values.peso, formik.values.altura]);

  const renderFileLinks = (val: any) => {
    if (!val) return null;
    if (Array.isArray(val) && val.length === 0) return null;
    if (Array.isArray(val)) {
      return val.map((u: string, i: number) => (
        <a
          key={i}
          href={u}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-block px-2 py-1 mt-1 mr-2 text-sm text-indigo-700 rounded-md bg-indigo-50'
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
        className='inline-block px-2 py-1 mt-1 text-sm text-indigo-700 rounded-md bg-indigo-50'
      >
        Ver archivo
      </a>
    );
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
                      {ficha?.altura ? `${ficha.altura} cm` : '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>IMC</div>
                    <div className='mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100'>
                      {ficha?.imc ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>
                      Grupo sanguíneo
                    </div>
                    <div className='mt-1 text-lg font-medium text-slate-800 dark:text-slate-100'>
                      {ficha?.grupo_sanguineo ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Presión</div>
                    <div className='mt-1 text-lg font-medium text-slate-800 dark:text-slate-100'>
                      {ficha?.presion_arterial ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>
                      Frecuencia cardíaca
                    </div>
                    <div className='mt-1 text-lg font-medium text-slate-800 dark:text-slate-100'>
                      {ficha?.frecuencia_cardiaca
                        ? `${ficha.frecuencia_cardiaca} bpm`
                        : '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Alergias</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {ficha?.alergias ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Medicación</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {ficha?.medicacion ?? '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Flags</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {(ficha as any)?.flags
                        ? (ficha as any).flags.join(' · ')
                        : '—'}
                    </div>
                  </div>
                  <div className='col-span-1 p-3 bg-white border rounded-md sm:col-span-2 dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Observaciones</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {ficha?.observaciones_medico ??
                        ficha?.observaciones_entrenador ??
                        '—'}
                    </div>
                  </div>
                  <div className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>Último control</div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {formatDate(ficha?.fecha_ultimo_control)}
                    </div>
                    <div className='mt-2 text-xs text-slate-400'>
                      Próxima revisión
                    </div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      {formatDate(ficha?.proxima_revision)}
                    </div>
                  </div>
                  <div className='col-span-1 p-3 bg-white border rounded-md sm:col-span-3 dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                    <div className='text-xs text-slate-400'>
                      Historial médico completo
                    </div>
                    <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                      <div>
                        <strong>Lesiones:</strong>{' '}
                        {ficha?.lesiones_previas ?? '—'}
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
                    <div className='col-span-1 p-3 bg-white border rounded-md sm:col-span-3 dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                      <div className='text-xs text-slate-400'>
                        Aprobación médica
                      </div>
                      <div className='mt-1 text-sm text-slate-700 dark:text-slate-300'>
                        {ficha.aprobacion_medica ? 'Sí' : 'No'}
                      </div>
                      <div className='mt-2'>
                        {renderFileLinks(ficha.archivo_aprobacion)}
                      </div>
                    </div>
                  ) : null}
                  {(ficha as any)?.archivos_adjuntos ? (
                    <div className='col-span-1 p-3 bg-white border rounded-md sm:col-span-3 dark:bg-slate-900 border-slate-100 dark:border-slate-800'>
                      <div className='text-xs text-slate-400'>
                        Archivos adjuntos
                      </div>
                      <div className='mt-1'>
                        {renderFileLinks((ficha as any).archivos_adjuntos)}
                      </div>
                    </div>
                  ) : null}
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
              <form
                onSubmit={formik.handleSubmit}
                className='grid grid-cols-1 gap-3 mt-4'
              >
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='text-xs text-slate-500'>
                      Altura (cm)
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      name='altura'
                      value={formik.values.altura ?? ''}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'altura',
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      onBlur={formik.handleBlur}
                      className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    />
                    {formik.touched.altura && formik.errors.altura && (
                      <div className='mt-1 text-xs text-red-600'>
                        {formik.errors.altura as string}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className='text-xs text-slate-500'>Peso (kg)</label>
                    <input
                      type='number'
                      step='0.1'
                      name='peso'
                      value={formik.values.peso ?? ''}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'peso',
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      onBlur={formik.handleBlur}
                      className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    />
                    {formik.touched.peso && formik.errors.peso && (
                      <div className='mt-1 text-xs text-red-600'>
                        {formik.errors.peso as string}
                      </div>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='text-xs text-slate-500'>IMC</label>
                    <input
                      type='number'
                      step='0.01'
                      name='imc'
                      value={formik.values.imc ?? ''}
                      readOnly
                      className='w-full px-3 py-2 border rounded-md bg-slate-50 border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                    />
                  </div>
                  <div>
                    <label className='text-xs text-slate-500'>
                      Grupo sanguíneo
                    </label>
                    <input
                      type='text'
                      name='grupo_sanguineo'
                      value={formik.values.grupo_sanguineo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    />
                    {formik.touched.grupo_sanguineo &&
                      formik.errors.grupo_sanguineo && (
                        <div className='mt-1 text-xs text-red-600'>
                          {formik.errors.grupo_sanguineo as string}
                        </div>
                      )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='text-xs text-slate-500'>
                      Presión arterial
                    </label>
                    <input
                      type='text'
                      name='presion_arterial'
                      placeholder='120/80'
                      value={formik.values.presion_arterial}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    />
                    {formik.touched.presion_arterial &&
                      formik.errors.presion_arterial && (
                        <div className='mt-1 text-xs text-red-600'>
                          {formik.errors.presion_arterial as string}
                        </div>
                      )}
                  </div>
                  <div>
                    <label className='text-xs text-slate-500'>
                      Frecuencia cardiaca (bpm)
                    </label>
                    <input
                      type='number'
                      name='frecuencia_cardiaca'
                      value={formik.values.frecuencia_cardiaca ?? ''}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'frecuencia_cardiaca',
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      onBlur={formik.handleBlur}
                      className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                    />
                    {formik.touched.frecuencia_cardiaca &&
                      formik.errors.frecuencia_cardiaca && (
                        <div className='mt-1 text-xs text-red-600'>
                          {formik.errors.frecuencia_cardiaca as string}
                        </div>
                      )}
                  </div>
                </div>
                <div>
                  <label className='text-xs text-slate-500'>Alergias</label>
                  <input
                    type='text'
                    name='alergias'
                    value={formik.values.alergias ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Medicació­n actual
                  </label>
                  <input
                    type='text'
                    name='medicacion_actual'
                    value={formik.values.medicacion_actual ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>

                <h4 className='mt-4 text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Historial médico
                </h4>
                <div>
                  <label className='text-xs text-slate-500'>
                    Lesiones previas
                  </label>
                  <textarea
                    name='lesiones_previas'
                    value={formik.values.lesiones_previas ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Enfermedades crónicas
                  </label>
                  <textarea
                    name='enfermedades_cronicas'
                    value={formik.values.enfermedades_cronicas ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Cirugías previas
                  </label>
                  <textarea
                    name='cirugias_previas'
                    value={formik.values.cirugias_previas ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      name='problemas_cardiacos'
                      checked={formik.values.problemas_cardiacos}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'problemas_cardiacos',
                          e.target.checked
                        )
                      }
                    />
                    <label className='text-sm text-slate-600'>
                      Problemas cardiacos
                    </label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      name='problemas_respiratorios'
                      checked={formik.values.problemas_respiratorios}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'problemas_respiratorios',
                          e.target.checked
                        )
                      }
                    />
                    <label className='text-sm text-slate-600'>
                      Problemas respiratorios
                    </label>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      name='aprobacion_medica'
                      checked={formik.values.aprobacion_medica}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'aprobacion_medica',
                          e.target.checked
                        )
                      }
                    />
                    <label className='text-sm text-slate-600'>
                      Aprobación médica para actividad física
                    </label>
                  </div>
                  <div>
                    <input
                      type='file'
                      accept='application/pdf,image/*'
                      onChange={(e) =>
                        formik.setFieldValue(
                          'archivo_aprobacion',
                          e.currentTarget.files
                        )
                      }
                    />
                    {formik.touched.archivo_aprobacion &&
                      formik.errors.archivo_aprobacion && (
                        <div className='mt-1 text-xs text-red-600'>
                          {formik.errors.archivo_aprobacion as string}
                        </div>
                      )}
                  </div>
                </div>

                <h4 className='mt-4 text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Seguimiento y control
                </h4>
                <div>
                  <label className='text-xs text-slate-500'>
                    Fecha de último control médico
                  </label>
                  <input
                    type='date'
                    name='fecha_ultimo_control'
                    value={formik.values.fecha_ultimo_control ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Observaciones del entrenador
                  </label>
                  <textarea
                    name='observaciones_entrenador'
                    value={formik.values.observaciones_entrenador ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Observaciones del médico
                  </label>
                  <textarea
                    name='observaciones_medico'
                    value={formik.values.observaciones_medico ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Archivos adjuntos (PDF/JPG)
                  </label>
                  <input
                    type='file'
                    multiple
                    accept='application/pdf,image/*'
                    onChange={(e) =>
                      formik.setFieldValue(
                        'archivos_adjuntos',
                        e.currentTarget.files
                      )
                    }
                  />
                  {formik.touched.archivos_adjuntos &&
                    formik.errors.archivos_adjuntos && (
                      <div className='mt-1 text-xs text-red-600'>
                        {formik.errors.archivos_adjuntos as string}
                      </div>
                    )}
                </div>
                <div>
                  <label className='text-xs text-slate-500'>
                    Próxima fecha de revisión
                  </label>
                  <input
                    type='date'
                    name='proxima_revision'
                    value={formik.values.proxima_revision ?? ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className='w-full px-3 py-2 bg-white border rounded-md border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  />
                </div>

                <div className='flex justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => formik.resetForm()}
                    className='px-4 py-2 border rounded-md'
                  >
                    Limpiar
                  </button>
                  <button
                    type='submit'
                    disabled={submitting}
                    className='px-4 py-2 text-white bg-indigo-600 rounded-md shadow-sm'
                  >
                    {submitting ? 'Enviando...' : 'Guardar'}
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
              {histLoading ? (
                <div className='mt-4 text-sm text-slate-500'>
                  Cargando historial...
                </div>
              ) : histError ? (
                <div className='mt-4 text-sm text-red-600'>{histError}</div>
              ) : historial.length === 0 ? (
                <div className='mt-4 text-sm text-slate-700 dark:text-slate-300'>
                  No se encontraron registros
                </div>
              ) : (
                <>
                  <ul className='mt-4 space-y-3'>
                    {historial.map((item: any, idx: number) => (
                      <li
                        key={idx}
                        className='p-3 bg-white border rounded-md dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='text-sm text-slate-600'>
                            {formatDate(
                              item.fecha_ultimo_control ??
                                item.created_at ??
                                item.fecha
                            )}
                          </div>
                          <div className='text-sm text-slate-500'>
                            {item.usuario_id
                              ? `Usuario ${item.usuario_id}`
                              : ''}
                          </div>
                        </div>
                        <div className='grid grid-cols-1 gap-2 mt-2 sm:grid-cols-3'>
                          <div>
                            <div className='text-xs text-slate-400'>Peso</div>
                            <div className='text-sm text-slate-700 dark:text-slate-300'>
                              {item.peso ? `${item.peso} kg` : '—'}
                            </div>
                          </div>
                          <div>
                            <div className='text-xs text-slate-400'>Altura</div>
                            <div className='text-sm text-slate-700 dark:text-slate-300'>
                              {item.altura ? `${item.altura} cm` : '—'}
                            </div>
                          </div>
                          <div>
                            <div className='text-xs text-slate-400'>
                              Presión
                            </div>
                            <div className='text-sm text-slate-700 dark:text-slate-300'>
                              {item.presion_arterial ?? '—'}
                            </div>
                          </div>
                        </div>
                        <div className='mt-2 text-sm text-slate-700 dark:text-slate-300'>
                          {item.observaciones_medico ??
                            item.observaciones_entrenador ??
                            '—'}
                        </div>
                        <div className='mt-2'>
                          {renderFileLinks(
                            item.archivos_adjuntos ?? item.archivo_aprobacion
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className='flex items-center justify-between mt-4'>
                    <div className='text-sm text-slate-600'>
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
                          !histMeta ||
                          histMeta.page >= (histMeta.totalPages || 1)
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
