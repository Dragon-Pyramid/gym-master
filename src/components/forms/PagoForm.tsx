"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  createPagoManualApi,
  fetchPagoFormOptionsApi,
  updatePagoApi,
} from "@/services/browser/pagoApiClient";
import { PagoManualFormOptions, ResponsePago } from "@/interfaces/pago.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calcularDescuentoPago, formatDiscountPercent } from "@/lib/cuotas/descuentoPago";

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

const fallbackMediosPago: CatalogoParametrizableItem[] = [
  {
    id: "fallback-efectivo",
    codigo: "efectivo",
    nombre: "Efectivo",
    descripcion: "Pago manual registrado por administración.",
    activo: true,
    orden: 10,
    requiere_comprobante: false,
    es_online: false,
  },
  {
    id: "fallback-transferencia",
    codigo: "transferencia",
    nombre: "Transferencia",
    descripcion: "Pago por transferencia bancaria o billetera.",
    activo: true,
    orden: 30,
    requiere_comprobante: true,
    es_online: false,
  },
  {
    id: "fallback-otro",
    codigo: "otro",
    nombre: "Otro",
    descripcion: "Medio de pago no clasificado.",
    activo: true,
    orden: 90,
    requiere_comprobante: false,
    es_online: false,
  },
];

function isFallbackMedioPagoId(value?: string | null) {
  return typeof value === "string" && value.startsWith("fallback-");
}

function normalizeMedioPagoIdForPayload(value?: string | null) {
  if (!value || isFallbackMedioPagoId(value)) return null;
  return value;
}

const emptyForm = {
  socio_id: "",
  cuota_id: "",
  fecha_pago: todayIso(),
  periodo_desde: todayIso(),
  periodo_hasta: addMonthsIso(todayIso(), 1),
  meses_cubiertos: 1,
  subtotal: 0,
  descuento_porcentaje: 0,
  descuento_monto: 0,
  descuento_motivo: "",
  monto_pagado: 0,
  metodo_pago: "efectivo",
  id_medio_pago: "",
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
  const [socioComboboxOpen, setSocioComboboxOpen] = useState(false);
  const { items: mediosPago } = useCatalogoParametrizable(
    "medio_pago",
    fallbackMediosPago
  );

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const data = await fetchPagoFormOptionsApi();
        if (!mounted) return;
        setOptions(data);
        const defaultCuotaId = data.cuotas?.[0]?.id || "";
        setForm((prev) => ({
          ...prev,
          cuota_id: prev.cuota_id || defaultCuotaId,
        }));
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
      const metodoPago = pago.metodo_pago ?? "efectivo";
      const medioPago = mediosPago.find(
        (item) => item.codigo === metodoPago || item.id === pago.id_medio_pago
      );

      setForm({
        socio_id: pago.socio?.id_socio ?? "",
        cuota_id: pago.cuota?.id ?? "",
        fecha_pago: pago.fecha_pago ?? todayIso(),
        periodo_desde: pago.periodo_desde ?? pago.fecha_pago ?? todayIso(),
        periodo_hasta:
          pago.periodo_hasta ?? pago.fecha_vencimiento ?? addMonthsIso(todayIso(), 1),
        meses_cubiertos: pago.meses_cubiertos ?? 1,
        subtotal: pago.subtotal ?? pago.monto_pagado ?? 0,
        descuento_porcentaje: pago.descuento_porcentaje ?? 0,
        descuento_monto: pago.descuento_monto ?? 0,
        descuento_motivo: pago.descuento_motivo ?? "",
        monto_pagado: pago.monto_pagado ?? 0,
        metodo_pago: medioPago?.codigo ?? metodoPago,
        id_medio_pago: pago.id_medio_pago ?? medioPago?.id ?? "",
        observaciones: pago.observaciones ?? "",
      });
    } else {
      setForm((prev) => ({
        ...prev,
        id_medio_pago:
          prev.id_medio_pago ||
          mediosPago.find((item) => item.codigo === prev.metodo_pago)?.id ||
          mediosPago.find((item) => item.codigo === emptyForm.metodo_pago)?.id ||
          "",
      }));
    }
  }, [pago, mediosPago]);

  const selectedSocio = useMemo(
    () => options.socios.find((socio) => socio.id_socio === form.socio_id),
    [form.socio_id, options.socios]
  );

  const selectedCuota = useMemo(
    () =>
      options.cuotas.find((cuota) => cuota.id === form.cuota_id) ??
      options.cuotas[0] ??
      null,
    [form.cuota_id, options.cuotas]
  );

  const descuentoPreview = useMemo(
    () =>
      calcularDescuentoPago({
        cuotaMonto: Number(selectedCuota?.monto ?? 0),
        mesesCubiertos: Number(form.meses_cubiertos || 1),
        config: options.descuento_config,
      }),
    [selectedCuota?.monto, form.meses_cubiertos, options.descuento_config]
  );

  const descuentoConfigActivo =
    options.descuento_config?.activo === true &&
    Number(options.descuento_config?.porcentaje ?? 0) > 0;

  useEffect(() => {
    if (!selectedCuota || pago) return;

    setForm((prev) => ({
      ...prev,
      subtotal: descuentoPreview.subtotal,
      descuento_porcentaje: descuentoPreview.descuento_porcentaje,
      descuento_monto: descuentoPreview.descuento_monto,
      descuento_motivo: descuentoPreview.mensaje ?? "",
      monto_pagado: descuentoPreview.total,
    }));
  }, [
    selectedCuota,
    descuentoPreview.subtotal,
    descuentoPreview.descuento_porcentaje,
    descuentoPreview.descuento_monto,
    descuentoPreview.mensaje,
    descuentoPreview.total,
    pago,
  ]);

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

      if (name === "cuota_id") {
        next.cuota_id = value;
      }

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

      if (name === "monto_pagado") {
        next.descuento_monto = Math.max(Number(next.subtotal || 0) - Number(value || 0), 0);
      }

      return next;
    });
  };

  const handleSocioSelect = (socioId: string) => {
    setForm((prev) => ({
      ...prev,
      socio_id: socioId,
    }));
    setSocioComboboxOpen(false);
  };

  const handleMedioPagoChange = (value: string) => {
    const selected = mediosPago.find((item) => item.id === value);
    setForm((prev) => ({
      ...prev,
      id_medio_pago: selected?.id ?? value,
      metodo_pago: selected?.codigo ?? value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.socio_id) {
      toast.error("Seleccioná un socio para registrar el pago");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        id_medio_pago: normalizeMedioPagoIdForPayload(form.id_medio_pago),
      };

      if (pago?.id) {
        await updatePagoApi(pago.id, payload);
        toast.success("Pago actualizado");
      } else {
        await createPagoManualApi(payload);
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
      <QaFileNameBadge file="src/components/forms/PagoForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="socio_id">Socio</Label>
        <Popover open={socioComboboxOpen} onOpenChange={setSocioComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              id="socio_id"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={socioComboboxOpen}
              disabled={loadingOptions || Boolean(pago)}
              className={cn(
                "h-10 w-full justify-between px-3 text-left font-normal",
                !selectedSocio && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {selectedSocio
                  ? `${selectedSocio.nombre_completo}${
                      selectedSocio.activo ? "" : " (inactivo / regularizar)"
                    }`
                  : loadingOptions
                    ? "Cargando socios..."
                    : "Buscar o seleccionar socio"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
          >
            <Command>
              <CommandInput placeholder="Buscar por nombre o email..." className="h-9" />
              <CommandList className="max-h-[320px]">
                <CommandEmpty>No se encontraron socios.</CommandEmpty>
                <CommandGroup>
                  {options.socios.map((socio) => {
                    const socioLabel = `${socio.nombre_completo}${
                      socio.activo ? "" : " (inactivo / regularizar)"
                    }`;
                    const searchValue = `${socio.nombre_completo} ${
                      socio.email ?? ""
                    } ${socio.activo ? "activo" : "inactivo regularizar"}`;

                    return (
                      <CommandItem
                        key={socio.id_socio}
                        value={searchValue}
                        onSelect={() => handleSocioSelect(socio.id_socio)}
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">{socioLabel}</span>
                          {socio.email ? (
                            <span className="truncate text-xs text-muted-foreground">
                              {socio.email}
                            </span>
                          ) : null}
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            form.socio_id === socio.id_socio ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {!pago ? (
          <p className="text-xs text-muted-foreground">
            Escribí el nombre o email para encontrar al socio sin recorrer todo el listado.
          </p>
        ) : null}
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

      {descuentoConfigActivo ? (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 md:col-span-2">
          <p className="font-semibold">
            Descuento por pago adelantado
          </p>
          <p className="mt-1">
            {descuentoPreview.mensaje ??
              `Pagando ${options.descuento_config?.cuotas_minimas ?? 2} o más cuotas se aplicará ${formatDiscountPercent(
                Number(options.descuento_config?.porcentaje ?? 0)
              )} de descuento.`}
          </p>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
            <div>
              <span className="text-cyan-700">Subtotal</span>
              <p className="font-semibold">{formatMoney(descuentoPreview.subtotal)}</p>
            </div>
            <div>
              <span className="text-cyan-700">Descuento</span>
              <p className="font-semibold">
                {formatMoney(descuentoPreview.descuento_monto)} ({formatDiscountPercent(descuentoPreview.descuento_porcentaje)})
              </p>
            </div>
            <div>
              <span className="text-cyan-700">Total sugerido</span>
              <p className="font-semibold">{formatMoney(descuentoPreview.total)}</p>
            </div>
            <div>
              <span className="text-cyan-700">Meses cubiertos</span>
              <p className="font-semibold">{form.meses_cubiertos}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="id_medio_pago">Método de pago</Label>
        <select
          id="id_medio_pago"
          name="id_medio_pago"
          value={form.id_medio_pago || mediosPago.find((item) => item.codigo === form.metodo_pago)?.id || form.metodo_pago}
          onChange={(e) => handleMedioPagoChange(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {mediosPago.map((medio) => (
            <option key={medio.id} value={medio.id}>
              {medio.nombre}
              {medio.es_online ? " (online)" : ""}
            </option>
          ))}
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
