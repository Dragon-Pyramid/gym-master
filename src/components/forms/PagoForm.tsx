"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createPago, updatePago } from "@/services/pagoService";
import { toast } from "sonner";

export interface PagoFormProps {
  pago?: {
    id?: string;
    socio_id: string;
    cuota_id: string;
    fecha_pago: string;
    fecha_vencimiento: string;
    monto_pagado: number;
    total: number;
    registrado_por: string;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  socio_id: "",
  cuota_id: "",
  fecha_pago: "",
  fecha_vencimiento: "",
  monto_pagado: 0,
  registrado_por: "",
};

export default function PagoForm({ pago, onCreated }: PagoFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pago) {
      setForm({
        socio_id: pago.socio_id ?? "",
        cuota_id: pago.cuota_id ?? "",
        fecha_pago: pago.fecha_pago ?? "",
        fecha_vencimiento: pago.fecha_vencimiento ?? "",
        monto_pagado: pago.monto_pagado ?? 0,
        registrado_por: pago.registrado_por ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [pago]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "monto_pagado" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (pago && pago.id) {
        await updatePago(pago.id, form);
        toast.success("Pago actualizado");
      } else {
        await createPago(form);
        toast.success("Pago creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar pago";
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
        <Label htmlFor="socio_id">Socio</Label>
        <Input
          id="socio_id"
          name="socio_id"
          placeholder="ID del socio"
          value={form.socio_id}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cuota_id">Cuota</Label>
        <Input
          id="cuota_id"
          name="cuota_id"
          placeholder="ID de la cuota"
          value={form.cuota_id}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_pago">Fecha de Pago</Label>
        <Input
          id="fecha_pago"
          name="fecha_pago"
          type="date"
          value={form.fecha_pago}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
        <Input
          id="fecha_vencimiento"
          name="fecha_vencimiento"
          type="date"
          value={form.fecha_vencimiento}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monto_pagado">Monto Pagado</Label>
        <Input
          id="monto_pagado"
          name="monto_pagado"
          type="number"
          placeholder="Monto pagado"
          value={form.monto_pagado}
          onChange={handleChange}
          required
          min={0}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="registrado_por">Registrado Por</Label>
        <Input
          id="registrado_por"
          name="registrado_por"
          placeholder="Usuario"
          value={form.registrado_por}
          onChange={handleChange}
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 text-white bg-blue-600 rounded col-span-full justify-self-end hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Guardando..." : pago ? "Actualizar Pago" : "Crear Pago"}
      </button>
    </form>
  );
}
