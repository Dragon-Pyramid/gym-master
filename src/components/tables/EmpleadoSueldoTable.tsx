"use client";

import { Button } from "@/components/ui/button";
import { EmpleadoSueldo } from "@/interfaces/empleado_sueldo.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { formatFrontendDate } from "@/utils/dateFormat";
import { Eye, FileText, Pencil, XCircle } from "lucide-react";

function estadoClass(estado: string) {
  if (estado === "pagado") return "bg-emerald-100 text-emerald-800";
  if (estado === "anulado") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export default function EmpleadoSueldoTable({
  sueldos,
  onView,
  onEdit,
  onAnular,
  onReceipt,
}: {
  sueldos: EmpleadoSueldo[];
  onView: (sueldo: EmpleadoSueldo) => void;
  onEdit: (sueldo: EmpleadoSueldo) => void;
  onAnular: (sueldo: EmpleadoSueldo) => void;
  onReceipt: (sueldo: EmpleadoSueldo) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3">Empleado</th>
            <th className="px-4 py-3">Período</th>
            <th className="px-4 py-3">Base</th>
            <th className="px-4 py-3">Bonos</th>
            <th className="px-4 py-3">Desc.</th>
            <th className="px-4 py-3">Neto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Pago</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sueldos.map((sueldo) => (
            <tr key={sueldo.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="font-semibold">{sueldo.empleado?.nombre_completo ?? "Empleado"}</div>
                <div className="text-xs text-muted-foreground">DNI {sueldo.empleado?.dni ?? "-"}</div>
              </td>
              <td className="px-4 py-3">{formatFrontendDate(sueldo.periodo)}</td>
              <td className="px-4 py-3">{formatCurrencyARS(sueldo.sueldo_base)}</td>
              <td className="px-4 py-3">{formatCurrencyARS(sueldo.bonos)}</td>
              <td className="px-4 py-3">{formatCurrencyARS(sueldo.descuentos)}</td>
              <td className="px-4 py-3 font-semibold">{formatCurrencyARS(sueldo.monto_neto)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoClass(sueldo.estado)}`}>
                  {sueldo.estado}
                </span>
              </td>
              <td className="px-4 py-3">{formatFrontendDate(sueldo.fecha_pago)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onView(sueldo)} title="Ver">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onReceipt(sueldo)} title="Recibo PDF">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onEdit(sueldo)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {sueldo.estado !== "anulado" ? (
                    <Button type="button" size="sm" variant="destructive" onClick={() => onAnular(sueldo)} title="Anular">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {sueldos.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                No hay sueldos registrados para los filtros seleccionados.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
