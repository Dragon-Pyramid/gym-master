"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createOtrosGastos,
  updateOtrosGastos,
} from "@/services/otrosGastosService";
import { toast } from "sonner";

export interface OtrosGastosFormProps {
  gasto?: {
    id?: string;
    descripcion: string;
    monto: number;
    fecha: string;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  descripcion: "",
  monto: 0,
  fecha: "",
};

export default function OtrosGastosForm({
  gasto,
  onCreated,
}: OtrosGastosFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gasto) {
      setForm({
        descripcion: gasto.descripcion ?? "",
        monto: gasto.monto ?? 0,
        fecha: gasto.fecha ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [gasto]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (gasto && gasto.id) {
        await updateOtrosGastos(gasto.id, form);
        toast.success("Gasto actualizado");
      } else {
        await createOtrosGastos(form);
        toast.success("Gasto creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar gasto";
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
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
          min={0}
        />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input
          id="fecha"
          name="fecha"
          type="date"
          value={form.fecha}
          onChange={handleChange}
          required
        />
      </div>
      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading ? "Guardando..." : gasto ? "Actualizar Gasto" : "Crear Gasto"}
      </Button>
    </form>
  );
}
