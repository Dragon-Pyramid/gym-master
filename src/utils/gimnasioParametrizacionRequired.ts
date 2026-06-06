import type { GimnasioParametrizacion } from '@/interfaces/gimnasioParametrizacion.interface';

export const GIMNASIO_PARAMETRIZACION_REQUIRED_FIELDS: Array<{
  key: keyof Pick<
    GimnasioParametrizacion,
    | 'nombre_comercial'
    | 'razon_social'
    | 'identificacion_fiscal'
    | 'condicion_fiscal'
    | 'domicilio_legal'
    | 'ciudad'
    | 'provincia'
    | 'pais'
    | 'telefono'
    | 'email'
  >;
  label: string;
}> = [
  { key: 'nombre_comercial', label: 'Nombre comercial' },
  { key: 'razon_social', label: 'Razón social' },
  { key: 'identificacion_fiscal', label: 'CUIT / DNI fiscal' },
  { key: 'condicion_fiscal', label: 'Condición fiscal' },
  { key: 'domicilio_legal', label: 'Domicilio legal' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'provincia', label: 'Provincia' },
  { key: 'pais', label: 'País' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email institucional' },
];

function hasValue(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function getMissingGimnasioParametrizacionFields(
  data: GimnasioParametrizacion | null | undefined
): string[] {
  if (!data || !data.id) {
    return GIMNASIO_PARAMETRIZACION_REQUIRED_FIELDS.map((field) => field.label);
  }

  return GIMNASIO_PARAMETRIZACION_REQUIRED_FIELDS.filter((field) => !hasValue(data[field.key])).map(
    (field) => field.label
  );
}

export function isGimnasioParametrizacionComplete(
  data: GimnasioParametrizacion | null | undefined
): boolean {
  return getMissingGimnasioParametrizacionFields(data).length === 0;
}

export function buildGimnasioParametrizacionRequiredMessage(missingFields: string[]): string {
  const fieldsText = missingFields.length > 0 ? `\n\nCampos faltantes:\n- ${missingFields.join('\n- ')}` : '';

  return [
    'No se puede emitir este comprobante comercial.',
    '',
    'Antes de generar recibos, reportes PDF o documentos comerciales, el administrador debe completar los datos legales y comerciales del gimnasio en Administración → Datos del Gimnasio.',
    'Gym Master es la plataforma tecnológica; el emisor comercial/legal del comprobante debe ser el gimnasio cliente.',
    fieldsText,
  ].join('\n');
}
