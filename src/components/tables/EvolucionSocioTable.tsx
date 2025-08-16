"use client";

import { useEffect, useState, useMemo } from "react";
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
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import { getEvolucionesSocio } from "@/services/apiClient";

export default function EvolucionSocioTable({
  searchTerm,
  onDataChange,
  onView,
}: {
  searchTerm?: string;
  onDataChange?: (rows: EvolucionSocio[]) => void;
  onView?: (evolucion: EvolucionSocio) => void;
}) {
  const [evoluciones, setEvoluciones] = useState<EvolucionSocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEvolucionesSocio("me");
        if (mounted) {
          const data: EvolucionSocio[] =
            res.ok && Array.isArray(res.data) ? res.data : [];
          setEvoluciones(data);
        }
      } catch (e: unknown) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm?.trim()) return evoluciones;
    const q = searchTerm.toLowerCase();
    return evoluciones.filter(
      (e) =>
        String(e.peso).toLowerCase().includes(q) ||
        String(e.cintura).toLowerCase().includes(q) ||
        String(e.altura).toLowerCase().includes(q) ||
        (e.observaciones || "").toLowerCase().includes(q)
    );
  }, [searchTerm, evoluciones]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(filtered);
    }
  }, [filtered, onDataChange]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">{error}</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay evoluciones registradas.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Fecha</TableHead>
          <TableHead>Peso</TableHead>
          <TableHead>Cintura</TableHead>
          <TableHead>Bíceps</TableHead>
          <TableHead>Tríceps</TableHead>
          <TableHead>Pierna</TableHead>
          <TableHead>Glúteos</TableHead>
          <TableHead>Pantorrilla</TableHead>
          <TableHead>Altura</TableHead>
          <TableHead>IMC</TableHead>
          <TableHead>Observaciones</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((e, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell>
              {e.fecha ? new Date(e.fecha).toLocaleDateString() : ""}
            </TableCell>
            <TableCell>{e.peso}</TableCell>
            <TableCell>{e.cintura}</TableCell>
            <TableCell>{e.bicep}</TableCell>
            <TableCell>{e.tricep}</TableCell>
            <TableCell>{e.pierna}</TableCell>
            <TableCell>{e.gluteos}</TableCell>
            <TableCell>{e.pantorrilla}</TableCell>
            <TableCell>{e.altura}</TableCell>
            <TableCell>{e.imc}</TableCell>
            <TableCell
              className="max-w-[220px] truncate"
              title={e.observaciones}
            >
              {e.observaciones}
            </TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(e)}
              >
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={11}>Total de evoluciones</TableCell>
          <TableCell className="text-right">{filtered.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de evoluciones registradas.</TableCaption>
    </Table>
  );
}
