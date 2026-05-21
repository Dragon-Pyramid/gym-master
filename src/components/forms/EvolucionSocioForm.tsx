"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SexoReferencia,
  TipoCorporal,
} from "@/interfaces/evolucionSocio.interface";
import { registrarEvolucionFisica } from "@/services/evolucionSocioClient";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  fecha: today(),
  peso: "",
  altura: "",
  cintura: "",
  pecho: "",
  cadera: "",
  abdomen: "",
  cuello: "",
  hombros: "",
  antebrazo_izquierdo: "",
  antebrazo_derecho: "",
  biceps_izquierdo: "",
  biceps_derecho: "",
  triceps_izquierdo: "",
  triceps_derecho: "",
  muslo_izquierdo: "",
  muslo_derecho: "",
  pantorrilla_izquierda: "",
  pantorrilla_derecha: "",
  porcentaje_grasa: "",
  masa_muscular: "",
  tipo_corporal: "",
  sexo_referencia: "",
  observaciones: "",
};

type EvolucionSocioFormState = typeof emptyForm;

const toOptionalNumber = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="col-span-full border-b pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </h3>
);

export default function EvolucionSocioForm({
  socioId = "me",
  onCreated,
  onCancel,
}: {
  socioId?: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EvolucionSocioFormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const imcPreview = useMemo(() => {
    const peso = Number(form.peso);
    const altura = Number(form.altura);

    if (!peso || !altura || altura <= 0) return null;

    const alturaM = altura / 100;
    return Number((peso / (alturaM * alturaM)).toFixed(2));
  }, [form.peso, form.altura]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const peso = Number(form.peso);
    const altura = Number(form.altura);

    if (!peso || peso <= 0) {
      throw new Error("El peso es obligatorio y debe ser mayor a cero.");
    }

    if (!altura || altura <= 0) {
      throw new Error("La altura es obligatoria y debe ser mayor a cero.");
    }

    const numericKeys = Object.keys(form).filter(
      (key) =>
        !["fecha", "tipo_corporal", "sexo_referencia", "observaciones"].includes(key)
    ) as Array<keyof EvolucionSocioFormState>;

    for (const key of numericKeys) {
      const rawValue = form[key];

      if (rawValue === "") continue;

      const value = Number(rawValue);

      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`El campo ${key.replaceAll("_", " ")} debe ser un número válido no negativo.`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      validate();

      await registrarEvolucionFisica({
        socio_id: socioId !== "me" ? socioId : undefined,
        fecha: form.fecha,
        peso: Number(form.peso),
        altura: Number(form.altura),
        cintura: toOptionalNumber(form.cintura),
        pecho: toOptionalNumber(form.pecho),
        cadera: toOptionalNumber(form.cadera),
        abdomen: toOptionalNumber(form.abdomen),
        cuello: toOptionalNumber(form.cuello),
        hombros: toOptionalNumber(form.hombros),
        antebrazo_izquierdo: toOptionalNumber(form.antebrazo_izquierdo),
        antebrazo_derecho: toOptionalNumber(form.antebrazo_derecho),
        biceps_izquierdo: toOptionalNumber(form.biceps_izquierdo),
        biceps_derecho: toOptionalNumber(form.biceps_derecho),
        triceps_izquierdo: toOptionalNumber(form.triceps_izquierdo),
        triceps_derecho: toOptionalNumber(form.triceps_derecho),
        muslo_izquierdo: toOptionalNumber(form.muslo_izquierdo),
        muslo_derecho: toOptionalNumber(form.muslo_derecho),
        pantorrilla_izquierda: toOptionalNumber(form.pantorrilla_izquierda),
        pantorrilla_derecha: toOptionalNumber(form.pantorrilla_derecha),
        porcentaje_grasa: toOptionalNumber(form.porcentaje_grasa),
        masa_muscular: toOptionalNumber(form.masa_muscular),
        tipo_corporal: form.tipo_corporal
          ? (form.tipo_corporal as TipoCorporal)
          : null,
        sexo_referencia: form.sexo_referencia
          ? (form.sexo_referencia as SexoReferencia)
          : null,
        observaciones: form.observaciones.trim() || null,
      });

      toast.success("Evolución física registrada");
      setForm({ ...emptyForm, fecha: today() });
      onCreated();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar evolución"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SectionTitle>Datos principales</SectionTitle>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha">Fecha</Label>
        <Input
          id="fecha"
          name="fecha"
          type="date"
          value={form.fecha}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="peso">Peso (kg) *</Label>
        <Input
          id="peso"
          name="peso"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ej: 78.5"
          value={form.peso}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="altura">Altura (cm) *</Label>
        <Input
          id="altura"
          name="altura"
          type="number"
          step="0.01"
          min="0"
          placeholder="Ej: 176"
          value={form.altura}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>IMC calculado</Label>
        <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
          {imcPreview ?? "Completar peso y altura"}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo_corporal">Tipo corporal</Label>
        <select
          id="tipo_corporal"
          name="tipo_corporal"
          value={form.tipo_corporal}
          onChange={handleChange}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Sin especificar</option>
          <option value="ectomorfo">Ectomorfo</option>
          <option value="mesomorfo">Mesomorfo</option>
          <option value="endomorfo">Endomorfo</option>
          <option value="mixto">Mixto</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sexo_referencia">Sexo de referencia</Label>
        <select
          id="sexo_referencia"
          name="sexo_referencia"
          value={form.sexo_referencia}
          onChange={handleChange}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Sin especificar</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
          <option value="no_especificado">No especificado</option>
        </select>
      </div>

      <SectionTitle>Medidas torso</SectionTitle>

      {[
        ["pecho", "Pecho (cm)"],
        ["cintura", "Cintura (cm)"],
        ["cadera", "Cadera (cm)"],
        ["abdomen", "Abdomen (cm)"],
        ["cuello", "Cuello (cm)"],
        ["hombros", "Hombros (cm)"],
      ].map(([name, label]) => (
        <div key={name} className="flex flex-col gap-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type="number"
            step="0.01"
            min="0"
            value={form[name as keyof EvolucionSocioFormState]}
            onChange={handleChange}
          />
        </div>
      ))}

      <SectionTitle>Medidas brazos y piernas</SectionTitle>

      {[
        ["antebrazo_izquierdo", "Antebrazo izquierdo (cm)"],
        ["antebrazo_derecho", "Antebrazo derecho (cm)"],
        ["biceps_izquierdo", "Bíceps izquierdo (cm)"],
        ["biceps_derecho", "Bíceps derecho (cm)"],
        ["triceps_izquierdo", "Tríceps izquierdo (cm)"],
        ["triceps_derecho", "Tríceps derecho (cm)"],
        ["muslo_izquierdo", "Muslo izquierdo (cm)"],
        ["muslo_derecho", "Muslo derecho (cm)"],
        ["pantorrilla_izquierda", "Pantorrilla izquierda (cm)"],
        ["pantorrilla_derecha", "Pantorrilla derecha (cm)"],
      ].map(([name, label]) => (
        <div key={name} className="flex flex-col gap-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type="number"
            step="0.01"
            min="0"
            value={form[name as keyof EvolucionSocioFormState]}
            onChange={handleChange}
          />
        </div>
      ))}

      <SectionTitle>Composición corporal</SectionTitle>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="porcentaje_grasa">% Grasa</Label>
        <Input
          id="porcentaje_grasa"
          name="porcentaje_grasa"
          type="number"
          step="0.01"
          min="0"
          value={form.porcentaje_grasa}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="masa_muscular">Masa muscular (kg)</Label>
        <Input
          id="masa_muscular"
          name="masa_muscular"
          type="number"
          step="0.01"
          min="0"
          value={form.masa_muscular}
          onChange={handleChange}
        />
      </div>

      <div className="col-span-full flex flex-col gap-1.5">
        <Label htmlFor="observaciones">Observaciones</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          placeholder="Notas del control, contexto del entrenamiento, cambios de dieta o comentarios relevantes..."
          value={form.observaciones}
          onChange={handleChange}
          className="min-h-24 resize-y rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="col-span-full flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#02a8e1] hover:bg-[#0288b1]">
          {loading ? "Guardando..." : "Registrar evolución"}
        </Button>
      </div>
    </form>
  );
}
