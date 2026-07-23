"use client";

import { Eye, Pencil, ShieldAlert } from "lucide-react";
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
import { Socio } from "@/interfaces/socio.interface";
import { buildSocioBaseRiskSummary, getSocioRiskToneClasses } from "@/utils/socioRiskAlerts";
import { useI18n } from "@/i18n/I18nProvider";
import { formatFrontendDate } from "@/utils/dateFormat";

export default function SociosTable({
  socios,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  socios: Socio[];
  loading?: boolean;
  onEdit: (socio: Socio) => void;
  onView?: (socio: Socio) => void;
  onDelete?: (socio: Socio) => void;
}) {
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === "en" ? en : es);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";

  if (loading) {
    return (
      <div className="space-y-2" aria-label={tx("Cargando socios", "Loading members")}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (socios.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {tx("No hay socios registrados aún.", "No members have been registered yet.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>DNI</TableHead>
          <TableHead>{tx("Nombre", "Name")}</TableHead>
          <TableHead>{tx("Teléfono", "Phone")}</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>{tx("Riesgo", "Risk")}</TableHead>
          <TableHead>{tx("Fecha alta", "Registration date")}</TableHead>
          <TableHead>{tx("Activo", "Active")}</TableHead>
          <TableHead>{tx("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {socios.map((s, i) => {
          const risk = buildSocioBaseRiskSummary(s, locale);

          return (
            <TableRow
              key={s.id_socio || i}
              className="odd:bg-muted/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
            >
              <TableCell className="font-medium">{s.dni}</TableCell>
              <TableCell>{s.nombre_completo}</TableCell>
              <TableCell>{s.telefono || '-'}</TableCell>
              <TableCell>{s.email || '-'}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold ${getSocioRiskToneClasses(risk.level)}`}>
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {risk.label}
                </span>
              </TableCell>
              <TableCell>{formatFrontendDate(s.fecha_alta, dateLocale)}</TableCell>
              <TableCell>{s.activo ? "✅" : "❌"}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView && onView(s)}
                  className="gap-1"
                  title={tx("Vista 360 del socio", "Member 360 view")}
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden xl:inline">360</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(s)}
                  title={tx("Editar", "Edit")}
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
                  {s.activo ? tx("Desactivar", "Deactivate") : tx("Activar", "Activate")}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>{tx("Total de socios", "Total members")}</TableCell>
          <TableCell className="text-right">{socios.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>
        {tx(
          "Listado de socios registrados con lectura rápida de riesgo.",
          "Registered members with a quick risk overview."
        )}
      </TableCaption>
    </Table>
  );
}
