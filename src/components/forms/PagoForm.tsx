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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  createPagoManualApi,
  fetchPagoFormOptionsApi,
  updatePagoApi,
} from "@/services/browser/pagoApiClient";
import {
  PagoManualFormOptions,
  ResponsePago,
} from "@/interfaces/pago.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  calcularDescuentoPago,
  formatDiscountPercent,
} from "@/lib/cuotas/descuentoPago";
import {
  combinarDescuentosPago,
  resolveBonificacionMensualForPeriod,
} from "@/lib/cuotas/descuentoPagoBonificacion";
import { useI18n } from "@/i18n/I18nProvider";

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

function normalizeLabel(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getPaymentMethodLabel(
  value: string | null | undefined,
  isEnglish: boolean,
) {
  if (!isEnglish) return value ?? "-";
  const normalized = normalizeLabel(value);
  const labels: Record<string, string> = {
    efectivo: "Cash",
    transferencia: "Bank transfer",
    stripe: "Stripe",
    mercado_pago: "Mercado Pago",
    "mercado pago": "Mercado Pago",
    tarjeta: "Card",
    debito: "Debit card",
    débito: "Debit card",
    credito: "Credit card",
    crédito: "Credit card",
    otro: "Other",
  };
  return labels[normalized] ?? value ?? "-";
}

function translatePaymentPreviewMessage(
  message: string | null | undefined,
  isEnglish: boolean,
) {
  if (!message) return null;
  if (!isEnglish) return message;

  const advanceDiscountMatch = message.match(
    /Pagando\s+(\d+)\s+o\s+m[aá]s\s+cuotas(?:\s+por\s+adelantado)?\s+obten[eé]s\s+([\d.,]+)%\s+de\s+descuento\.?/i,
  );
  if (advanceDiscountMatch) {
    return `Paying ${advanceDiscountMatch[1]} or more fees in advance gives you ${advanceDiscountMatch[2]}% discount.`;
  }

  const appliesDiscountMatch = message.match(
    /Pagando\s+(\d+)\s+o\s+m[aá]s\s+cuotas\s+se\s+aplicar[aá]\s+([\d.,]+)%\s+de\s+descuento\.?/i,
  );
  if (appliesDiscountMatch) {
    return `Paying ${appliesDiscountMatch[1]} or more fees applies ${appliesDiscountMatch[2]}% discount.`;
  }

  return message
    .replace(/Pagando/gi, "Paying")
    .replace(/o más cuotas por adelantado obtenés/gi, "or more fees in advance gives you")
    .replace(/o mas cuotas por adelantado obtenes/gi, "or more fees in advance gives you")
    .replace(/o más cuotas se aplicará/gi, "or more fees applies")
    .replace(/de descuento/gi, "discount")
    .replace(/Bonificación mensual activa para este socio/gi, "Active monthly bonus for this member");
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
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState<PagoManualFormOptions>({
    socios: [],
    cuotas: [],
    bonificaciones_mensuales: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [socioComboboxOpen, setSocioComboboxOpen] = useState(false);
  const { items: mediosPago } = useCatalogoParametrizable(
    "medio_pago",
    fallbackMediosPago,
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
        toast.error(
          error.message ||
            tx(
              "Error al cargar opciones de pago",
              "Error loading payment options",
            ),
        );
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
        (item) => item.codigo === metodoPago || item.id === pago.id_medio_pago,
      );

      setForm({
        socio_id: pago.socio?.id_socio ?? "",
        cuota_id: pago.cuota?.id ?? "",
        fecha_pago: pago.fecha_pago ?? todayIso(),
        periodo_desde: pago.periodo_desde ?? pago.fecha_pago ?? todayIso(),
        periodo_hasta:
          pago.periodo_hasta ??
          pago.fecha_vencimiento ??
          addMonthsIso(todayIso(), 1),
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
          mediosPago.find((item) => item.codigo === emptyForm.metodo_pago)
            ?.id ||
          "",
      }));
    }
  }, [pago, mediosPago]);

  const selectedSocio = useMemo(
    () => options.socios.find((socio) => socio.id_socio === form.socio_id),
    [form.socio_id, options.socios],
  );

  const selectedCuota = useMemo(
    () =>
      options.cuotas.find((cuota) => cuota.id === form.cuota_id) ??
      options.cuotas[0] ??
      null,
    [form.cuota_id, options.cuotas],
  );

  const descuentoPreview = useMemo(
    () =>
      calcularDescuentoPago({
        cuotaMonto: Number(selectedCuota?.monto ?? 0),
        mesesCubiertos: Number(form.meses_cubiertos || 1),
        config: options.descuento_config,
      }),
    [selectedCuota?.monto, form.meses_cubiertos, options.descuento_config],
  );

  const bonificacionMensualActiva = useMemo(
    () =>
      resolveBonificacionMensualForPeriod({
        socioId: form.socio_id,
        fechaReferencia: form.periodo_desde || form.fecha_pago,
        bonificaciones: options.bonificaciones_mensuales,
      }),
    [
      form.fecha_pago,
      form.periodo_desde,
      form.socio_id,
      options.bonificaciones_mensuales,
    ],
  );

  const pagoPreview = useMemo(
    () =>
      combinarDescuentosPago({
        previewPagoAdelantado: descuentoPreview,
        bonificacionMensual: bonificacionMensualActiva,
      }),
    [bonificacionMensualActiva, descuentoPreview],
  );

  const descuentoConfigActivo =
    options.descuento_config?.activo === true &&
    Number(options.descuento_config?.porcentaje ?? 0) > 0;

  useEffect(() => {
    if (!selectedCuota || pago) return;

    setForm((prev) => ({
      ...prev,
      subtotal: pagoPreview.subtotal,
      descuento_porcentaje: pagoPreview.descuento_porcentaje,
      descuento_monto: pagoPreview.descuento_monto,
      descuento_motivo: pagoPreview.mensaje ?? "",
      monto_pagado: pagoPreview.total,
    }));
  }, [
    selectedCuota,
    pagoPreview.subtotal,
    pagoPreview.descuento_porcentaje,
    pagoPreview.descuento_monto,
    pagoPreview.mensaje,
    pagoPreview.total,
    pago,
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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
        next.periodo_hasta = addMonthsIso(
          value,
          Number(next.meses_cubiertos || 1),
        );
      }

      if (name === "periodo_desde" || name === "meses_cubiertos") {
        next.periodo_hasta = addMonthsIso(
          name === "periodo_desde" ? value : next.periodo_desde,
          Number(
            name === "meses_cubiertos" ? value : next.meses_cubiertos || 1,
          ),
        );
      }

      if (name === "monto_pagado") {
        next.descuento_monto = Math.max(
          Number(next.subtotal || 0) - Number(value || 0),
          0,
        );
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
      toast.error(
        tx(
          "Seleccioná un socio para registrar el pago",
          "Select a member to register the payment",
        ),
      );
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
        toast.success(tx("Pago actualizado", "Payment updated"));
      } else {
        await createPagoManualApi(payload);
        toast.success(
          tx("Pago manual registrado", "Manual payment registered"),
        );
      }

      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      toast.error(
        error.message || tx("Error al guardar pago", "Error saving payment"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/PagoForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="socio_id">{tx("Socio", "Member")}</Label>
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
                !selectedSocio && "text-muted-foreground",
              )}
            >
              <span className="truncate">
                {selectedSocio
                  ? `${selectedSocio.nombre_completo}${
                      selectedSocio.activo
                        ? ""
                        : tx(
                            " (inactivo / regularizar)",
                            " (inactive / regularize)",
                          )
                    }`
                  : loadingOptions
                    ? tx("Cargando socios...", "Loading members...")
                    : tx(
                        "Buscar o seleccionar socio",
                        "Search or select member",
                      )}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
          >
            <Command>
              <CommandInput
                placeholder={tx(
                  "Buscar por nombre o email...",
                  "Search by name or email...",
                )}
                className="h-9"
              />
              <CommandList className="max-h-[320px]">
                <CommandEmpty>
                  {tx("No se encontraron socios.", "No members found.")}
                </CommandEmpty>
                <CommandGroup>
                  {options.socios.map((socio) => {
                    const socioLabel = `${socio.nombre_completo}${
                      socio.activo
                        ? ""
                        : tx(
                            " (inactivo / regularizar)",
                            " (inactive / regularize)",
                          )
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
                            form.socio_id === socio.id_socio
                              ? "opacity-100"
                              : "opacity-0",
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
            {tx(
              "Escribí el nombre o email para encontrar al socio sin recorrer todo el listado.",
              "Type the name or email to find the member without browsing the full list.",
            )}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cuota_id">{tx("Cuota", "Fee")}</Label>
        <select
          id="cuota_id"
          name="cuota_id"
          value={form.cuota_id}
          onChange={handleChange}
          disabled={loadingOptions || Boolean(pago)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">
            {tx("Cuota vigente / última activa", "Current fee / last active")}
          </option>
          {options.cuotas.map((cuota) => (
            <option key={cuota.id} value={cuota.id}>
              {cuota.descripcion} - $
              {Number(cuota.monto).toLocaleString("es-AR")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_pago">
          {tx("Fecha de pago", "Payment date")}
        </Label>
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
        <Label htmlFor="meses_cubiertos">
          {tx("Meses cubiertos", "Covered months")}
        </Label>
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
        <Label htmlFor="periodo_desde">
          {tx("Cubre desde", "Covers from")}
        </Label>
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
        <Label htmlFor="periodo_hasta">{tx("Cubre hasta", "Covers to")}</Label>
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
        <Label htmlFor="monto_pagado">
          {tx("Monto pagado", "Amount paid")}
        </Label>
        <Input
          id="monto_pagado"
          name="monto_pagado"
          type="number"
          placeholder={tx("Monto pagado", "Amount paid")}
          value={form.monto_pagado}
          onChange={handleChange}
          required
          min={0}
        />
      </div>

      {descuentoConfigActivo || pagoPreview.bonificacion_mensual_aplicada ? (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-900/70 dark:bg-cyan-950/35 dark:text-cyan-100 md:col-span-2">
          <p className="font-semibold">
            {tx(
              "Descuentos y bonificación aplicados",
              "Applied discounts and bonus",
            )}
          </p>
          <p className="mt-1">
            {translatePaymentPreviewMessage(pagoPreview.mensaje, isEnglish) ??
              `${tx("Pagando", "Paying")} ${options.descuento_config?.cuotas_minimas ?? 2} ${tx("o más cuotas se aplicará", "or more fees applies")} ${formatDiscountPercent(
                Number(options.descuento_config?.porcentaje ?? 0),
              )} ${tx("de descuento", "discount")}.`}
          </p>
          {pagoPreview.bonificacion_mensual_aplicada ? (
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-cyan-900 dark:bg-neutral-900/80 dark:text-cyan-100">
              {tx(
                "Bonificación mensual activa para este socio",
                "Active monthly bonus for this member",
              )}
              :{" "}
              {formatDiscountPercent(
                pagoPreview.bonificacion_mensual_porcentaje ?? 0,
              )}
              .
            </p>
          ) : null}
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
            <div>
              <span className="text-cyan-700 dark:text-cyan-300">Subtotal</span>
              <p className="font-semibold">
                {formatMoney(pagoPreview.subtotal)}
              </p>
            </div>
            <div>
              <span className="text-cyan-700 dark:text-cyan-300">
                {tx("Descuento", "Discount")}
              </span>
              <p className="font-semibold">
                {formatMoney(pagoPreview.descuento_monto)} (
                {formatDiscountPercent(pagoPreview.descuento_porcentaje)})
              </p>
            </div>
            <div>
              <span className="text-cyan-700 dark:text-cyan-300">
                {tx("Total sugerido", "Suggested total")}
              </span>
              <p className="font-semibold">{formatMoney(pagoPreview.total)}</p>
            </div>
            <div>
              <span className="text-cyan-700 dark:text-cyan-300">
                {tx("Meses cubiertos", "Covered months")}
              </span>
              <p className="font-semibold">{form.meses_cubiertos}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="id_medio_pago">
          {tx("Método de pago", "Payment method")}
        </Label>
        <select
          id="id_medio_pago"
          name="id_medio_pago"
          value={
            form.id_medio_pago ||
            mediosPago.find((item) => item.codigo === form.metodo_pago)?.id ||
            form.metodo_pago
          }
          onChange={(e) => handleMedioPagoChange(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {mediosPago.map((medio) => (
            <option key={medio.id} value={medio.id}>
              {getPaymentMethodLabel(medio.codigo || medio.nombre, isEnglish)}
              {medio.es_online ? ` (${tx("online", "online")})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="observaciones">{tx("Observaciones", "Notes")}</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
          placeholder={tx(
            "Ejemplo: pago en efectivo en recepción",
            "Example: cash payment at reception",
          )}
          className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-end gap-2 md:col-span-2">
        <Button type="submit" disabled={loading || loadingOptions}>
          {loading
            ? tx("Guardando...", "Saving...")
            : pago
              ? tx("Actualizar pago", "Update payment")
              : tx("Registrar pago", "Register payment")}
        </Button>
      </div>
    </form>
  );
}
