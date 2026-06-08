'use client';

import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { getFichaMedicaActual } from '../../services/apiClient';
import type { FichaMedica } from '../../interfaces/fichaMedica.interface';
import { useAuthStore } from '../../stores/authStore';
import { formatFrontendDate } from '@/utils/dateFormat';

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
        const targetId: number | string | null | undefined =
          socioId ?? authUser?.id_socio ?? authUser?.id;

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
  }, [active, socioId, authUser?.id, authUser?.id_socio]);

  const formatDate = (value: unknown) => {
    if (!value) return '—';
    try {
      return formatFrontendDate(String(value));
    } catch {
      return String(value);
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
    return keys.some((key) => {
      const value = obj[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
  };

  const normalizeFileList = (value: string | string[] | null | undefined) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [String(value)].filter(Boolean);
  };

  const handleDownloadPdf = async () => {
    if (!ficha) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    const addLine = (label: string, value: unknown) => {
      const text = `${label}: ${value === null || value === undefined || value === '' ? '—' : String(value)}`;
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 6;
      if (y > 275) {
        doc.addPage();
        y = 16;
      }
    };

    const addSection = (title: string) => {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Gym Master', margin, y);
    doc.setFontSize(10);
    doc.text('Ficha médica del socio', pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.setDrawColor(2, 168, 225);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addLine('Socio', authUser?.nombre ?? 'Socio');
    addLine('Email', authUser?.email ?? '—');
    addLine('Fecha de emisión', new Date().toLocaleDateString('es-AR'));

    addSection('Datos biométricos');
    addLine('Peso', ficha.peso ? `${ficha.peso} kg` : '—');
    addLine('Altura', ficha.altura ? `${ficha.altura} cm` : '—');
    addLine('IMC', ficha.imc ?? '—');
    addLine('Grupo sanguíneo', ficha.grupo_sanguineo ?? '—');
    addLine('Presión arterial', ficha.presion_arterial ?? '—');
    addLine('Frecuencia cardíaca', ficha.frecuencia_cardiaca ? `${ficha.frecuencia_cardiaca} bpm` : '—');

    addSection('Antecedentes');
    addLine('Alergias', ficha.alergias ?? '—');
    addLine('Medicación', ficha.medicacion ?? '—');
    addLine('Lesiones previas', ficha.lesiones_previas ?? '—');
    addLine('Enfermedades crónicas', ficha.enfermedades_cronicas ?? '—');
    addLine('Cirugías previas', ficha.cirugias_previas ?? '—');
    addLine('Problemas cardíacos', ficha.problemas_cardiacos ? 'Sí' : 'No');
    addLine('Problemas respiratorios', ficha.problemas_respiratorios ? 'Sí' : 'No');

    addSection('Controles y observaciones');
    addLine('Apto médico', ficha.aprobacion_medica ? 'Sí' : 'No');
    addLine('Último control médico', formatDate(ficha.fecha_ultimo_control));
    addLine('Próxima revisión', formatDate(ficha.proxima_revision));
    addLine('Observaciones médicas', ficha.observaciones_medico ?? '—');
    addLine('Observaciones del entrenador', ficha.observaciones_entrenador ?? '—');

    const approvalUrls = normalizeFileList(ficha.archivo_aprobacion);
    const attachmentUrls = normalizeFileList(ficha.archivos_adjuntos);
    if (approvalUrls.length || attachmentUrls.length) {
      addSection('Documentos adjuntos');
      [...approvalUrls, ...attachmentUrls].forEach((url, index) => {
        const label = `Documento ${index + 1}: ${url}`;
        const lines = doc.splitTextToSize(label, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        try {
          doc.link(margin, y - 4, pageWidth - margin * 2, 6, { url });
        } catch {
          // El link es complementario. El texto de la URL queda visible aunque falle el enlace.
        }
        y += lines.length * 6;
      });
    }

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Documento generado por Gym Master. No reemplaza evaluación médica profesional.', margin, 288);
    doc.save(`ficha-medica-${authUser?.nombre ?? 'socio'}.pdf`.replace(/\s+/g, '-').toLowerCase());
  };

  const renderFileLinks = (value: string | string[] | null | undefined) => {
    const urls = normalizeFileList(value);
    if (!urls.length) return null;

    return (
      <div className='mt-2 flex flex-wrap gap-2'>
        {urls.map((url, index) => (
          <a
            key={`${url}-${index}`}
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted'
          >
            <FileText className='h-4 w-4 text-blue-600' />
            Ver archivo {index + 1}
            <ExternalLink className='h-3.5 w-3.5' />
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className='w-full rounded-xl border bg-background p-4 shadow-sm md:p-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Ficha actual</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Datos médicos vigentes, controles recientes y documentación adjunta.
          </p>
        </div>
        {fichaTieneDatos(ficha) ? (
          <button
            type='button'
            onClick={handleDownloadPdf}
            className='inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted'
          >
            <Download className='h-4 w-4' />
            Descargar ficha PDF
          </button>
        ) : null}
      </div>
      {loading ? (
        <div className='mt-4 text-sm'>Cargando...</div>
      ) : error ? (
        <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300'>
          {error}
        </div>
      ) : !fichaTieneDatos(ficha) ? (
        <div className='mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground'>
          El socio todavía no tiene una ficha médica cargada.
        </div>
      ) : (
        <div className='mt-5 space-y-5'>
          <div className='grid w-full grid-cols-1 gap-3 sm:grid-cols-3'>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Peso</div>
              <div className='mt-1 text-xl font-semibold'>{ficha?.peso ? `${ficha.peso} kg` : '—'}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Altura</div>
              <div className='mt-1 text-xl font-semibold'>{ficha?.altura ? `${ficha.altura} cm` : '—'}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>IMC</div>
              <div className='mt-1 text-xl font-semibold'>{ficha?.imc ?? '—'}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Grupo sanguíneo</div>
              <div className='mt-1 text-lg font-medium'>{ficha?.grupo_sanguineo ?? '—'}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Presión</div>
              <div className='mt-1 text-lg font-medium'>{ficha?.presion_arterial ?? '—'}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Frecuencia cardíaca</div>
              <div className='mt-1 text-lg font-medium'>
                {ficha?.frecuencia_cardiaca ? `${ficha.frecuencia_cardiaca} bpm` : '—'}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Alergias</div>
              <div className='mt-1 text-sm'>{ficha?.alergias ?? '—'}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Medicación</div>
              <div className='mt-1 text-sm'>{ficha?.medicacion ?? '—'}</div>
            </div>
          </div>

          <div className='rounded-lg border p-3'>
            <div className='text-xs text-muted-foreground'>Historial médico</div>
            <div className='mt-2 space-y-1 text-sm'>
              <div><strong>Lesiones:</strong> {ficha?.lesiones_previas ?? '—'}</div>
              <div><strong>Enfermedades crónicas:</strong> {ficha?.enfermedades_cronicas ?? '—'}</div>
              <div><strong>Cirugías previas:</strong> {ficha?.cirugias_previas ?? '—'}</div>
              <div><strong>Problemas cardíacos:</strong> {ficha?.problemas_cardiacos ? 'Sí' : 'No'}</div>
              <div><strong>Problemas respiratorios:</strong> {ficha?.problemas_respiratorios ? 'Sí' : 'No'}</div>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Último control</div>
              <div className='mt-1 text-sm'>{formatDate(ficha?.fecha_ultimo_control)}</div>
            </div>
            <div className='rounded-lg border p-3'>
              <div className='text-xs text-muted-foreground'>Próxima revisión</div>
              <div className='mt-1 text-sm'>{formatDate(ficha?.proxima_revision)}</div>
            </div>
          </div>

          <div className='rounded-lg border p-3'>
            <div className='text-xs text-muted-foreground'>Observaciones</div>
            <div className='mt-1 whitespace-pre-wrap text-sm'>
              {ficha?.observaciones_medico ?? ficha?.observaciones_entrenador ?? '—'}
            </div>
          </div>

          <div className='rounded-lg border p-3'>
            <div className='text-xs text-muted-foreground'>Apto médico</div>
            <div className='mt-1 text-sm'>{ficha?.aprobacion_medica ? 'Sí' : 'No'}</div>
            {renderFileLinks(ficha?.archivo_aprobacion)}
          </div>

          <div className='rounded-lg border p-3'>
            <div className='text-xs text-muted-foreground'>Archivos adjuntos</div>
            {renderFileLinks((ficha as unknown as { archivos_adjuntos?: string | string[] })?.archivos_adjuntos) ?? (
              <div className='mt-1 text-sm'>—</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
