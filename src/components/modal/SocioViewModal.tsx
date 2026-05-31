"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Socio } from "@/interfaces/socio.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

const sexoLabel = (value?: string | null) => {
  if (value === "M") return "Masculino";
  if (value === "F") return "Femenino";
  return "-";
};

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="min-h-10 rounded-md border bg-muted p-2 text-foreground">
        {value || "-"}
      </div>
    </div>
  );
}

export default function SocioViewModal({
  open,
  onClose,
  socio,
}: {
  open: boolean;
  onClose: () => void;
  socio?: Socio | null;
}) {
  if (!socio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[900px] !w-full bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/SocioViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Socio
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Datos personales</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DetailField label="Nombre completo" value={socio.nombre_completo} />
              <DetailField label="DNI" value={socio.dni} />
              <DetailField label="Sexo" value={sexoLabel(socio.sexo)} />
              <DetailField label="Fecha de nacimiento" value={socio.fecnac} />
              <DetailField label="Fecha alta" value={socio.fecha_alta} />
              <DetailField label="Estado" value={socio.activo ? "Activo" : "Inactivo"} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Contacto y ubicación</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DetailField label="Teléfono" value={socio.telefono} />
              <DetailField label="Email" value={socio.email} />
              <DetailField label="Dirección" value={socio.direccion} />
              <DetailField label="Ciudad" value={socio.ciudad} />
              <DetailField label="Provincia" value={socio.provincia} />
              <DetailField label="País" value={socio.pais} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Contacto de emergencia</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label="Nombre del contacto" value={socio.contacto_emergencia_nombre} />
              <DetailField label="Teléfono de emergencia" value={socio.contacto_emergencia_telefono} />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
