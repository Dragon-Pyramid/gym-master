"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
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
  precio: "",
  stock: "",
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
        precio: producto.precio != null ? String(Math.trunc(Number(producto.precio))) : "",
        stock: producto.stock != null ? String(Math.trunc(Number(producto.stock))) : "",
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
    const { name, value } = e.target;

    if (name === "precio" || name === "stock") {
      const normalized = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
      setForm((prev) => ({
        ...prev,
        [name]: normalized,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const precio = Number(form.precio);
      const stock = Number(form.stock);

      if (!Number.isInteger(precio) || precio < 0) {
        throw new Error("El precio debe ser un número entero en pesos argentinos");
      }

      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0");
      }

      const payload = {
        ...form,
        precio,
        stock,
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
      <QaFileNameBadge file="src/components/forms/ProductoForm.tsx" />
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
            <option value="">Seleccionar proveedor activo</option>
            {proveedores
              .filter(
                (proveedor) =>
                  (proveedor.estado ?? "activo") === "activo" ||
                  proveedor.id === producto?.proveedor_id
              )
              .map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                  {(proveedor.estado ?? "activo") !== "activo"
                    ? ` (${proveedor.estado})`
                    : ""}
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ej: 15000"
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ej: 25"
          value={form.stock}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-span-full rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
Los precios y el stock se cargan como enteros para evitar ceros iniciales, decimales accidentales o formatos incómodos. El stock mínimo operativo se calcula con valor base 5 hasta aplicar la evolución privada de base de datos.
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
