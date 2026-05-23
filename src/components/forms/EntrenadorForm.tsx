"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { crearEntrenador, actualizarEntrenador } from "@/services/apiClient";
import { Entrenador } from "@/interfaces/entrenador.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";

export interface EntrenadorFormProps {
  entrenador?: Entrenador | null;
  onCreated: () => void;
}

const diasSemana = [
  { id: "Lunes", label: "Lunes" },
  { id: "Martes", label: "Martes" },
  { id: "Miércoles", label: "Miércoles" },
  { id: "Jueves", label: "Jueves" },
  { id: "Viernes", label: "Viernes" },
  { id: "Sábado", label: "Sábado" },
  { id: "Domingo", label: "Domingo" },
];

const fallbackTiposEmpleado: CatalogoParametrizableItem[] = [
  {
    id: "fallback-entrenador",
    codigo: "entrenador",
    nombre: "Entrenador",
    descripcion: "Empleado responsable de entrenamiento, rutinas y seguimiento físico.",
    activo: true,
    orden: 20,
  },
];

const emptyForm = {
  nombre_completo: "",
  dni: "",
  id_tipo_empleado: "",
};

export default function EntrenadorForm({
  entrenador,
  onCreated,
}: EntrenadorFormProps) {
  const [form, setForm] = useState(
    entrenador
      ? {
          nombre_completo: entrenador.nombre_completo,
          dni: entrenador.dni,
          id_tipo_empleado: entrenador.id_tipo_empleado ?? "",
        }
      : emptyForm
  );
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<{
    [dia: string]: { hora_desde: string; hora_hasta: string }[];
  }>({});
  const [loading, setLoading] = useState(false);
  const { items: tiposEmpleado } = useCatalogoParametrizable(
    "tipo_empleado",
    fallbackTiposEmpleado
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!form.nombre_completo.trim() || !form.dni.trim()) {
      toast.error("Complete todos los campos obligatorios");
      setLoading(false);
      return;
    }

    try {
      const horariosTexto = diasSeleccionados
        .map((dia) => {
          const bloques = horarios[dia] || [];
          const horariosDelDia = bloques
            .map((b) => `${b.hora_desde}-${b.hora_hasta}`)
            .join(", ");
          return `${
            diasSemana.find((d) => d.id === dia)?.label
          }: ${horariosDelDia}`;
        })
        .join(" | ");

      const formData = {
        nombre_completo: form.nombre_completo,
        dni: form.dni,
        id_tipo_empleado: form.id_tipo_empleado || null,
        horarios: diasSeleccionados.map((dia) => ({
          dia_semana: dia,
          bloques: horarios[dia] || [],
        })),
        horarios_texto: horariosTexto,
      };

      if (entrenador && entrenador.id) {
        const { ok } = await actualizarEntrenador(entrenador.id, formData);
        if (ok) {
          toast.success("Entrenador actualizado correctamente");
          onCreated();
        } else {
          throw new Error();
        }
      } else {
        const { ok } = await crearEntrenador(formData);
        if (ok) {
          toast.success("Entrenador creado correctamente");
          onCreated();
        } else {
          throw new Error();
        }
      }
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
          <label
            htmlFor="nombre_completo"
            className="block text-sm font-medium"
          >
            Nombre completo
          </label>
          <Input
            id="nombre_completo"
            type="text"
            placeholder="Ej: Juan Pérez"
            value={form.nombre_completo}
            onChange={(e) =>
              setForm({ ...form, nombre_completo: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dni" className="block text-sm font-medium">
            DNI
          </label>
          <Input
            id="dni"
            type="text"
            placeholder="Ej: 12345678"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="id_tipo_empleado" className="block text-sm font-medium">
            Tipo de empleado
          </label>
          <select
            id="id_tipo_empleado"
            value={form.id_tipo_empleado}
            onChange={(e) =>
              setForm({ ...form, id_tipo_empleado: e.target.value })
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Seleccionar tipo de empleado</option>
            {tiposEmpleado.map((tipo) => (
              <option
                key={tipo.id}
                value={tipo.id.startsWith("fallback-") ? "" : tipo.id}
              >
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Card>
        <CardHeader>Días y horarios</CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {diasSemana.map((dia) => (
              <label key={dia.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={diasSeleccionados.includes(dia.id)}
                  onChange={(e) => toggleDia(dia.id, e.target.checked)}
                />
                {dia.label}
              </label>
            ))}
          </div>
          {diasSeleccionados.map((dia) => (
            <div key={dia} className="p-3 mt-4 border rounded">
              <div className="mb-2 font-semibold">
                {diasSemana.find((d) => d.id === dia)?.label}
              </div>
              {(horarios[dia] || []).map((bloque, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="time"
                    value={bloque.hora_desde}
                    onChange={(e) =>
                      actualizarBloque(dia, idx, "hora_desde", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={bloque.hora_hasta}
                    onChange={(e) =>
                      actualizarBloque(dia, idx, "hora_hasta", e.target.value)
                    }
                    className="px-2 py-1 border rounded"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => eliminarBloque(dia, idx)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                onClick={() => agregarBloque(dia)}
              >
                Agregar bloque horario
              </Button>
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
