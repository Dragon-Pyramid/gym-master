"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createServicio, updateServicio } from "@/services/servicioService";
import { Servicio } from "@/interfaces/servicio.interface";
import { toast } from "sonner";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export interface ServicioFormProps {
  servicio?: Servicio | null;
  onCreated: () => void;
}

const CATEGORIAS_SERVICIO = [
  { value: "personal_trainer", label: "Personal trainer" },
  { value: "evaluacion", label: "Evaluación física" },
  { value: "nutricion", label: "Nutrición" },
  { value: "clase_especial", label: "Clase especial" },
  { value: "pase", label: "Pase / acceso" },
  { value: "alquiler", label: "Alquiler de espacio" },
  { value: "premium", label: "Servicio premium" },
  { value: "otro", label: "Otro" },
];

const MODALIDADES_SERVICIO = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "mixto", label: "Mixto" },
];

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  codigo: "",
  categoria: "otro",
  duracion_minutos: "",
  requiere_reserva: false,
  cupo_maximo: "",
  modalidad: "presencial",
  disponible_online: false,
  observaciones: "",
};

export default function ServicioForm({
  servicio,
  onCreated,
}: ServicioFormProps) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (servicio) {
      setForm({
        nombre: servicio.nombre ?? "",
        descripcion: servicio.descripcion ?? "",
        precio: servicio.precio !== undefined ? String(servicio.precio) : "",
        codigo: servicio.codigo ?? "",
        categoria: servicio.categoria ?? "otro",
        duracion_minutos: servicio.duracion_minutos ? String(servicio.duracion_minutos) : "",
        requiere_reserva: Boolean(servicio.requiere_reserva),
        cupo_maximo: servicio.cupo_maximo ? String(servicio.cupo_maximo) : "",
        modalidad: servicio.modalidad ?? "presencial",
        disponible_online: Boolean(servicio.disponible_online),
        observaciones: servicio.observaciones ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [servicio]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "codigo") {
      const normalized = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
      setForm((prev) => ({ ...prev, codigo: normalized }));
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
      const duracion = form.duracion_minutos.trim() ? Number(form.duracion_minutos) : null;
      const cupo = form.cupo_maximo.trim() ? Number(form.cupo_maximo) : null;

      if (!Number.isFinite(precio) || precio < 0) {
        throw new Error(c("El precio debe ser un número válido mayor o igual a cero."));
      }

      if (duracion !== null && (!Number.isInteger(duracion) || duracion <= 0)) {
        throw new Error(c("La duración debe ser un número entero positivo."));
      }

      if (cupo !== null && (!Number.isInteger(cupo) || cupo <= 0)) {
        throw new Error(c("El cupo máximo debe ser un número entero positivo."));
      }

      const payload = {
        nombre: form.nombre,
        codigo: form.codigo || null,
        descripcion: form.descripcion,
        precio,
        categoria: form.categoria,
        duracion_minutos: duracion,
        requiere_reserva: form.requiere_reserva,
        cupo_maximo: cupo,
        modalidad: form.modalidad,
        disponible_online: form.disponible_online,
        observaciones: form.observaciones || null,
      };

      if (servicio && servicio.id) {
        await updateServicio(servicio.id, payload);
        toast.success(c("Servicio actualizado"));
      } else {
        await createServicio(payload);
        toast.success(c("Servicio creado"));
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || c("Error al guardar servicio");
      if (msg.includes("value too long")) {
        msg =
          c("Uno de los campos excede la cantidad máxima de caracteres permitidos.");
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  function generarCodigoServicio() {
    const base = (form.nombre || "SERV")
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    setForm((prev) => ({ ...prev, codigo: `${base || 'SERV'}-${String(Date.now()).slice(-5)}` }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/ServicioForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">{c("Nombre")}</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder={c("Ej: Personal trainer 1 hora")}
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precio">{c("Precio")}</Label>
        <Input
          id="precio"
          name="precio"
          type="number"
          inputMode="decimal"
          placeholder={c("Ingrese precio")}
          value={form.precio}
          onChange={handleChange}
          required
          min={0}
          step="0.01"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="codigo">{c("Código comercial / QR")}</Label>
          <Button type="button" size="sm" variant="outline" onClick={generarCodigoServicio}>
            {c("Generar")}
          </Button>
        </div>
        <Input
          id="codigo"
          name="codigo"
          placeholder={c("Ej: SERV-EVALUACION-001")}
          value={form.codigo}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground">
          {c("El scanner móvil/POS puede resolver servicios por este código.")}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoria">{c("Categoría")}</Label>
        <select
          id="categoria"
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {CATEGORIAS_SERVICIO.map((categoria) => (
            <option key={categoria.value} value={categoria.value}>
              {c(categoria.label)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="modalidad">{c("Modalidad")}</Label>
        <select
          id="modalidad"
          name="modalidad"
          value={form.modalidad}
          onChange={handleChange}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {MODALIDADES_SERVICIO.map((modalidad) => (
            <option key={modalidad.value} value={modalidad.value}>
              {c(modalidad.label)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="duracion_minutos">{c("Duración estimada (minutos)")}</Label>
        <Input
          id="duracion_minutos"
          name="duracion_minutos"
          type="number"
          inputMode="numeric"
          placeholder={c("Ej: 60")}
          value={form.duracion_minutos}
          onChange={handleChange}
          min={1}
          step={1}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cupo_maximo">{c("Cupo máximo")}</Label>
        <Input
          id="cupo_maximo"
          name="cupo_maximo"
          type="number"
          inputMode="numeric"
          placeholder={c("Opcional")}
          value={form.cupo_maximo}
          onChange={handleChange}
          min={1}
          step={1}
        />
      </div>
      <div className="flex items-center gap-2 rounded-md border p-3">
        <Checkbox
          id="requiere_reserva"
          checked={form.requiere_reserva}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, requiere_reserva: checked === true }))
          }
        />
        <Label htmlFor="requiere_reserva" className="cursor-pointer">
          {c("Requiere reserva o coordinación previa")}
        </Label>
      </div>
      <div className="flex items-center gap-2 rounded-md border p-3">
        <Checkbox
          id="disponible_online"
          checked={form.disponible_online}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, disponible_online: checked === true }))
          }
        />
        <Label htmlFor="disponible_online" className="cursor-pointer">
          {c("Disponible para venta online futura")}
        </Label>
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="descripcion">{c("Descripción")}</Label>
        <textarea
          id="descripcion"
          name="descripcion"
          placeholder={c("Describí qué incluye el servicio, condiciones y alcance.")}
          value={form.descripcion}
          onChange={handleChange}
          className="border rounded-md p-2 min-h-[80px]"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="observaciones">{c("Observaciones internas")}</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          placeholder={c("Notas internas, requisitos, disponibilidad o aclaraciones comerciales.")}
          value={form.observaciones}
          onChange={handleChange}
          className="border rounded-md p-2 min-h-[70px]"
        />
      </div>
      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading
          ? c("Guardando...")
          : servicio
          ? c("Actualizar Servicio")
          : c("Crear Servicio")}
      </Button>
    </form>
  );
}
