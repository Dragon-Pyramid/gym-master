"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAviso } from "@/services/avisoService";
import { CreateAvisoDto } from "@/interfaces/aviso.interface";
import TextEditor from "@/components/ui/TextEditor";
import { useI18n } from "@/i18n/I18nProvider";

const emptyForm: CreateAvisoDto = {
  titulo: "",
  mensaje: "",
  tipo: "general",
  fecha_envio: new Date().toISOString().slice(0, 10),
  enviar_email: false,
  enviado: false,
};

export default function AvisosForm({ onCreated }: { onCreated?: () => void }) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => (locale === "en" ? en : es);
  const [form, setForm] = useState<CreateAvisoDto>(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMensajeChange = (value: string) => {
    setForm((prev) => ({ ...prev, mensaje: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAviso(form);
      setForm(emptyForm);
      if (onCreated) onCreated();
    } catch {}
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <QaFileNameBadge file="src/components/forms/AvisosForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titulo">{c("Título", "Title")}</Label>
        <Input
          id="titulo"
          name="titulo"
          placeholder={c("Ingrese título", "Enter title")}
          value={form.titulo}
          onChange={handleChange}
          required
          className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mensaje">{c("Mensaje", "Message")}</Label>
        <TextEditor value={form.mensaje} onChange={handleMensajeChange} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo">{c("Tipo", "Type")}</Label>
        <Input
          id="tipo"
          name="tipo"
          placeholder={c("Tipo de aviso", "Notice type")}
          value={form.tipo}
          onChange={handleChange}
          required
          className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_envio">{c("Fecha de envío", "Send date")}</Label>
        <Input
          id="fecha_envio"
          name="fecha_envio"
          type="date"
          value={form.fecha_envio}
          onChange={handleChange}
          required
          className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="enviar_email"
          name="enviar_email"
          type="checkbox"
          checked={form.enviar_email}
          onChange={handleChange}
          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <Label htmlFor="enviar_email">{c("Enviar por email", "Send by email")}</Label>
      </div>
      <Button type="submit" className="justify-self-end" disabled={loading}>
        {loading ? c("Enviando...", "Sending...") : c("Enviar aviso", "Send notice")}
      </Button>
    </form>
  );
}
