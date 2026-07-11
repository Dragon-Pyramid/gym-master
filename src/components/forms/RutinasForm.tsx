"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Objetivo } from "@/interfaces/objetivo.interface";
import { Nivel } from "@/interfaces/niveles.interface";
import { toast } from "sonner";
import { generarNuevaRutina } from "@/services/apiClient";
import { useI18n } from "@/i18n/I18nProvider";

export interface RutinaFormValues {
  objetivo: string;
  nivel: string;
  dias: string;
}

export default function RutinasForm({
  initialValues,
  onSubmit,
  loading,
  objetivos,
  niveles,
  targetSocioId,
  targetSocioName,
}: {
  initialValues?: RutinaFormValues;
  onSubmit: (values: RutinaFormValues) => void | Promise<void>;
  loading?: boolean;
  objetivos: Objetivo[];
  niveles: Nivel[];
  targetSocioId?: string;
  targetSocioName?: string;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  const translateObjective = (value?: string | null) => {
    const label = String(value ?? "").trim();
    const normalized = label.toLowerCase();
    const map: Record<string, string> = {
      fuerza: "Strength",
      hipertrofia: "Hypertrophy",
      resistencia: "Endurance",
      tonificacion: "Toning",
      tonificación: "Toning",
      adelgazar: "Weight loss",
      "perder peso": "Weight loss",
      "ganar masa muscular": "Muscle gain",
      mantenimiento: "Maintenance",
      rehabilitacion: "Rehabilitation",
      rehabilitación: "Rehabilitation",
      "rehabilitación física": "Physical rehabilitation",
      "rehabilitacion fisica": "Physical rehabilitation",
      "salud general": "General health",
      "preparación para competencia": "Competition preparation",
      "preparacion para competencia": "Competition preparation",
      "condición física postparto": "Postpartum physical conditioning",
      "condicion fisica postparto": "Postpartum physical conditioning",
      "condición physical postpartum": "Postpartum physical conditioning",
      "condicion physical postpartum": "Postpartum physical conditioning",
      "control del estrés": "Stress management",
      "control del estres": "Stress management",
    };
    return isEnglish ? map[normalized] ?? label : label;
  };

  const translateLevel = (value?: string | null) => {
    const label = String(value ?? "").trim();
    const normalized = label.toLowerCase();
    const map: Record<string, string> = {
      principiante: "Beginner",
      inicial: "Beginner",
      intermedio: "Intermediate",
      avanzado: "Advanced",
      experto: "Expert",
    };
    return isEnglish ? map[normalized] ?? label : label;
  };

  const [values, setValues] = useState<RutinaFormValues>(
    initialValues || {
      objetivo: "",
      nivel: "",
      dias: "",
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (field: keyof RutinaFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!values.objetivo || !values.nivel || !values.dias) {
      toast.error(tx("Todos los campos son obligatorios", "All fields are required"));
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generarNuevaRutina({
        objetivo: parseInt(values.objetivo),
        nivel: parseInt(values.nivel),
        dias: parseInt(values.dias),
        ...(targetSocioId ? { id_socio: targetSocioId } : {}),
      });

      if (!response.ok) {
        throw new Error(response.data?.error || tx("Error al generar rutina", "Error generating routine"));
      }

      toast.success(
        targetSocioName
          ? tx(`Rutina generada correctamente para ${targetSocioName}`, `Routine generated successfully for ${targetSocioName}`)
          : tx("Rutina generada correctamente", "Routine generated successfully")
      );
      await onSubmit(values);
    } catch (error) {
      console.error("Error al generar rutina:", error);
      toast.error(
        error instanceof Error ? error.message : tx("Error al generar la rutina", "Error generating the routine")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const diasOptions = [
    { value: "1", label: tx("1 día", "1 day") },
    { value: "2", label: tx("2 días", "2 days") },
    { value: "3", label: tx("3 días", "3 days") },
    { value: "4", label: tx("4 días", "4 days") },
    { value: "5", label: tx("5 días", "5 days") },
    { value: "6", label: tx("6 días", "6 days") },
  ];

  const getObjetivoLabel = () => {
    if (!values.objetivo) return tx("Selecciona un objetivo", "Select a goal");
    const objetivo = objetivos.find((o) => o.id_objetivo === values.objetivo);
    return objetivo ? translateObjective(objetivo.nombre_objetivo) : tx("Selecciona un objetivo", "Select a goal");
  };

  const getNivelLabel = () => {
    if (!values.nivel) return tx("Selecciona un nivel", "Select a level");
    const nivel = niveles.find((n) => n.id_nivel === values.nivel);
    return nivel ? translateLevel(nivel.nombre_nivel) : tx("Selecciona un nivel", "Select a level");
  };

  const getDiasLabel = () => {
    if (!values.dias) return tx("Selecciona cantidad de días", "Select number of days");
    const dia = diasOptions.find((d) => d.value === values.dias);
    return dia ? dia.label : tx("Selecciona cantidad de días", "Select number of days");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/RutinasForm.tsx" />
      {targetSocioName && (
        <div className="col-span-full rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {tx("Generando rutina para:", "Generating routine for:")}{" "}
          <span className="font-semibold text-foreground">{targetSocioName}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>{tx("Objetivo", "Goal")}</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between bg-background text-foreground border-border"
            >
              {getObjetivoLabel()}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {objetivos.map((objetivo) => (
              <DropdownMenuItem
                key={objetivo.id_objetivo}
                onSelect={() => handleChange("objetivo", objetivo.id_objetivo)}
              >
                {translateObjective(objetivo.nombre_objetivo)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{tx("Nivel", "Level")}</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between bg-background text-foreground border-border"
            >
              {getNivelLabel()}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {niveles.map((nivel) => (
              <DropdownMenuItem
                key={nivel.id_nivel}
                onSelect={() => handleChange("nivel", nivel.id_nivel)}
              >
                {translateLevel(nivel.nombre_nivel)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{tx("Cantidad de Días", "Number of days")}</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between bg-background text-foreground border-border"
            >
              {getDiasLabel()}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {diasOptions.map((dia) => (
              <DropdownMenuItem
                key={dia.value}
                onSelect={() => handleChange("dias", dia.value)}
              >
                {dia.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        type="submit"
        className="col-span-full justify-self-end bg-[#02a8e1] hover:bg-[#0288b1]"
        disabled={loading || isGenerating}
      >
        {isGenerating ? tx("Generando rutina...", "Generating routine...") : tx("Generar Rutina", "Generate routine")}
      </Button>
    </form>
  );
}
