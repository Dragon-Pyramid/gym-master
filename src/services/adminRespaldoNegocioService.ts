import ExcelJS from 'exceljs';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { getSupabaseServerClient } from '@/services/supabaseServerClient';

export type RespaldoFormato = 'xlsx' | 'json';

export type RespaldoModuloKey =
  | 'gimnasio_parametrizacion'
  | 'socios'
  | 'usuarios'
  | 'empleados'
  | 'empleados_sueldos'
  | 'cuotas'
  | 'pagos'
  | 'asistencias'
  | 'ventas'
  | 'venta_detalle'
  | 'compras'
  | 'compra_detalle'
  | 'productos'
  | 'proveedores'
  | 'servicios'
  | 'gastos_egresos'
  | 'mensajes_socios'
  | 'tickets_soporte';

type ExportColumn = {
  key: string;
  label: string;
  width?: number;
};

type ExportModuleDefinition = {
  key: RespaldoModuloKey;
  label: string;
  description: string;
  table: string;
  columns: ExportColumn[];
  safeForClientExport: boolean;
};

export type RespaldoModuloPublico = Pick<
  ExportModuleDefinition,
  'key' | 'label' | 'description' | 'safeForClientExport'
>;

export type RespaldoHistorialItem = {
  id: string;
  usuario_id: string | null;
  usuario_email: string | null;
  usuario_nombre: string | null;
  formato: RespaldoFormato;
  modulos: string[];
  registros_totales: number;
  estado: string;
  error: string | null;
  archivo_nombre: string | null;
  creado_en: string;
};

export type CreateRespaldoExportInput = {
  formato?: RespaldoFormato;
  modulos?: string[];
};

export type RespaldoExportResult = {
  fileName: string;
  contentType: string;
  buffer: Buffer;
};

const MAX_ROWS_PER_MODULE = 50000;

export const RESPLADO_NEGOCIO_MODULES: ExportModuleDefinition[] = [
  {
    key: 'gimnasio_parametrizacion',
    label: 'Datos del gimnasio',
    description: 'Parametrización comercial, legal y visual del gimnasio cliente.',
    table: 'gimnasio_parametrizacion',
    safeForClientExport: true,
    columns: [
      { key: 'nombre_comercial', label: 'Nombre comercial', width: 32 },
      { key: 'razon_social', label: 'Razón social', width: 34 },
      { key: 'identificacion_fiscal', label: 'CUIT / DNI fiscal', width: 22 },
      { key: 'condicion_fiscal', label: 'Condición fiscal', width: 24 },
      { key: 'domicilio_legal', label: 'Domicilio legal', width: 40 },
      { key: 'ciudad', label: 'Ciudad', width: 22 },
      { key: 'provincia', label: 'Provincia', width: 22 },
      { key: 'pais', label: 'País', width: 18 },
      { key: 'telefono', label: 'Teléfono', width: 20 },
      { key: 'email', label: 'Email', width: 34 },
      { key: 'sitio_web', label: 'Sitio web', width: 34 },
      { key: 'instagram_url', label: 'Instagram', width: 34 },
      { key: 'facebook_url', label: 'Facebook', width: 34 },
      { key: 'logo_url', label: 'Logo principal', width: 44 },
      { key: 'logo_alternativo_url', label: 'Logo alternativo', width: 44 },
      { key: 'color_primario', label: 'Color primario', width: 16 },
      { key: 'color_secundario', label: 'Color secundario', width: 16 },
      { key: 'color_acento', label: 'Color acento', width: 16 },
      { key: 'texto_legal_recibos', label: 'Texto legal recibos', width: 46 },
      { key: 'texto_legal_reportes', label: 'Texto legal reportes', width: 46 },
      { key: 'pie_pagina_documentos', label: 'Pie documentos', width: 46 },
      { key: 'actualizado_en', label: 'Actualizado en', width: 24 },
    ],
  },
  {
    key: 'socios',
    label: 'Socios',
    description: 'Datos operativos de socios, contacto, estado y datos de emergencia.',
    table: 'socio',
    safeForClientExport: true,
    columns: [
      { key: 'id_socio', label: 'ID socio', width: 38 },
      { key: 'usuario_id', label: 'ID usuario', width: 38 },
      { key: 'nombre_completo', label: 'Nombre completo', width: 32 },
      { key: 'dni', label: 'DNI', width: 18 },
      { key: 'email', label: 'Email', width: 34 },
      { key: 'telefono', label: 'Teléfono', width: 20 },
      { key: 'direccion', label: 'Dirección', width: 34 },
      { key: 'ciudad', label: 'Ciudad', width: 24 },
      { key: 'provincia', label: 'Provincia', width: 24 },
      { key: 'pais', label: 'País', width: 18 },
      { key: 'sexo', label: 'Sexo', width: 12 },
      { key: 'fecnac', label: 'Fecha nacimiento', width: 18 },
      { key: 'fecha_alta', label: 'Fecha alta', width: 18 },
      { key: 'fecha_baja', label: 'Fecha baja', width: 18 },
      { key: 'activo', label: 'Activo', width: 12 },
      { key: 'contacto_emergencia_nombre', label: 'Contacto emergencia', width: 28 },
      { key: 'contacto_emergencia_telefono', label: 'Teléfono emergencia', width: 24 },
    ],
  },
  {
    key: 'usuarios',
    label: 'Usuarios internos',
    description: 'Identidades operativas sin contraseña ni hash.',
    table: 'usuario',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID usuario', width: 38 },
      { key: 'nombre', label: 'Nombre', width: 32 },
      { key: 'email', label: 'Email', width: 34 },
      { key: 'rol', label: 'Rol', width: 16 },
      { key: 'dni', label: 'DNI', width: 18 },
      { key: 'activo', label: 'Activo', width: 12 },
      { key: 'must_change_password', label: 'Debe cambiar contraseña', width: 22 },
      { key: 'creado_en', label: 'Creado en', width: 24 },
      { key: 'ultimo_login_en', label: 'Último login', width: 24 },
    ],
  },
  {
    key: 'empleados',
    label: 'Empleados',
    description: 'Perfiles laborales internos del gimnasio.',
    table: 'empleados',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID empleado', width: 38 },
      { key: 'usuario_id', label: 'ID usuario', width: 38 },
      { key: 'nombre_completo', label: 'Nombre completo', width: 32 },
      { key: 'dni', label: 'DNI', width: 18 },
      { key: 'email', label: 'Email', width: 34 },
      { key: 'telefono', label: 'Teléfono', width: 20 },
      { key: 'puesto', label: 'Puesto', width: 28 },
      { key: 'area', label: 'Área', width: 24 },
      { key: 'tipo_contratacion', label: 'Tipo contratación', width: 24 },
      { key: 'turno', label: 'Turno', width: 18 },
      { key: 'sueldo_base', label: 'Sueldo base', width: 18 },
      { key: 'fecha_inicio', label: 'Fecha inicio', width: 18 },
      { key: 'fecha_fin', label: 'Fecha fin', width: 18 },
      { key: 'activo', label: 'Activo', width: 12 },
    ],
  },
  {
    key: 'empleados_sueldos',
    label: 'Sueldos',
    description: 'Liquidaciones y pagos de sueldos de empleados.',
    table: 'empleados_sueldos',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID sueldo', width: 38 },
      { key: 'empleado_id', label: 'ID empleado', width: 38 },
      { key: 'periodo', label: 'Período', width: 18 },
      { key: 'concepto', label: 'Concepto', width: 28 },
      { key: 'sueldo_base', label: 'Sueldo base', width: 18 },
      { key: 'bonos', label: 'Bonos', width: 18 },
      { key: 'descuentos', label: 'Descuentos', width: 18 },
      { key: 'monto_neto', label: 'Monto neto', width: 18 },
      { key: 'estado', label: 'Estado', width: 16 },
      { key: 'medio_pago', label: 'Medio pago', width: 22 },
      { key: 'fecha_pago', label: 'Fecha pago', width: 18 },
    ],
  },
  {
    key: 'cuotas',
    label: 'Cuotas',
    description: 'Precios y vigencias de cuotas configuradas.',
    table: 'cuota',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID cuota', width: 38 },
      { key: 'descripcion', label: 'Descripción', width: 34 },
      { key: 'monto', label: 'Monto', width: 18 },
      { key: 'periodo', label: 'Período', width: 18 },
      { key: 'fecha_inicio', label: 'Fecha inicio', width: 18 },
      { key: 'fecha_fin', label: 'Fecha fin', width: 18 },
      { key: 'activo', label: 'Activo', width: 12 },
    ],
  },
  {
    key: 'pagos',
    label: 'Pagos',
    description: 'Pagos de cuotas, períodos cubiertos y descuentos aplicados.',
    table: 'pago',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID pago', width: 38 },
      { key: 'socio_id', label: 'ID socio', width: 38 },
      { key: 'cuota_id', label: 'ID cuota', width: 38 },
      { key: 'fecha_pago', label: 'Fecha pago', width: 18 },
      { key: 'periodo_desde', label: 'Cubre desde', width: 18 },
      { key: 'periodo_hasta', label: 'Cubre hasta', width: 18 },
      { key: 'meses_cubiertos', label: 'Meses', width: 12 },
      { key: 'subtotal', label: 'Subtotal', width: 18 },
      { key: 'descuento_porcentaje', label: 'Descuento %', width: 18 },
      { key: 'descuento_monto', label: 'Descuento monto', width: 18 },
      { key: 'monto_pagado', label: 'Monto pagado', width: 18 },
      { key: 'metodo_pago', label: 'Método pago', width: 20 },
      { key: 'estado', label: 'Estado', width: 16 },
      { key: 'observaciones', label: 'Observaciones', width: 36 },
    ],
  },
  {
    key: 'asistencias',
    label: 'Asistencias',
    description: 'Registros de ingreso y egreso de socios.',
    table: 'asistencia',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID asistencia', width: 38 },
      { key: 'socio_id', label: 'ID socio', width: 38 },
      { key: 'fecha', label: 'Fecha', width: 18 },
      { key: 'hora_ingreso', label: 'Hora ingreso', width: 18 },
      { key: 'hora_egreso', label: 'Hora egreso', width: 18 },
      { key: 'creado_en', label: 'Creado en', width: 24 },
    ],
  },
  {
    key: 'ventas',
    label: 'Ventas',
    description: 'Ventas de productos/servicios a socios, visitantes o consumidor final.',
    table: 'venta',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID venta', width: 38 },
      { key: 'socio_id', label: 'ID socio', width: 38 },
      { key: 'cliente_tipo', label: 'Tipo cliente', width: 18 },
      { key: 'cliente_nombre', label: 'Cliente', width: 28 },
      { key: 'cliente_documento', label: 'Documento', width: 20 },
      { key: 'fecha', label: 'Fecha', width: 18 },
      { key: 'total', label: 'Total', width: 18 },
      { key: 'metodo_pago', label: 'Método pago', width: 20 },
      { key: 'estado', label: 'Estado', width: 16 },
      { key: 'comprobante_codigo', label: 'Comprobante', width: 24 },
      { key: 'observaciones', label: 'Observaciones', width: 36 },
    ],
  },
  {
    key: 'venta_detalle',
    label: 'Detalle de ventas',
    description: 'Ítems vendidos por operación comercial.',
    table: 'venta_detalle',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID detalle', width: 38 },
      { key: 'venta_id', label: 'ID venta', width: 38 },
      { key: 'producto_id', label: 'ID producto', width: 38 },
      { key: 'servicio_id', label: 'ID servicio', width: 38 },
      { key: 'item_tipo', label: 'Tipo ítem', width: 16 },
      { key: 'cantidad', label: 'Cantidad', width: 14 },
      { key: 'precio_unitario', label: 'Precio unitario', width: 18 },
      { key: 'descuento', label: 'Descuento', width: 18 },
      { key: 'subtotal', label: 'Subtotal', width: 18 },
      { key: 'total_linea', label: 'Total línea', width: 18 },
    ],
  },
  {
    key: 'compras',
    label: 'Compras',
    description: 'Compras a proveedores y comprobantes asociados.',
    table: 'compra',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID compra', width: 38 },
      { key: 'proveedor_id', label: 'ID proveedor', width: 38 },
      { key: 'fecha', label: 'Fecha', width: 18 },
      { key: 'estado', label: 'Estado', width: 16 },
      { key: 'medio_pago', label: 'Medio pago', width: 20 },
      { key: 'numero_comprobante', label: 'Comprobante', width: 24 },
      { key: 'total', label: 'Total', width: 18 },
      { key: 'observaciones', label: 'Observaciones', width: 36 },
    ],
  },
  {
    key: 'compra_detalle',
    label: 'Detalle de compras',
    description: 'Productos comprados, cantidades y costos unitarios.',
    table: 'compra_detalle',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID detalle', width: 38 },
      { key: 'compra_id', label: 'ID compra', width: 38 },
      { key: 'producto_id', label: 'ID producto', width: 38 },
      { key: 'cantidad', label: 'Cantidad', width: 14 },
      { key: 'costo_unitario', label: 'Costo unitario', width: 18 },
      { key: 'subtotal', label: 'Subtotal', width: 18 },
      { key: 'creado_en', label: 'Creado en', width: 24 },
    ],
  },
  {
    key: 'productos',
    label: 'Productos / stock',
    description: 'Catálogo comercial de productos, stock y precios vigentes.',
    table: 'producto',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID producto', width: 38 },
      { key: 'nombre', label: 'Nombre', width: 30 },
      { key: 'descripcion', label: 'Descripción', width: 36 },
      { key: 'sku', label: 'SKU', width: 22 },
      { key: 'codigo_barras', label: 'Código barras', width: 22 },
      { key: 'marca', label: 'Marca', width: 22 },
      { key: 'presentacion', label: 'Presentación', width: 22 },
      { key: 'unidad_medida', label: 'Unidad medida', width: 18 },
      { key: 'stock', label: 'Stock', width: 12 },
      { key: 'stock_minimo', label: 'Stock mínimo', width: 14 },
      { key: 'costo', label: 'Costo', width: 16 },
      { key: 'precio', label: 'Precio', width: 16 },
      { key: 'activo', label: 'Activo', width: 12 },
    ],
  },
  {
    key: 'proveedores',
    label: 'Proveedores',
    description: 'Datos comerciales y de contacto de proveedores.',
    table: 'proveedor',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID proveedor', width: 38 },
      { key: 'nombre', label: 'Nombre', width: 30 },
      { key: 'razon_social', label: 'Razón social', width: 32 },
      { key: 'identificacion_fiscal', label: 'Identificación fiscal', width: 24 },
      { key: 'contacto', label: 'Contacto', width: 28 },
      { key: 'email', label: 'Email', width: 34 },
      { key: 'telefono', label: 'Teléfono', width: 20 },
      { key: 'whatsapp', label: 'WhatsApp', width: 20 },
      { key: 'rubro', label: 'Rubro', width: 24 },
      { key: 'estado', label: 'Estado', width: 16 },
    ],
  },
  {
    key: 'servicios',
    label: 'Servicios',
    description: 'Servicios comerciales adicionales ofrecidos por el gimnasio.',
    table: 'servicio',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID servicio', width: 38 },
      { key: 'nombre', label: 'Nombre', width: 30 },
      { key: 'descripcion', label: 'Descripción', width: 36 },
      { key: 'precio', label: 'Precio', width: 16 },
      { key: 'activo', label: 'Activo', width: 12 },
    ],
  },
  {
    key: 'gastos_egresos',
    label: 'Gastos / egresos',
    description: 'Gastos operativos, vencimientos y comprobantes.',
    table: 'otros_gastos',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID gasto', width: 38 },
      { key: 'descripcion', label: 'Descripción', width: 36 },
      { key: 'monto', label: 'Monto', width: 18 },
      { key: 'fecha', label: 'Fecha', width: 18 },
      { key: 'estado', label: 'Estado', width: 16 },
      { key: 'medio_pago', label: 'Medio pago', width: 20 },
      { key: 'proveedor_nombre', label: 'Proveedor', width: 28 },
      { key: 'entidad', label: 'Entidad', width: 24 },
      { key: 'numero_comprobante', label: 'Comprobante', width: 24 },
      { key: 'fecha_vencimiento', label: 'Vencimiento', width: 18 },
      { key: 'fecha_pago', label: 'Fecha pago', width: 18 },
      { key: 'observaciones', label: 'Observaciones', width: 36 },
    ],
  },
  {
    key: 'mensajes_socios',
    label: 'Mensajes de socios',
    description: 'Consultas, reclamos y respuestas administrativas.',
    table: 'socio_mensaje',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID mensaje', width: 38 },
      { key: 'socio_id', label: 'ID socio', width: 38 },
      { key: 'usuario_id', label: 'ID usuario', width: 38 },
      { key: 'asunto', label: 'Asunto', width: 34 },
      { key: 'categoria', label: 'Categoría', width: 18 },
      { key: 'estado', label: 'Estado', width: 16 },
      { key: 'mensaje', label: 'Mensaje', width: 48 },
      { key: 'respuesta', label: 'Respuesta', width: 48 },
      { key: 'respondido_en', label: 'Respondido en', width: 24 },
      { key: 'cerrado_en', label: 'Cerrado en', width: 24 },
      { key: 'creado_en', label: 'Creado en', width: 24 },
    ],
  },
  {
    key: 'tickets_soporte',
    label: 'Tickets Dragon Pyramid',
    description: 'Tickets enviados por el gimnasio a soporte Dragon Pyramid.',
    table: 'soporte_ticket',
    safeForClientExport: true,
    columns: [
      { key: 'id', label: 'ID ticket', width: 38 },
      { key: 'codigo', label: 'Código', width: 24 },
      { key: 'categoria', label: 'Categoría', width: 18 },
      { key: 'prioridad', label: 'Prioridad', width: 18 },
      { key: 'estado', label: 'Estado', width: 18 },
      { key: 'asunto', label: 'Asunto', width: 34 },
      { key: 'descripcion', label: 'Descripción', width: 48 },
      { key: 'usuario_email', label: 'Usuario email', width: 34 },
      { key: 'creado_en', label: 'Creado en', width: 24 },
      { key: 'respondido_en', label: 'Respondido en', width: 24 },
      { key: 'cerrado_en', label: 'Cerrado en', width: 24 },
    ],
  },
];

function requireAdmin(user: JwtUser) {
  if (!user || user.rol !== 'admin') {
    throw new Error('No autorizado: solo administradores pueden exportar respaldos del negocio');
  }
}

function moduleMap() {
  return new Map(RESPLADO_NEGOCIO_MODULES.map((module) => [module.key, module]));
}

function normalizeModules(rawModules?: string[]) {
  const map = moduleMap();
  const unique = Array.from(new Set((rawModules ?? []).map((item) => String(item).trim()).filter(Boolean)));
  const selected = unique.length ? unique : RESPLADO_NEGOCIO_MODULES.map((module) => module.key);
  const invalid = selected.filter((key) => !map.has(key as RespaldoModuloKey));

  if (invalid.length) {
    throw new Error(`Módulos inválidos para exportación: ${invalid.join(', ')}`);
  }

  return selected.map((key) => map.get(key as RespaldoModuloKey)!);
}

function normalizeFormat(format?: string): RespaldoFormato {
  if (format === 'json' || format === 'xlsx') return format;
  return 'xlsx';
}

function toPlainValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

async function fetchRows(module: ExportModuleDefinition) {
  const supabase = getSupabaseServerClient();
  const selectColumns = module.columns.map((column) => column.key).join(',');

  const { data, error } = await supabase
    .from(module.table)
    .select(selectColumns)
    .limit(MAX_ROWS_PER_MODULE);

  if (error) {
    throw new Error(`No se pudo exportar ${module.label}: ${error.message}`);
  }

  return (data ?? []) as unknown as Array<Record<string, unknown>>;
}

async function createAudit(user: JwtUser, formato: RespaldoFormato, modules: ExportModuleDefinition[], fileName: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('admin_respaldo_exportacion')
    .insert({
      usuario_id: user.id,
      usuario_email: user.email,
      usuario_nombre: user.nombre ?? null,
      formato,
      modulos: modules.map((module) => module.key),
      registros_totales: 0,
      estado: 'generando',
      archivo_nombre: fileName,
      detalle: {
        alcance: 'datos_negocio_cliente',
        excluye: ['password_hash', 'tokens', 'secrets', 'migraciones_privadas', 'datasets_propietarios'],
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`No se pudo registrar auditoría de exportación: ${error.message}`);
  }

  return data.id as string;
}

async function finishAudit(id: string, estado: 'completado' | 'error', registrosTotales: number, errorMessage?: string) {
  const supabase = getSupabaseServerClient();
  await supabase
    .from('admin_respaldo_exportacion')
    .update({
      estado,
      registros_totales: registrosTotales,
      error: errorMessage ?? null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id);
}

function buildFileName(format: RespaldoFormato) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `gym-master-respaldo-negocio-${stamp}.${format === 'xlsx' ? 'xlsx' : 'json'}`;
}

async function buildXlsx(moduleRows: Array<{ module: ExportModuleDefinition; rows: Array<Record<string, unknown>> }>) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gym Master';
  workbook.created = new Date();

  const resumen = workbook.addWorksheet('Resumen');
  resumen.columns = [
    { header: 'Módulo', key: 'modulo', width: 34 },
    { header: 'Tabla origen', key: 'tabla', width: 28 },
    { header: 'Registros', key: 'registros', width: 16 },
  ];

  moduleRows.forEach(({ module, rows }) => {
    resumen.addRow({ modulo: module.label, tabla: module.table, registros: rows.length });
  });

  resumen.addRow({});
  resumen.addRow({ modulo: 'Alcance', tabla: 'Exportación operativa del negocio del gimnasio' });
  resumen.addRow({ modulo: 'Excluye', tabla: 'Contraseñas, secretos, tokens, migraciones privadas y know-how interno Dragon Pyramid' });

  moduleRows.forEach(({ module, rows }) => {
    const worksheetName = module.label.slice(0, 31).replace(/[\\/*?:\[\]]/g, ' ');
    const worksheet = workbook.addWorksheet(worksheetName);
    worksheet.columns = module.columns.map((column) => ({
      header: column.label,
      key: column.key,
      width: column.width ?? 22,
    }));

    rows.forEach((row) => {
      const output: Record<string, unknown> = {};
      module.columns.forEach((column) => {
        output[column.key] = toPlainValue(row[column.key]);
      });
      worksheet.addRow(output);
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function buildJson(moduleRows: Array<{ module: ExportModuleDefinition; rows: Array<Record<string, unknown>> }>) {
  const payload = {
    generado_en: new Date().toISOString(),
    sistema: 'Gym Master',
    alcance: 'datos_negocio_cliente',
    excluye: ['password_hash', 'tokens', 'secrets', 'migraciones_privadas', 'datasets_propietarios'],
    modulos: moduleRows.map(({ module, rows }) => ({
      key: module.key,
      label: module.label,
      table: module.table,
      registros: rows.length,
      rows: rows.map((row) => {
        const output: Record<string, unknown> = {};
        module.columns.forEach((column) => {
          output[column.key] = toPlainValue(row[column.key]);
        });
        return output;
      }),
    })),
  };

  return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
}

export function getRespaldoNegocioModules(user: JwtUser): RespaldoModuloPublico[] {
  requireAdmin(user);
  return RESPLADO_NEGOCIO_MODULES.map(({ key, label, description, safeForClientExport }) => ({
    key,
    label,
    description,
    safeForClientExport,
  }));
}

export async function getRespaldoNegocioHistory(user: JwtUser): Promise<RespaldoHistorialItem[]> {
  requireAdmin(user);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('admin_respaldo_exportacion')
    .select('id,usuario_id,usuario_email,usuario_nombre,formato,modulos,registros_totales,estado,error,archivo_nombre,creado_en')
    .order('creado_en', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`No se pudo consultar historial de exportaciones: ${error.message}`);
  }

  return (data ?? []) as RespaldoHistorialItem[];
}

export async function exportRespaldoNegocio(user: JwtUser, input: CreateRespaldoExportInput): Promise<RespaldoExportResult> {
  requireAdmin(user);
  const formato = normalizeFormat(input.formato);
  const modules = normalizeModules(input.modulos);
  const fileName = buildFileName(formato);
  const auditId = await createAudit(user, formato, modules, fileName);

  try {
    const moduleRows = [];
    let registrosTotales = 0;

    for (const module of modules) {
      const rows = await fetchRows(module);
      registrosTotales += rows.length;
      moduleRows.push({ module, rows });
    }

    const buffer = formato === 'xlsx' ? await buildXlsx(moduleRows) : buildJson(moduleRows);
    await finishAudit(auditId, 'completado', registrosTotales);

    return {
      fileName,
      contentType:
        formato === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/json; charset=utf-8',
      buffer,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al exportar respaldo';
    await finishAudit(auditId, 'error', 0, message);
    throw error;
  }
}
