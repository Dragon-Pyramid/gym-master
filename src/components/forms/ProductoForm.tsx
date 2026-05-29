"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProducto, updateProducto } from "@/services/productoService";
import { getAllProveedores } from "@/services/proveedorService";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { Proveedor } from "@/interfaces/proveedor.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { toast } from "sonner";

export interface ProductoFormProps {
  producto?: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    proveedor_id: string;
    id_categoria_producto?: string | null;
  } | null;
  onCreated: () => void;
}

const fallbackCategoriasProducto: CatalogoParametrizableItem[] = [
  {
    id: "fallback-otros",
    codigo: "otros",
    nombre: "Otros",
    descripcion: "Productos no clasificados.",
    activo: true,
    orden: 90,
  },
];

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: 0,
  stock: 0,
  proveedor_id: "",
  id_categoria_producto: "",
};

export default function ProductoForm({
  producto,
  onCreated,
}: ProductoFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const { items: categoriasProducto } = useCatalogoParametrizable(
    "categoria_producto",
    fallbackCategoriasProducto
  );

  useEffect(() => {
    async function loadProveedores() {
      try {
        const data = await getAllProveedores();
        setProveedores(data ?? []);
      } catch {
        setProveedores([]);
      }
    }

    loadProveedores();
  }, []);

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre ?? "",
        descripcion: producto.descripcion ?? "",
        precio: producto.precio ?? 0,
        stock: producto.stock ?? 0,
        proveedor_id: producto.proveedor_id ?? "",
        id_categoria_producto: producto.id_categoria_producto ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [producto]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      const payload = {
        ...form,
        precio: Math.max(Number(form.precio), 0),
        stock: Math.max(Number(form.stock), 0),
        id_categoria_producto: form.id_categoria_producto || null,
      };

      if (producto && producto.id) {
        await updateProducto(producto.id, payload);
        toast.success("Producto actualizado");
      } else {
        await createProducto(payload);
        toast.success("Producto creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      const msg = error.message || "Error al guardar producto";
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
        <Label htmlFor="nombre">Nombre comercial</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ej: Proteína Whey 1 kg"
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción / presentación</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder="Ej: vainilla, 1 kg, frasco"
          value={form.descripcion}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="id_categoria_producto">Categoría</Label>
        <select
          id="id_categoria_producto"
          name="id_categoria_producto"
          value={form.id_categoria_producto}
          onChange={handleChange}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Sin categoría</option>
          {categoriasProducto.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proveedor_id">Proveedor</Label>
        {proveedores.length > 0 ? (
          <select
            id="proveedor_id"
            name="proveedor_id"
            value={form.proveedor_id}
            onChange={handleChange}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="proveedor_id"
            name="proveedor_id"
            placeholder="ID del proveedor"
            value={form.proveedor_id}
            onChange={handleChange}
            required
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precio">Precio de venta</Label>
        <Input
          id="precio"
          name="precio"
          type="number"
          min={0}
          placeholder="Ingrese precio"
          value={form.precio}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock">Stock actual</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          min={0}
          placeholder="Ingrese stock"
          value={form.stock}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-span-full rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        En esta etapa el stock mínimo operativo se calcula con el valor base 5. La parametrización por producto quedará disponible cuando se aplique la evolución privada de base de datos.
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
