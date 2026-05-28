"use client";

import { useState } from "react";
import { Dieta } from "@/interfaces/dieta.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Target,
  Utensils,
} from "lucide-react";
import { descargarDietaPdf } from "@/utils/dietaPdf";

type PlanBlock = {
  title: string;
  items: string[];
};

const MEAL_ORDER = [
  "desayuno",
  "colacion media manana",
  "almuerzo",
  "colacion siesta",
  "merienda",
  "colacion tarde",
  "cena",
];

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  "colacion media manana": "Colación media mañana",
  almuerzo: "Almuerzo",
  "colacion siesta": "Colación siesta",
  merienda: "Merienda",
  "colacion tarde": "Colación tarde",
  cena: "Cena",
};

function normalizeMealTitle(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (normalized.includes("desayuno")) return "desayuno";
  if (normalized.includes("media manana") || normalized.includes("colacion manana")) {
    return "colacion media manana";
  }
  if (normalized.includes("almuerzo")) return "almuerzo";
  if (normalized.includes("siesta")) return "colacion siesta";
  if (normalized.includes("merienda")) return "merienda";
  if (normalized.includes("tarde")) return "colacion tarde";
  if (normalized.includes("cena")) return "cena";

  return normalized;
}

function orderPlanBlocks(blocks: PlanBlock[]) {
  return blocks
    .map((block, index) => {
      const key = normalizeMealTitle(block.title);
      const order = MEAL_ORDER.indexOf(key);

      return {
        ...block,
        title: MEAL_LABELS[key] || block.title,
        __order: order === -1 ? 999 + index : order,
      };
    })
    .sort((a, b) => a.__order - b.__order)
    .map(({ __order, ...block }) => block);
}

interface DietaDisplayProps {
  dieta: Dieta;
  onBack?: () => void;
  backLabel?: string;
}

function formatDate(date?: string) {
  if (!date) return "No disponible";

  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calculateDays(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function parsePlan(observaciones?: string): { blocks: PlanBlock[]; raw?: string } {
  if (!observaciones?.trim()) return { blocks: [] };

  try {
    const parsed = JSON.parse(observaciones);

    if (Array.isArray(parsed)) {
      const blocks = parsed.map((item, index) => ({
        title: item?.title || item?.comida || `Comida ${index + 1}`,
        items: Array.isArray(item?.items)
          ? item.items.map(String)
          : [item?.descripcion || item?.detalle || JSON.stringify(item)],
      }));
      return { blocks: orderPlanBlocks(blocks) };
    }

    if (typeof parsed === "object" && parsed !== null) {
      const blocks = Object.entries(parsed).map(([key, value]) => {
        if (Array.isArray(value)) {
          return {
            title: key,
            items: value.map(String),
          };
        }

        if (typeof value === "object" && value !== null) {
          const record = value as Record<string, unknown>;
          return {
            title: key,
            items: [
              String(
                record.descripcion ||
                  record.detalle ||
                  record.items ||
                  JSON.stringify(record)
              ),
            ],
          };
        }

        return {
          title: key,
          items: [String(value)],
        };
      });

      return { blocks: orderPlanBlocks(blocks) };
    }
  } catch {
    return { blocks: [], raw: observaciones };
  }

  return { blocks: [], raw: observaciones };
}

export default function DietaDisplay({
  dieta,
  onBack,
  backLabel = "Volver al Gestor de Dietas",
}: DietaDisplayProps) {
  const plan = parsePlan(dieta.observaciones);
  const duracion = calculateDays(dieta.fecha_inicio, dieta.fecha_fin);
  const [pdfLoading, setPdfLoading] = useState(false);
  const socioNombre = dieta.socio?.nombre_completo || dieta.socio_id || "Socio no disponible";

  const handleDescargarPdf = async () => {
    try {
      setPdfLoading(true);
      await descargarDietaPdf({ dieta, socioNombre });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Detalle de dieta</h1>
          <p className="text-sm text-muted-foreground">
            Plan alimentario asociado al socio. Vista administrativa de consulta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              {backLabel}
            </Button>
          )}
          <Button variant="outline" onClick={handleDescargarPdf} disabled={pdfLoading}>
            <Download className="w-4 h-4 mr-2" />
            {pdfLoading ? "Generando PDF..." : "Descargar PDF"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            {dieta.nombre_plan || "Dieta sin nombre"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="p-3 border rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Target className="w-4 h-4" /> Objetivo
            </div>
            <p className="mt-1 text-sm font-semibold">{dieta.objetivo || "No definido"}</p>
          </div>
          <div className="p-3 border rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="w-4 h-4" /> Inicio
            </div>
            <p className="mt-1 text-sm font-semibold">{formatDate(dieta.fecha_inicio)}</p>
          </div>
          <div className="p-3 border rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="w-4 h-4" /> Fin
            </div>
            <p className="mt-1 text-sm font-semibold">{formatDate(dieta.fecha_fin)}</p>
          </div>
          <div className="p-3 border rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock className="w-4 h-4" /> Duración
            </div>
            <p className="mt-1 text-sm font-semibold">
              {duracion > 0 ? `${duracion} días` : "No calculable"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Plan alimentario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.blocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {plan.blocks.map((block, index) => (
                <div key={`${block.title}-${index}`} className="p-4 border rounded-lg">
                  <h3 className="mb-2 text-sm font-semibold text-primary">
                    {block.title}
                  </h3>
                  <ul className="space-y-1 text-sm leading-relaxed list-disc list-inside text-muted-foreground">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : plan.raw ? (
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {plan.raw}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta dieta no tiene detalle alimentario registrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
