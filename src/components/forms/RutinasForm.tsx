"use client";

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
}: {
  initialValues?: RutinaFormValues;
  onSubmit: (values: RutinaFormValues) => void;
  loading?: boolean;
  objetivos: Objetivo[];
  niveles: Nivel[];
}) {
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
      toast.error("Todos los campos son obligatorios");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generarNuevaRutina({
        objetivo: parseInt(values.objetivo),
        nivel: parseInt(values.nivel),
        dias: parseInt(values.dias),
      });

      if (!response.ok) {
        throw new Error("Error al generar rutina");
      }

      toast.success("Rutina generada correctamente");
      onSubmit(values);
    } catch (error) {
      console.error("Error al generar rutina:", error);
      toast.error("Error al generar la rutina");
    } finally {
      setIsGenerating(false);
    }
  };

  const diasOptions = [
    { value: "1", label: "1 día" },
    { value: "2", label: "2 días" },
    { value: "3", label: "3 días" },
    { value: "4", label: "4 días" },
    { value: "5", label: "5 días" },
    { value: "6", label: "6 días" },
  ];

  const getObjetivoLabel = () => {
    if (!values.objetivo) return "Selecciona un objetivo";
    const objetivo = objetivos.find((o) => o.id_objetivo === values.objetivo);
    return objetivo ? objetivo.nombre_objetivo : "Selecciona un objetivo";
  };

  const getNivelLabel = () => {
    if (!values.nivel) return "Selecciona un nivel";
    const nivel = niveles.find((n) => n.id_nivel === values.nivel);
    return nivel ? nivel.nombre_nivel : "Selecciona un nivel";
  };

  const getDiasLabel = () => {
    if (!values.dias) return "Selecciona cantidad de días";
    const dia = diasOptions.find((d) => d.value === values.dias);
    return dia ? dia.label : "Selecciona cantidad de días";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div className="flex flex-col gap-1.5">
        <Label>Objetivo</Label>
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
                {objetivo.nombre_objetivo}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Nivel</Label>
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
                {nivel.nombre_nivel}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Cantidad de Días</Label>
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
        {isGenerating ? "Generando rutina..." : "Generar Rutina"}
      </Button>
    </form>
  );
}
