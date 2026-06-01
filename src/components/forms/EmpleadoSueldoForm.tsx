"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empleado } from "@/interfaces/empleado.interface";
import { EmpleadoSueldo } from "@/interfaces/empleado_sueldo.interface";
import { actualizarEmpleadoSueldo, crearEmpleadoSueldo } from "@/services/apiClient";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export interface EmpleadoSueldoFormProps {
  sueldo?: EmpleadoSueldo | null;
  empleados: Empleado[];
  onCreated: () => void;
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const raw = String(value);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ddMmYyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyy) return `${ddMmYyyy[3]}-${ddMmYyyy[2]}-${ddMmYyyy[1]}`;
  return "";
};

const currentMonthPeriod = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
};

const emptyForm = {
  empleado_id: "",
  periodo: currentMonthPeriod(),
  concepto: "Sueldo mensual",
  sueldo_base: "0",
  bonos: "0",
  descuentos: "0",
  estado: "pendiente",
  medio_pago: "transferencia",
  fecha_pago: "",
  comprobante_url: "",
  observaciones: "",
};

export default function EmpleadoSueldoForm({
  sueldo,
  empleados,
  onCreated,
}: EmpleadoSueldoFormProps) {
  const [form, setForm] = useState(() =>
    sueldo
      ? {
          empleado_id: sueldo.empleado_id ?? "",
          periodo: toDateInputValue(sueldo.periodo) || currentMonthPeriod(),
          concepto: sueldo.concepto ?? "Sueldo mensual",
          sueldo_base: String(sueldo.sueldo_base ?? 0),
          bonos: String(sueldo.bonos ?? 0),
          descuentos: String(sueldo.descuentos ?? 0),
          estado: sueldo.estado ?? "pendiente",
          medio_pago: sueldo.medio_pago ?? "transferencia",
          fecha_pago: toDateInputValue(sueldo.fecha_pago),
          comprobante_url: sueldo.comprobante_url ?? "",
          observaciones: sueldo.observaciones ?? "",
        }
      : emptyForm
  );

  const empleadoSeleccionado = useMemo(
    () => empleados.find((empleado) => empleado.id === form.empleado_id),
    [empleados, form.empleado_id]
  );

  const sueldoBase = Number(form.sueldo_base || 0);
  const bonos = Number(form.bonos || 0);
  const descuentos = Number(form.descuentos || 0);
  const montoNeto = Math.max(0, sueldoBase + bonos - descuentos);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "empleado_id") {
        const empleado = empleados.find((item) => item.id === value);
        if (empleado && !sueldo) {
          next.sueldo_base = String(empleado.sueldo_base ?? 0);
        }
      }

      if (key === "estado" && value !== "pagado") {
        next.fecha_pago = "";
      }

      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.empleado_id) {
      toast.error("Seleccioná un empleado");
      return;
    }

    if (!form.periodo) {
      toast.error("Seleccioná el período");
      return;
    }

    const payload = {
      ...form,
      sueldo_base: sueldoBase,
      bonos,
      descuentos,
      monto_neto: montoNeto,
      fecha_pago: form.estado === "pagado" ? form.fecha_pago || new Date().toISOString().slice(0, 10) : null,
    };

    const response = sueldo
      ? await actualizarEmpleadoSueldo(sueldo.id, payload)
      : await crearEmpleadoSueldo(payload);

    if (!response.ok) {
      toast.error(response.error || "No se pudo guardar el sueldo");
      return;
    }

    toast.success(sueldo ? "Sueldo actualizado" : "Sueldo registrado");
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <QaFileNameBadge file="src/components/forms/EmpleadoSueldoForm.tsx" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Empleado *
          <select
            value={form.empleado_id}
            onChange={(event) => handleChange("empleado_id", event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Seleccionar empleado</option>
            {empleados
              .filter((empleado) => empleado.activo || empleado.id === form.empleado_id)
              .map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre_completo} · DNI {empleado.dni}
                </option>
              ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Período *
          <Input
            type="date"
            value={form.periodo}
            onChange={(event) => handleChange("periodo", event.target.value)}
            required
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Concepto
          <Input
            value={form.concepto}
            onChange={(event) => handleChange("concepto", event.target.value)}
            placeholder="Sueldo mensual"
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Estado
          <select
            value={form.estado}
            onChange={(event) => handleChange("estado", event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="anulado">Anulado</option>
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Sueldo base
          <Input
            type="number"
            min="0"
            step="1"
            value={form.sueldo_base}
            onChange={(event) => handleChange("sueldo_base", event.target.value)}
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Bonos / adicionales
          <Input
            type="number"
            min="0"
            step="1"
            value={form.bonos}
            onChange={(event) => handleChange("bonos", event.target.value)}
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Descuentos
          <Input
            type="number"
            min="0"
            step="1"
            value={form.descuentos}
            onChange={(event) => handleChange("descuentos", event.target.value)}
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Medio de pago
          <select
            value={form.medio_pago}
            onChange={(event) => handleChange("medio_pago", event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="mercado_pago">Mercado Pago</option>
            <option value="tarjeta_debito">Tarjeta débito</option>
            <option value="tarjeta_credito">Tarjeta crédito</option>
            <option value="otro">Otro</option>
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium">
          Fecha de pago
          <Input
            type="date"
            value={form.fecha_pago}
            onChange={(event) => handleChange("fecha_pago", event.target.value)}
            disabled={form.estado !== "pagado"}
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          URL de comprobante
          <Input
            value={form.comprobante_url}
            onChange={(event) => handleChange("comprobante_url", event.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <label className="space-y-1 text-sm font-medium">
        Observaciones
        <textarea
          value={form.observaciones}
          onChange={(event) => handleChange("observaciones", event.target.value)}
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Observaciones internas sobre esta liquidación"
        />
      </label>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm">
        <div className="font-semibold">Resumen de liquidación</div>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <span>Empleado: <strong>{empleadoSeleccionado?.nombre_completo ?? "Sin seleccionar"}</strong></span>
          <span>Base: <strong>${sueldoBase.toLocaleString("es-AR")}</strong></span>
          <span>Bonos: <strong>${bonos.toLocaleString("es-AR")}</strong></span>
          <span>Neto: <strong>${montoNeto.toLocaleString("es-AR")}</strong></span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">{sueldo ? "Guardar cambios" : "Registrar sueldo"}</Button>
      </div>
    </form>
  );
}
