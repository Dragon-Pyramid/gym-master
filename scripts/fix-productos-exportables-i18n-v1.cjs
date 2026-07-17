const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'productos', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');
const BACKUP_SUFFIX = '.bak_exportables_i18n_productos_v1';

const PRODUCTO_HELPER_MARKER = 'type StockFilter = "todos" | "activos" | "critico" | "sin_stock" | "inactivos";\n';
const PRODUCTO_EXPORT_HELPERS = "function productoExportTx(locale: string, es: string, en: string) {\n  return locale === 'en' ? en : es;\n}\n\nfunction normalizeProductoExportText(value?: string | null) {\n  return String(value ?? '')\n    .trim()\n    .normalize('NFD')\n    .replace(/[\\u0300-\\u036f]/g, '')\n    .toLowerCase()\n    .replace(/[\\s/-]+/g, '_');\n}\n\nconst PRODUCTO_EXPORT_TEXTS: Record<string, string> = {\n  todos: 'All',\n  todas: 'All',\n  activos: 'Active',\n  activo: 'Active',\n  active: 'Active',\n  inactivos: 'Inactive',\n  inactivo: 'Inactive',\n  inactive: 'Inactive',\n  discontinuados: 'Discontinued',\n  discontinuado: 'Discontinued',\n  critico: 'Critical stock',\n  stock_critico: 'Critical stock',\n  critical_stock: 'Critical stock',\n  sin_stock: 'Out of stock',\n  out_of_stock: 'Out of stock',\n  stock_ok: 'Stock OK',\n  ok: 'OK',\n  bajo_stock: 'Low stock',\n  low_stock: 'Low stock',\n  no: 'No',\n  si: 'Yes',\n  yes: 'Yes',\n  no_category: 'No category',\n  sin_categoria: 'No category',\n  categoria_no_encontrada: 'Category not found',\n  sin_proveedor_asignado: 'No supplier assigned',\n  proveedor_no_encontrado: 'Supplier not found',\n  bebidas: 'Drinks',\n  bebida: 'Drink',\n  suplementos: 'Supplements',\n  suplemento: 'Supplement',\n  accesorios: 'Accessories',\n  accesorio: 'Accessory',\n  higiene: 'Hygiene',\n  indumentaria: 'Apparel',\n  snacks: 'Snacks',\n  servicios: 'Services',\n  otros: 'Other',\n  otro: 'Other',\n  productos_no_clasificados: 'Unclassified products',\n  descripcion_del_producto_1: 'Product 1 description',\n  descripcion_del_producto_2: 'Product 2 description',\n  descripcion_del_producto_3: 'Product 3 description',\n  descripcion_del_producto_4: 'Product 4 description',\n  descripcion_del_producto_5: 'Product 5 description',\n  energizante: 'Energy drink',\n  bebida_isotonica_post_entrenamiento: 'Post-workout isotonic drink',\n  bebida_isotonica_post_entrenamiento_: 'Post-workout isotonic drink.',\n  barra_proteica_sabor_chocolate: 'Chocolate-flavored protein bar',\n  barra_proteica_sabor_chocolate_: 'Chocolate-flavored protein bar.',\n  creatina_monohidrato_micronizada: 'Micronized creatine monohydrate',\n  creatina_monohidrato_micronizada_: 'Micronized creatine monohydrate.',\n  proteina_de_suero_sabor_vainilla: 'Vanilla-flavored whey protein',\n  proteina_de_suero_sabor_vainilla_: 'Vanilla-flavored whey protein.',\n  shaker_para_suplementos: 'Supplement shaker',\n  shaker_para_suplementos_: 'Supplement shaker.',\n  guantes_basicos_para_entrenamiento: 'Basic training gloves',\n  guantes_basicos_para_entrenamiento_: 'Basic training gloves.',\n  toalla_deportiva_mediana: 'Medium sports towel',\n  toalla_deportiva_mediana_: 'Medium sports towel.',\n  agua_mineral_para_venta_rapida_en_kiosco: 'Mineral water for quick kiosk sales',\n  agua_mineral_para_venta_rapida_en_kiosco_: 'Mineral water for quick kiosk sales.',\n  sabor_neutro_300_grms: 'Neutral flavor 300 g',\n};\n\nfunction translateProductoExportText(locale: string, value?: string | null, fallback = '') {\n  const original = String(value ?? fallback ?? '').trim();\n  if (!original) return '';\n  if (locale !== 'en') return original;\n\n  const normalized = normalizeProductoExportText(original);\n  const genericProductMatch = normalized.match(/^producto_(\\d+)$/);\n  if (genericProductMatch) return 'Product ' + genericProductMatch[1];\n\n  const genericDescriptionMatch = normalized.match(/^descripcion_del_producto_(\\d+)$/);\n  if (genericDescriptionMatch) return 'Product ' + genericDescriptionMatch[1] + ' description';\n\n  return PRODUCTO_EXPORT_TEXTS[normalized] ?? original;\n}\n\nfunction stockFilterExportLabel(locale: string, filter: StockFilter) {\n  if (filter === 'todos') return productoExportTx(locale, 'Todos', 'All');\n  if (filter === 'activos') return productoExportTx(locale, 'Activos', 'Active');\n  if (filter === 'critico') return productoExportTx(locale, 'Stock crítico', 'Critical stock');\n  if (filter === 'sin_stock') return productoExportTx(locale, 'Sin stock', 'Out of stock');\n  if (filter === 'inactivos') return productoExportTx(locale, 'Inactivos / discontinuados', 'Inactive / discontinued');\n  return translateProductoExportText(locale, filter);\n}\n\nfunction getProductoExportFiltersLabel(locale: string, stockFilter: StockFilter, searchTerm: string) {\n  const search = searchTerm.trim();\n  return `${productoExportTx(locale, 'Filtro', 'Filter')}: ${stockFilterExportLabel(locale, stockFilter)}${search ? ` · ${productoExportTx(locale, 'Búsqueda', 'Search')}: ${search}` : ''}`;\n}\n";
const PRODUCTO_EXPORT_EXCEL_BLOCK = "  const handleExportExcel = async () => {\n    const workbook = new ExcelJS.Workbook();\n    const worksheet = workbook.addWorksheet(productoExportTx(locale, 'Productos', 'Products'));\n\n    worksheet.columns = [\n      { header: productoExportTx(locale, 'Producto', 'Product'), key: 'nombre', width: 30 },\n      { header: productoExportTx(locale, 'Descripción', 'Description'), key: 'descripcion', width: 38 },\n      { header: productoExportTx(locale, 'Categoría', 'Category'), key: 'categoria', width: 24 },\n      { header: productoExportTx(locale, 'Proveedor', 'Supplier'), key: 'proveedor', width: 30 },\n      { header: productoExportTx(locale, 'Precio', 'Price'), key: 'precio', width: 15 },\n      { header: productoExportTx(locale, 'Costo', 'Cost'), key: 'costo', width: 15 },\n      { header: productoExportTx(locale, 'Margen', 'Margin'), key: 'margen', width: 15 },\n      { header: 'Stock', key: 'stock', width: 10 },\n      { header: productoExportTx(locale, 'Stock mínimo', 'Minimum stock'), key: 'stock_minimo', width: 16 },\n      { header: productoExportTx(locale, 'Estado', 'Status'), key: 'estado', width: 18 },\n      { header: productoExportTx(locale, 'Activo', 'Active'), key: 'activo', width: 12 },\n    ];\n\n    filteredProductos.forEach((p) => {\n      worksheet.addRow({\n        nombre: translateProductoExportText(locale, p.nombre),\n        descripcion: translateProductoExportText(locale, p.descripcion),\n        categoria: translateProductoExportText(locale, getCategoriaNombre(p.id_categoria_producto)),\n        proveedor: translateProductoExportText(locale, getProveedorNombre(p.proveedor_id)),\n        precio: p.precio,\n        costo: p.costo ?? 0,\n        margen: Number(p.precio ?? 0) - Number(p.costo ?? 0),\n        stock: p.stock,\n        stock_minimo: p.stock_minimo ?? 5,\n        estado: translateProductoExportText(locale, getProductoStockEstado(p).replace(/_/g, ' ')),\n        activo: p.activo === false ? productoExportTx(locale, 'No', 'No') : productoExportTx(locale, 'Sí', 'Yes'),\n      });\n    });\n\n    worksheet.getRow(1).font = { bold: true };\n    worksheet.views = [{ state: 'frozen', ySplit: 1 }];\n\n    const buffer = await workbook.xlsx.writeBuffer();\n    const blob = new Blob([buffer], {\n      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    });\n    const url = window.URL.createObjectURL(blob);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = buildTimestampedDownloadFileName(\n      productoExportTx(locale, 'listado-productos', 'products-list'),\n      'xlsx',\n    );\n    a.click();\n    window.URL.revokeObjectURL(url);\n  };\n\n";
const PRODUCTO_EXPORT_PDF_BLOCK = "  const handleDownloadPdf = async () => {\n    try {\n      await downloadCommercialReportPdf({\n        title: productoExportTx(locale, 'Listado de Productos', 'Product list'),\n        subtitle: productoExportTx(\n          locale,\n          'Control operativo de productos, stock, proveedores y estado comercial.',\n          'Operational control of products, stock, suppliers and commercial status.',\n        ),\n        fileName: productoExportTx(locale, 'listado-productos-gym-master', 'gym-master-products-list'),\n        locale,\n        footerText: productoExportTx(\n          locale,\n          'Documento generado por Gym Master.',\n          'Document generated by Gym Master.',\n        ),\n        labels: {\n          generated: productoExportTx(locale, 'Generado', 'Generated'),\n          page: productoExportTx(locale, 'Página', 'Page'),\n          of: productoExportTx(locale, 'de', 'of'),\n          detail: productoExportTx(locale, 'Detalle', 'Details'),\n          records: productoExportTx(locale, 'registros', 'records'),\n          empty: productoExportTx(\n            locale,\n            'No hay registros para el filtro seleccionado.',\n            'No records found for the selected filter.',\n          ),\n        },\n        rows: filteredProductos,\n        metrics: [\n          { label: productoExportTx(locale, 'Productos activos', 'Active products'), value: metrics.activos },\n          { label: productoExportTx(locale, 'Stock crítico', 'Critical stock'), value: metrics.criticos },\n          { label: productoExportTx(locale, 'Sin stock', 'Out of stock'), value: metrics.sinStock },\n          { label: productoExportTx(locale, 'Inventario estimado', 'Estimated inventory'), value: formatCurrencyARS(metrics.valorInventario) },\n        ],\n        filtersLabel: getProductoExportFiltersLabel(locale, stockFilter, searchTerm),\n        columns: [\n          { header: productoExportTx(locale, 'Producto', 'Product'), width: 30, getValue: (p) => translateProductoExportText(locale, p.nombre) },\n          { header: productoExportTx(locale, 'Descripción', 'Description'), width: 34, getValue: (p) => p.descripcion ? translateProductoExportText(locale, p.descripcion) : '-' },\n          { header: productoExportTx(locale, 'Categoría', 'Category'), width: 25, getValue: (p) => translateProductoExportText(locale, getCategoriaNombre(p.id_categoria_producto)) },\n          { header: productoExportTx(locale, 'Proveedor', 'Supplier'), width: 30, getValue: (p) => translateProductoExportText(locale, getProveedorNombre(p.proveedor_id)) },\n          { header: productoExportTx(locale, 'Precio', 'Price'), width: 18, getValue: (p) => formatCurrencyARS(p.precio), align: 'right' },\n          { header: productoExportTx(locale, 'Costo', 'Cost'), width: 18, getValue: (p) => formatCurrencyARS(p.costo ?? 0), align: 'right' },\n          { header: productoExportTx(locale, 'Margen', 'Margin'), width: 18, getValue: (p) => formatCurrencyARS((p.precio ?? 0) - (p.costo ?? 0)), align: 'right' },\n          { header: 'Stock', width: 14, getValue: (p) => p.stock, align: 'right' },\n          { header: productoExportTx(locale, 'Stock mínimo', 'Minimum stock'), width: 20, getValue: (p) => p.stock_minimo ?? 5, align: 'right' },\n          { header: productoExportTx(locale, 'Estado', 'Status'), width: 22, getValue: (p) => translateProductoExportText(locale, getProductoStockEstado(p).replace(/_/g, ' ')) },\n          { header: productoExportTx(locale, 'Activo', 'Active'), width: 16, getValue: (p) => (p.activo === false ? productoExportTx(locale, 'No', 'No') : productoExportTx(locale, 'Sí', 'Yes')) },\n        ],\n      });\n    } catch {\n      toast.error(productoExportTx(locale, 'No se pudo generar el PDF de productos', 'Could not generate the products PDF'));\n    }\n  };";

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo esperado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function backup(filePath) {
  const backupPath = `${filePath}${BACKUP_SUFFIX}`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
}

function ensureContains(content, marker, message) {
  if (!content.includes(marker)) {
    throw new Error(message);
  }
}

function patchCommercialReportPdfLocaleSupport() {
  let content = read(pdfPath).replace(/\r\n/g, '\n');

  if (content.includes('CommercialReportLocale') && content.includes('getCommercialReportPdfLabel')) {
    console.log('[OK] commercialReportPdf.ts ya tiene soporte de locale.');
    return;
  }

  backup(pdfPath);

  content = content.replace(
    `export interface CommercialReportMetric {`,
    `export type CommercialReportLocale = "es" | "en";

export interface CommercialReportLabels {
  generated: string;
  page: string;
  of: string;
  detail: string;
  records: string;
  empty: string;
}

const DEFAULT_COMMERCIAL_REPORT_LABELS: Record<CommercialReportLocale, CommercialReportLabels> = {
  es: {
    generated: "Generado",
    page: "Página",
    of: "de",
    detail: "Detalle",
    records: "registros",
    empty: "No hay registros para el filtro seleccionado.",
  },
  en: {
    generated: "Generated",
    page: "Page",
    of: "of",
    detail: "Details",
    records: "records",
    empty: "No records found for the selected filter.",
  },
};

const getCommercialReportPdfLabel = (
  locale: CommercialReportLocale,
  labels: Partial<CommercialReportLabels> | undefined,
  key: keyof CommercialReportLabels
): string => labels?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS[locale]?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS.es[key];

export interface CommercialReportMetric {`
  );

  content = content.replace(
    `  footerText?: string;
}`,
    `  footerText?: string;
  locale?: CommercialReportLocale;
  labels?: Partial<CommercialReportLabels>;
}`
  );

  content = content.replace(
    `const formatDateTime = (): string => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
};`,
    `const formatDateTime = (locale: CommercialReportLocale = "es"): string => {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
};`
  );

  content = content.replace(
    `  brandName: string,
  brandSubtitle: string
) => {`,
    `  brandName: string,
  brandSubtitle: string,
  locale: CommercialReportLocale,
  labels?: Partial<CommercialReportLabels>
) => {`
  );

  content = content.replace(
    'doc.text(`Generado: ${formatDateTime()}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "generated")}: ${formatDateTime(locale)}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {'
  );

  content = content.replace(
    `  footerText: string,
  currentPage: number,
  totalPages: number
) => {`,
    `  footerText: string,
  currentPage: number,
  totalPages: number,
  locale: CommercialReportLocale,
  labels?: Partial<CommercialReportLabels>
) => {`
  );

  content = content.replace(
    'doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "page")} ${currentPage} ${getCommercialReportPdfLabel(locale, labels, "of")} ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {'
  );

  content = content.replace(
    `  brandName,
  brandSubtitle,
  footerText,
}: DownloadCommercialReportPdfParams<T>): Promise<void> {`,
    `  brandName,
  brandSubtitle,
  footerText,
  locale = "es",
  labels,
}: DownloadCommercialReportPdfParams<T>): Promise<void> {`
  );

  content = content.replaceAll(
    'addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle);',
    'addHeader(doc, pageWidth, logoDataUrl, title, subtitle, resolvedBrandName, resolvedBrandSubtitle, locale, labels);'
  );

  content = content.replace(
    'doc.text(`Detalle (${rows.length} registros)`, PAGE_MARGIN, y);',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "detail")} (${rows.length} ${getCommercialReportPdfLabel(locale, labels, "records")})`, PAGE_MARGIN, y);'
  );

  content = content.replace(
    'doc.text("No hay registros para el filtro seleccionado.", PAGE_MARGIN, y + 8);',
    'doc.text(getCommercialReportPdfLabel(locale, labels, "empty"), PAGE_MARGIN, y + 8);'
  );

  content = content.replace(
    'addFooter(doc, pageWidth, pageHeight, resolvedFooterText, page, pages);',
    'addFooter(doc, pageWidth, pageHeight, resolvedFooterText, page, pages, locale, labels);'
  );

  ensureContains(content, 'locale?: CommercialReportLocale;', 'No se pudo insertar locale en DownloadCommercialReportPdfParams.');
  ensureContains(content, 'getCommercialReportPdfLabel(locale, labels, "page")', 'No se pudo internacionalizar footer del PDF.');
  write(pdfPath, content);
  console.log('[OK] src/utils/commercialReportPdf.ts actualizado.');
}

function patchProductosPage() {
  let content = read(pagePath).replace(/\r\n/g, '\n');
  backup(pagePath);

  if (
    content.includes('function getProductoExportFiltersLabel(') &&
    content.includes("workbook.addWorksheet(productoExportTx(locale, 'Productos', 'Products'))") &&
    content.includes("title: productoExportTx(locale, 'Listado de Productos', 'Product list')") &&
    content.includes('filtersLabel: getProductoExportFiltersLabel(locale, stockFilter, searchTerm)')
  ) {
    console.log('[OK] productos/page.tsx ya tiene exportables ES/EN.');
    return;
  }

  if (!content.includes('function getProductoExportFiltersLabel(')) {
    if (!content.includes(PRODUCTO_HELPER_MARKER)) {
      throw new Error('No se pudo ubicar StockFilter para insertar helpers de productos exportables.');
    }
    content = content.replace(PRODUCTO_HELPER_MARKER, `${PRODUCTO_HELPER_MARKER}\n${PRODUCTO_EXPORT_HELPERS}`);
  }

  const startExcel = content.indexOf('  const handleExportExcel = async () => {');
  const startPdf = content.indexOf('  const handleDownloadPdf = async () => {');
  if (startExcel === -1 || startPdf === -1 || startPdf <= startExcel) {
    throw new Error('No se pudo ubicar handleExportExcel/handleDownloadPdf en productos/page.tsx.');
  }

  content = content.slice(0, startExcel) + PRODUCTO_EXPORT_EXCEL_BLOCK + content.slice(startPdf);

  const startPdf2 = content.indexOf('  const handleDownloadPdf = async () => {');
  const endPdf = content.indexOf('\n\n  useEffect(() => {', startPdf2);
  if (startPdf2 === -1 || endPdf === -1 || endPdf <= startPdf2) {
    throw new Error('No se pudo ubicar el final de handleDownloadPdf en productos/page.tsx.');
  }

  content = content.slice(0, startPdf2) + PRODUCTO_EXPORT_PDF_BLOCK + content.slice(endPdf);

  ensureContains(content, 'function getProductoExportFiltersLabel(', 'No se insertaron helpers de productos exportables.');
  ensureContains(content, "workbook.addWorksheet(productoExportTx(locale, 'Productos', 'Products'))", 'No se internacionalizó la hoja Excel.');
  ensureContains(content, "title: productoExportTx(locale, 'Listado de Productos', 'Product list')", 'No se internacionalizó título PDF.');
  ensureContains(content, 'filtersLabel: getProductoExportFiltersLabel(locale, stockFilter, searchTerm)', 'No se internacionalizaron filtros PDF.');
  ensureContains(content, "page: productoExportTx(locale, 'Página', 'Page')", 'No se internacionalizó footer PDF.');

  write(pagePath, content);
  console.log('[OK] src/app/dashboard/productos/page.tsx actualizado.');
}

patchCommercialReportPdfLocaleSupport();
patchProductosPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
