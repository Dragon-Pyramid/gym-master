"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProducto, updateProducto } from "@/services/productoService";
import { getAllProveedores } from "@/services/proveedorService";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { Proveedor } from "@/interfaces/proveedor.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { toast } from "sonner";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export interface ProductoFormProps {
  producto?: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    proveedor_id: string;
    id_categoria_producto?: string | null;
    costo?: number | null;
    stock_minimo?: number | null;
    sku?: string | null;
    codigo_barras?: string | null;
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
  costo: "",
  stock: "",
  stock_minimo: "5",
  sku: "",
  codigo_barras: "",
  proveedor_id: "",
  id_categoria_producto: "",
  motivo_cambio_precio: "",
  moneda_historial: "ARS",
  cotizacion_usada: "",
  fecha_vigencia: new Date().toISOString().slice(0, 10),
};

export default function ProductoForm({
  producto,
  onCreated,
}: ProductoFormProps) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

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
        costo: producto.costo != null ? String(Math.trunc(Number(producto.costo))) : "",
        stock: producto.stock != null ? String(Math.trunc(Number(producto.stock))) : "",
        stock_minimo: producto.stock_minimo != null ? String(Math.trunc(Number(producto.stock_minimo))) : "5",
        sku: producto.sku ?? "",
        codigo_barras: producto.codigo_barras ?? "",
        proveedor_id: producto.proveedor_id ?? "",
        id_categoria_producto: producto.id_categoria_producto ?? "",
        motivo_cambio_precio: "",
        moneda_historial: "ARS",
        cotizacion_usada: "",
        fecha_vigencia: new Date().toISOString().slice(0, 10),
      });
    } else {
      setForm(emptyForm);
    }
  }, [producto]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "sku") {
      const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
      setForm((prev) => ({ ...prev, sku: normalized }));
      return;
    }

    if (name === "codigo_barras") {
      setForm((prev) => ({
        ...prev,
        codigo_barras: value.replace(/\s+/g, "").toUpperCase().slice(0, 80),
      }));
      return;
    }

    if (name === "precio" || name === "costo" || name === "stock" || name === "stock_minimo") {
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
      const costo = Number(form.costo || 0);
      const stock = Number(form.stock);
      const stock_minimo = Number(form.stock_minimo || 5);

      if (!Number.isInteger(precio) || precio < 0) {
        throw new Error(c("El precio debe ser un número entero en pesos argentinos"));
      }

      if (!Number.isInteger(costo) || costo < 0) {
        throw new Error(c("El costo debe ser un número entero mayor o igual a 0"));
      }

      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error(c("El stock debe ser un número entero mayor o igual a 0"));
      }

      if (!Number.isInteger(stock_minimo) || stock_minimo < 0) {
        throw new Error(c("El stock mínimo debe ser un número entero mayor o igual a 0"));
      }

      const payload = {
        ...form,
        precio,
        costo,
        stock,
        stock_minimo,
        moneda_historial: form.moneda_historial as "ARS" | "USD",
        cotizacion_usada: form.cotizacion_usada ? Number(form.cotizacion_usada) : null,
        fecha_vigencia: form.fecha_vigencia || new Date().toISOString().slice(0, 10),
        id_categoria_producto: form.id_categoria_producto || null,
      };

      if (producto && producto.id) {
        await updateProducto(producto.id, payload);
        toast.success(c("Producto actualizado"));
      } else {
        await createProducto(payload);
        toast.success(c("Producto creado"));
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      const msg = error.message || c("Error al guardar producto");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const precioNumerico = Number(form.precio || 0);
  const costoNumerico = Number(form.costo || 0);
  const margenEstimado = precioNumerico - costoNumerico;
  const margenPorcentaje = precioNumerico > 0 ? (margenEstimado / precioNumerico) * 100 : 0;

  const cambioPrecioCosto = useMemo(() => {
    if (!producto) return true;
    return (
      Number(form.precio || 0) !== Math.trunc(Number(producto.precio ?? 0)) ||
      Number(form.costo || 0) !== Math.trunc(Number(producto.costo ?? 0))
    );
  }, [form.precio, form.costo, producto]);

  function generarSku() {
    const base = (form.nombre || "PROD")
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    const suffix = String(Date.now()).slice(-5);
    setForm((prev) => ({ ...prev, sku: `${base || 'PROD'}-${suffix}` }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/ProductoForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">{c("Nombre comercial")}</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder={c("Ej: Proteína Whey 1 kg")}
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">{c("Descripción / presentación")}</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder={c("Ej: vainilla, 1 kg, frasco")}
          value={form.descripcion}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="id_categoria_producto">{c("Categoría")}</Label>
        <select
          id="id_categoria_producto"
          name="id_categoria_producto"
          value={form.id_categoria_producto}
          onChange={handleChange}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{c("Sin categoría")}</option>
          {categoriasProducto.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proveedor_id">{c("Proveedor")}</Label>
        {proveedores.length > 0 ? (
          <select
            id="proveedor_id"
            name="proveedor_id"
            value={form.proveedor_id}
            onChange={handleChange}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">{c("Seleccionar proveedor activo")}</option>
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
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="sku">{c("SKU / código interno")}</Label>
          <Button type="button" size="sm" variant="outline" onClick={generarSku}>
            Generar
          </Button>
        </div>
        <Input
          id="sku"
          name="sku"
          placeholder="Ej: PROT-WHEY-001"
          value={form.sku}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground">El POS y el scanner móvil pueden resolver productos por SKU.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="codigo_barras">{c("Código de barras / QR externo")}</Label>
        <Input
          id="codigo_barras"
          name="codigo_barras"
          placeholder="Ej: 7791234567890"
          value={form.codigo_barras}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground">Puede cargarse manualmente o escaneando el envase con el móvil.</p>
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
        <Label htmlFor="costo">Costo de compra</Label>
        <Input
          id="costo"
          name="costo"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ej: 10000"
          value={form.costo}
          onChange={handleChange}
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock_minimo">{c("Stock mínimo operativo")}</Label>
        <Input
          id="stock_minimo"
          name="stock_minimo"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ej: 5"
          value={form.stock_minimo}
          onChange={handleChange}
        />
      </div>
      <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">Margen estimado</p>
        <p>Margen: ${margenEstimado.toLocaleString("es-AR")} · {margenPorcentaje.toFixed(1)}%</p>
      </div>
      {cambioPrecioCosto && (
        <div className="col-span-full grid grid-cols-1 gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 md:grid-cols-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="motivo_cambio_precio">Motivo del cambio de precio/costo</Label>
            <Input
              id="motivo_cambio_precio"
              name="motivo_cambio_precio"
              placeholder={c("Ej: actualización de proveedor, inflación, cambio de costo")}
              value={form.motivo_cambio_precio}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moneda_historial">Moneda</Label>
            <select
              id="moneda_historial"
              name="moneda_historial"
              value={form.moneda_historial}
              onChange={handleChange}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha_vigencia">Fecha de vigencia</Label>
            <Input
              id="fecha_vigencia"
              name="fecha_vigencia"
              type="date"
              value={form.fecha_vigencia}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="cotizacion_usada">{c("Cotización usada (opcional)")}</Label>
            <Input
              id="cotizacion_usada"
              name="cotizacion_usada"
              type="text"
              inputMode="decimal"
              placeholder="Ej: 1200"
              value={form.cotizacion_usada}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  cotizacion_usada: e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."),
                }))
              }
            />
          </div>
          <div className="md:col-span-2 rounded-md bg-white/80 p-3 text-xs text-amber-900">
            Este bloque se registra en el historial solo si cambia el precio de venta o el costo de compra.
          </div>
        </div>
      )}
      <div className="col-span-full rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        Los precios, costos y stock se cargan como enteros para evitar ceros iniciales, decimales accidentales o formatos incómodos. Los cambios de precio/costo quedan auditados para BI comercial.
      </div>
      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading
          ? c("Guardando...")
          : producto
          ? c("Actualizar Producto")
          : c("Crear Producto")}
      </Button>
    </form>
  );
}
