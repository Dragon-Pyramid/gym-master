const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pagePath = path.join(root, 'src', 'app', 'dashboard', 'servicios', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');
const BACKUP_SUFFIX = '.bak_exportables_i18n_servicios_v1';

const SERVICE_EXPORT_HELPERS = `function serviceExportTx(locale: string, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeServiceExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\\s/.,;:()\"'¿?¡!+\\-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const SERVICE_EXPORT_TEXTS: Record<string, string> = {
  todos: "All",
  todas: "All",
  all: "All",
  activo: "Active",
  activos: "Active",
  active: "Active",
  inactivo: "Inactive",
  inactivos: "Inactive",
  inactive: "Inactive",
  si: "Yes",
  yes: "Yes",
  no: "No",
  servicio: "Service",
  servicios: "Services",
  listado_de_servicios: "Service list",
  alquiler: "Rental",
  rental: "Rental",
  premium: "Premium",
  otro: "Other",
  otros: "Other",
  other: "Other",
  evaluacion: "Assessment",
  assessment: "Assessment",
  nutricion: "Nutrition",
  nutrition: "Nutrition",
  clase_especial: "Special class",
  special_class: "Special class",
  pase: "Pass",
  pass: "Pass",
  personal_trainer: "Personal trainer",
  presencial: "In person",
  online: "Online",
  hibrido: "Hybrid",
  hybrid: "Hybrid",
  cama_solar: "Tanning bed",
  tanning_bed: "Tanning bed",
  servicio_de_cama_solar_incluye_bornceador_y_toalla: "Tanning bed service, includes bronzer and towel.",
  servicio_de_cama_solar_incluye_bronceador_y_toalla: "Tanning bed service, includes bronzer and towel.",
  servicio_de_orientacion_nutricional_basica_ofrecido_por_profesional_autorizado: "Basic nutritional guidance service provided by an authorized professional.",
  servicio_especial_1: "Special service 1",
  servicio_especial_2: "Special service 2",
  servicio_especial_3: "Special service 3",
  servicio_especial_4: "Special service 4",
  servicio_especial_5: "Special service 5",
  servicio_de_prueba_2: "Test service 2",
  es_un_servicio_de_prueba: "This is a test service.",
  testeo_nomas: "Test only",
  servicio_premium_mensual: "Monthly premium service",
  paquete_premium_mensual_con_beneficios_comerciales_adicionales_definidos_por_el_gimnasio: "Monthly premium package with additional commercial benefits defined by the gym.",
  orientacion_nutricional_basica: "Basic nutritional guidance",
};

function translateServiceExportText(locale: string, value?: string | null, fallback = "") {
  const original = String(value ?? fallback ?? "").trim();
  if (!original) return "";
  if (locale !== "en") return original;

  const normalized = normalizeServiceExportText(original);
  return SERVICE_EXPORT_TEXTS[normalized] ?? original;
}

function serviceNameExportLabel(locale: string, value?: string | null) {
  return translateServiceExportText(locale, value);
}

function serviceDescriptionExportLabel(locale: string, value?: string | null) {
  return translateServiceExportText(locale, value);
}

function serviceCategoryExportLabel(locale: string, value?: string | null) {
  const raw = String(value ?? "otro");
  const fromCatalog = CATEGORIA_LABELS[raw] ?? raw;
  return translateServiceExportText(locale, fromCatalog, serviceExportTx(locale, "Otro", "Other"));
}

function serviceBooleanExportLabel(locale: string, value: boolean) {
  return value ? serviceExportTx(locale, "Sí", "Yes") : serviceExportTx(locale, "No", "No");
}

function serviceStatusExportLabel(locale: string, active: boolean) {
  return active ? serviceExportTx(locale, "Activo", "Active") : serviceExportTx(locale, "Inactivo", "Inactive");
}

function serviceStatusFilterExportLabel(locale: string, filter: string) {
  if (filter === "todos") return serviceExportTx(locale, "Todos", "All");
  if (filter === "activos") return serviceExportTx(locale, "Activos", "Active");
  if (filter === "inactivos") return serviceExportTx(locale, "Inactivos", "Inactive");
  return translateServiceExportText(locale, filter);
}

function serviceCategoryFilterExportLabel(locale: string, filter: string) {
  return filter === "todas"
    ? serviceExportTx(locale, "Todas", "All")
    : serviceCategoryExportLabel(locale, filter);
}
`;

const SERVICE_EXPORT_PDF_BLOCK = `  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: serviceExportTx(locale, "Listado de Servicios", "Service list"),
        subtitle: serviceExportTx(
          locale,
          "Reporte de servicios adicionales disponibles para venta.",
          "Additional services available for sale report.",
        ),
        fileName: serviceExportTx(locale, "listado-servicios-gym-master", "gym-master-service-list"),
        locale,
        footerText: serviceExportTx(
          locale,
          "Documento generado por Gym Master.",
          "Document generated by Gym Master.",
        ),
        labels: {
          generated: serviceExportTx(locale, "Generado", "Generated"),
          page: serviceExportTx(locale, "Página", "Page"),
          of: serviceExportTx(locale, "de", "of"),
          detail: serviceExportTx(locale, "Detalle", "Details"),
          records: serviceExportTx(locale, "registros", "records"),
          empty: serviceExportTx(
            locale,
            "No hay registros para el filtro seleccionado.",
            "No records found for the selected filter.",
          ),
        },
        rows: filteredServicios,
        metrics: [
          { label: serviceExportTx(locale, "Servicios filtrados", "Filtered services"), value: filteredServicios.length },
          { label: serviceExportTx(locale, "Activos", "Active"), value: filteredServicios.filter((s) => s.activo).length },
          { label: serviceExportTx(locale, "Requieren reserva", "Require booking"), value: filteredServicios.filter((s) => s.requiere_reserva).length },
        ],
        filtersLabel:
          serviceExportTx(locale, "Estado", "Status") +
          ": " +
          serviceStatusFilterExportLabel(locale, filtroActivo) +
          " · " +
          serviceExportTx(locale, "Categoría", "Category") +
          ": " +
          serviceCategoryFilterExportLabel(locale, filtroCategoria) +
          (searchTerm.trim()
            ? " · " + serviceExportTx(locale, "Búsqueda", "Search") + ": " + searchTerm.trim()
            : ""),
        columns: [
          { header: serviceExportTx(locale, "Servicio", "Service"), width: 42, getValue: (s) => serviceNameExportLabel(locale, s.nombre) },
          { header: serviceExportTx(locale, "Categoría", "Category"), width: 26, getValue: (s) => serviceCategoryExportLabel(locale, String(s.categoria ?? "otro")) },
          { header: serviceExportTx(locale, "Descripción", "Description"), width: 60, getValue: (s) => s.descripcion ? serviceDescriptionExportLabel(locale, s.descripcion) : "-" },
          { header: serviceExportTx(locale, "Precio", "Price"), width: 20, getValue: (s) => \`$\${Number(s.precio || 0).toLocaleString("es-AR")}\`, align: "right" },
          { header: serviceExportTx(locale, "Duración", "Duration"), width: 18, getValue: (s) => s.duracion_minutos ? \`\${s.duracion_minutos} min\` : "-" },
          { header: serviceExportTx(locale, "Reserva", "Booking"), width: 18, getValue: (s) => serviceBooleanExportLabel(locale, Boolean(s.requiere_reserva)) },
          { header: serviceExportTx(locale, "Estado", "Status"), width: 20, getValue: (s) => serviceStatusExportLabel(locale, Boolean(s.activo)) },
        ],
      });
    } catch {
      toast.error(serviceExportTx(locale, "No se pudo generar el PDF de servicios", "Could not generate the services PDF"));
    }
  };
`;

const SERVICE_EXPORT_EXCEL_BLOCK = `  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(serviceExportTx(locale, "Servicios", "Services"));

    worksheet.columns = [
      { header: serviceExportTx(locale, "Nombre", "Name"), key: "nombre", width: 30 },
      { header: serviceExportTx(locale, "Categoría", "Category"), key: "categoria", width: 24 },
      { header: serviceExportTx(locale, "Descripción", "Description"), key: "descripcion", width: 44 },
      { header: serviceExportTx(locale, "Precio", "Price"), key: "precio", width: 15 },
      { header: serviceExportTx(locale, "Duración minutos", "Duration minutes"), key: "duracion_minutos", width: 18 },
      { header: serviceExportTx(locale, "Requiere reserva", "Requires booking"), key: "requiere_reserva", width: 18 },
      { header: serviceExportTx(locale, "Cupo máximo", "Max capacity"), key: "cupo_maximo", width: 14 },
      { header: serviceExportTx(locale, "Modalidad", "Mode"), key: "modalidad", width: 16 },
      { header: serviceExportTx(locale, "Disponible online", "Available online"), key: "disponible_online", width: 18 },
      { header: serviceExportTx(locale, "Observaciones", "Notes"), key: "observaciones", width: 40 },
      { header: serviceExportTx(locale, "Activo", "Active"), key: "activo", width: 12 },
    ];

    filteredServicios.forEach((s) => {
      worksheet.addRow({
        nombre: serviceNameExportLabel(locale, s.nombre),
        categoria: serviceCategoryExportLabel(locale, String(s.categoria ?? "otro")),
        descripcion: s.descripcion ? serviceDescriptionExportLabel(locale, s.descripcion) : "",
        precio: s.precio,
        duracion_minutos: s.duracion_minutos ?? "",
        requiere_reserva: serviceBooleanExportLabel(locale, Boolean(s.requiere_reserva)),
        cupo_maximo: s.cupo_maximo ?? "",
        modalidad: translateServiceExportText(locale, s.modalidad ?? "presencial"),
        disponible_online: serviceBooleanExportLabel(locale, Boolean(s.disponible_online)),
        observaciones: s.observaciones ? translateServiceExportText(locale, s.observaciones) : "",
        activo: serviceStatusExportLabel(locale, Boolean(s.activo)),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(
      serviceExportTx(locale, "listado-servicios", "service-list"),
      "xlsx",
    );
    a.click();
    window.URL.revokeObjectURL(url);
  };
`;

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

function patchServiciosPage() {
  let content = read(pagePath).replace(/\r\n/g, '\n');
  backup(pagePath);

  if (!content.includes('function serviceExportTx(')) {
    const categoryRegex = /const CATEGORIA_LABELS: Record<string, string> = \{[\s\S]*?\n\};\n/;
    const match = content.match(categoryRegex);
    if (!match) {
      throw new Error('No se pudo ubicar CATEGORIA_LABELS para insertar helpers de exportación.');
    }
    content = content.replace(match[0], `${match[0]}\n${SERVICE_EXPORT_HELPERS}\n`);
  }

  const startPdf = content.indexOf('  const handleDownloadPdf = async () => {');
  const startExcel = content.indexOf('  const handleExportExcel = async () => {');
  if (startPdf === -1 || startExcel === -1 || startExcel <= startPdf) {
    throw new Error('No se pudo ubicar handleDownloadPdf/handleExportExcel en servicios/page.tsx.');
  }

  content = content.slice(0, startPdf) + SERVICE_EXPORT_PDF_BLOCK + '\n' + content.slice(startExcel);

  const startExcel2 = content.indexOf('  const handleExportExcel = async () => {');
  let endExcel = content.indexOf('\n\n  useEffect(() => {', startExcel2);
  if (endExcel === -1) {
    endExcel = content.indexOf('\n\n  const load', startExcel2);
  }
  if (startExcel2 === -1 || endExcel === -1 || endExcel <= startExcel2) {
    throw new Error('No se pudo ubicar el final de handleExportExcel en servicios/page.tsx.');
  }

  content = content.slice(0, startExcel2) + SERVICE_EXPORT_EXCEL_BLOCK + content.slice(endExcel);

  ensureContains(content, 'fileName: serviceExportTx(locale, "listado-servicios-gym-master", "gym-master-service-list")', 'No se pudo internacionalizar el nombre del PDF.');
  ensureContains(content, 'labels: {', 'No se pudo agregar labels al PDF.');
  ensureContains(content, 'descripcion: s.descripcion ? serviceDescriptionExportLabel(locale, s.descripcion) : ""', 'No se pudo internacionalizar descripción en Excel.');
  write(pagePath, content);
  console.log('[OK] src/app/dashboard/servicios/page.tsx actualizado.');
}

patchCommercialReportPdfLocaleSupport();
patchServiciosPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
