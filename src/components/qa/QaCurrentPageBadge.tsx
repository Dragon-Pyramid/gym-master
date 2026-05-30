"use client";

import { usePathname } from "next/navigation";
import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";

const PAGE_FILES: Record<string, string> = {
  "/auth/login/admin": "src/app/auth/login/admin/page.tsx",
  "/auth/login": "src/app/auth/login/page.tsx",
  "/auth/login/socio": "src/app/auth/login/socio/page.tsx",
  "/dashboard/actividades": "src/app/dashboard/actividades/page.tsx",
  "/dashboard/admin": "src/app/dashboard/admin/page.tsx",
  "/dashboard/asistencias": "src/app/dashboard/asistencias/page.tsx",
  "/dashboard/asistencias/terminal": "src/app/dashboard/asistencias/terminal/page.tsx",
  "/dashboard/avisos": "src/app/dashboard/avisos/page.tsx",
  "/dashboard/bi-cuotas-pagos": "src/app/dashboard/bi-cuotas-pagos/page.tsx",
  "/dashboard/comercial": "src/app/dashboard/comercial/page.tsx",
  "/dashboard/control-asistencia": "src/app/dashboard/control-asistencia/page.tsx",
  "/dashboard/cuotas": "src/app/dashboard/cuotas/page.tsx",
  "/dashboard/dietas": "src/app/dashboard/dietas/page.tsx",
  "/dashboard/entrenadores": "src/app/dashboard/entrenadores/page.tsx",
  "/dashboard/equipamientos": "src/app/dashboard/equipamientos/page.tsx",
  "/dashboard/evolucion-fisica": "src/app/dashboard/evolucion-fisica/page.tsx",
  "/dashboard/ficha-medica": "src/app/dashboard/ficha-medica/page.tsx",
  "/dashboard/gestion-dietas": "src/app/dashboard/gestion-dietas/page.tsx",
  "/dashboard/gestor-dietas": "src/app/dashboard/gestor-dietas/page.tsx",
  "/dashboard/gestor-evolucion-fisica": "src/app/dashboard/gestor-evolucion-fisica/page.tsx",
  "/dashboard/gestor-rutinas": "src/app/dashboard/gestor-rutinas/page.tsx",
  "/dashboard/mi-cuenta/historial-pagos": "src/app/dashboard/mi-cuenta/historial-pagos/page.tsx",
  "/dashboard/mi-cuenta/pagar-cuota": "src/app/dashboard/mi-cuenta/pagar-cuota/page.tsx",
  "/dashboard/otros-gastos": "src/app/dashboard/otros-gastos/page.tsx",
  "/dashboard": "src/app/dashboard/page.tsx",
  "/dashboard/pagos": "src/app/dashboard/pagos/page.tsx",
  "/dashboard/parametrizacion": "src/app/dashboard/parametrizacion/page.tsx",
  "/dashboard/perfil": "src/app/dashboard/perfil/page.tsx",
  "/dashboard/productos": "src/app/dashboard/productos/page.tsx",
  "/dashboard/proveedores": "src/app/dashboard/proveedores/page.tsx",
  "/dashboard/rutinas/asistente": "src/app/dashboard/rutinas/asistente/page.tsx",
  "/dashboard/rutinas/media": "src/app/dashboard/rutinas/media/page.tsx",
  "/dashboard/rutinas": "src/app/dashboard/rutinas/page.tsx",
  "/dashboard/servicios": "src/app/dashboard/servicios/page.tsx",
  "/dashboard/socios": "src/app/dashboard/socios/page.tsx",
  "/dashboard/usuarios": "src/app/dashboard/usuarios/page.tsx",
  "/dashboard/ventas": "src/app/dashboard/ventas/page.tsx",
  "/dashboard/ventas-detalle": "src/app/dashboard/ventas-detalle/page.tsx",
  "/": "src/app/page.tsx",
  "/pago-exitoso": "src/app/pago-exitoso/page.tsx",
  "/pago-fallido": "src/app/pago-fallido/page.tsx",
  "/ranking-asistencias": "src/app/ranking-asistencias/page.tsx",
  "/swagger": "src/app/swagger/page.tsx",
};

const DYNAMIC_PAGE_FILES: Array<{ pattern: RegExp; file: string }> = [
  { pattern: new RegExp("^/dashboard/gestor-dietas/dieta/[^/]+/?$"), file: "src/app/dashboard/gestor-dietas/dieta/[idDieta]/page.tsx" },
  { pattern: new RegExp("^/dashboard/gestor-evolucion-fisica/socio/[^/]+/?$"), file: "src/app/dashboard/gestor-evolucion-fisica/socio/[socioId]/page.tsx" },
  { pattern: new RegExp("^/dashboard/gestor-rutinas/rutina/[^/]+/?$"), file: "src/app/dashboard/gestor-rutinas/rutina/[idRutina]/page.tsx" },
];

export function QaCurrentPageBadge() {
  const pathname = usePathname();
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const file =
    PAGE_FILES[normalizedPath] ??
    DYNAMIC_PAGE_FILES.find((entry) => entry.pattern.test(normalizedPath))?.file ??
    `Ruta no mapeada: ${normalizedPath}`;

  return <QaFileNameBadge file={file} position="fixed" />;
}
