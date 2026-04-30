"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAviso } from "@/services/avisoService";
import { CreateAvisoDto } from "@/interfaces/aviso.interface";
import TextEditor from "@/components/ui/TextEditor";

const emptyForm: CreateAvisoDto = {
  titulo: "",
  mensaje: "",
  tipo: "general",
  fecha_envio: new Date().toISOString().slice(0, 10),
  enviar_email: false,
  enviado: false,
};

export default function AvisosForm({ onCreated }: { onCreated?: () => void }) {
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          name="titulo"
          placeholder="Ingrese título"
          value={form.titulo}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mensaje">Mensaje</Label>
        <TextEditor value={form.mensaje} onChange={handleMensajeChange} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo">Tipo</Label>
        <Input
          id="tipo"
          name="tipo"
          placeholder="Tipo de aviso"
          value={form.tipo}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_envio">Fecha de envío</Label>
        <Input
          id="fecha_envio"
          name="fecha_envio"
          type="date"
          value={form.fecha_envio}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="enviar_email"
          name="enviar_email"
          type="checkbox"
          checked={form.enviar_email}
          onChange={handleChange}
        />
        <Label htmlFor="enviar_email">Enviar por email</Label>
      </div>
      <Button type="submit" className="justify-self-end" disabled={loading}>
        {loading ? "Enviando..." : "Enviar Aviso"}
      </Button>
    </form>
  );
}
