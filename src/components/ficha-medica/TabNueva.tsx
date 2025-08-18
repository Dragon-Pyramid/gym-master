'use client';
import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { crearFichaMedica } from '../../services/apiClient';
import { useAuthStore } from '../../stores/authStore';

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
  medicacion_actual?: string | null;
};

export default function TabNueva({
  socioId,
  onSaved,
}: {
  socioId?: number | string;
  onSaved?: () => void;
}) {
  const authUser = useAuthStore((s) => s.user);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

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
      medicacion_actual: null,
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
        medicacion: values.medicacion ?? values.medicacion_actual ?? null,
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
          if (onSaved) onSaved();
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
  }, [formik, formik.values.peso, formik.values.altura]);

  return (
    <div className='w-full p-4 rounded-lg page-bg'>
      <h3 className='text-lg font-semibold'>Nueva ficha</h3>
      <p className='mt-2 text-sm'>Registra una nueva entrada médica.</p>
      <form
        onSubmit={formik.handleSubmit}
        className='grid grid-cols-1 gap-3 mt-4'
      >
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-xs'>Altura (cm)</label>
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
              className='w-full px-3 py-2 border rounded-md'
            />
            {formik.touched.altura && formik.errors.altura && (
              <div className='mt-1 text-xs'>
                {formik.errors.altura as string}
              </div>
            )}
          </div>
          <div>
            <label className='text-xs'>Peso (kg)</label>
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
              className='w-full px-3 py-2 border rounded-md'
            />
            {formik.touched.peso && formik.errors.peso && (
              <div className='mt-1 text-xs'>{formik.errors.peso as string}</div>
            )}
          </div>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-xs'>IMC</label>
            <input
              type='number'
              step='0.01'
              name='imc'
              value={formik.values.imc ?? ''}
              readOnly
              className='w-full px-3 py-2 border rounded-md'
            />
          </div>
          <div>
            <label className='text-xs'>Grupo sanguíneo</label>
            <input
              type='text'
              name='grupo_sanguineo'
              value={formik.values.grupo_sanguineo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className='w-full px-3 py-2 border rounded-md'
            />
            {formik.touched.grupo_sanguineo &&
              formik.errors.grupo_sanguineo && (
                <div className='mt-1 text-xs'>
                  {formik.errors.grupo_sanguineo as string}
                </div>
              )}
          </div>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-xs'>Presión arterial</label>
            <input
              type='text'
              name='presion_arterial'
              placeholder='120/80'
              value={formik.values.presion_arterial}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className='w-full px-3 py-2 border rounded-md'
            />
            {formik.touched.presion_arterial &&
              formik.errors.presion_arterial && (
                <div className='mt-1 text-xs'>
                  {formik.errors.presion_arterial as string}
                </div>
              )}
          </div>
          <div>
            <label className='text-xs'>Frecuencia cardiaca (bpm)</label>
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
              className='w-full px-3 py-2 border rounded-md'
            />
            {formik.touched.frecuencia_cardiaca &&
              formik.errors.frecuencia_cardiaca && (
                <div className='mt-1 text-xs'>
                  {formik.errors.frecuencia_cardiaca as string}
                </div>
              )}
          </div>
        </div>
        <div>
          <label className='text-xs'>Alergias</label>
          <input
            type='text'
            name='alergias'
            value={formik.values.alergias ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div>
          <label className='text-xs'>Medicació­n actual</label>
          <input
            type='text'
            name='medicacion_actual'
            value={formik.values.medicacion_actual ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>

        <h4 className='mt-4 text-sm font-medium'>Historial médico</h4>
        <div>
          <label className='text-xs'>Lesiones previas</label>
          <textarea
            name='lesiones_previas'
            value={formik.values.lesiones_previas ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div>
          <label className='text-xs'>Enfermedades crónicas</label>
          <textarea
            name='enfermedades_cronicas'
            value={formik.values.enfermedades_cronicas ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div>
          <label className='text-xs'>Cirugías previas</label>
          <textarea
            name='cirugias_previas'
            value={formik.values.cirugias_previas ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              name='problemas_cardiacos'
              checked={formik.values.problemas_cardiacos}
              onChange={(e) =>
                formik.setFieldValue('problemas_cardiacos', e.target.checked)
              }
            />
            <label className='text-sm'>Problemas cardiacos</label>
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
            <label className='text-sm'>Problemas respiratorios</label>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              name='aprobacion_medica'
              checked={formik.values.aprobacion_medica}
              onChange={(e) =>
                formik.setFieldValue('aprobacion_medica', e.target.checked)
              }
            />
            <label className='text-sm'>
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
                <div className='mt-1 text-xs'>
                  {formik.errors.archivo_aprobacion as string}
                </div>
              )}
          </div>
        </div>

        <h4 className='mt-4 text-sm font-medium'>Seguimiento y control</h4>
        <div>
          <label className='text-xs'>Fecha de último control médico</label>
          <input
            type='date'
            name='fecha_ultimo_control'
            value={formik.values.fecha_ultimo_control ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div>
          <label className='text-xs'>Observaciones del entrenador</label>
          <textarea
            name='observaciones_entrenador'
            value={formik.values.observaciones_entrenador ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div>
          <label className='text-xs'>Observaciones del médico</label>
          <textarea
            name='observaciones_medico'
            value={formik.values.observaciones_medico ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
        <div>
          <label className='text-xs'>Archivos adjuntos (PDF/JPG)</label>
          <input
            type='file'
            multiple
            accept='application/pdf,image/*'
            onChange={(e) =>
              formik.setFieldValue('archivos_adjuntos', e.currentTarget.files)
            }
          />
          {formik.touched.archivos_adjuntos &&
            formik.errors.archivos_adjuntos && (
              <div className='mt-1 text-xs'>
                {formik.errors.archivos_adjuntos as string}
              </div>
            )}
        </div>
        <div>
          <label className='text-xs'>Próxima fecha de revisión</label>
          <input
            type='date'
            name='proxima_revision'
            value={formik.values.proxima_revision ?? ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-full px-3 py-2 border rounded-md'
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
            className='px-4 py-2 rounded-md shadow-sm'
          >
            {submitting ? 'Enviando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
