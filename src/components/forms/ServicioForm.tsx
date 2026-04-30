"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createServicio, updateServicio } from "@/services/servicioService";
import { toast } from "sonner";

export interface ServicioFormProps {
  servicio?: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    activo: boolean;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: 0,
};

export default function ServicioForm({
  servicio,
  onCreated,
}: ServicioFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (servicio) {
      setForm({
        nombre: servicio.nombre ?? "",
        descripcion: servicio.descripcion ?? "",
        precio: servicio.precio ?? 0,
      });
    } else {
      setForm(emptyForm);
    }
  }, [servicio]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "precio" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (servicio && servicio.id) {
        await updateServicio(servicio.id, form);
        toast.success("Servicio actualizado");
      } else {
        await createServicio(form);
        toast.success("Servicio creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar servicio";
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
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ingrese nombre del servicio"
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precio">Precio</Label>
        <Input
          id="precio"
          name="precio"
          type="number"
          placeholder="Ingrese precio"
          value={form.precio}
          onChange={handleChange}
          required
          min={0}
        />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          placeholder="Ingrese descripción"
          value={form.descripcion}
          onChange={handleChange}
          className="border rounded-md p-2 min-h-[80px]"
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
          : servicio
          ? "Actualizar Servicio"
          : "Crear Servicio"}
      </Button>
    </form>
  );
}
