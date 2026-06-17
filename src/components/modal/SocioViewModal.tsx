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
import { getProfilePhotoOrDefault, isDefaultProfilePhoto } from '@/utils/profilePhoto';

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

  const fotoPerfil = getProfilePhotoOrDefault(socio.foto);
  const tieneFotoPropia = !isDefaultProfilePhoto(socio.foto);

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
          <section className="rounded-xl border bg-muted/30 p-4">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border bg-white p-1 shadow-sm">
                <img
                  src={fotoPerfil}
                  alt={`Foto de ${socio.nombre_completo}`}
                  className="h-full w-full rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/gm_logo.svg';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <h3 className="text-lg font-semibold text-foreground">{socio.nombre_completo}</h3>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2 py-1 text-xs font-semibold ${
                      tieneFotoPropia
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {tieneFotoPropia ? 'Foto de perfil cargada' : 'Usa logo por defecto'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tieneFotoPropia
                    ? 'El socio tiene una imagen propia cargada en su perfil.'
                    : 'El socio todavía no cargó una foto propia; se muestra el logo de Gym Master como imagen por defecto.'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  DNI: {socio.dni || '-'} · Email: {socio.email || '-'}
                </p>
              </div>
            </div>
          </section>

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
