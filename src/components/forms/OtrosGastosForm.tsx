"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createOtrosGastos,
  updateOtrosGastos,
  uploadOtrosGastosComprobante,
} from "@/services/otrosGastosService";
import { getParametrizacionCatalogos } from "@/services/parametrizacionService";
import {
  CreateOtrosGastosDto,
  OtrosGastos,
  OtrosGastosEstado,
  OtrosGastosMedioPago,
  TipoGastoLite,
} from "@/interfaces/otros_gastos.interface";
import { toast } from "sonner";
import { FileUp, Link as LinkIcon } from "lucide-react";
import { useI18n } from '@/i18n/I18nProvider';
import { getOtrosGastosTipoLabel, translateOtrosGastosUi } from '@/utils/otrosGastosI18n';

export interface OtrosGastosFormProps {
  gasto?: OtrosGastos | null;
  onCreated: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm: CreateOtrosGastosDto = {
  descripcion: "",
  monto: 0,
  fecha: todayIso(),
  id_tipo_gasto: null,
  estado: "pagado",
  medio_pago: "efectivo",
  proveedor_nombre: "",
  entidad: "",
  numero_comprobante: "",
  comprobante_url: "",
  comprobante_nombre: "",
  comprobante_mime_type: "",
  fecha_vencimiento: "",
  fecha_pago: todayIso(),
  periodo_desde: "",
  periodo_hasta: "",
  observaciones: "",
};

const estados: { value: OtrosGastosEstado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
  { value: "anulado", label: "Anulado" },
];

const mediosPago: { value: OtrosGastosMedioPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta débito" },
  { value: "tarjeta_credito", label: "Tarjeta crédito" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "stripe", label: "Stripe" },
  { value: "otro", label: "Otro" },
];

function normalizeNullable(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export default function OtrosGastosForm({ gasto, onCreated }: OtrosGastosFormProps) {
  const { locale } = useI18n();
  const c = (text: string) => translateOtrosGastosUi(locale, text);

  const [form, setForm] = useState<CreateOtrosGastosDto>(emptyForm);
  const [tiposGasto, setTiposGasto] = useState<TipoGastoLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadCatalogos() {
      try {
        const response = await getParametrizacionCatalogos();
        const catalogo = response.catalogos.find((item) => item.key === "tipo_gasto");
        const items = (catalogo?.items ?? [])
          .filter((item) => item.activo !== false)
          .map((item) => ({
            id: item.id,
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion,
            activo: item.activo,
          }));
        setTiposGasto(items);
      } catch {
        setTiposGasto([]);
      }
    }

    loadCatalogos();
  }, []);

  useEffect(() => {
    if (gasto) {
      setForm({
        descripcion: gasto.descripcion ?? "",
        monto: Number(gasto.monto ?? 0),
        fecha: gasto.fecha ?? todayIso(),
        id_tipo_gasto: gasto.id_tipo_gasto ?? null,
        estado: gasto.estado ?? "pagado",
        medio_pago: gasto.medio_pago ?? "efectivo",
        proveedor_nombre: gasto.proveedor_nombre ?? "",
        entidad: gasto.entidad ?? "",
        numero_comprobante: gasto.numero_comprobante ?? "",
        comprobante_url: gasto.comprobante_url ?? "",
        comprobante_nombre: gasto.comprobante_nombre ?? "",
        comprobante_mime_type: gasto.comprobante_mime_type ?? "",
        fecha_vencimiento: gasto.fecha_vencimiento ?? "",
        fecha_pago: gasto.fecha_pago ?? "",
        periodo_desde: gasto.periodo_desde ?? "",
        periodo_hasta: gasto.periodo_hasta ?? "",
        observaciones: gasto.observaciones ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [gasto]);

  const selectedTipo = useMemo(
    () => tiposGasto.find((tipo) => tipo.id === form.id_tipo_gasto),
    [form.id_tipo_gasto, tiposGasto]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number(value) : value,
    }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadOtrosGastosComprobante(file);
      setForm((prev) => ({
        ...prev,
        comprobante_url: uploaded.url,
        comprobante_nombre: uploaded.originalName,
        comprobante_mime_type: uploaded.mimeType,
      }));
      toast.success(c("Comprobante subido correctamente"));
    } catch (error: any) {
      toast.error(error?.message || c("Error al subir comprobante"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const buildPayload = (): CreateOtrosGastosDto => ({
    descripcion: form.descripcion.trim(),
    monto: Number(form.monto),
    fecha: form.fecha,
    id_tipo_gasto: normalizeNullable(form.id_tipo_gasto ?? ""),
    estado: form.estado ?? "pagado",
    medio_pago: form.medio_pago ?? "efectivo",
    proveedor_nombre: normalizeNullable(form.proveedor_nombre ?? ""),
    entidad: normalizeNullable(form.entidad ?? ""),
    numero_comprobante: normalizeNullable(form.numero_comprobante ?? ""),
    comprobante_url: normalizeNullable(form.comprobante_url ?? ""),
    comprobante_nombre: normalizeNullable(form.comprobante_nombre ?? ""),
    comprobante_mime_type: normalizeNullable(form.comprobante_mime_type ?? ""),
    fecha_vencimiento: normalizeNullable(form.fecha_vencimiento ?? ""),
    fecha_pago: normalizeNullable(form.fecha_pago ?? ""),
    periodo_desde: normalizeNullable(form.periodo_desde ?? ""),
    periodo_hasta: normalizeNullable(form.periodo_hasta ?? ""),
    observaciones: normalizeNullable(form.observaciones ?? ""),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = buildPayload();
      if (gasto?.id) {
        await updateOtrosGastos(gasto.id, payload);
        toast.success(c("Gasto actualizado"));
      } else {
        await createOtrosGastos(payload);
        toast.success(c("Gasto creado"));
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      toast.error(error?.message || c("Error al guardar gasto"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mt-4 space-y-6">
      <QaFileNameBadge file="src/components/forms/OtrosGastosForm.tsx" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descripcion">{c("Descripción *")}</Label>
          <Input
            id="descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder={c("Ej.: Factura de luz, reparación, insumos de limpieza...")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_tipo_gasto">{c("Tipo de gasto")}</Label>
          <select
            id="id_tipo_gasto"
            name="id_tipo_gasto"
            value={form.id_tipo_gasto ?? ""}
            onChange={handleChange}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            <option value="">{c("Sin clasificar")}</option>
            {tiposGasto.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {getOtrosGastosTipoLabel(locale, tipo.nombre)}
              </option>
            ))}
          </select>
          {selectedTipo?.descripcion ? (
            <p className="text-xs text-muted-foreground">{getOtrosGastosTipoLabel(locale, selectedTipo.descripcion)}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto">{c("Monto *")}</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            min="0"
            step="0.01"
            value={form.monto || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha">{c("Fecha del gasto *")}</Label>
          <Input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_vencimiento">{c("Fecha de vencimiento")}</Label>
          <Input
            id="fecha_vencimiento"
            name="fecha_vencimiento"
            type="date"
            value={form.fecha_vencimiento ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_pago">{c("Fecha de pago")}</Label>
          <Input
            id="fecha_pago"
            name="fecha_pago"
            type="date"
            value={form.fecha_pago ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">{c("Estado")}</Label>
          <select
            id="estado"
            name="estado"
            value={form.estado ?? "pagado"}
            onChange={handleChange}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            {estados.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {c(estado.label)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medio_pago">{c("Medio de pago")}</Label>
          <select
            id="medio_pago"
            name="medio_pago"
            value={form.medio_pago ?? "efectivo"}
            onChange={handleChange}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          >
            {mediosPago.map((medio) => (
              <option key={medio.value} value={medio.value}>
                {c(medio.label)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proveedor_nombre">{c("Proveedor / entidad")}</Label>
          <Input
            id="proveedor_nombre"
            name="proveedor_nombre"
            value={form.proveedor_nombre ?? ""}
            onChange={handleChange}
            placeholder={c("Ej.: Edesur, AFIP, alquiler, técnico...")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_comprobante">{c("Nº comprobante / factura")}</Label>
          <Input
            id="numero_comprobante"
            name="numero_comprobante"
            value={form.numero_comprobante ?? ""}
            onChange={handleChange}
            placeholder={c("Factura, ticket, transferencia...")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodo_desde">{c("Período desde")}</Label>
          <Input
            id="periodo_desde"
            name="periodo_desde"
            type="date"
            value={form.periodo_desde ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodo_hasta">{c("Período hasta")}</Label>
          <Input
            id="periodo_hasta"
            name="periodo_hasta"
            type="date"
            value={form.periodo_hasta ?? ""}
            onChange={handleChange}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
        <div className="mb-3 flex items-center gap-2">
          <FileUp className="h-4 w-4 text-sky-600" />
          <h3 className="font-semibold">{c("Comprobante")}</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="comprobante_file">{c("Subir PDF o imagen")}</Label>
            <input
              ref={receiptFileInputRef}
              id="comprobante_file"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
              onChange={handleFileChange}
              disabled={uploading}
              className="sr-only"
            />
            <div className="flex flex-col gap-2 rounded-md border border-input bg-background p-2 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => receiptFileInputRef.current?.click()}
                className="justify-start sm:w-auto"
              >
                <FileUp className="mr-2 h-4 w-4" />
                {uploading ? c("Subiendo...") : c("Seleccionar archivo")}
              </Button>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground dark:text-neutral-400">
                {form.comprobante_nombre || c("Sin archivo seleccionado")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {c("Formatos permitidos: PDF, PNG, JPG, WEBP, GIF, HEIC/HEIF. Máximo 10MB.")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprobante_url">{c("URL del comprobante")}</Label>
            <div className="flex gap-2">
              <Input
                id="comprobante_url"
                name="comprobante_url"
                value={form.comprobante_url ?? ""}
                onChange={handleChange}
                placeholder={c("URL de Cloudinary o comprobante externo")}
              />
              {form.comprobante_url ? (
                <Button type="button" variant="outline" asChild>
                  <a href={form.comprobante_url} target="_blank" rel="noreferrer" title={c("Abrir comprobante")}>
                    <LinkIcon className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
            {form.comprobante_nombre ? (
              <p className="text-xs text-muted-foreground">{c("Archivo:")} {form.comprobante_nombre}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="observaciones">{c("Observaciones")}</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          value={form.observaciones ?? ""}
          onChange={handleChange}
          rows={3}
          placeholder={c("Notas internas, detalle del gasto, condiciones de pago...")}
          className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
        />
      </div>

      <Button type="submit" disabled={loading || uploading} className="w-full bg-[#02a8e1] hover:bg-[#0288b1]">
        {loading ? c("Guardando...") : gasto ? c("Actualizar Gasto") : c("Crear Gasto")}
      </Button>
    </form>
  );
}
