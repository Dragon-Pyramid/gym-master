"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  Entrenador,
  CreateEntrenadorDto,
  UpdateEntrenadorDto,
  DiaHorario,
  BloqueHorario,
} from "@/interfaces/entrenador.interface";

export interface EntrenadorFormProps {
  entrenador?: Entrenador | null;
  onCreated: () => void;
}

const diasSemana = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const emptyForm = {
  nombre_completo: "",
  dni: "",
};

export default function EntrenadorForm({
  entrenador,
  onCreated,
}: EntrenadorFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<{ [dia: string]: BloqueHorario[] }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const agregarBloque = (dia: string) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: [...(prev[dia] || []), { hora_desde: "", hora_hasta: "" }],
    }));
  };

  const eliminarBloque = (dia: string, index: number) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((_, i) => i !== index),
    }));
  };

  const actualizarBloque = (
    dia: string,
    index: number,
    campo: "hora_desde" | "hora_hasta",
    valor: string
  ) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: prev[dia].map((bloque, i) =>
        i === index ? { ...bloque, [campo]: valor } : bloque
      ),
    }));
  };

  const toggleDia = (dia: string, checked: boolean) => {
    if (checked) {
      setDiasSeleccionados((prev) => [...prev, dia]);
      if (!horarios[dia]) {
        setHorarios((prev) => ({
          ...prev,
          [dia]: [{ hora_desde: "", hora_hasta: "" }],
        }));
      }
    } else {
      setDiasSeleccionados((prev) => prev.filter((d) => d !== dia));
      setHorarios((prev) => {
        const nuevo = { ...prev };
        delete nuevo[dia];
        return nuevo;
      });
    }
  };

  const validarHorarios = (): boolean => {
    for (const dia of diasSeleccionados) {
      const bloques = horarios[dia] || [];

      for (let i = 0; i < bloques.length; i++) {
        const bloque = bloques[i];

        if (!bloque.hora_desde || !bloque.hora_hasta) {
          toast.error(`Complete todos los horarios para ${dia}`);
          return false;
        }

        if (bloque.hora_desde >= bloque.hora_hasta) {
          toast.error(
            `La hora de inicio debe ser menor a la hora de fin en ${dia}`
          );
          return false;
        }

        for (let j = i + 1; j < bloques.length; j++) {
          const otroBloque = bloques[j];
          if (
            (bloque.hora_desde < otroBloque.hora_hasta &&
              bloque.hora_hasta > otroBloque.hora_desde) ||
            (otroBloque.hora_desde < bloque.hora_hasta &&
              otroBloque.hora_hasta > bloque.hora_desde)
          ) {
            toast.error(`Hay solapamiento de horarios en ${dia}`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.nombre_completo.trim() || !form.dni.trim()) {
      toast.error("Complete todos los campos obligatorios");
      setLoading(false);
      return;
    }

    if (diasSeleccionados.length === 0) {
      toast.error("Seleccione al menos un día de la semana");
      setLoading(false);
      return;
    }

    if (!validarHorarios()) {
      setLoading(false);
      return;
    }

    const horariosArray: DiaHorario[] = diasSeleccionados.map((dia) => ({
      dia,
      bloques: horarios[dia] || [],
    }));

    try {
      const payload: CreateEntrenadorDto | UpdateEntrenadorDto = {
        ...form,
        horarios: horariosArray,
      };

      console.log("Payload:", payload);
      toast.success(
        entrenador
          ? "Entrenador actualizado correctamente"
          : "Entrenador creado correctamente"
      );
      onCreated();
    } catch {
      toast.error("Error al guardar entrenador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nombre_completo">Nombre completo *</Label>
          <Input
            id="nombre_completo"
            type="text"
            value={form.nombre_completo}
            onChange={(e) =>
              setForm({ ...form, nombre_completo: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dni">DNI *</Label>
          <Input
            id="dni"
            type="text"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            required
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios de trabajo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diasSemana.map((dia) => (
            <div key={dia.id} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={dia.id}
                  checked={diasSeleccionados.includes(dia.id)}
                  onCheckedChange={(checked) =>
                    toggleDia(dia.id, checked as boolean)
                  }
                />
                <Label htmlFor={dia.id} className="font-medium">
                  {dia.label}
                </Label>
              </div>

              {diasSeleccionados.includes(dia.id) && (
                <div className="ml-6 space-y-2">
                  {(horarios[dia.id] || []).map((bloque, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={bloque.hora_desde}
                        onChange={(e) =>
                          actualizarBloque(
                            dia.id,
                            index,
                            "hora_desde",
                            e.target.value
                          )
                        }
                        className="w-32"
                        placeholder="Desde"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={bloque.hora_hasta}
                        onChange={(e) =>
                          actualizarBloque(
                            dia.id,
                            index,
                            "hora_hasta",
                            e.target.value
                          )
                        }
                        className="w-32"
                        placeholder="Hasta"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarBloque(dia.id, index)}
                        disabled={horarios[dia.id].length === 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => agregarBloque(dia.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar horario
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#02a8e1] hover:bg-[#0288b1]"
        >
          {loading ? "Guardando..." : entrenador ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
