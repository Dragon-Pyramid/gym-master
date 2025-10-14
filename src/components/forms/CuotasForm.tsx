"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createCuota, updateCuota } from "@/services/cuotaService";
import { toast } from "sonner";

export interface CuotasFormProps {
  cuota?: {
    id?: string;
    descripcion: string;
    monto: number;
    periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  descripcion: "",
  monto: 0,
  periodo: "",
  fecha_inicio: "",
  fecha_fin: "",
};

export default function CuotasForm({ cuota, onCreated }: CuotasFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cuota) {
      setForm({
        descripcion: cuota.descripcion ?? "",
        monto: cuota.monto ?? 0,
        periodo: cuota.periodo ?? "",
        fecha_inicio: cuota.fecha_inicio ?? "",
        fecha_fin: cuota.fecha_fin ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [cuota]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (cuota && cuota.id) {
        await updateCuota(cuota.id, { ...form, activo: true });
        toast.success("Cuota actualizada");
      } else {
        await createCuota(form);
        toast.success("Cuota creada");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar cuota";
      if (msg.includes("value too long")) {
        msg =
          "Uno de los campos excede la cantidad máxima de caracteres permitidos.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder="Ingrese descripción"
          value={form.descripcion}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monto">Monto</Label>
        <Input
          id="monto"
          name="monto"
          type="number"
          placeholder="Ingrese monto"
          value={form.monto}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodo">Período</Label>
        <Input
          id="periodo"
          name="periodo"
          placeholder="Ingrese período"
          value={form.periodo}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
        <Input
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          value={form.fecha_inicio}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_fin">Fecha de Fin</Label>
        <Input
          id="fecha_fin"
          name="fecha_fin"
          type="date"
          value={form.fecha_fin}
          onChange={handleChange}
          required
        />
      </div>

      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading ? "Guardando..." : cuota ? "Actualizar Cuota" : "Crear Cuota"}
      </Button>
    </form>
  );
}
