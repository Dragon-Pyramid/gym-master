"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createCuota, updateCuota } from "@/services/cuotaService";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

export interface CuotasFormProps {
  cuota?: {
    id?: string;
    descripcion: string;
    monto: number;
    periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
  } | null;
  onCreated: () => void;
}

const emptyForm = {
  descripcion: "",
  monto: 0,
  periodo: "",
  fecha_inicio: "",
  fecha_fin: "",
};

export default function CuotasForm({ cuota, onCreated }: CuotasFormProps) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cuota) {
      setForm({
        descripcion: cuota.descripcion ?? "",
        monto: cuota.monto ?? 0,
        periodo: cuota.periodo ?? "",
        fecha_inicio: cuota.fecha_inicio ?? "",
        fecha_fin: cuota.fecha_fin ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [cuota]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (cuota && cuota.id) {
        await updateCuota(cuota.id, { ...form, activo: true });
        toast.success(tx("Cuota actualizada", "Fee updated"));
      } else {
        await createCuota(form);
        toast.success(tx("Cuota creada", "Fee created"));
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || tx("Error al guardar cuota", "Error saving fee");
      if (msg.includes("value too long")) {
        msg = tx(
          "Uno de los campos excede la cantidad máxima de caracteres permitidos.",
          "One of the fields exceeds the maximum allowed number of characters.",
        );
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "dark:border-neutral-800 dark:bg-black dark:text-neutral-100 dark:placeholder:text-neutral-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/CuotasForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">{tx("Descripción", "Description")}</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder={tx("Ingrese descripción", "Enter description")}
          value={form.descripcion}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monto">{tx("Monto", "Amount")}</Label>
        <Input
          id="monto"
          name="monto"
          type="number"
          placeholder={tx("Ingrese monto", "Enter amount")}
          value={form.monto}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodo">{tx("Período", "Period")}</Label>
        <Input
          id="periodo"
          name="periodo"
          placeholder={tx("Ingrese período", "Enter period")}
          value={form.periodo}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_inicio">{tx("Fecha de Inicio", "Start date")}</Label>
        <Input
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          value={form.fecha_inicio}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_fin">{tx("Fecha de Fin", "End date")}</Label>
        <Input
          id="fecha_fin"
          name="fecha_fin"
          type="date"
          value={form.fecha_fin}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading
          ? tx("Guardando...", "Saving...")
          : cuota
          ? tx("Actualizar Cuota", "Update fee")
          : tx("Crear Cuota", "Create fee")}
      </Button>
    </form>
  );
}
