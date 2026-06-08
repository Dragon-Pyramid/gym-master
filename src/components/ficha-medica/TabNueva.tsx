'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { AlertTriangle, CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';
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

const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const GRUPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function fileListToArray(value?: FileList | null) {
  return value ? Array.from(value) : [];
}

function validateMedicalFiles(value?: FileList | null) {
  const files = fileListToArray(value);
  if (!files.length) return true;

  return files.every(
    (file) => FILE_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE_BYTES
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDropZone({
  label,
  description,
  files,
  multiple = false,
  error,
  onChange,
}: {
  label: string;
  description: string;
  files?: FileList | null;
  multiple?: boolean;
  error?: string;
  onChange: (files: FileList | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileArray = fileListToArray(files);

  return (
    <div className='space-y-2'>
      <label className='text-xs font-medium'>{label}</label>
      <label
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onChange(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-muted-foreground/25 bg-muted/30 hover:border-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-950/10'
        }`}
      >
        <UploadCloud className='mb-2 h-8 w-8 text-blue-600' />
        <span className='text-sm font-medium'>Arrastrá el archivo o tocá para buscar</span>
        <span className='mt-1 text-xs text-muted-foreground'>{description}</span>
        <input
          type='file'
          className='sr-only'
          multiple={multiple}
          accept='application/pdf,image/jpeg,image/png'
          onChange={(event) => onChange(event.currentTarget.files)}
        />
      </label>

      {fileArray.length ? (
        <div className='space-y-2'>
          {fileArray.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className='flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <FileText className='h-4 w-4 shrink-0 text-blue-600' />
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{file.name}</p>
                  <p className='text-xs text-muted-foreground'>{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => onChange(null)}
                className='rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
                aria-label='Quitar archivo'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <div className='text-xs text-red-600'>{error}</div> : null}
    </div>
  );
}

export default function TabNueva({
  socioId,
  onSaved,
}: {
  socioId?: number | string;
  onSaved?: () => void;
}) {
  const authUser = useAuthStore((s) => s.user);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      .test('requiredIfApproved', 'Adjuntá el apto o certificado médico', function (value) {
        const { aprobacion_medica } = this.parent as { aprobacion_medica?: boolean };
        if (!aprobacion_medica) return true;
        return Boolean(value && (value as FileList).length > 0);
      })
      .test('fileFormat', 'Usá PDF, JPG o PNG. Máximo 5MB por archivo.', function (value) {
        if (!value) return true;
        return validateMedicalFiles(value as FileList);
      }),
    fecha_ultimo_control: yup.date().nullable(),
    observaciones_entrenador: yup.string().nullable(),
    observaciones_medico: yup.string().nullable(),
    archivos_adjuntos: yup
      .mixed()
      .test('fileFormatMultiple', 'Usá PDF, JPG o PNG. Máximo 5MB por archivo.', function (value) {
        if (!value) return true;
        return validateMedicalFiles(value as FileList);
      }),
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
      setSuccessMessage(null);

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

      const files: { fieldName?: string; file: File }[] = [];

      if (values.archivo_aprobacion && values.archivo_aprobacion.length > 0) {
        const file = values.archivo_aprobacion.item(0);
        if (file) files.push({ fieldName: 'archivo_aprobacion', file });
      }

      if (values.archivos_adjuntos && values.archivos_adjuntos.length > 0) {
        Array.from(values.archivos_adjuntos).forEach((file) => {
          files.push({ fieldName: 'archivos_adjuntos', file });
        });
      }

      try {
        const res = await crearFichaMedica(socioId, payload, files);
        if (res.ok) {
          helpers.resetForm();
          setSuccessMessage('Ficha médica guardada correctamente.');
          if (onSaved) onSaved();
        } else {
          alert(res.data?.message || res.data?.error || 'Error al guardar ficha');
        }
      } catch {
        alert('Error al guardar ficha');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { peso, altura, imc } = formik.values;

  useEffect(() => {
    if (!peso || !altura) {
      if (imc !== null) formik.setFieldValue('imc', null, false);
      return;
    }

    const hMeters = Number(altura) / 100;
    if (!hMeters || hMeters <= 0) {
      if (imc !== null) formik.setFieldValue('imc', null, false);
      return;
    }

    const imcVal = Number((Number(peso) / (hMeters * hMeters)).toFixed(2));
    if (!Number.isNaN(imcVal) && Number.isFinite(imcVal) && imc !== imcVal) {
      formik.setFieldValue('imc', imcVal, false);
    }
  }, [peso, altura, imc, formik]);

  const imcStatus = useMemo(() => {
    const value = Number(formik.values.imc ?? 0);
    if (!value) return null;
    if (value < 18.5) return 'Bajo peso';
    if (value < 25) return 'Rango saludable';
    if (value < 30) return 'Sobrepeso';
    return 'Obesidad';
  }, [formik.values.imc]);

  return (
    <div className='w-full rounded-xl border bg-background p-4 shadow-sm md:p-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Nueva ficha médica</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Registrá controles, antecedentes, apto médico y documentos adjuntos del socio.
          </p>
        </div>
        <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200'>
          <div className='flex gap-2'>
            <AlertTriangle className='h-4 w-4 shrink-0' />
            <span>Ante dolor, lesión o condición clínica, derivar a un profesional de salud.</span>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className='mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300'>
          <CheckCircle2 className='h-4 w-4' />
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={formik.handleSubmit} className='mt-6 space-y-6'>
        <section className='space-y-4 rounded-xl border p-4'>
          <div>
            <h4 className='font-semibold'>Datos biométricos</h4>
            <p className='text-sm text-muted-foreground'>Peso, altura, signos básicos y cálculo automático de IMC.</p>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div>
              <label className='text-xs font-medium'>Altura (cm)</label>
              <input
                type='number'
                step='0.1'
                name='altura'
                value={formik.values.altura ?? ''}
                onChange={(e) => formik.setFieldValue('altura', e.target.value === '' ? null : Number(e.target.value))}
                onBlur={formik.handleBlur}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {formik.touched.altura && formik.errors.altura ? <div className='mt-1 text-xs text-red-600'>{formik.errors.altura as string}</div> : null}
            </div>
            <div>
              <label className='text-xs font-medium'>Peso (kg)</label>
              <input
                type='number'
                step='0.1'
                name='peso'
                value={formik.values.peso ?? ''}
                onChange={(e) => formik.setFieldValue('peso', e.target.value === '' ? null : Number(e.target.value))}
                onBlur={formik.handleBlur}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {formik.touched.peso && formik.errors.peso ? <div className='mt-1 text-xs text-red-600'>{formik.errors.peso as string}</div> : null}
            </div>
            <div>
              <label className='text-xs font-medium'>IMC</label>
              <input
                type='number'
                step='0.01'
                name='imc'
                value={formik.values.imc ?? ''}
                readOnly
                className='mt-1 w-full rounded-md border bg-muted px-3 py-2'
              />
              {imcStatus ? <div className='mt-1 text-xs text-muted-foreground'>{imcStatus}</div> : null}
            </div>
            <div>
              <label className='text-xs font-medium'>Grupo sanguíneo</label>
              <select
                name='grupo_sanguineo'
                value={formik.values.grupo_sanguineo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className='mt-1 w-full rounded-md border bg-background px-3 py-2'
              >
                <option value=''>Seleccionar</option>
                {GRUPOS_SANGUINEOS.map((grupo) => (
                  <option key={grupo} value={grupo}>{grupo}</option>
                ))}
              </select>
              {formik.touched.grupo_sanguineo && formik.errors.grupo_sanguineo ? <div className='mt-1 text-xs text-red-600'>{formik.errors.grupo_sanguineo as string}</div> : null}
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='text-xs font-medium'>Presión arterial</label>
              <input
                type='text'
                name='presion_arterial'
                placeholder='120/80'
                value={formik.values.presion_arterial}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {formik.touched.presion_arterial && formik.errors.presion_arterial ? <div className='mt-1 text-xs text-red-600'>{formik.errors.presion_arterial as string}</div> : null}
            </div>
            <div>
              <label className='text-xs font-medium'>Frecuencia cardíaca (bpm)</label>
              <input
                type='number'
                name='frecuencia_cardiaca'
                value={formik.values.frecuencia_cardiaca ?? ''}
                onChange={(e) => formik.setFieldValue('frecuencia_cardiaca', e.target.value === '' ? null : Number(e.target.value))}
                onBlur={formik.handleBlur}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {formik.touched.frecuencia_cardiaca && formik.errors.frecuencia_cardiaca ? <div className='mt-1 text-xs text-red-600'>{formik.errors.frecuencia_cardiaca as string}</div> : null}
            </div>
          </div>
        </section>

        <section className='space-y-4 rounded-xl border p-4'>
          <div>
            <h4 className='font-semibold'>Antecedentes y alertas</h4>
            <p className='text-sm text-muted-foreground'>Información preventiva para el gimnasio. No reemplaza evaluación médica.</p>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='text-xs font-medium'>Alergias</label>
              <input type='text' name='alergias' value={formik.values.alergias ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 w-full rounded-md border px-3 py-2' />
            </div>
            <div>
              <label className='text-xs font-medium'>Medicación actual</label>
              <input type='text' name='medicacion_actual' value={formik.values.medicacion_actual ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 w-full rounded-md border px-3 py-2' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <label className='text-xs font-medium'>Lesiones previas</label>
              <textarea name='lesiones_previas' value={formik.values.lesiones_previas ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 min-h-24 w-full rounded-md border px-3 py-2' />
            </div>
            <div>
              <label className='text-xs font-medium'>Enfermedades crónicas</label>
              <textarea name='enfermedades_cronicas' value={formik.values.enfermedades_cronicas ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 min-h-24 w-full rounded-md border px-3 py-2' />
            </div>
            <div>
              <label className='text-xs font-medium'>Cirugías previas</label>
              <textarea name='cirugias_previas' value={formik.values.cirugias_previas ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 min-h-24 w-full rounded-md border px-3 py-2' />
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <label className='flex items-center gap-2 rounded-lg border p-3 text-sm'>
              <input type='checkbox' name='problemas_cardiacos' checked={formik.values.problemas_cardiacos} onChange={(e) => formik.setFieldValue('problemas_cardiacos', e.target.checked)} />
              Problemas cardíacos
            </label>
            <label className='flex items-center gap-2 rounded-lg border p-3 text-sm'>
              <input type='checkbox' name='problemas_respiratorios' checked={formik.values.problemas_respiratorios} onChange={(e) => formik.setFieldValue('problemas_respiratorios', e.target.checked)} />
              Problemas respiratorios
            </label>
            <label className='flex items-center gap-2 rounded-lg border p-3 text-sm'>
              <input type='checkbox' name='aprobacion_medica' checked={formik.values.aprobacion_medica} onChange={(e) => formik.setFieldValue('aprobacion_medica', e.target.checked)} />
              Apto médico para actividad física
            </label>
          </div>
        </section>

        <section className='space-y-4 rounded-xl border p-4'>
          <div>
            <h4 className='font-semibold'>Seguimiento y documentación</h4>
            <p className='text-sm text-muted-foreground'>Usá PDF, JPG o PNG. Los archivos se guardan en Cloudinary.</p>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='text-xs font-medium'>Fecha de último control médico</label>
              <input type='date' name='fecha_ultimo_control' value={formik.values.fecha_ultimo_control ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 w-full rounded-md border px-3 py-2' />
            </div>
            <div>
              <label className='text-xs font-medium'>Próxima fecha de revisión</label>
              <input type='date' name='proxima_revision' value={formik.values.proxima_revision ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 w-full rounded-md border px-3 py-2' />
            </div>
          </div>
          <FileDropZone
            label='Apto o certificado médico'
            description='Obligatorio si marcaste apto médico. Formatos: PDF, JPG, PNG.'
            files={formik.values.archivo_aprobacion}
            error={formik.touched.archivo_aprobacion ? (formik.errors.archivo_aprobacion as string | undefined) : undefined}
            onChange={(files) => formik.setFieldValue('archivo_aprobacion', files)}
          />
          <FileDropZone
            label='Archivos adjuntos adicionales'
            description='Estudios, recomendaciones o imágenes relevantes. Podés adjuntar varios archivos.'
            files={formik.values.archivos_adjuntos}
            multiple
            error={formik.touched.archivos_adjuntos ? (formik.errors.archivos_adjuntos as string | undefined) : undefined}
            onChange={(files) => formik.setFieldValue('archivos_adjuntos', files)}
          />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='text-xs font-medium'>Observaciones del entrenador</label>
              <textarea name='observaciones_entrenador' value={formik.values.observaciones_entrenador ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 min-h-24 w-full rounded-md border px-3 py-2' />
            </div>
            <div>
              <label className='text-xs font-medium'>Observaciones médicas</label>
              <textarea name='observaciones_medico' value={formik.values.observaciones_medico ?? ''} onChange={formik.handleChange} onBlur={formik.handleBlur} className='mt-1 min-h-24 w-full rounded-md border px-3 py-2' />
            </div>
          </div>
        </section>

        <div className='flex flex-col gap-2 md:flex-row md:justify-end'>
          <button type='button' onClick={() => formik.resetForm()} className='rounded-md border px-4 py-2'>
            Limpiar
          </button>
          <button type='submit' disabled={submitting} className='rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60'>
            {submitting ? 'Guardando...' : 'Guardar ficha médica'}
          </button>
        </div>
      </form>
    </div>
  );
}
