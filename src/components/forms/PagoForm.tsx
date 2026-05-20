"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createPagoManualApi,
  fetchPagoFormOptionsApi,
  updatePagoApi,
} from "@/services/browser/pagoApiClient";
import { PagoManualFormOptions, ResponsePago } from "@/interfaces/pago.interface";
import { toast } from "sonner";

export interface PagoFormProps {
  pago?: ResponsePago | null;
  onCreated: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function addMonthsIso(dateIso: string, months: number) {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

const emptyForm = {
  socio_id: "",
  cuota_id: "",
  fecha_pago: todayIso(),
  periodo_desde: todayIso(),
  periodo_hasta: addMonthsIso(todayIso(), 1),
  meses_cubiertos: 1,
  monto_pagado: 0,
  metodo_pago: "efectivo" as const,
  observaciones: "",
};

export default function PagoForm({ pago, onCreated }: PagoFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState<PagoManualFormOptions>({
    socios: [],
    cuotas: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const data = await fetchPagoFormOptionsApi();
        if (!mounted) return;
        setOptions(data);
      } catch (error: any) {
        toast.error(error.message || "Error al cargar opciones de pago");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (pago) {
      setForm({
        socio_id: pago.socio?.id_socio ?? "",
        cuota_id: pago.cuota?.id ?? "",
        fecha_pago: pago.fecha_pago ?? todayIso(),
        periodo_desde: pago.periodo_desde ?? pago.fecha_pago ?? todayIso(),
        periodo_hasta:
          pago.periodo_hasta ?? pago.fecha_vencimiento ?? addMonthsIso(todayIso(), 1),
        meses_cubiertos: pago.meses_cubiertos ?? 1,
        monto_pagado: pago.monto_pagado ?? 0,
        metodo_pago: (pago.metodo_pago as "efectivo") ?? "efectivo",
        observaciones: pago.observaciones ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [pago]);

  const selectedCuota = useMemo(
    () => options.cuotas.find((cuota) => cuota.id === form.cuota_id),
    [form.cuota_id, options.cuotas]
  );

  useEffect(() => {
    if (!selectedCuota || pago) return;

    const monto = Number(selectedCuota.monto || 0) * Number(form.meses_cubiertos || 1);
    setForm((prev) => ({
      ...prev,
      monto_pagado: monto,
    }));
  }, [selectedCuota, form.meses_cubiertos, pago]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]:
          name === "monto_pagado" || name === "meses_cubiertos"
            ? Number(value)
            : value,
      };

      if (name === "fecha_pago") {
        next.periodo_desde = value;
        next.periodo_hasta = addMonthsIso(value, Number(next.meses_cubiertos || 1));
      }

      if (name === "periodo_desde" || name === "meses_cubiertos") {
        next.periodo_hasta = addMonthsIso(
          name === "periodo_desde" ? value : next.periodo_desde,
          Number(name === "meses_cubiertos" ? value : next.meses_cubiertos || 1)
        );
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (pago?.id) {
        await updatePagoApi(pago.id, form);
        toast.success("Pago actualizado");
      } else {
        await createPagoManualApi(form);
        toast.success("Pago manual registrado");
      }

      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="socio_id">Socio</Label>
        <select
          id="socio_id"
          name="socio_id"
          value={form.socio_id}
          onChange={handleChange}
          required
          disabled={loadingOptions || Boolean(pago)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Seleccionar socio</option>
          {options.socios.map((socio) => (
            <option key={socio.id_socio} value={socio.id_socio}>
              {socio.nombre_completo}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cuota_id">Cuota</Label>
        <select
          id="cuota_id"
          name="cuota_id"
          value={form.cuota_id}
          onChange={handleChange}
          disabled={loadingOptions || Boolean(pago)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Cuota vigente / última activa</option>
          {options.cuotas.map((cuota) => (
            <option key={cuota.id} value={cuota.id}>
              {cuota.descripcion} - ${Number(cuota.monto).toLocaleString("es-AR")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_pago">Fecha de pago</Label>
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
        <Label htmlFor="meses_cubiertos">Meses cubiertos</Label>
        <Input
          id="meses_cubiertos"
          name="meses_cubiertos"
          type="number"
          min={1}
          max={24}
          value={form.meses_cubiertos}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodo_desde">Cubre desde</Label>
        <Input
          id="periodo_desde"
          name="periodo_desde"
          type="date"
          value={form.periodo_desde}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodo_hasta">Cubre hasta</Label>
        <Input
          id="periodo_hasta"
          name="periodo_hasta"
          type="date"
          value={form.periodo_hasta}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monto_pagado">Monto pagado</Label>
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
        <Label htmlFor="metodo_pago">Método de pago</Label>
        <select
          id="metodo_pago"
          name="metodo_pago"
          value={form.metodo_pago}
          onChange={handleChange}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
          placeholder="Ejemplo: pago en efectivo en recepción"
          className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-end gap-2 md:col-span-2">
        <Button type="submit" disabled={loading || loadingOptions}>
          {loading ? "Guardando..." : pago ? "Actualizar Pago" : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
}
