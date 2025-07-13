import { useState } from "react";
import { createMantenimiento } from "@/services/mantenimientoService";
import { CreateMantenimientoDTO } from "@/interfaces/mantenimiento.interface";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MantenimientoForm({
  equipoId,
  onCreated,
}: {
  equipoId: string;
  onCreated: () => void;
}) {
  const [tipo_mantenimiento, setTipoMantenimiento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha_mantenimiento, setFechaMantenimiento] = useState("");
  const [tecnico_responsable, setTecnicoResponsable] = useState("");
  const [costo, setCosto] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: CreateMantenimientoDTO = {
      id_equipamiento: equipoId,
      tipo_mantenimiento,
      descripcion,
      fecha_mantenimiento,
      tecnico_responsable,
      costo,
      observaciones,
    };
    await createMantenimiento(payload);
    setTipoMantenimiento("");
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
      <div>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={tipo_mantenimiento}
          onChange={(e) => setTipoMantenimiento(e.target.value)}
          required
        >
          <option value="">Tipo de mantenimiento</option>
          <option value="preventivo">Preventivo</option>
          <option value="correctivo">Correctivo</option>
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
