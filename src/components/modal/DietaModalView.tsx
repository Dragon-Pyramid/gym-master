"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Dieta } from "@/interfaces/dieta.interface";
import { Calendar, Target, User, FileText } from "lucide-react";

interface DietaModalViewProps {
  open: boolean;
  onClose: () => void;
  dieta?: Dieta | null;
}

export default function DietaModalView({
  open,
  onClose,
  dieta,
}: DietaModalViewProps) {
  if (!dieta) return null;

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calcularDuracion = () => {
    if (!dieta.fecha_inicio || !dieta.fecha_fin) return 0;
    try {
      const inicio = new Date(dieta.fecha_inicio);
      const fin = new Date(dieta.fecha_fin);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Target className="w-5 h-5 text-primary" />
            {dieta.nombre_plan}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                Fechas
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Inicio: {formatearFecha(dieta.fecha_inicio)}</p>
                <p>Fin: {formatearFecha(dieta.fecha_fin)}</p>
                <p>Duración: {calcularDuracion()} días</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                Objetivo
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {dieta.objetivo}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-primary" />
              Información del Socio
            </div>
            <p className="text-sm text-muted-foreground">
              ID Socio: {dieta.socio_id}
            </p>
          </div>

          <Separator />

          {dieta.observaciones && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-primary" />
                  Plan Alimentario
                </div>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const planAlimentario = JSON.parse(dieta.observaciones);
                      return Object.entries(planAlimentario).map(
                        ([comida, detalle]) => (
                          <div
                            key={comida}
                            className="p-3 border rounded-lg bg-muted/50"
                          >
                            <h4 className="mb-2 text-sm font-medium text-primary">
                              {comida}
                            </h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {(detalle as { descripcion: string })
                                ?.descripcion || "Sin descripción"}
                            </p>
                          </div>
                        )
                      );
                    } catch {
                      return (
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                            {dieta.observaciones}
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-primary" />
              Información Adicional
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>ID: {dieta.id}</p>
              <p>Creado por: {dieta.creado_por}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
