"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

export default function DietasModal({
  open,
  onClose,
  dieta,
}: {
  open: boolean;
  onClose: () => void;
  dieta?: any | null;
}) {
  const [showOpciones, setShowOpciones] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle Dieta</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-foreground">Socio</div>
                <div className="p-2 border rounded-md bg-background text-foreground border-border">
                  {dieta?.socio || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  Objetivo
                </div>
                <div className="p-2 border rounded-md bg-background text-foreground border-border">
                  {dieta?.objetivo || "-"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-foreground">Fecha</div>
                <div className="p-2 border rounded-md bg-background text-foreground border-border">
                  {dieta?.fecha || "-"}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {dietaHardcode.map((bloque, idx) => (
              <div key={idx}>
                <div className="font-semibold text-foreground">
                  {bloque.title}
                </div>
                <ul className="ml-5 list-disc text-foreground">
                  {bloque.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOpciones((v) => !v)}
            >
              {showOpciones
                ? "Ocultar opciones de verduras y notas"
                : "Ver opciones de verduras y notas"}
            </Button>
            {showOpciones && (
              <div className="flex flex-col gap-4 p-2 mt-4 overflow-y-auto border rounded-md max-h-64 bg-muted">
                <div className="flex flex-col gap-8 sm:flex-row">
                  <div className="flex-1">
                    <div className="mb-2 font-semibold text-foreground">
                      OPCIONES DE VERDURAS VERDES
                    </div>
                    <ul className="ml-5 list-disc text-foreground">
                      {verdurasVerdes.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 font-semibold text-foreground">
                      Notas
                    </div>
                    <ul className="ml-5 list-disc text-foreground">
                      {notas.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
