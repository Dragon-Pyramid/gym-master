"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState } from "react";
import { createMantenimiento } from "@/services/mantenimientoService";
import { CreateMantenimientoDTO } from "@/interfaces/mantenimiento.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const fallbackTiposMantenimiento: CatalogoParametrizableItem[] = [
  {
    id: "fallback-preventivo",
    codigo: "preventivo",
    nombre: "Preventivo",
    descripcion: "Mantenimiento preventivo general.",
    activo: true,
    orden: 10,
    frecuencia_dias: 30,
    alerta_dias_anticipacion: 5,
  },
  {
    id: "fallback-correctivo",
    codigo: "correctivo",
    nombre: "Correctivo",
    descripcion: "Mantenimiento correctivo por falla o rotura.",
    activo: true,
    orden: 20,
    frecuencia_dias: null,
    alerta_dias_anticipacion: 0,
  },
];

export default function MantenimientoForm({
  equipoId,
  onCreated,
}: {
  equipoId: string;
  onCreated: () => void;
}) {
  const [tipo_mantenimiento, setTipoMantenimiento] = useState("");
  const [id_tipo_mantenimiento, setIdTipoMantenimiento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha_mantenimiento, setFechaMantenimiento] = useState("");
  const [tecnico_responsable, setTecnicoResponsable] = useState("");
  const [costo, setCosto] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const { items: tiposMantenimiento } = useCatalogoParametrizable(
    "tipo_mantenimiento",
    fallbackTiposMantenimiento
  );

  const handleTipoChange = (value: string) => {
    const selected = tiposMantenimiento.find((item) => item.id === value);
    setIdTipoMantenimiento(
      selected?.id?.startsWith("fallback-") ? "" : selected?.id ?? ""
    );
    setTipoMantenimiento(selected?.codigo ?? value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: CreateMantenimientoDTO = {
      id_equipamiento: equipoId,
      tipo_mantenimiento,
      id_tipo_mantenimiento: id_tipo_mantenimiento || null,
      descripcion,
      fecha_mantenimiento,
      tecnico_responsable,
      costo,
      observaciones,
    };
    await createMantenimiento(payload);
    setTipoMantenimiento("");
    setIdTipoMantenimiento("");
    setDescripcion("");
    setFechaMantenimiento("");
    setTecnicoResponsable("");
    setCosto(0);
    setObservaciones("");
    setLoading(false);
    onCreated();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/MantenimientoForm.tsx" />
      <div>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={id_tipo_mantenimiento || tiposMantenimiento.find((item) => item.codigo === tipo_mantenimiento)?.id || ""}
          onChange={(e) => handleTipoChange(e.target.value)}
          required
        >
          <option value="">Tipo de mantenimiento</option>
          {tiposMantenimiento.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
              {tipo.frecuencia_dias ? ` · cada ${tipo.frecuencia_dias} días` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción"
          required
        />
      </div>
      <div>
        <Input
          type="date"
          value={fecha_mantenimiento}
          onChange={(e) => setFechaMantenimiento(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          value={tecnico_responsable}
          onChange={(e) => setTecnicoResponsable(e.target.value)}
          placeholder="Técnico responsable"
          required
        />
      </div>
      <div>
        <Input
          type="number"
          value={costo}
          onChange={(e) => setCosto(Number(e.target.value))}
          min={0}
          placeholder="Costo"
          required
        />
      </div>
      <div className="md:col-span-2">
        <Input
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Observaciones"
        />
      </div>
      <div className="flex justify-end md:col-span-2">
        <Button type="submit" className="px-4 py-2" disabled={loading}>
          Registrar mantenimiento
        </Button>
      </div>
    </form>
  );
}
