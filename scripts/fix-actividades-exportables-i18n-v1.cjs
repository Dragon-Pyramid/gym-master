const fs = require('fs');
const path = require('path');

const root = process.cwd();
const actividadesPath = path.join(root, 'src', 'app', 'dashboard', 'actividades', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');

const BACKUP_SUFFIX = '.bak_exportables_i18n_actividades_v1';

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

function patchCommercialReportPdf() {
  let content = read(pdfPath).replace(/\r\n/g, '\n');
  backup(pdfPath);

  if (content.includes('CommercialReportLocale') && content.includes('getCommercialReportPdfLabel')) {
    console.log('[OK] commercialReportPdf.ts ya tiene soporte de locale.');
    return;
  }

  content = content.replace(
    `export interface CommercialReportMetric {`,
    `export type CommercialReportLocale = "es" | "en";\n\nexport interface CommercialReportLabels {\n  generated: string;\n  page: string;\n  of: string;\n  detail: string;\n  records: string;\n  empty: string;\n}\n\nconst DEFAULT_COMMERCIAL_REPORT_LABELS: Record<CommercialReportLocale, CommercialReportLabels> = {\n  es: {\n    generated: "Generado",\n    page: "Página",\n    of: "de",\n    detail: "Detalle",\n    records: "registros",\n    empty: "No hay registros para el filtro seleccionado.",\n  },\n  en: {\n    generated: "Generated",\n    page: "Page",\n    of: "of",\n    detail: "Details",\n    records: "records",\n    empty: "No records found for the selected filter.",\n  },\n};\n\nconst getCommercialReportPdfLabel = (\n  locale: CommercialReportLocale,\n  labels: Partial<CommercialReportLabels> | undefined,\n  key: keyof CommercialReportLabels\n): string => labels?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS[locale]?.[key] ?? DEFAULT_COMMERCIAL_REPORT_LABELS.es[key];\n\nexport interface CommercialReportMetric {`
  );

  content = content.replace(
    `  footerText?: string;\n}`,
    `  footerText?: string;\n  locale?: CommercialReportLocale;\n  labels?: Partial<CommercialReportLabels>;\n}`
  );

  content = content.replace(
    `const formatDateTime = (): string => {\n  return new Intl.DateTimeFormat("es-AR", {\n    dateStyle: "short",\n    timeStyle: "short",\n  }).format(new Date());\n};`,
    `const formatDateTime = (locale: CommercialReportLocale = "es"): string => {\n  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {\n    dateStyle: "short",\n    timeStyle: "short",\n  }).format(new Date());\n};`
  );

  content = content.replace(
    `  brandName: string,\n  brandSubtitle: string\n) => {`,
    `  brandName: string,\n  brandSubtitle: string,\n  locale: CommercialReportLocale,\n  labels?: Partial<CommercialReportLabels>\n) => {`
  );

  content = content.replace(
    'doc.text(`Generado: ${formatDateTime()}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "generated")}: ${formatDateTime(locale)}`, brandX, Math.min(generatedY, HEADER_HEIGHT + 1), {'
  );

  content = content.replace(
    `  footerText: string,\n  currentPage: number,\n  totalPages: number\n) => {`,
    `  footerText: string,\n  currentPage: number,\n  totalPages: number,\n  locale: CommercialReportLocale,\n  labels?: Partial<CommercialReportLabels>\n) => {`
  );

  content = content.replace(
    'doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {',
    'doc.text(`${getCommercialReportPdfLabel(locale, labels, "page")} ${currentPage} ${getCommercialReportPdfLabel(locale, labels, "of")} ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 5, {'
  );

  content = content.replace(
    `  brandName,\n  brandSubtitle,\n  footerText,\n}: DownloadCommercialReportPdfParams<T>): Promise<void> {`,
    `  brandName,\n  brandSubtitle,\n  footerText,\n  locale = "es",\n  labels,\n}: DownloadCommercialReportPdfParams<T>): Promise<void> {`
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

function patchActividadesPage() {
  let content = read(actividadesPath).replace(/\r\n/g, '\n');
  backup(actividadesPath);

  if (
    content.includes('activities-shifts-slots-gym-master') &&
    content.includes('workbook.addWorksheet(tx("Turnos", "Shifts"))') &&
    content.includes('activityExportFilterLabel(')
  ) {
    console.log('[OK] actividades/page.tsx ya tiene exportables ES/EN.');
    return;
  }

  if (!content.includes('function activityExportFilterLabel(')) {
    content = content.replace(
      `function translateActivityText(locale: ActivityLocale, value?: string | null, fallback = "") {\n  const original = String(value ?? fallback ?? "");\n  if (locale !== "en") return original;\n  const normalized = normalizeActivityText(original);\n  return ACTIVITY_TEXT_TRANSLATIONS[normalized] ?? original;\n}\n`,
      `function translateActivityText(locale: ActivityLocale, value?: string | null, fallback = "") {\n  const original = String(value ?? fallback ?? "");\n  if (locale !== "en") return original;\n  const normalized = normalizeActivityText(original);\n  return ACTIVITY_TEXT_TRANSLATIONS[normalized] ?? original;\n}\n\nfunction activityExportFilterLabel(\n  locale: ActivityLocale,\n  diaFilter: string,\n  estadoFilter: string,\n  searchTerm: string,\n) {\n  const day = diaFilter === "todos"\n    ? activityTx(locale, "todos", "all")\n    : diaLabel(Number(diaFilter), locale);\n  const status = estadoFilter === "todos"\n    ? activityTx(locale, "todos", "all")\n    : estadoLabel(estadoFilter, locale);\n  const search = searchTerm.trim() || activityTx(locale, "sin búsqueda", "no search");\n\n  return activityTx(locale, "Día", "Day") + ": " + day + "; " + activityTx(locale, "Estado", "Status") + ": " + status + "; " + activityTx(locale, "Búsqueda", "Search") + ": " + search;\n}\n`
    );
  }

  const replacements = [
    [`title: "Actividades, turnos y cupos",`, `title: tx("Actividades, turnos y cupos", "Activities, shifts and slots"),`],
    [`subtitle:\n          "Reporte operativo de clases, reservas, ocupación e inscripciones.",`, `subtitle: tx(\n          "Reporte operativo de clases, reservas, ocupación e inscripciones.",\n          "Operational report for classes, bookings, occupancy, and enrollments.",\n        ),`],
    [`fileName: "actividades-turnos-cupos-gym-master",`, `fileName: tx("actividades-turnos-cupos-gym-master", "activities-shifts-slots-gym-master"),\n        locale,\n        footerText: tx("Documento generado por Gym Master.", "Document generated by Gym Master."),\n        labels: {\n          generated: tx("Generado", "Generated"),\n          page: tx("Página", "Page"),\n          of: tx("de", "of"),\n          detail: tx("Detalle", "Details"),\n          records: tx("registros", "records"),\n          empty: tx("No hay registros para el filtro seleccionado.", "No records found for the selected filter."),\n        },`],
    [`label: "Actividades",`, `label: tx("Actividades", "Activities"),`],
    [`{ label: "Turnos", value: kpis?.total_turnos ?? 0 },`, `{ label: tx("Turnos", "Shifts"), value: kpis?.total_turnos ?? 0 },`],
    [`{ label: "Inscriptos", value: kpis?.inscriptos ?? 0 },`, `{ label: tx("Inscriptos", "Enrolled"), value: kpis?.inscriptos ?? 0 },`],
    [`{ label: "Cupos disponibles", value: kpis?.cupos_disponibles ?? 0 },`, `{ label: tx("Cupos disponibles", "Available slots"), value: kpis?.cupos_disponibles ?? 0 },`],
    [`label: "Ocupación promedio",`, `label: tx("Ocupación promedio", "Average occupancy"),`],
    ['filtersLabel: `Día: ${diaFilter === "todos" ? "todos" : diaLabel(Number(diaFilter))}; Estado: ${estadoFilter}; Búsqueda: ${turnoSearchTerm || "sin búsqueda"}`,', `filtersLabel: activityExportFilterLabel(locale, diaFilter, estadoFilter, turnoSearchTerm),`],
    [`getValue: (turno) => turno.actividad_nombre ?? "",`, `getValue: (turno) => translateActivityText(locale, turno.actividad_nombre),`],
    [`getValue: (turno) => turno.nombre_turno,`, `getValue: (turno) => translateActivityText(locale, turno.nombre_turno),`],
    [`header: "Día",`, `header: tx("Día", "Day"),`],
    [`getValue: (turno) => diaLabel(turno.dia_semana),`, `getValue: (turno) => diaLabel(turno.dia_semana, locale),`],
    [`header: "Horario",`, `header: tx("Horario", "Time"),`],
    [`header: "Cupo",`, `header: tx("Cupo", "Slots"),`],
    [`header: "Inscriptos",`, `header: tx("Inscriptos", "Enrolled"),`],
    [`header: "Ocupación",`, `header: tx("Ocupación", "Occupancy"),`],
    [`toast.error("No se pudo generar el PDF de actividades, turnos y cupos");`, `toast.error(tx("No se pudo generar el PDF de actividades, turnos y cupos", "Could not generate the activities, shifts, and slots PDF"));`],
    [`const actividadesSheet = workbook.addWorksheet("Actividades");`, `const actividadesSheet = workbook.addWorksheet(tx("Actividades", "Activities"));`],
    [`const turnosSheet = workbook.addWorksheet("Turnos");`, `const turnosSheet = workbook.addWorksheet(tx("Turnos", "Shifts"));`],
    [`const inscripcionesSheet = workbook.addWorksheet("Inscripciones");`, `const inscripcionesSheet = workbook.addWorksheet(tx("Inscripciones", "Enrollments"));`],
    [`{ header: "Creado en", key: "creado_en", width: 24 },`, `{ header: tx("Creado en", "Created at"), key: "creado_en", width: 24 },`],
    [`nombre_actividad: actividad.nombre_actividad,`, `nombre_actividad: translateActivityText(locale, actividad.nombre_actividad),`],
    [`{ header: "Día", key: "dia", width: 16 },`, `{ header: tx("Día", "Day"), key: "dia", width: 16 },`],
    [`{ header: "Horario", key: "horario", width: 18 },`, `{ header: tx("Horario", "Time"), key: "horario", width: 18 },`],
    [`{ header: "Ubicación", key: "ubicacion", width: 25 },`, `{ header: tx("Ubicación", "Location"), key: "ubicacion", width: 25 },`],
    [`{ header: "Estado", key: "estado", width: 16 },`, `{ header: tx("Estado", "Status"), key: "estado", width: 16 },`],
    [`{ header: "Cupo", key: "cupo", width: 10 },`, `{ header: tx("Cupo", "Slots"), key: "cupo", width: 10 },`],
    [`{ header: "Inscriptos", key: "inscriptos", width: 12 },`, `{ header: tx("Inscriptos", "Enrolled"), key: "inscriptos", width: 12 },`],
    [`{ header: "Lista espera", key: "lista_espera", width: 14 },`, `{ header: tx("Lista espera", "Waitlist"), key: "lista_espera", width: 14 },`],
    [`{ header: "Ocupación", key: "ocupacion", width: 14 },`, `{ header: tx("Ocupación", "Occupancy"), key: "ocupacion", width: 14 },`],
    [`actividad: turno.actividad_nombre,`, `actividad: translateActivityText(locale, turno.actividad_nombre),`],
    [`turno: turno.nombre_turno,`, `turno: translateActivityText(locale, turno.nombre_turno),`],
    [`dia: diaLabel(turno.dia_semana),`, `dia: diaLabel(turno.dia_semana, locale),`],
    [`ubicacion: turno.ubicacion,`, `ubicacion: translateActivityText(locale, turno.ubicacion),`],
    [`instructor: turno.instructor_nombre,`, `instructor: translateActivityText(locale, turno.instructor_nombre, tx("A confirmar", "To be confirmed")),`],
    [`estado: turno.estado,`, `estado: estadoLabel(turno.estado, locale),`],
    [`{ header: "Socio", key: "socio", width: 35 },`, `{ header: tx("Socio", "Member"), key: "socio", width: 35 },`],
    [`{ header: "Estado", key: "estado", width: 18 },`, `{ header: tx("Estado", "Status"), key: "estado", width: 18 },`],
    [`{ header: "Fecha inscripción", key: "fecha", width: 24 },`, `{ header: tx("Fecha inscripción", "Enrollment date"), key: "fecha", width: 24 },`],
    [`actividad: inscripcion.actividad_nombre,`, `actividad: translateActivityText(locale, inscripcion.actividad_nombre),`],
    [`turno: inscripcion.turno_nombre,`, `turno: translateActivityText(locale, inscripcion.turno_nombre),`],
    [`estado: estadoLabel(inscripcion.estado),`, `estado: socioEstadoLabel(inscripcion.estado, locale),`],
    [`"actividades-turnos-cupos",\n      "xlsx",`, `tx("actividades-turnos-cupos", "activities-shifts-slots"),\n      "xlsx",`],
  ];

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replace(from, to);
    }
  }

  // Cobertura defensiva por si el archivo real trae pequeñas diferencias de comillas o formato.
  content = content.replace(/title:\s*["']Actividades, turnos y cupos["']/g, 'title: tx("Actividades, turnos y cupos", "Activities, shifts and slots")');
  content = content.replace(/fileName:\s*["']actividades-turnos-cupos-gym-master["']/g, 'fileName: tx("actividades-turnos-cupos-gym-master", "activities-shifts-slots-gym-master")');
  content = content.replace(/workbook\.addWorksheet\(["']Actividades["']\)/g, 'workbook.addWorksheet(tx("Actividades", "Activities"))');
  content = content.replace(/workbook\.addWorksheet\(["']Turnos["']\)/g, 'workbook.addWorksheet(tx("Turnos", "Shifts"))');
  content = content.replace(/workbook\.addWorksheet\(["']Inscripciones["']\)/g, 'workbook.addWorksheet(tx("Inscripciones", "Enrollments"))');

  ensureContains(content, 'activityExportFilterLabel(locale, diaFilter, estadoFilter, turnoSearchTerm)', 'No se pudo internacionalizar la línea de filtros del PDF.');
  ensureContains(content, 'activities-shifts-slots-gym-master', 'No se pudo internacionalizar el fileName del PDF.');
  ensureContains(content, 'workbook.addWorksheet(tx("Turnos", "Shifts"))', 'No se pudo internacionalizar la hoja Turnos del Excel.');
  ensureContains(content, 'buildTimestampedDownloadFileName(\n      tx("actividades-turnos-cupos", "activities-shifts-slots")', 'No se pudo internacionalizar el nombre del Excel.');

  write(actividadesPath, content);
  console.log('[OK] src/app/dashboard/actividades/page.tsx actualizado.');
}

patchCommercialReportPdf();
patchActividadesPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
