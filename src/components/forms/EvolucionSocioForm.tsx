"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { registrarEvolucionSocio } from "@/services/apiClient";
import { toast } from "sonner";

const emptyForm = {
  peso: "",
  cintura: "",
  bicep: "",
  tricep: "",
  pierna: "",
  gluteos: "",
  pantorrilla: "",
  altura: "",
  observaciones: "",
};

export default function EvolucionSocioForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registrarEvolucionSocio({
        peso: parseFloat(form.peso),
        cintura: parseFloat(form.cintura),
        bicep: parseFloat(form.bicep),
        tricep: parseFloat(form.tricep),
        pierna: parseFloat(form.pierna),
        gluteos: parseFloat(form.gluteos),
        pantorrilla: parseFloat(form.pantorrilla),
        altura: parseFloat(form.altura),
        observaciones: form.observaciones,
      });
      toast.success("Evolución registrada");
      setForm(emptyForm);
      onCreated();
    } catch (error: unknown) {
      toast.error((error as Error).message || "Error al registrar evolución");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      {Object.keys(emptyForm).map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Label>
          {key === "observaciones" ? (
            <textarea
              id={key}
              name={key}
              placeholder={`Ingrese ${key}`}
              value={form[key as keyof typeof emptyForm]}
              onChange={handleChange}
              className="h-24 resize-none"
              required
            />
          ) : (
            <Input
              id={key}
              name={key}
              type="number"
              placeholder={`Ingrese ${key}`}
              value={form[key as keyof typeof emptyForm]}
              onChange={handleChange}
              required
            />
          )}
        </div>
      ))}

      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading ? "Guardando..." : "Registrar Evolución"}
      </Button>

      <Button
        type="button"
        onClick={onCancel}
        className="text-gray-800 bg-gray-200 col-span-full justify-self-end hover:bg-gray-300"
        disabled={loading}
      >
        Cancelar
      </Button>
    </form>
  );
}
