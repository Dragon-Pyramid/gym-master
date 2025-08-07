"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { getDietasPorSocio, getSocioByUsuarioId } from "@/services/apiClient";
import type { Dieta } from "@/interfaces/dieta.interface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export default function DietaHistorial({
  userId,
}: {
  userId: number | string;
}) {
  const [dietas, setDietas] = useState<Dieta[]>([]);
  const [selected, setSelected] = useState<Dieta | null>(null);
  const [showComidasModal, setShowComidasModal] = useState(false);
  const [detalleComidas, setDetalleComidas] = useState<Record<
    string,
    unknown
  > | null>(null);

  const handleVerComidas = (observaciones: string) => {
    try {
      const comidasObj =
        typeof observaciones === "string"
          ? JSON.parse(observaciones)
          : observaciones;
      setDetalleComidas(comidasObj);
      setShowComidasModal(true);
    } catch {
      setDetalleComidas({ error: "Formato de comidas inválido" });
      setShowComidasModal(true);
    }
  };

  useEffect(() => {
    const fetchDietas = async () => {
      const socio = await getSocioByUsuarioId(userId.toString());
      if (socio) {
        const res = await getDietasPorSocio(socio.id_socio);
        if (res.ok && Array.isArray(res.data)) {
          setDietas(res.data);
        }
      }
    };
    fetchDietas();
  }, [userId]);
  const dietasOrdenadas = [...dietas].sort((a, b) =>
    b.fecha_inicio.localeCompare(a.fecha_inicio)
  );
  return (
    <div className="w-full">
      {selected ? (
        <div className="p-4 mb-6 border rounded bg-muted">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Detalle dieta</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Volver
            </Button>
          </div>
          <pre className="overflow-x-auto text-xs max-h-64">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
      ) : null}

      <Dialog open={showComidasModal} onOpenChange={setShowComidasModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="mb-2 text-xl font-bold">
              Plan Alimentario
            </DialogTitle>
          </DialogHeader>
          {detalleComidas && !(detalleComidas as { error?: string }).error ? (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto p-1">
              {Object.entries(detalleComidas).map(([comida, info]) => (
                <div key={comida} className="p-3 border rounded-lg bg-muted/50">
                  <h4 className="mb-2 text-sm font-medium text-primary">
                    {comida}
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {(info as { descripcion: string })?.descripcion ||
                      "Sin descripción"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              {(detalleComidas as { error?: string })?.error ||
                "No hay información disponible"}
            </div>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="w-full mt-2">
              Cerrar
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
        <TableHeader>
          <TableRow className="bg-muted/50 text-muted-foreground">
            <TableHead>Nombre plan</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead>Observaciones</TableHead>
            <TableHead>Fecha inicio</TableHead>
            <TableHead>Fecha fin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dietasOrdenadas.map((d) => (
            <TableRow
              key={d.id}
              className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
            >
              <TableCell>{d.nombre_plan}</TableCell>
              <TableCell>{d.objetivo}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVerComidas(d.observaciones)}
                >
                  Ver
                </Button>
              </TableCell>
              <TableCell>{d.fecha_inicio}</TableCell>
              <TableCell>{d.fecha_fin}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/50 text-muted-foreground">
            <TableCell colSpan={4}>Total de dietas</TableCell>
            <TableCell className="font-bold text-right">
              {dietas.length}
            </TableCell>
          </TableRow>
        </TableFooter>
        <TableCaption>Historial de dietas registradas.</TableCaption>
      </Table>
    </div>
  );
}
