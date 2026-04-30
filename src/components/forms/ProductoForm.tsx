"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProducto, updateProducto } from "@/services/productoService";
import { toast } from "sonner";

export interface ProductoFormProps {
  producto?: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    proveedor_id: string;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: 0,
  stock: 0,
  proveedor_id: "",
};

export default function ProductoForm({
  producto,
  onCreated,
}: ProductoFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre ?? "",
        descripcion: producto.descripcion ?? "",
        precio: producto.precio ?? 0,
        stock: producto.stock ?? 0,
        proveedor_id: producto.proveedor_id ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [producto]);

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
      if (producto && producto.id) {
        await updateProducto(producto.id, form);
        toast.success("Producto actualizado");
      } else {
        await createProducto(form);
        toast.success("Producto creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar producto";
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
          placeholder="Ingrese nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>
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
        <Label htmlFor="precio">Precio</Label>
        <Input
          id="precio"
          name="precio"
          type="number"
          placeholder="Ingrese precio"
          value={form.precio}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock">Stock</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          placeholder="Ingrese stock"
          value={form.stock}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proveedor_id">Proveedor ID</Label>
        <Input
          id="proveedor_id"
          name="proveedor_id"
          placeholder="Ingrese proveedor ID"
          value={form.proveedor_id}
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
          : producto
          ? "Actualizar Producto"
          : "Crear Producto"}
      </Button>
    </form>
  );
}
