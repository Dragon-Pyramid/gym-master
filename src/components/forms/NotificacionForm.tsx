'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CreateNotificacionDto,
  Notificacion,
  NotificacionCanal,
  NotificacionEstado,
  NotificacionPlantilla,
  NotificacionSegmento,
  NotificacionTipo,
} from '@/interfaces/notificacion.interface';
import { actualizarNotificacion, crearNotificacion } from '@/services/apiClient';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { toast } from 'sonner';

type FormState = CreateNotificacionDto;


function notificationTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function optionLabel(locale: GymMasterLocale, label: string) {
  const labels: Record<string, string> = {
    'General': 'General',
    'Feriado / horario especial': 'Holiday / special schedule',
    'Promoción': 'Promotion',
    'Stock crítico': 'Critical stock',
    'Cumpleaños': 'Birthday',
    'Cuotas / pagos': 'Fees / payments',
    'Recordatorio': 'Reminder',
    'Sistema': 'System',
    'Otro': 'Other',
    'Email': 'Email',
    'Terminal': 'Terminal',
    'Email + Terminal': 'Email + Terminal',
    'Sistema interno': 'Internal system',
    'Borrador': 'Draft',
    'Programada / activa': 'Scheduled / active',
    'Enviada': 'Sent',
    'Cancelada': 'Cancelled',
    'Error': 'Error',
    'Todos los socios con email': 'All members with email',
    'Socios activos con email': 'Active members with email',
    'Socios con cuota al día (base futura)': 'Members with up-to-date fees (future base)',
    'Manual / personalizado (base futura)': 'Manual / custom (future base)',
    'Rosa neón': 'Neon pink',
    'Verde flúor': 'Fluorescent green',
    'Naranja flúor': 'Fluorescent orange',
    'Amarillo flúor': 'Fluorescent yellow',
    'Rojo flúor': 'Fluorescent red',
  };
  return locale === 'en' ? labels[label] ?? label : label;
}


const emptyForm: FormState = {
  titulo: '',
  asunto: '',
  cuerpo: '',
  tipo: 'general',
  canal: 'email',
  estado: 'borrador',
  destinatario_segmento: 'socios_activos',
  fecha_programada: '',
  fecha_vigencia_hasta: '',
  mostrar_terminal: false,
  terminal_visible: true,
  terminal_imagen_url: '',
  terminal_color_neon: 'verde_fluo',
  terminal_duracion_segundos: 8,
  terminal_frecuencia_segundos: 60,
};

const tipos: Array<{ value: NotificacionTipo; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'feriado', label: 'Feriado / horario especial' },
  { value: 'promocion', label: 'Promoción' },
  { value: 'stock', label: 'Stock crítico' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'cuota', label: 'Cuotas / pagos' },
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'sistema', label: 'Sistema' },
  { value: 'otro', label: 'Otro' },
];

const canales: Array<{ value: NotificacionCanal; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'email_terminal', label: 'Email + Terminal' },
  { value: 'sistema', label: 'Sistema interno' },
];


const estadosNotificacion: Array<{ value: NotificacionEstado; label: string }> = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'programada', label: 'Programada / activa' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'error', label: 'Error' },
];

const segmentos: Array<{ value: NotificacionSegmento; label: string }> = [
  { value: 'todos_socios', label: 'Todos los socios con email' },
  { value: 'socios_activos', label: 'Socios activos con email' },
  { value: 'socios_cuota_al_dia', label: 'Socios con cuota al día (base futura)' },
  { value: 'manual', label: 'Manual / personalizado (base futura)' },
];

const coloresNeon = [
  { value: 'rosa', label: 'Rosa neón' },
  { value: 'verde_fluo', label: 'Verde flúor' },
  { value: 'naranja_fluo', label: 'Naranja flúor' },
  { value: 'amarillo_fluo', label: 'Amarillo flúor' },
  { value: 'rojo_fluo', label: 'Rojo flúor' },
];

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NotificacionForm({
  notificacion,
  plantillas,
  onCreated,
}: {
  notificacion?: Notificacion | null;
  plantillas: NotificacionPlantilla[];
  onCreated?: () => void;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => notificationTx(locale, es, en);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notificacion) {
      setForm(emptyForm);
      return;
    }

    setForm({
      plantilla_id: notificacion.plantilla_id ?? '',
      titulo: notificacion.titulo ?? '',
      asunto: notificacion.asunto ?? '',
      cuerpo: notificacion.cuerpo ?? '',
      tipo: notificacion.tipo ?? 'general',
      canal: notificacion.canal ?? 'email',
      estado: notificacion.estado ?? 'borrador',
      destinatario_segmento: notificacion.destinatario_segmento ?? 'socios_activos',
      fecha_programada: toDatetimeLocal(notificacion.fecha_programada),
      fecha_vigencia_hasta: toDatetimeLocal(notificacion.fecha_vigencia_hasta),
      mostrar_terminal: Boolean(notificacion.mostrar_terminal),
      terminal_visible: Boolean(notificacion.terminal_visible),
      terminal_imagen_url: notificacion.terminal_imagen_url ?? '',
      terminal_color_neon: notificacion.terminal_color_neon ?? 'verde_fluo',
      terminal_duracion_segundos: notificacion.terminal_duracion_segundos ?? 8,
      terminal_frecuencia_segundos: notificacion.terminal_frecuencia_segundos ?? 60,
    });
  }, [notificacion]);

  const selectedPlantilla = useMemo(
    () => plantillas.find((plantilla) => plantilla.id === form.plantilla_id),
    [form.plantilla_id, plantillas]
  );

  const updateField = (name: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const applyPlantilla = (plantillaId: string) => {
    const plantilla = plantillas.find((item) => item.id === plantillaId);
    if (!plantilla) {
      updateField('plantilla_id', '');
      return;
    }

    setForm((prev) => ({
      ...prev,
      plantilla_id: plantilla.id,
      titulo: plantilla.nombre,
      asunto: plantilla.asunto,
      cuerpo: plantilla.cuerpo,
      tipo: plantilla.tipo,
      canal: plantilla.canal,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const payload: CreateNotificacionDto = {
      ...form,
      plantilla_id: form.plantilla_id || null,
      terminal_imagen_url: form.terminal_imagen_url || null,
      fecha_programada: form.fecha_programada || null,
      fecha_vigencia_hasta: form.fecha_vigencia_hasta || null,
    };

    const response = notificacion
      ? await actualizarNotificacion(notificacion.id, payload)
      : await crearNotificacion(payload);

    setLoading(false);

    if (!response.ok) {
      toast.error(response.error || c('No se pudo guardar la notificación', 'Could not save the notification'));
      return;
    }

    toast.success(notificacion ? c('Notificación actualizada', 'Notification updated') : c('Notificación creada', 'Notification created'));
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <QaFileNameBadge file='src/components/forms/NotificacionForm.tsx' />

      <div className='flex flex-col gap-1.5 md:col-span-2'>
        <Label htmlFor='plantilla_id'>{c('Plantilla base', 'Base template')}</Label>
        <select
          id='plantilla_id'
          value={form.plantilla_id ?? ''}
          onChange={(event) => applyPlantilla(event.target.value)}
          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
        >
          <option value=''>{c('Sin plantilla', 'No template')}</option>
          {plantillas.map((plantilla) => (
            <option key={plantilla.id} value={plantilla.id}>
              {plantilla.nombre}
            </option>
          ))}
        </select>
        {selectedPlantilla ? (
          <p className='text-xs text-muted-foreground'>
            {c('Se cargaron asunto, cuerpo, tipo y canal desde la plantilla seleccionada.', 'Subject, body, type and channel were loaded from the selected template.')}
          </p>
        ) : null}
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='titulo'>{c('Título interno', 'Internal title')}</Label>
        <Input
          id='titulo'
          value={form.titulo}
          onChange={(event) => updateField('titulo', event.target.value)}
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='asunto'>{c('Asunto / título visible', 'Subject / visible title')}</Label>
        <Input
          id='asunto'
          value={form.asunto}
          onChange={(event) => updateField('asunto', event.target.value)}
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='tipo'>{c('Tipo', 'Type')}</Label>
        <select
          id='tipo'
          value={form.tipo}
          onChange={(event) => updateField('tipo', event.target.value)}
          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
        >
          {tipos.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {optionLabel(locale, tipo.label)}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='canal'>{c('Canal', 'Channel')}</Label>
        <select
          id='canal'
          value={form.canal}
          onChange={(event) => updateField('canal', event.target.value)}
          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
        >
          {canales.map((canal) => (
            <option key={canal.value} value={canal.value}>
              {optionLabel(locale, canal.label)}
            </option>
          ))}
        </select>
      </div>


      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='estado'>{c('Estado', 'Status')}</Label>
        <select
          id='estado'
          value={form.estado ?? 'borrador'}
          onChange={(event) => updateField('estado', event.target.value)}
          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
        >
          {estadosNotificacion.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {optionLabel(locale, estado.label)}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='destinatario_segmento'>{c('Destinatarios', 'Recipients')}</Label>
        <select
          id='destinatario_segmento'
          value={form.destinatario_segmento}
          onChange={(event) => updateField('destinatario_segmento', event.target.value)}
          className='h-10 rounded-md border border-input bg-background px-3 text-sm'
        >
          {segmentos.map((segmento) => (
            <option key={segmento.value} value={segmento.value}>
              {optionLabel(locale, segmento.label)}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='fecha_programada'>{c('Visible desde / fecha programada', 'Visible from / scheduled date')}</Label>
        <Input
          id='fecha_programada'
          type='datetime-local'
          value={form.fecha_programada ?? ''}
          onChange={(event) => updateField('fecha_programada', event.target.value)}
        />
      </div>


      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='fecha_vigencia_hasta'>{c('Fecha/hora visible hasta', 'Visible until date/time')}</Label>
        <Input
          id='fecha_vigencia_hasta'
          type='datetime-local'
          value={form.fecha_vigencia_hasta ?? ''}
          onChange={(event) => updateField('fecha_vigencia_hasta', event.target.value)}
        />
        <p className='text-xs text-muted-foreground'>{c('Usá este campo para que promociones vencidas no sigan apareciendo en Terminal.', 'Use this field so expired promotions stop appearing in the terminal.')}</p>
      </div>

      <div className='flex flex-col gap-1.5 md:col-span-2'>
        <Label htmlFor='cuerpo'>{c('Mensaje', 'Message')}</Label>
        <textarea
          id='cuerpo'
          value={form.cuerpo}
          onChange={(event) => updateField('cuerpo', event.target.value)}
          required
          rows={6}
          className='min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm'
        />
      </div>

      <div className='rounded-xl border bg-muted/30 p-4 md:col-span-2'>
        <div className='mb-3 flex items-center justify-between gap-4'>
          <div>
            <h3 className='font-semibold'>{c('Salida en Terminal de asistencia', 'Attendance terminal output')}</h3>
            <p className='text-xs text-muted-foreground'>
              {c('Base para avisos/promociones en el panel derecho sin ocultar el QR.', 'Base for alerts/promotions in the right panel without hiding the QR.')}
            </p>
          </div>
          <label className='flex items-center gap-2 text-sm font-medium'>
            <input
              type='checkbox'
              checked={Boolean(form.mostrar_terminal)}
              onChange={(event) => updateField('mostrar_terminal', event.target.checked)}
            />
            {c('Mostrar en Terminal', 'Show in terminal')}
          </label>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <label className='flex items-center gap-2 text-sm font-medium'>
            <input
              type='checkbox'
              checked={Boolean(form.terminal_visible)}
              onChange={(event) => updateField('terminal_visible', event.target.checked)}
            />
            {c('Visible/habilitada', 'Visible/enabled')}
          </label>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='terminal_color_neon'>{c('Color neón', 'Neon color')}</Label>
            <select
              id='terminal_color_neon'
              value={form.terminal_color_neon ?? 'verde_fluo'}
              onChange={(event) => updateField('terminal_color_neon', event.target.value)}
              className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              {coloresNeon.map((color) => (
                <option key={color.value} value={color.value}>
                  {optionLabel(locale, color.label)}
                </option>
              ))}
            </select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='terminal_duracion_segundos'>{c('Duración en pantalla (segundos)', 'On-screen duration (seconds)')}</Label>
            <Input
              id='terminal_duracion_segundos'
              type='number'
              min={1}
              value={String(form.terminal_duracion_segundos ?? 8)}
              onChange={(event) => updateField('terminal_duracion_segundos', event.target.value)}
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='terminal_frecuencia_segundos'>{c('Frecuencia de aparición (segundos)', 'Appearance frequency (seconds)')}</Label>
            <Input
              id='terminal_frecuencia_segundos'
              type='number'
              min={1}
              value={String(form.terminal_frecuencia_segundos ?? 60)}
              onChange={(event) => updateField('terminal_frecuencia_segundos', event.target.value)}
            />
          </div>

          <div className='flex flex-col gap-1.5 md:col-span-2'>
            <Label htmlFor='terminal_imagen_url'>{c('URL de imagen/banner', 'Image/banner URL')}</Label>
            <Input
              id='terminal_imagen_url'
              value={form.terminal_imagen_url ?? ''}
              onChange={(event) => updateField('terminal_imagen_url', event.target.value)}
              placeholder='https://...'
            />
            <p className='text-xs text-muted-foreground'>
              {c('Recomendación visual: relación de aspecto 5:4. Si no hay imagen, se usará el logo del gimnasio y luego el logo de Gym Master como fallback.', 'Visual recommendation: 5:4 aspect ratio. If there is no image, the gym logo and then the Gym Master logo will be used as fallback.')}
            </p>
          </div>
        </div>
      </div>

      <div className='flex justify-end md:col-span-2'>
        <Button type='submit' disabled={loading}>
          {loading ? c('Guardando...', 'Saving...') : notificacion ? c('Guardar cambios', 'Save changes') : c('Crear notificación', 'Create notification')}
        </Button>
      </div>
    </form>
  );
}
