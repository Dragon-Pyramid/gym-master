"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

pdfMake.vfs = pdfFonts.vfs;

const dietaHardcode = [
  {
    title: "Desayuno",
    items: [
      "5 claras + 2 rodajas de pan integral + 2 cucharadas de té de mantequilla de maní",
      "Infusión",
      "Multivitaminicos",
    ],
  },
  {
    title: "Colación",
    items: ["Batido de prote + 10 nueces o almendras"],
  },
  {
    title: "Almuerzo",
    items: ["150gr de carne + verduras verdes + 100gr de arroz parboil"],
  },
  {
    title: "Antes de entrenar",
    items: [
      "Tomó bcaa + glutamina",
      "Entreno musculación + turno de Cardio",
      "Batido de proteína",
    ],
  },
  {
    title: "Merienda",
    items: [
      "4 claras + 50gr de avena + 1 banana (tortilla d avena)",
      "Infusión",
    ],
  },
  {
    title: "Colación",
    items: ["1 lata de atún + 1 tomate + 6 aceitunas"],
  },
  {
    title: "Cena",
    items: ["180gr de carne + ensalada de verduras verdes + 80gr de coreanito"],
  },
];

const verdurasVerdes = [
  "Lechuga",
  "Acelga",
  "Espinaca",
  "Pimiento rojo o verde",
  "Cebolla",
  "Chauchas",
  "Apio",
  "Brocoli",
  "Rucula",
  "Zapallito verde",
  "Coliflor",
  "Berenjenas",
  "Pepino",
];

const notas = [
  "infusion: te, mate, café (con edulcorante)",
  "cocinar los alimentos con fritolin",
  "sal y condimentos normal",
  "4lts de agua al día mínimo",
  "gaseosas y bebidas cero, jugo clight, jugo natural de pomelo y limón",
  "podes usar Mostaza",
  "pesar los alimentos una vez cocinados.",
  "comer cada 3hs",
];

export default function DietasViewModal({
  open,
  onClose,
  dieta,
}: {
  open: boolean;
  onClose: () => void;
  dieta?: any | null;
}) {
  const [showOpciones, setShowOpciones] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const handleExportPDF = () => {
    if (pdfExporting) return;
    setPdfExporting(true);
    setTimeout(() => {
      const content: any[] = [
        {
          text: "Detalle de la dieta",
          style: "header",
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              width: "50%",
              stack: [
                { text: "Objetivo:", bold: true },
                {
                  text: dieta?.objetivo || "No especificado",
                  margin: [0, 0, 0, 8],
                },
                { text: "Fecha:", bold: true },
                {
                  text: dieta?.fecha || "No especificada",
                  margin: [0, 0, 0, 8],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          text: "Plan Alimentario",
          style: "subheader",
          margin: [0, 0, 0, 6],
        },
        ...dietaHardcode.map((bloque) => ({
          text: `${bloque.title}\n${bloque.items
            .map((item) => `- ${item}`)
            .join("\n")}`,
          margin: [0, 0, 0, 4],
        })),
        {
          text: "Opciones de verduras verdes",
          style: "subheader",
          margin: [0, 10, 0, 4],
        },
        {
          ul: [...verdurasVerdes],
          margin: [0, 0, 0, 8],
        },
        {
          text: "Notas importantes",
          style: "subheader",
          margin: [0, 4, 0, 4],
        },
        {
          ul: [...notas],
        },
      ];

      pdfMake
        .createPdf({
          content: JSON.parse(JSON.stringify(content)),
          styles: {
            header: { fontSize: 18, bold: true },
            subheader: { fontSize: 14, bold: true },
          },
          defaultStyle: { fontSize: 10 },
          pageOrientation: "portrait",
        })
        .download("Detalle_Dieta.pdf");
      setPdfExporting(false);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-3 sm:p-4 md:p-6">
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="flex items-center gap-2"
            disabled={pdfExporting}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar a PDF
          </Button>
        </div>
        <DialogHeader className="flex-shrink-0 pb-3 border-b sm:pb-4">
          <DialogTitle className="text-base sm:text-lg md:text-xl">
            Detalle de la dieta
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          <div className="py-3 space-y-4 sm:py-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium sm:text-sm text-muted-foreground">
                  Objetivo
                </label>
                <div className="p-2 text-xs border rounded-lg sm:p-3 sm:text-sm bg-muted/50">
                  {dieta?.objetivo || "No especificado"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium sm:text-sm text-muted-foreground">
                  Fecha
                </label>
                <div className="p-2 text-xs border rounded-lg sm:p-3 sm:text-sm bg-muted/50">
                  {dieta?.fecha || "No especificada"}
                </div>
              </div>
            </div>
            <div className="w-full">
              <h3 className="pb-2 text-base font-semibold border-b sm:text-lg">
                Plan Alimentario
              </h3>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {dietaHardcode.map((bloque, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="px-3 py-2 text-xs font-semibold rounded-lg sm:text-sm bg-primary/10 hover:bg-primary/20 [&[data-state=open]>svg]:rotate-180">
                      {bloque.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-3 pl-4 pr-3 space-y-1 border-b border-l border-r rounded-b-lg">
                      {bloque.items.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs sm:text-sm text-muted-foreground"
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {item}
                        </li>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div className="w-full">
              <Button
                variant="outline"
                onClick={() => setShowOpciones((v) => !v)}
                className="w-full text-xs sm:text-sm"
              >
                {showOpciones
                  ? "Ocultar información adicional"
                  : "Ver información adicional"}
              </Button>
              {showOpciones && (
                <div className="p-3 mt-2 space-y-4 border rounded-lg sm:p-4 sm:space-y-6 bg-muted/30">
                  <div className="space-y-3">
                    <h4 className="pb-1 text-xs font-semibold border-b sm:text-sm text-primary border-primary/20">
                      OPCIONES DE VERDURAS VERDES
                    </h4>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {verdurasVerdes.map((v, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 text-xs border rounded text-muted-foreground bg-background"
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="pb-1 text-xs font-semibold border-b sm:text-sm text-primary border-primary/20">
                      NOTAS IMPORTANTES
                    </h4>
                    <ul className="space-y-2">
                      {notas.map((n, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground relative pl-3 sm:pl-4 before:content-['→'] before:absolute before:left-0 before:text-primary"
                        >
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
