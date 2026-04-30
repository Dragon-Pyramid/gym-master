"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Proveedor,
  CreateProveedorDto,
  UpdateProveedorDto,
} from "@/interfaces/proveedor.interface";
import { createProveedor, updateProveedor } from "@/services/proveedorService";
import { toast } from "sonner";

export interface ProveedorFormProps {
  proveedor?: Proveedor | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  nombre: "",
  contacto: "",
  telefono: "",
  direccion: "",
};

export default function ProveedorForm({
  proveedor,
  onCreated,
  onCancel,
}: ProveedorFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setForm({
        nombre: proveedor.nombre ?? "",
        contacto: proveedor.contacto ?? "",
        telefono: proveedor.telefono ?? "",
        direccion: proveedor.direccion ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [proveedor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (proveedor && proveedor.id) {
        const updateData: UpdateProveedorDto = {
          nombre: form.nombre,
          contacto: form.contacto,
          telefono: form.telefono,
          direccion: form.direccion,
        };
        await updateProveedor(proveedor.id, updateData);
        toast.success("Proveedor actualizado");
      } else {
        const createData: CreateProveedorDto = {
          nombre: form.nombre,
          contacto: form.contacto,
          telefono: form.telefono,
          direccion: form.direccion,
        };
        await createProveedor(createData);
        toast.success("Proveedor creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: unknown) {
      let msg = (error as Error).message || "Error al guardar proveedor";
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
          placeholder="Ingrese nombre del proveedor"
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contacto">Contacto</Label>
        <Input
          id="contacto"
          name="contacto"
          placeholder="Ingrese nombre de contacto"
          value={form.contacto}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          placeholder="Ingrese teléfono"
          value={form.telefono}
          onChange={handleChange}
          required
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
          : proveedor
          ? "Actualizar Proveedor"
          : "Crear Proveedor"}
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
