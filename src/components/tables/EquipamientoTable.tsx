"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Equipamento } from "@/interfaces/equipamiento.interface";
import { calculateEquipamientoRisk, equipamientoRiskTone } from "@/utils/equipamientoRisk";
import { useI18n } from "@/i18n/I18nProvider";

const estadoColor = {
  operativo: "bg-green-500",
  "en mantenimiento": "bg-yellow-400",
  "fuera de servicio": "bg-red-500",
};

export default function EquipamientoTable({
  equipos,
  onEdit,
  onView,
  onDelete,
}: {
  equipos: Equipamento[];
  onEdit: (equipo: Equipamento) => void;
  onView?: (equipo: Equipamento) => void;
  onDelete?: (equipo: Equipamento) => void;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const tStatus = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "operativo": return tx("operativo", "operational");
      case "en mantenimiento": return tx("en mantenimiento", "under maintenance");
      case "fuera de servicio": return tx("fuera de servicio", "out of service");
      default: return String(value ?? "");
    }
  };
  const tRiskLevel = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "bajo": return tx("bajo", "low");
      case "medio": return tx("medio", "medium");
      case "alto": return tx("alto", "high");
      case "critico":
      case "crítico": return tx("crítico", "critical");
      default: return String(value ?? "");
    }
  };
  const tRiskFactor = (value?: string | null) => {
    switch (String(value ?? "").toLowerCase()) {
      case "fuera de servicio": return tx("fuera de servicio", "out of service");
      case "en mantenimiento": return tx("en mantenimiento", "under maintenance");
      case "sin próxima revisión": return tx("sin próxima revisión", "no next review");
      case "revisión vencida": return tx("revisión vencida", "overdue review");
      case "revisión urgente": return tx("revisión urgente", "urgent review");
      case "revisión próxima": return tx("revisión próxima", "upcoming review");
      case "score de reemplazo": return tx("score de reemplazo", "replacement score");
      case "fallas repetidas": return tx("fallas repetidas", "repeated failures");
      case "costo reciente": return tx("costo reciente", "recent cost");
      default: return String(value ?? "");
    }
  };
  const tRiskMessage = (value?: string | null) => {
    switch (String(value ?? "")) {
      case "Intervención prioritaria: el equipo puede afectar operación, seguridad o costos.":
        return tx("Intervención prioritaria: el equipo puede afectar operación, seguridad o costos.", "Priority intervention: this equipment may affect operations, safety, or costs.");
      case "Planificar revisión técnica: hay señales de mantenimiento o reemplazo.":
        return tx("Planificar revisión técnica: hay señales de mantenimiento o reemplazo.", "Plan a technical review: there are signs of maintenance needs or replacement.");
      case "Mantener seguimiento preventivo y revisar en la próxima ronda técnica.":
        return tx("Mantener seguimiento preventivo y revisar en la próxima ronda técnica.", "Maintain preventive follow-up and review in the next technical round.");
      case "Equipo sin señales críticas con los datos disponibles.":
        return tx("Equipo sin señales críticas con los datos disponibles.", "This equipment shows no critical signals with the available data.");
      default: return String(value ?? "");
    }
  };

  if (!equipos) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (equipos.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {tx("No hay equipos registrados aún.", "No equipment has been registered yet.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>{tx("Nombre", "Name")}</TableHead>
          <TableHead>{tx("Tipo", "Type")}</TableHead>
          <TableHead>{tx("Estado", "Status")}</TableHead>
          <TableHead>{tx("Riesgo", "Risk")}</TableHead>
          <TableHead>{tx("Ubicación", "Location")}</TableHead>
          <TableHead>{tx("Próxima Revisión", "Next review")}</TableHead>
          <TableHead>{tx("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipos.map((e) => {
          const riesgo = calculateEquipamientoRisk(e);

          return (
            <TableRow
              key={e.id}
              className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
            >
              <TableCell>{e.nombre}</TableCell>
              <TableCell>{e.tipo}</TableCell>
              <TableCell>
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${
                    estadoColor[e.estado] || "bg-gray-300"
                  }`}
                ></span>
                {tStatus(e.estado)}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold capitalize ${
                    equipamientoRiskTone[riesgo.nivel]
                  }`}
                  title={riesgo.factores.length ? riesgo.factores.map((factor) => tRiskFactor(factor)).join(", ") : tRiskMessage(riesgo.mensaje)}
                >
                  {tRiskLevel(riesgo.nivel)} · {riesgo.score}
                </span>
              </TableCell>
              <TableCell>{e.ubicacion}</TableCell>
              <TableCell>{e.proxima_revision}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView && onView(e)}
                >
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(e)}
                  title={tx("Editar", "Edit")}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                  onClick={() => onDelete && onDelete(e)}
                >
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>{tx("Total de equipos", "Total equipment")}</TableCell>
          <TableCell className="text-right">{equipos.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{tx("Listado de equipos registrados.", "List of registered equipment.")}</TableCaption>
    </Table>
  );
}
