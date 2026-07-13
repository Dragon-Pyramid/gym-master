"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
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
import { useI18n } from "@/i18n/I18nProvider";

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
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === "en" ? en : es);

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
      throw new Error(tx("El peso es obligatorio y debe ser mayor a cero.", "Weight is required and must be greater than zero."));
    }

    if (!altura || altura <= 0) {
      throw new Error(tx("La altura es obligatoria y debe ser mayor a cero.", "Height is required and must be greater than zero."));
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
        throw new Error(`${tx("El campo", "The field")} ${key.replaceAll("_", " ")} ${tx("debe ser un número válido no negativo.", "must be a valid non-negative number.")}`);
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

      toast.success(tx("Evolución física registrada", "Physical evolution record saved"));
      setForm({ ...emptyForm, fecha: today() });
      onCreated();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : tx("Error al registrar evolución", "Error saving physical evolution record")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <QaFileNameBadge file="src/components/forms/EvolucionSocioForm.tsx" />
      <SectionTitle>{tx("Datos principales", "Main data")}</SectionTitle>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha">{tx("Fecha", "Date")}</Label>
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
        <Label htmlFor="peso">{tx("Peso (kg) *", "Weight (kg) *")}</Label>
        <Input
          id="peso"
          name="peso"
          type="number"
          step="0.01"
          min="0"
          placeholder={tx("Ej: 78.5", "Ex: 78.5")}
          value={form.peso}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="altura">{tx("Altura (cm) *", "Height (cm) *")}</Label>
        <Input
          id="altura"
          name="altura"
          type="number"
          step="0.01"
          min="0"
          placeholder={tx("Ej: 176", "Ex: 176")}
          value={form.altura}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{tx("IMC calculado", "Calculated BMI")}</Label>
        <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-foreground">
          {imcPreview ?? tx("Completar peso y altura", "Complete weight and height")}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo_corporal">{tx("Tipo corporal", "Body type")}</Label>
        <select
          id="tipo_corporal"
          name="tipo_corporal"
          value={form.tipo_corporal}
          onChange={handleChange}
          className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
        >
          <option value="">{tx("Sin especificar", "Not specified")}</option>
          <option value="ectomorfo">{tx("Ectomorfo", "Ectomorph")}</option>
          <option value="mesomorfo">{tx("Mesomorfo", "Mesomorph")}</option>
          <option value="endomorfo">{tx("Endomorfo", "Endomorph")}</option>
          <option value="mixto">{tx("Mixto", "Mixed")}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sexo_referencia">{tx("Sexo de referencia", "Reference sex")}</Label>
        <select
          id="sexo_referencia"
          name="sexo_referencia"
          value={form.sexo_referencia}
          onChange={handleChange}
          className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
        >
          <option value="">{tx("Sin especificar", "Not specified")}</option>
          <option value="masculino">{tx("Masculino", "Male")}</option>
          <option value="femenino">{tx("Femenino", "Female")}</option>
          <option value="otro">{tx("Otro", "Other")}</option>
          <option value="no_especificado">{tx("No especificado", "Not specified")}</option>
        </select>
      </div>

      <SectionTitle>{tx("Medidas torso", "Torso measurements")}</SectionTitle>

      {[
        ["pecho", tx("Pecho (cm)", "Chest (cm)")],
        ["cintura", tx("Cintura (cm)", "Waist (cm)")],
        ["cadera", tx("Cadera (cm)", "Hip (cm)")],
        ["abdomen", tx("Abdomen (cm)", "Abdomen (cm)")],
        ["cuello", tx("Cuello (cm)", "Neck (cm)")],
        ["hombros", tx("Hombros (cm)", "Shoulders (cm)")],
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

      <SectionTitle>{tx("Medidas brazos y piernas", "Arm and leg measurements")}</SectionTitle>

      {[
        ["antebrazo_izquierdo", tx("Antebrazo izquierdo (cm)", "Left forearm (cm)")],
        ["antebrazo_derecho", tx("Antebrazo derecho (cm)", "Right forearm (cm)")],
        ["biceps_izquierdo", tx("Bíceps izquierdo (cm)", "Left biceps (cm)")],
        ["biceps_derecho", tx("Bíceps derecho (cm)", "Right biceps (cm)")],
        ["triceps_izquierdo", tx("Tríceps izquierdo (cm)", "Left triceps (cm)")],
        ["triceps_derecho", tx("Tríceps derecho (cm)", "Right triceps (cm)")],
        ["muslo_izquierdo", tx("Muslo izquierdo (cm)", "Left thigh (cm)")],
        ["muslo_derecho", tx("Muslo derecho (cm)", "Right thigh (cm)")],
        ["pantorrilla_izquierda", tx("Pantorrilla izquierda (cm)", "Left calf (cm)")],
        ["pantorrilla_derecha", tx("Pantorrilla derecha (cm)", "Right calf (cm)")],
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

      <SectionTitle>{tx("Composición corporal", "Body composition")}</SectionTitle>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="porcentaje_grasa">{tx("% Grasa", "Fat %")}</Label>
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
        <Label htmlFor="masa_muscular">{tx("Masa muscular (kg)", "Muscle mass (kg)")}</Label>
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
        <Label htmlFor="observaciones">{tx("Observaciones", "Notes")}</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          placeholder={tx("Notas del control, contexto del entrenamiento, cambios de dieta o comentarios relevantes...", "Control notes, training context, diet changes, or relevant comments...")}
          value={form.observaciones}
          onChange={handleChange}
          className="min-h-24 resize-y rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="col-span-full flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {tx("Cancelar", "Cancel")}
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#02a8e1] hover:bg-[#0288b1]">
          {loading ? tx("Guardando...", "Saving...") : tx("Registrar evolución", "Register evolution")}
        </Button>
      </div>
    </form>
  );
}
