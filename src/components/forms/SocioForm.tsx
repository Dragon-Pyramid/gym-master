"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createSocio, updateSocio } from "@/services/socioService";
import { toast } from "sonner";

export interface SocioFormProps {
  socio?: {
    id_socio?: string;
    nombre_completo: string;
    dni: string;
    direccion: string;
    telefono: string;
    email: string;
    fecha_alta: string;
    activo: boolean;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  nombre_completo: "",
  dni: "",
  direccion: "",
  telefono: "",
  email: "",
  fecha_alta: "",
};

export default function SocioForm({ socio, onCreated }: SocioFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socio) {
      setForm({
        nombre_completo: socio.nombre_completo ?? "",
        dni: socio.dni ?? "",
        direccion: socio.direccion ?? "",
        telefono: socio.telefono ?? "",
        email: socio.email ?? "",
        fecha_alta: socio.fecha_alta ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [socio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (socio && socio.id_socio) {
        await updateSocio(undefined as any, socio.id_socio, form);
        toast.success("Socio actualizado");
      } else {
        const createData = {
          usuario_id: "",
          nombre_completo: form.nombre_completo,
          dni: form.dni,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
        };
        await createSocio(undefined as any, createData);
        toast.success("Socio creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar socio";
      if (msg.includes("value too long")) {
        msg = "Uno de los campos excede la cantidad máxima de caracteres permitidos.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre_completo">Nombre completo</Label>
        <Input
          id="nombre_completo"
          name="nombre_completo"
          placeholder="Ingrese nombre completo"
          value={form.nombre_completo}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dni">DNI</Label>
        <Input
          id="dni"
          name="dni"
          placeholder="Ingrese DNI"
          value={form.dni}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          placeholder="Ingrese teléfono"
          value={form.telefono}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          placeholder="Ingrese correo electrónico"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          name="direccion"
          placeholder="Ingrese dirección"
          value={form.direccion}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_alta">Fecha de Alta</Label>
        <Input
          id="fecha_alta"
          name="fecha_alta"
          type="date"
          value={form.fecha_alta}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" className="col-span-full justify-self-end" disabled={loading}>
        {loading ? "Guardando..." : socio ? "Actualizar Socio" : "Crear Socio"}
      </Button>
    </form>
  );
}
