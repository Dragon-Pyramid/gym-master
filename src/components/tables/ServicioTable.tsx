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
import { Servicio } from "@/interfaces/servicio.interface";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const CATEGORIA_LABELS: Record<string, string> = {
  personal_trainer: "Personal trainer",
  evaluacion: "Evaluación",
  nutricion: "Nutrición",
  clase_especial: "Clase especial",
  pase: "Pase",
  alquiler: "Alquiler",
  premium: "Premium",
  otro: "Otro",
};

export default function ServicioTable({
  servicios,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  servicios: Servicio[];
  loading?: boolean;
  onEdit: (servicio: Servicio) => void;
  onView?: (servicio: Servicio) => void;
  onDelete?: (servicio: Servicio) => void;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (servicios.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {c("No hay servicios registrados aún.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>{c("Nombre")}</TableHead>
          <TableHead>{c("Código")}</TableHead>
          <TableHead>{c("Categoría")}</TableHead>
          <TableHead>{c("Precio")}</TableHead>
          <TableHead>{c("Duración")}</TableHead>
          <TableHead>{c("Reserva")}</TableHead>
          <TableHead>{c("Estado")}</TableHead>
          <TableHead>{c("Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicios.map((s) => (
          <TableRow
            key={s.id}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">
              <div>{c(s.nombre)}</div>
              <div className="max-w-sm truncate text-xs text-muted-foreground">
                {s.descripcion ? c(s.descripcion) : c("Sin descripción")}
              </div>
            </TableCell>
            <TableCell><span className="font-mono text-xs">{s.codigo || "-"}</span></TableCell>
            <TableCell>{c(CATEGORIA_LABELS[String(s.categoria ?? "otro")] ?? "Otro")}</TableCell>
            <TableCell>${Number(s.precio || 0).toLocaleString("es-AR")}</TableCell>
            <TableCell>{s.duracion_minutos ? `${s.duracion_minutos} min` : "-"}</TableCell>
            <TableCell>{s.requiere_reserva ? c("Sí") : c("No")}</TableCell>
            <TableCell>{s.activo ? `✅ ${c("Activo")}` : `❌ ${c("Inactivo")}`}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(s)}
              >
                {c("Ver")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(s)}
                title={c("Editar")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={
                  (s.activo
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600") +
                  " text-white w-[100px]"
                }
                onClick={() => onDelete && onDelete(s)}
              >
                {s.activo ? c("Desactivar") : c("Activar")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>{c("Total servicios")}</TableCell>
          <TableCell className="text-right">{servicios.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{c("Listado de servicios registrados.")}</TableCaption>
    </Table>
  );
}
