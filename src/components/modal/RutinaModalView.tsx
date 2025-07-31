"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rutina } from "@/interfaces/rutina.interface";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Eye } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

function EjerciciosModal({
  open,
  onClose,
  rutina,
}: {
  open: boolean;
  onClose: () => void;
  rutina: Rutina;
}) {
  const [gifEjercicio, setGifEjercicio] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const obtenerEjerciciosPorDia = () => {
    try {
      if (rutina.rutina_desc && rutina.rutina_desc.semana) {
        return rutina.rutina_desc.semana;
      }
      return {};
    } catch {
      return {};
    }
  };

  const ejerciciosPorDia = obtenerEjerciciosPorDia();
  const dias = Object.keys(ejerciciosPorDia);

  const handleExportarPDF = async () => {
    setExportando(true);
    const content: any[] = [
      { text: "Ejercicios por día", style: "header", margin: [0, 0, 0, 10] },
    ];
    for (const dia of dias) {
      content.push({ text: dia, style: "subheader", margin: [0, 10, 0, 4] });
      if (ejerciciosPorDia[dia] && ejerciciosPorDia[dia].length > 0) {
        const tableBody = [
          ["Ejercicio", "Series", "Repeticiones"],
          ...ejerciciosPorDia[dia].map((ej: any) => [
            ej.ejercicio,
            ej.series.toString(),
            ej.repeticiones.toString(),
          ]),
        ];
        content.push({
          table: { body: tableBody },
          layout: "lightHorizontalLines",
        });
      } else {
        content.push({ text: "Descanso", italics: true });
      }
    }
    pdfMake
      .createPdf({
        content,
        styles: {
          header: { fontSize: 18, bold: true },
          subheader: { fontSize: 14, bold: true },
        },
        defaultStyle: { font: "Roboto" },
      })
      .download("ejercicios.pdf");
    setExportando(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Ejercicios por día
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end mb-2">
          <Button onClick={handleExportarPDF} disabled={exportando}>
            {exportando ? "Exportando..." : "Exportar a PDF"}
          </Button>
        </div>
        <div className="w-full">
          <Accordion type="single" collapsible className="w-full">
            {dias.map((dia) => (
              <AccordionItem key={dia} value={dia}>
                <AccordionTrigger className="text-base text-foreground">
                  {dia}
                </AccordionTrigger>
                <AccordionContent>
                  {ejerciciosPorDia[dia] && ejerciciosPorDia[dia].length > 0 ? (
                    <ul className="space-y-3">
                      {ejerciciosPorDia[dia].map((ej: any, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className="font-medium text-foreground">
                              {ej.ejercicio}
                            </span>
                            <span className="text-sm text-foreground">
                              Series: {ej.series}
                            </span>
                            <span className="text-sm text-foreground">
                              Reps: {ej.repeticiones}
                            </span>
                            <span className="text-sm text-foreground">
                              Descanso: {ej.descanso}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setGifEjercicio(`${dia}-${idx}`)}
                          >
                            <Eye className="w-5 h-5" />
                          </Button>
                          {gifEjercicio === `${dia}-${idx}` && (
                            <div className="flex flex-col items-center w-full mt-2">
                              <img
                                src={ej.imagen}
                                alt="gif ejercicio"
                                className="w-full h-auto max-w-xs rounded-md"
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setGifEjercicio(null)}
                                >
                                  Cerrar
                                </Button>
                                <a
                                  href={ej.imagen}
                                  download={`ejercicio-${ej.ejercicio}.gif`}
                                  className="inline-block"
                                >
                                  <Button size="sm" variant="outline">
                                    Descargar GIF
                                  </Button>
                                </a>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground">Descanso</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RutinaModalView({
  open,
  onClose,
  rutina,
}: {
  open: boolean;
  onClose: () => void;
  rutina?: Rutina | null;
}) {
  const [modalEjercicios, setModalEjercicios] = useState(false);

  if (!rutina) return null;

  const obtenerDiasRutina = () => {
    try {
      if (rutina.rutina_desc && rutina.rutina_desc.semana) {
        return Object.keys(rutina.rutina_desc.semana);
      }
      return [];
    } catch {
      return [];
    }
  };

  const diasRutina = obtenerDiasRutina();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Detalle Rutina
            </DialogTitle>
            <div className="text-sm text-right text-muted-foreground">
              {new Date().toLocaleString()}
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nombre
                </label>
                <div className="p-2 border rounded-md bg-muted text-foreground border-border">
                  {rutina.nombre || "-"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Semana
                </label>
                <div className="p-2 border rounded-md bg-muted text-foreground border-border">
                  {rutina.semana || "-"}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Creado en
                </label>
                <div className="p-2 border rounded-md bg-muted text-foreground border-border">
                  {rutina.creado_en
                    ? new Date(rutina.creado_en).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Días
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-muted text-foreground border-border">
                  <span className="truncate">
                    {diasRutina.join(", ") || "-"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModalEjercicios(true)}
                  >
                    Ver ejercicios
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <EjerciciosModal
        open={modalEjercicios}
        onClose={() => setModalEjercicios(false)}
        rutina={rutina}
      />
    </>
  );
}
