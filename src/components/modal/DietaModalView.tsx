"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Dieta } from "@/interfaces/dieta.interface";
import { Calendar, Target, User, FileText } from "lucide-react";
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';

interface DietaModalViewProps { open: boolean; onClose: () => void; dieta?: Dieta | null; }

export default function DietaModalView({ open, onClose, dieta }: DietaModalViewProps) {
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === 'en' ? en : es);
  if (!dieta) return null;

  const formatearFecha = (fecha: string) => formatFrontendDate(fecha, locale === 'en' ? 'en-US' : 'es-AR');
  const calcularDuracion = () => {
    if (!dieta.fecha_inicio || !dieta.fecha_fin) return 0;
    try {
      return Math.ceil(Math.abs(new Date(dieta.fecha_fin).getTime() - new Date(dieta.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24));
    } catch { return 0; }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <QaFileNameBadge file="src/components/modal/DietaModalView.tsx" />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold"><Target className="w-5 h-5 text-primary" />{dieta.nombre_plan}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium"><Calendar className="w-4 h-4 text-primary" />{tx('Fechas', 'Dates')}</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{tx('Inicio', 'Start')}: {formatearFecha(dieta.fecha_inicio)}</p>
                <p>{tx('Fin', 'End')}: {formatearFecha(dieta.fecha_fin)}</p>
                <p>{tx('Duración', 'Duration')}: {calcularDuracion()} {tx('días', 'days')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium"><Target className="w-4 h-4 text-primary" />{tx('Objetivo', 'Goal')}</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">{dieta.objetivo}</span>
            </div>
          </div>

          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium"><User className="w-4 h-4 text-primary" />{tx('Información del socio', 'Member information')}</div>
            <p className="text-sm text-muted-foreground">{tx('ID socio', 'Member ID')}: {dieta.socio_id}</p>
          </div>

          <Separator />
          {dieta.observaciones && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><FileText className="w-4 h-4 text-primary" />{tx('Plan alimentario', 'Meal plan')}</div>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const planAlimentario = JSON.parse(dieta.observaciones);
                      return Object.entries(planAlimentario).map(([comida, detalle]) => (
                        <div key={comida} className="p-3 border rounded-lg bg-muted/50">
                          <h4 className="mb-2 text-sm font-medium text-primary">{comida}</h4>
                          <p className="text-sm leading-relaxed text-muted-foreground">{(detalle as { descripcion: string })?.descripcion || tx('Sin descripción', 'No description')}</p>
                        </div>
                      ));
                    } catch {
                      return <div className="p-3 rounded-lg bg-muted"><p className="text-sm whitespace-pre-wrap text-muted-foreground">{dieta.observaciones}</p></div>;
                    }
                  })()}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium"><User className="w-4 h-4 text-primary" />{tx('Información adicional', 'Additional information')}</div>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>ID: {dieta.id}</p>
              <p>{tx('Creado por', 'Created by')}: {dieta.creado_por}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
