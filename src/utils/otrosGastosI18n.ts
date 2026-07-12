import type { GymMasterLocale } from '@/i18n/config';
import { translateCommercialUi } from '@/i18n/commercialUi';

const enOtrosGastosUi: Record<string, string> = {
  'Cargando...': 'Loading...',
  'Gastos / Egresos': 'Expenses / Outflows',
  'Total egresos': 'Total outflows',
  'Activos': 'Active',
  'Pendientes': 'Pending',
  'Vencidos': 'Overdue',
  'Comprobantes': 'Receipts',
  'Listado de Gastos / Egresos': 'Expenses / Outflows list',
  'Registrá gastos operativos, vencimientos, medios de pago y comprobantes.': 'Register operating expenses, due dates, payment methods, and receipts.',
  'Todos': 'All',
  'Pagados': 'Paid',
  'Pendiente': 'Pending',
  'Pagado': 'Paid',
  'Vencido': 'Overdue',
  'Anulado': 'Cancelled',
  'Anulados': 'Cancelled',
  'Sin estado': 'No status',
  'Sin clasificar': 'Unclassified',
  'Sueldos': 'Salaries',
  'Mantenimiento': 'Maintenance',
  'Servicios': 'Services',
  'Insumos': 'Supplies',
  'Alquiler': 'Rent',
  'Impuestos': 'Taxes',
  'Limpieza': 'Cleaning',
  'Marketing': 'Marketing',
  'Otros': 'Other',
  'Reparación': 'Repair',
  'Reparaciones': 'Repairs',
  'Servicios públicos': 'Utilities',
  'Honorarios': 'Professional fees',
  'Gastos asociados a mantenimiento de equipamiento o infraestructura.': 'Expenses related to equipment or infrastructure maintenance.',
  'Gastos asociados a sueldos, jornales o liquidaciones del personal.': 'Expenses related to salaries, wages, or staff settlements.',
  'Gastos asociados a servicios contratados, profesionales o tercerizados.': 'Expenses related to contracted, professional, or outsourced services.',
  'Gastos asociados a insumos operativos, limpieza, oficina o mantenimiento.': 'Expenses related to operating, cleaning, office, or maintenance supplies.',
  'Gastos asociados a alquileres, renta del local o espacios operativos.': 'Expenses related to rent, facility rental, or operating spaces.',
  'Gastos asociados a impuestos, tasas o cargas fiscales.': 'Expenses related to taxes, fees, or fiscal charges.',
  'Gastos asociados a limpieza, higiene o desinfección.': 'Expenses related to cleaning, hygiene, or disinfection.',
  'Gastos asociados a marketing, publicidad o comunicación.': 'Expenses related to marketing, advertising, or communications.',
  'Gastos asociados a otros conceptos operativos.': 'Expenses related to other operating concepts.',
  'Gasto sin tipo asignado.': 'Expense without an assigned type.',
  'Gastos no clasificados.': 'Unclassified expenses.',
  'Gastos no clasificados': 'Unclassified expenses.',
  'Otros gastos no clasificados.': 'Other unclassified expenses.',
  'Otros gastos no clasificados': 'Other unclassified expenses.',
  'Pagos mensuales a empleados.': 'Monthly payments to employees.',
  'Pagos mensuales a empleados': 'Monthly payments to employees.',
  'Pagos a empleados.': 'Payments to employees.',
  'Pagos a empleados': 'Payments to employees.',
  'Sin descripción de tipo.': 'No type description.',
  'Sueldos, jornales, cargas sociales o liquidaciones del personal.': 'Salaries, wages, payroll taxes, or staff settlements.',
  'Sueldos, jornales o liquidaciones del personal.': 'Salaries, wages, or staff settlements.',
  'Gastos de sueldos, jornales o liquidaciones del personal.': 'Salary, wage, or staff settlement expenses.',
  'Mantenimiento de equipamiento o infraestructura.': 'Equipment or infrastructure maintenance.',
  'Reparaciones, mantenimiento de equipamiento o infraestructura.': 'Repairs and equipment or infrastructure maintenance.',
  'Servicios contratados, profesionales o tercerizados.': 'Contracted, professional, or outsourced services.',
  'Luz, agua, internet, software u otros servicios.': 'Electricity, water, internet, software, or other services.',
  'Luz, agua, internet, software u otros servicios': 'Electricity, water, internet, software, or other services.',
  'Servicios públicos, internet, software u otros servicios.': 'Utilities, internet, software, or other services.',
  'Servicios públicos, internet, software u otros servicios': 'Utilities, internet, software, or other services.',
  'Insumos operativos, limpieza, oficina o mantenimiento.': 'Operating, cleaning, office, or maintenance supplies.',
  'Compra de insumos operativos, limpieza, oficina o mantenimiento.': 'Purchase of operating, cleaning, office, or maintenance supplies.',
  'Alquileres, renta del local o espacios operativos.': 'Rent, facility rental, or operating spaces.',
  'Alquiler del local, depósitos o espacios operativos.': 'Facility rent, storage, or operating spaces.',
  'Impuestos, tasas o cargas fiscales.': 'Taxes, fees, or fiscal charges.',
  'Impuestos, tasas, cargas fiscales o retenciones.': 'Taxes, fees, fiscal charges, or withholdings.',
  'Limpieza, higiene o desinfección.': 'Cleaning, hygiene, or disinfection.',
  'Productos o servicios de limpieza, higiene y desinfección.': 'Cleaning, hygiene, and disinfection products or services.',
  'Marketing, publicidad o comunicación.': 'Marketing, advertising, or communications.',
  'Publicidad, redes sociales, diseño o campañas comerciales.': 'Advertising, social media, design, or commercial campaigns.',
  'Otros conceptos operativos.': 'Other operating concepts.',
  'Otros gastos operativos no clasificados.': 'Other unclassified operating expenses.',
  'Fecha desde': 'From date',
  'Fecha hasta': 'To date',
  'Limpiar': 'Clear',
  'Buscar gasto, tipo, entidad, comprobante...': 'Search expense, type, entity, receipt...',
  'Descargar PDF': 'Download PDF',
  'Exportar': 'Export',
  'Añadir Gasto': 'Add expense',
  'Añadir': 'Add',
  'Los comprobantes pueden guardarse como URL o subirse a Cloudinary en formato PDF o imagen. Los gastos anulados quedan fuera del total operativo.': 'Receipts can be stored as a URL or uploaded to Cloudinary as PDF or image. Cancelled expenses are excluded from the operating total.',
  'Total de gastos filtrados': 'Total filtered expenses',
  'Listado de gastos y egresos operativos registrados.': 'Registered operating expenses and outflows list.',
  'No hay gastos registrados aún.': 'No expenses registered yet.',
  'Descripción': 'Description',
  'Descripción *': 'Description *',
  'Monto *': 'Amount *',
  'Fecha del gasto *': 'Expense date *',
  'Nº comprobante / factura': 'Receipt / invoice No.',
  'Nº comprobante': 'Receipt No.',
  'Control operativo de egresos del gimnasio': 'Operational control of gym outflows',
  'Con comprobante': 'With receipt',
  'Gastos': 'Expenses',
  'Tipo': 'Type',
  'Tipo de gasto': 'Expense type',
  'Entidad': 'Entity',
  'Estado': 'Status',
  'Medio': 'Medium',
  'Medio de pago': 'Payment method',
  'Monto': 'Amount',
  'Fecha': 'Date',
  'Fecha del gasto': 'Expense date',
  'Vencimiento': 'Due date',
  'Fecha vencimiento': 'Due date',
  'Fecha de vencimiento': 'Due date',
  'Fecha pago': 'Payment date',
  'Fecha de pago': 'Payment date',
  'Comprobante': 'Receipt',
  'Acciones': 'Actions',
  'Comp.': 'Receipt',
  'Abrir comprobante': 'Open receipt',
  'Ver': 'View',
  'Editar': 'Edit',
  'Anular': 'Cancel',
  '¿Está seguro de anular el gasto?': 'Are you sure you want to cancel this expense?',
  'Gasto anulado correctamente': 'Expense cancelled successfully',
  'Error al anular gasto': 'Error cancelling expense',
  'Estado:': 'Status:',
  'Desde:': 'From:',
  'Hasta:': 'To:',
  'Búsqueda:': 'Search:',
  'Listado de gastos-egresos': 'expenses-outflows-list',
  'Total': 'Total',
  'Período desde': 'Period from',
  'Período hasta': 'Period to',
  'Observaciones': 'Notes',
  'Nuevo Gasto / Egreso': 'New expense / outflow',
  'Editar Gasto / Egreso': 'Edit expense / outflow',
  'Detalle de gasto / egreso': 'Expense / outflow detail',
  'Proveedor / entidad': 'Supplier / entity',
  'Sin comprobante adjunto': 'No receipt attached',
  'Subir PDF o imagen': 'Upload PDF or image',
  'Seleccionar archivo': 'Select file',
  'Sin archivo seleccionado': 'No file selected',
  'Subiendo...': 'Uploading...',
  'Formatos permitidos: PDF, PNG, JPG, WEBP, GIF, HEIC/HEIF. Máximo 10MB.': 'Allowed formats: PDF, PNG, JPG, WEBP, GIF, HEIC/HEIF. Max 10MB.',
  'URL del comprobante': 'Receipt URL',
  'URL de Cloudinary o comprobante externo': 'Cloudinary URL or external receipt',
  'Archivo:': 'File:',
  'Notas internas, detalle del gasto, condiciones de pago...': 'Internal notes, expense details, payment terms...',
  'Guardando...': 'Saving...',
  'Actualizar Gasto': 'Update expense',
  'Crear Gasto': 'Create expense',
  'Gasto actualizado': 'Expense updated',
  'Gasto creado': 'Expense created',
  'Error al guardar gasto': 'Error saving expense',
  'Comprobante subido correctamente': 'Receipt uploaded successfully',
  'Error al subir comprobante': 'Error uploading receipt',
  'Ej.: Factura de luz, reparación, insumos de limpieza...': 'Ex: electricity bill, repair, cleaning supplies...',
  'Ej.: Edesur, AFIP, alquiler, técnico...': 'Ex: Edesur, tax agency, rent, technician...',
  'Factura, ticket, transferencia...': 'Invoice, ticket, transfer...',
  'Efectivo': 'Cash',
  'Transferencia': 'Transfer',
  'Tarjeta débito': 'Debit card',
  'Tarjeta crédito': 'Credit card',
  'Mercado Pago': 'Mercado Pago',
  'Stripe': 'Stripe',
  'Otro': 'Other',
  'efectivo': 'cash',
  'transferencia': 'transfer',
  'tarjeta debito': 'debit card',
  'tarjeta credito': 'credit card',
  'mercado pago': 'mercado pago',
  'otro': 'other',
  'registros': 'records',
  'gastos': 'expenses',
};

export function translateOtrosGastosUi(locale: GymMasterLocale, text: string) {
  if (locale !== 'en') return text;
  return enOtrosGastosUi[text] ?? translateCommercialUi(locale, text);
}

export function getOtrosGastosEstadoLabel(locale: GymMasterLocale, estado?: string | null) {
  if (!estado) return translateOtrosGastosUi(locale, 'Sin estado');
  const normalized = estado.toLowerCase();
  const esLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return translateOtrosGastosUi(locale, esLabel);
}

export function getOtrosGastosMedioPagoLabel(locale: GymMasterLocale, medio?: string | null) {
  if (!medio) return '-';
  const normalized = medio.replace(/_/g, ' ');
  if (locale !== 'en') return normalized;
  return enOtrosGastosUi[normalized] ?? normalized;
}


function translateOtrosGastosTipoDescriptionByMeaning(normalized: string) {
  if (!normalized) return null;

  const compact = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hasAny = (...words: string[]) => words.some((word) => compact.includes(word));
  const hasAll = (...words: string[]) => words.every((word) => compact.includes(word));

  if (
    hasAny('sin descripcion', 'sin tipo') ||
    hasAll('sin', 'clasificar') ||
    hasAny('no clasificado', 'no clasificados')
  ) {
    return 'Unclassified expenses.';
  }

  if (hasAny('sueldo', 'jornal', 'liquidacion', 'carga social', 'nomina', 'personal', 'empleado', 'empleados')) {
    return 'Salaries, wages, payroll taxes, or staff settlements.';
  }

  if (hasAny('mantenimiento', 'infraestructura', 'equipamiento', 'reparacion')) {
    return 'Expenses related to equipment or infrastructure maintenance.';
  }

  if (hasAny('luz', 'agua', 'internet', 'software', 'servicio publico') || hasAll('otros', 'servicios')) {
    return 'Electricity, water, internet, software, or other services.';
  }

  if (hasAny('insumo', 'oficina', 'suministro')) {
    return 'Operating, cleaning, office, or maintenance supplies.';
  }

  if (hasAny('alquiler', 'renta', 'local', 'deposito')) {
    return 'Rent, facility rental, or operating spaces.';
  }

  if (hasAny('impuesto', 'tasa', 'fiscal', 'retencion')) {
    return 'Taxes, fees, or fiscal charges.';
  }

  if (hasAny('limpieza', 'higiene', 'desinfeccion')) {
    return 'Cleaning, hygiene, or disinfection.';
  }

  if (hasAny('marketing', 'publicidad', 'comunicacion', 'redes sociales', 'campana', 'diseño', 'diseno')) {
    return 'Marketing, advertising, or communications.';
  }

  if (hasAny('otro concepto', 'otros conceptos', 'otros gastos')) {
    return 'Other operating concepts.';
  }

  return null;
}

export function getOtrosGastosTipoLabel(locale: GymMasterLocale, value?: string | null) {
  if (!value) return translateOtrosGastosUi(locale, 'Sin clasificar');
  if (locale !== 'en') return value;

  const translated = translateOtrosGastosUi(locale, value);
  if (translated !== value) return translated;

  const normalized = value.trim().toLowerCase();
  const fallbackCatalog: Record<string, string> = {
    sueldos: 'Salaries',
    mantenimiento: 'Maintenance',
    servicios: 'Services',
    insumos: 'Supplies',
    alquiler: 'Rent',
    impuestos: 'Taxes',
    limpieza: 'Cleaning',
    marketing: 'Marketing',
    otros: 'Other',
    otro: 'Other',
    reparación: 'Repair',
    reparaciones: 'Repairs',
    'servicios públicos': 'Utilities',
    honorarios: 'Professional fees',
    'gastos asociados a mantenimiento de equipamiento o infraestructura.': 'Expenses related to equipment or infrastructure maintenance.',
    'gastos asociados a sueldos, jornales o liquidaciones del personal.': 'Expenses related to salaries, wages, or staff settlements.',
    'gastos asociados a servicios contratados, profesionales o tercerizados.': 'Expenses related to contracted, professional, or outsourced services.',
    'gastos asociados a insumos operativos, limpieza, oficina o mantenimiento.': 'Expenses related to operating, cleaning, office, or maintenance supplies.',
    'gastos asociados a alquileres, renta del local o espacios operativos.': 'Expenses related to rent, facility rental, or operating spaces.',
    'gastos asociados a impuestos, tasas o cargas fiscales.': 'Expenses related to taxes, fees, or fiscal charges.',
    'gastos asociados a limpieza, higiene o desinfección.': 'Expenses related to cleaning, hygiene, or disinfection.',
    'gastos asociados a marketing, publicidad o comunicación.': 'Expenses related to marketing, advertising, or communications.',
    'gastos asociados a otros conceptos operativos.': 'Expenses related to other operating concepts.',
    'gasto sin tipo asignado.': 'Expense without an assigned type.',
    'gastos no clasificados.': 'Unclassified expenses.',
    'gastos no clasificados': 'Unclassified expenses.',
    'otros gastos no clasificados.': 'Other unclassified expenses.',
    'otros gastos no clasificados': 'Other unclassified expenses.',
    'pagos mensuales a empleados.': 'Monthly payments to employees.',
    'pagos mensuales a empleados': 'Monthly payments to employees.',
    'pagos a empleados.': 'Payments to employees.',
    'pagos a empleados': 'Payments to employees.',
    'sin descripción de tipo.': 'No type description.',
    'sueldos, jornales, cargas sociales o liquidaciones del personal.': 'Salaries, wages, payroll taxes, or staff settlements.',
    'sueldos, jornales o liquidaciones del personal.': 'Salaries, wages, or staff settlements.',
    'gastos de sueldos, jornales o liquidaciones del personal.': 'Salary, wage, or staff settlement expenses.',
    'mantenimiento de equipamiento o infraestructura.': 'Equipment or infrastructure maintenance.',
    'reparaciones, mantenimiento de equipamiento o infraestructura.': 'Repairs and equipment or infrastructure maintenance.',
    'servicios contratados, profesionales o tercerizados.': 'Contracted, professional, or outsourced services.',
    'luz, agua, internet, software u otros servicios.': 'Electricity, water, internet, software, or other services.',
    'luz, agua, internet, software u otros servicios': 'Electricity, water, internet, software, or other services.',
    'servicios públicos, internet, software u otros servicios.': 'Utilities, internet, software, or other services.',
    'servicios públicos, internet, software u otros servicios': 'Utilities, internet, software, or other services.',
    'insumos operativos, limpieza, oficina o mantenimiento.': 'Operating, cleaning, office, or maintenance supplies.',
    'compra de insumos operativos, limpieza, oficina o mantenimiento.': 'Purchase of operating, cleaning, office, or maintenance supplies.',
    'alquileres, renta del local o espacios operativos.': 'Rent, facility rental, or operating spaces.',
    'alquiler del local, depósitos o espacios operativos.': 'Facility rent, storage, or operating spaces.',
    'impuestos, tasas o cargas fiscales.': 'Taxes, fees, or fiscal charges.',
    'impuestos, tasas, cargas fiscales o retenciones.': 'Taxes, fees, fiscal charges, or withholdings.',
    'limpieza, higiene o desinfección.': 'Cleaning, hygiene, or disinfection.',
    'productos o servicios de limpieza, higiene y desinfección.': 'Cleaning, hygiene, and disinfection products or services.',
    'marketing, publicidad o comunicación.': 'Marketing, advertising, or communications.',
    'publicidad, redes sociales, diseño o campañas comerciales.': 'Advertising, social media, design, or commercial campaigns.',
    'otros conceptos operativos.': 'Other operating concepts.',
    'otros gastos operativos no clasificados.': 'Other unclassified operating expenses.',
  };

  const exactFallback = fallbackCatalog[normalized];
  if (exactFallback) return exactFallback;

  const meaningFallback = translateOtrosGastosTipoDescriptionByMeaning(normalized);
  if (meaningFallback) return meaningFallback;

  return value
    .replace(/Gastos no clasificados\.?/gi, 'Unclassified expenses.')
    .replace(/Pagos mensuales a empleados\.?/gi, 'Monthly payments to employees.')
    .replace(/Pagos a empleados\.?/gi, 'Payments to employees.')
    .replace(/Gastos asociados a mantenimiento de equipamiento o infraestructura\.?/gi, 'Expenses related to equipment or infrastructure maintenance.')
    .replace(/Gastos asociados a sueldos, jornales o liquidaciones del personal\.?/gi, 'Expenses related to salaries, wages, or staff settlements.')
    .replace(/Gastos asociados a servicios contratados, profesionales o tercerizados\.?/gi, 'Expenses related to contracted, professional, or outsourced services.')
    .replace(/Gastos asociados a insumos operativos, limpieza, oficina o mantenimiento\.?/gi, 'Expenses related to operating, cleaning, office, or maintenance supplies.')
    .replace(/Gastos asociados a alquileres, renta del local o espacios operativos\.?/gi, 'Expenses related to rent, facility rental, or operating spaces.')
    .replace(/Gastos asociados a impuestos, tasas o cargas fiscales\.?/gi, 'Expenses related to taxes, fees, or fiscal charges.')
    .replace(/Gastos asociados a limpieza, higiene o desinfección\.?/gi, 'Expenses related to cleaning, hygiene, or disinfection.')
    .replace(/Gastos asociados a marketing, publicidad o comunicación\.?/gi, 'Expenses related to marketing, advertising, or communications.')
    .replace(/Gastos asociados a otros conceptos operativos\.?/gi, 'Expenses related to other operating concepts.');
}

export function translateOtrosGastosDescription(locale: GymMasterLocale, value?: string | null) {
  if (!value) return '-';
  if (locale !== 'en') return value;

  return value
    .replace(/^Gasto demo/i, 'Demo expense')
    .replace(/^Gasto/i, 'Expense')
    .replace(/^Luz$/i, 'Electricity')
    .replace(/^Comp\.:/i, 'Receipt:')
    .replace(/Proveedor demo operativo/gi, 'Demo operating supplier')
    .replace(/Sin clasificar/gi, 'Unclassified');
}
