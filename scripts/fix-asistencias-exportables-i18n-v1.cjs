const fs = require('fs');
const path = require('path');

const root = process.cwd();
const asistenciasPath = path.join(root, 'src', 'app', 'dashboard', 'asistencias', 'page.tsx');
const pdfPath = path.join(root, 'src', 'utils', 'commercialReportPdf.ts');

const BACKUP_SUFFIX = '.bak_exportables_i18n_asistencias_v1';

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
  if (!fs.existsSync(pdfPath)) {
    console.log('[SKIP] src/utils/commercialReportPdf.ts no encontrado.');
    return;
  }

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

function patchAsistenciasPage() {
  let content = read(asistenciasPath).replace(/\r\n/g, '\n');
  backup(asistenciasPath);

  if (
    content.includes('attendance-list-gym-master') &&
    content.includes('workbook.addWorksheet(attendanceText("Asistencias", "Attendances"))') &&
    content.includes('getAttendancePeriodExportLabel(')
  ) {
    console.log('[OK] asistencias/page.tsx ya tiene exportables ES/EN.');
    return;
  }

  if (!content.includes('function getAttendancePeriodExportLabel(')) {
    content = content.replace(
      `function translateAforoMessage(message: string | undefined, isEnglish: boolean) {\n  if (!message) {\n    return isEnglish ? "No capacity data." : "Sin datos de aforo.";\n  }\n\n  if (!isEnglish) {\n    return message;\n  }\n\n  const translations: Record<string, string> = {\n    "Ocupación normal. Hay disponibilidad operativa.":\n      "Normal occupancy. Operational capacity is available.",\n    "Ocupación moderada. El gimnasio opera con margen disponible.":\n      "Moderate occupancy. The gym is operating with available margin.",\n    "Ocupación alta. Recomendado monitorear accesos y horarios pico.":\n      "High occupancy. Monitor access points and peak hours.",\n    "Ocupación crítica. Activar control de aforo y limitar nuevos ingresos.":\n      "Critical occupancy. Activate capacity control and limit new entries.",\n  };\n\n  return translations[message] ?? message;\n}\n`,
      `function translateAforoMessage(message: string | undefined, isEnglish: boolean) {\n  if (!message) {\n    return isEnglish ? "No capacity data." : "Sin datos de aforo.";\n  }\n\n  if (!isEnglish) {\n    return message;\n  }\n\n  const translations: Record<string, string> = {\n    "Ocupación normal. Hay disponibilidad operativa.":\n      "Normal occupancy. Operational capacity is available.",\n    "Ocupación moderada. El gimnasio opera con margen disponible.":\n      "Moderate occupancy. The gym is operating with available margin.",\n    "Ocupación alta. Recomendado monitorear accesos y horarios pico.":\n      "High occupancy. Monitor access points and peak hours.",\n    "Ocupación crítica. Activar control de aforo y limitar nuevos ingresos.":\n      "Critical occupancy. Activate capacity control and limit new entries.",\n  };\n\n  return translations[message] ?? message;\n}\n\nfunction getAttendancePeriodExportLabel(\n  periodFilter: string,\n  attendanceText: (es: string, en: string) => string,\n) {\n  const labels: Record<string, string> = {\n    todos: attendanceText("todos", "all"),\n    dia: attendanceText("hoy", "today"),\n    semana: attendanceText("últimos 7 días", "last 7 days"),\n    mes: attendanceText("mes actual", "current month"),\n    anio: attendanceText("año actual", "current year"),\n  };\n\n  return labels[periodFilter] ?? periodFilter;\n}\n`
    );
  }

  const startPdf = content.indexOf('  const handleDownloadPdf = async () => {');
  const startExcel = content.indexOf('  const handleExportExcel = async () => {');
  if (startPdf === -1 || startExcel === -1 || startExcel <= startPdf) {
    throw new Error('No se pudo ubicar handleDownloadPdf/handleExportExcel en asistencias/page.tsx.');
  }

  const newPdfBlock = [
    '  const handleDownloadPdf = async () => {',
    '    const periodLabel = getAttendancePeriodExportLabel(',
    '      periodFilter,',
    '      attendanceText,',
    '    );',
    '    const search = searchTerm.trim();',
    '    const filterParts = [',
    '      `${attendanceText("Período", "Period")}: ${periodLabel}` ,',
    '      fechaDesde ? `${attendanceText("Desde", "From")}: ${fechaDesde}` : "",',
    '      fechaHasta ? `${attendanceText("Hasta", "To")}: ${fechaHasta}` : "",',
    '      search ? `${attendanceText("Búsqueda", "Search")}: ${search}` : "",',
    '    ].filter(Boolean);',
    '',
    '    try {',
    '      await downloadCommercialReportPdf({',
    '        title: attendanceText("Listado de Asistencias", "Attendance list"),',
    '        subtitle: attendanceText(',
    '          "Reporte de ingresos, egresos y filtros de asistencia.",',
    '          "Check-in, check-out, and attendance filter report.",',
    '        ),',
    '        fileName: attendanceText(',
    '          "listado-asistencias-gym-master",',
    '          "attendance-list-gym-master",',
    '        ),',
    '        locale,',
    '        footerText: attendanceText(',
    '          "Documento generado por Gym Master.",',
    '          "Document generated by Gym Master.",',
    '        ),',
    '        labels: {',
    '          generated: attendanceText("Generado", "Generated"),',
    '          page: attendanceText("Página", "Page"),',
    '          of: attendanceText("de", "of"),',
    '          detail: attendanceText("Detalle", "Details"),',
    '          records: attendanceText("registros", "records"),',
    '          empty: attendanceText(',
    '            "No hay registros para el filtro seleccionado.",',
    '            "No records found for the selected filter.",',
    '          ),',
    '        },',
    '        rows: filteredAsistencias,',
    '        metrics: [',
    '          {',
    '            label: attendanceText(',
    '              "Asistencias filtradas",',
    '              "Filtered attendances",',
    '            ),',
    '            value: filteredAsistencias.length,',
    '          },',
    '        ],',
    '        filtersLabel: filterParts.join(" · "),',
    '        columns: [',
    '          {',
    '            header: attendanceText("Socio", "Member"),',
    '            width: 48,',
    '            getValue: (a) => a.socio?.nombre_completo || a.socio_id,',
    '          },',
    '          {',
    '            header: attendanceText("Fecha", "Date"),',
    '            width: 26,',
    '            getValue: (a) => a.fecha,',
    '          },',
    '          {',
    '            header: attendanceText("Hora ingreso", "Check-in time"),',
    '            width: 28,',
    '            getValue: (a) => a.hora_ingreso || "-",',
    '          },',
    '          {',
    '            header: attendanceText("Hora egreso", "Check-out time"),',
    '            width: 28,',
    '            getValue: (a) => a.hora_egreso || "-",',
    '          },',
    '          {',
    '            header: attendanceText("ID socio", "Member ID"),',
    '            width: 56,',
    '            getValue: (a) => a.socio_id,',
    '          },',
    '        ],',
    '      });',
    '    } catch {',
    '      toast.error(',
    '        attendanceText(',
    '          "No se pudo generar el PDF de asistencias",',
    '          "Could not generate the attendances PDF",',
    '        ),',
    '      );',
    '    }',
    '  };',
    '',
  ].join('\n');

  content = content.slice(0, startPdf) + newPdfBlock + content.slice(startExcel);

  const startExcel2 = content.indexOf('  const handleExportExcel = async () => {');
  const startDelete = content.indexOf('  const handleDeleteAsistencia = async', startExcel2);
  if (startExcel2 === -1 || startDelete === -1 || startDelete <= startExcel2) {
    throw new Error('No se pudo ubicar handleExportExcel/handleDeleteAsistencia en asistencias/page.tsx.');
  }

  const newExcelBlock = `  const handleExportExcel = async () => {\n    const workbook = new ExcelJS.Workbook();\n    const worksheet = workbook.addWorksheet(\n      attendanceText("Asistencias", "Attendances"),\n    );\n\n    worksheet.columns = [\n      {\n        header: attendanceText("ID Asistencia", "Attendance ID"),\n        key: "id",\n        width: 22,\n      },\n      {\n        header: attendanceText("Socio", "Member"),\n        key: "socio",\n        width: 32,\n      },\n      {\n        header: attendanceText("ID Socio", "Member ID"),\n        key: "socio_id",\n        width: 38,\n      },\n      { header: attendanceText("Fecha", "Date"), key: "fecha", width: 15 },\n      {\n        header: attendanceText("Hora ingreso", "Check-in time"),\n        key: "hora_ingreso",\n        width: 18,\n      },\n      {\n        header: attendanceText("Hora egreso", "Check-out time"),\n        key: "hora_egreso",\n        width: 18,\n      },\n    ];\n\n    filteredAsistencias.forEach((a) => {\n      worksheet.addRow({\n        id: a.id,\n        socio: a.socio?.nombre_completo || "",\n        socio_id: a.socio_id,\n        fecha: a.fecha,\n        hora_ingreso: a.hora_ingreso,\n        hora_egreso: a.hora_egreso,\n      });\n    });\n\n    worksheet.getRow(1).font = { bold: true };\n    worksheet.views = [{ state: "frozen", ySplit: 1 }];\n\n    const buffer = await workbook.xlsx.writeBuffer();\n    const blob = new Blob([buffer], {\n      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",\n    });\n    const url = window.URL.createObjectURL(blob);\n    const a = document.createElement("a");\n    a.href = url;\n    a.download = buildTimestampedDownloadFileName(\n      attendanceText("listado-asistencias", "attendance-list"),\n      "xlsx",\n    );\n    a.click();\n    window.URL.revokeObjectURL(url);\n  };\n\n`;

  content = content.slice(0, startExcel2) + newExcelBlock + content.slice(startDelete);

  content = content.replace(
    'toast.success("Asistencia eliminada correctamente");',
    'toast.success(attendanceText("Asistencia eliminada correctamente", "Attendance deleted successfully"));'
  );
  content = content.replace(
    'toast.error("Error al eliminar asistencia");',
    'toast.error(attendanceText("Error al eliminar asistencia", "Error deleting attendance"));'
  );
  content = content.replace(
    'toast.success(response.message || "Salida registrada correctamente");',
    'toast.success(response.message || attendanceText("Salida registrada correctamente", "Exit registered successfully"));'
  );
  content = content.replace(
    'toast.error((error as Error).message || "No se pudo registrar la salida");',
    'toast.error((error as Error).message || attendanceText("No se pudo registrar la salida", "Could not register the exit"));'
  );

  ensureContains(content, 'attendance-list-gym-master', 'No se pudo internacionalizar el fileName del PDF.');
  ensureContains(content, 'header: attendanceText("Socio", "Member")', 'No se pudo internacionalizar columna Socio/Member del PDF/Excel.');
  ensureContains(content, 'workbook.addWorksheet(\n      attendanceText("Asistencias", "Attendances")', 'No se pudo internacionalizar la hoja del Excel.');
  ensureContains(content, 'buildTimestampedDownloadFileName(\n      attendanceText("listado-asistencias", "attendance-list")', 'No se pudo internacionalizar el nombre del Excel.');

  write(asistenciasPath, content);
  console.log('[OK] src/app/dashboard/asistencias/page.tsx actualizado.');
}

patchCommercialReportPdf();
patchAsistenciasPage();
console.log('\nPatch aplicado. Ejecutá: rm -rf .next && npm run build');
