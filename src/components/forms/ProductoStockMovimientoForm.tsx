"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Producto } from "@/interfaces/producto.interface";
import { ProductoStockOperacionTipo } from "@/interfaces/producto_stock_movimiento.interface";
import { formatCurrencyARS, getProductoStockEstadoLabel } from "@/lib/comercial/productos";
import { createProductoStockMovimiento } from "@/services/productoStockMovimientoService";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const operacionOptions: Array<{
  value: ProductoStockOperacionTipo;
  label: string;
  help: string;
}> = [
  {
    value: "ajuste_entrada",
    label: "Ajuste de entrada",
    help: "Suma unidades por corrección manual o ingreso sin compra registrada.",
  },
  {
    value: "ajuste_salida",
    label: "Ajuste de salida",
    help: "Resta unidades por corrección manual o diferencia operativa.",
  },
  {
    value: "recuento",
    label: "Recuento físico",
    help: "Define el stock real contado físicamente y ajusta la diferencia.",
  },
  {
    value: "devolucion",
    label: "Devolución vendible",
    help: "Reingresa stock cuando el producto devuelto vuelve en condiciones vendibles.",
  },
  {
    value: "merma",
    label: "Merma / no apto",
    help: "Resta stock cuando el producto no debe volver al inventario.",
  },
  {
    value: "compra",
    label: "Compra / reposición",
    help: "Suma stock por reposición o compra a proveedor.",
  },
];

const emptyForm = {
  tipo_operacion: "ajuste_entrada" as ProductoStockOperacionTipo,
  cantidad: "",
  stock_real: "",
  motivo: "",
  venta_id: "",
  venta_detalle_id: "",
};

function normalizeIntegerInput(value: string) {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

export default function ProductoStockMovimientoForm({
  producto,
  onSaved,
}: {
  producto: Producto;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const selectedOperation = operacionOptions.find(
    (option) => option.value === form.tipo_operacion
  );
  const isRecuento = form.tipo_operacion === "recuento";

  const preview = useMemo(() => {
    const stockActual = Number(producto.stock ?? 0);
    const cantidad = Number(form.cantidad || 0);
    const stockReal = Number(form.stock_real || 0);

    if (isRecuento) {
      return {
        stockAnterior: stockActual,
        stockNuevo: form.stock_real === "" ? stockActual : stockReal,
        delta: form.stock_real === "" ? 0 : stockReal - stockActual,
      };
    }

    const suma =
      form.tipo_operacion === "ajuste_entrada" ||
      form.tipo_operacion === "devolucion" ||
      form.tipo_operacion === "compra";

    return {
      stockAnterior: stockActual,
      stockNuevo: suma ? stockActual + cantidad : stockActual - cantidad,
      delta: suma ? cantidad : -cantidad,
    };
  }, [form.cantidad, form.stock_real, form.tipo_operacion, isRecuento, producto.stock]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        producto_id: producto.id,
        tipo_operacion: form.tipo_operacion,
        cantidad: isRecuento ? null : Number(form.cantidad),
        stock_real: isRecuento ? Number(form.stock_real) : null,
        motivo: form.motivo,
        venta_id: form.venta_id || null,
        venta_detalle_id: form.venta_detalle_id || null,
      };

      await createProductoStockMovimiento(payload);
      toast.success("Movimiento de stock registrado");
      setForm(emptyForm);
      await onSaved();
    } catch (error: any) {
      toast.error(error.message || "No se pudo registrar el movimiento de stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <QaFileNameBadge file="src/components/forms/ProductoStockMovimientoForm.tsx" />

      <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Producto</p>
          <p className="font-semibold">{producto.nombre}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Stock actual</p>
          <p className="font-semibold">{producto.stock ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estado</p>
          <p className="font-semibold">{getProductoStockEstadoLabel(producto)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Valor estimado</p>
          <p className="font-semibold">
            {formatCurrencyARS(Number(producto.precio ?? 0) * Number(producto.stock ?? 0))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo_operacion">Tipo de movimiento</Label>
          <select
            id="tipo_operacion"
            name="tipo_operacion"
            value={form.tipo_operacion}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                tipo_operacion: event.target.value as ProductoStockOperacionTipo,
                cantidad: "",
                stock_real: "",
              }))
            }
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {operacionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{selectedOperation?.help}</p>
        </div>

        {isRecuento ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock_real">Stock real contado</Label>
            <Input
              id="stock_real"
              name="stock_real"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 24"
              value={form.stock_real}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, stock_real: normalizeIntegerInput(event.target.value) }))
              }
              required
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              name="cantidad"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 3"
              value={form.cantidad}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cantidad: normalizeIntegerInput(event.target.value) }))
              }
              required
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venta_id">ID de venta relacionada (opcional)</Label>
          <Input
            id="venta_id"
            name="venta_id"
            placeholder="UUID de venta si aplica"
            value={form.venta_id}
            onChange={(event) => setForm((prev) => ({ ...prev, venta_id: event.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venta_detalle_id">ID de detalle de venta (opcional)</Label>
          <Input
            id="venta_detalle_id"
            name="venta_detalle_id"
            placeholder="UUID de detalle si aplica"
            value={form.venta_detalle_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, venta_detalle_id: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivo">Motivo / observación</Label>
        <Input
          id="motivo"
          name="motivo"
          placeholder="Ej: recuento físico semanal, devolución vendible, producto vencido, reposición proveedor"
          value={form.motivo}
          onChange={(event) => setForm((prev) => ({ ...prev, motivo: event.target.value }))}
          required
        />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-semibold">Vista previa del movimiento</p>
        <p className="mt-1 text-muted-foreground">
          Stock anterior: <strong>{preview.stockAnterior}</strong> · Cambio:{" "}
          <strong className={preview.delta < 0 ? "text-red-700" : "text-emerald-700"}>
            {preview.delta > 0 ? `+${preview.delta}` : preview.delta}
          </strong>{" "}
          · Stock nuevo: <strong>{preview.stockNuevo}</strong>
        </p>
        {preview.stockNuevo < 0 && (
          <p className="mt-2 text-xs font-semibold text-red-700">
            La operación no se podrá registrar porque dejaría stock negativo.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || preview.stockNuevo < 0}>
          {loading ? "Registrando..." : "Registrar movimiento"}
        </Button>
      </div>
    </form>
  );
}
