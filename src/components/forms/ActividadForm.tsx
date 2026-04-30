"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Actividad,
  CreateActividadDto,
  UpdateActividadDto,
} from "@/interfaces/actividad.interface";
import { createActividad, updateActividad } from "@/services/actividadService";
import { toast } from "sonner";

export interface ActividadFormProps {
  actividad?: Actividad | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  nombre_actividad: "",
};

export default function ActividadForm({
  actividad,
  onCreated,
  onCancel,
}: ActividadFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (actividad) {
      setForm({
        nombre_actividad: actividad.nombre_actividad ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [actividad]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (actividad && actividad.id) {
        const updateData: UpdateActividadDto = {
          nombre_actividad: form.nombre_actividad,
        };
        await updateActividad(actividad.id, updateData);
        toast.success("Actividad actualizada");
      } else {
        const createData: CreateActividadDto = {
          nombre_actividad: form.nombre_actividad,
        };
        await createActividad(createData);
        toast.success("Actividad creada");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: unknown) {
      let msg = (error as Error).message || "Error al guardar actividad";
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre_actividad">Nombre de Actividad</Label>
        <Input
          id="nombre_actividad"
          name="nombre_actividad"
          placeholder="Ingrese nombre de la actividad"
          value={form.nombre_actividad}
          onChange={handleChange}
          required
        />
      </div>

      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading
          ? "Guardando..."
          : actividad
          ? "Actualizar Actividad"
          : "Crear Actividad"}
      </Button>

      <Button
        type="button"
        onClick={onCancel}
        className="col-span-full justify-self-end text-gray-800 bg-gray-200 hover:bg-gray-300"
        disabled={loading}
      >
        Cancelar
      </Button>
    </form>
  );
}
