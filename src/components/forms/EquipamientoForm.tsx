"use client";

import { useState } from "react";
import {
  createEquipamiento,
  updateEquipamiento,
} from "@/services/equipamientoService";
import {
  Equipamento,
  CreateEquipamentoDTO,
  UpdateEquipamentoDTO,
} from "@/interfaces/equipamiento.interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EquipamientoFormValues {
  nombre: string;
  tipo: string;
  marca: string;
  modelo: string;
  estado: "operativo" | "en mantenimiento" | "fuera de servicio";
  ubicacion: string;
  proxima_revision: string;
  observaciones: string;
}

export default function EquipamientoForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: {
  initialValues?: Equipamento;
  onSubmit: (values: Equipamento) => void;
  onCancel?: () => void;
  loading?: boolean;
}) {
  const isEdit = !!initialValues;
  const [values, setValues] = useState<EquipamientoFormValues>(
    initialValues || {
      nombre: "",
      tipo: "",
      marca: "",
      modelo: "",
      estado: "operativo",
      ubicacion: "",
      proxima_revision: "",
      observaciones: "",
    }
  );
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof EquipamientoFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (isEdit && initialValues) {
      const updateData: UpdateEquipamentoDTO = {
        nombre: values.nombre,
        tipo: values.tipo as any,
        marca: values.marca,
        modelo: values.modelo,
        estado: values.estado,
        ubicacion: values.ubicacion,
        proxima_revision: values.proxima_revision,
        observaciones: values.observaciones,
      };
      const updated = await updateEquipamiento(initialValues.id, updateData);
      onSubmit(updated);
    } else {
      const createData: CreateEquipamentoDTO = {
        nombre: values.nombre,
        tipo: values.tipo as any,
        marca: values.marca,
        modelo: values.modelo,
        ubicacion: values.ubicacion,
        proxima_revision: values.proxima_revision,
        observaciones: values.observaciones,
      };
      const created = await createEquipamiento(createData);
      onSubmit(created);
    }
    setSubmitting(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div className="flex flex-col gap-1.5">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          placeholder="Nombre del equipo"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.tipo}
          onChange={(e) => handleChange("tipo", e.target.value)}
          placeholder="Tipo de equipo"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.marca}
          onChange={(e) => handleChange("marca", e.target.value)}
          placeholder="Marca"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.modelo}
          onChange={(e) => handleChange("modelo", e.target.value)}
          placeholder="Modelo"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <select
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
          value={values.estado}
          onChange={(e) => handleChange("estado", e.target.value)}
          required
        >
          <option value="operativo">Operativo</option>
          <option value="en mantenimiento">En mantenimiento</option>
          <option value="fuera de servicio">Fuera de servicio</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.ubicacion}
          onChange={(e) => handleChange("ubicacion", e.target.value)}
          placeholder="Ubicación"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          type="date"
          value={values.proxima_revision}
          onChange={(e) => handleChange("proxima_revision", e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Input
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          placeholder="Observaciones"
        />
      </div>
      <div className="flex justify-end gap-2 col-span-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading || submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="" disabled={loading || submitting}>
          {isEdit ? "Actualizar equipo" : "Guardar equipo"}
        </Button>
      </div>
    </form>
  );
}
