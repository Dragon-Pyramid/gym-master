"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useEffect, useState } from "react";
import {
  createEquipamiento,
  updateEquipamiento,
} from "@/services/equipamientoService";
import {
  Equipamento,
  CreateEquipamentoDTO,
  UpdateEquipamentoDTO,
} from "@/interfaces/equipamiento.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EquipamientoFormValues {
  nombre: string;
  tipo: string;
  id_tipo_equipamiento?: string | null;
  marca: string;
  modelo: string;
  estado: "operativo" | "en mantenimiento" | "fuera de servicio";
  ubicacion: string;
  id_ubicacion_equipamiento?: string | null;
  proxima_revision: string;
  observaciones: string;
}

const fallbackTiposEquipamiento: CatalogoParametrizableItem[] = [
  {
    id: "fallback-cardio",
    codigo: "cardio",
    nombre: "Cardio",
    descripcion: "Equipamiento cardiovascular.",
    activo: true,
    orden: 10,
  },
  {
    id: "fallback-fuerza",
    codigo: "fuerza",
    nombre: "Fuerza",
    descripcion: "Máquinas y equipamiento de fuerza.",
    activo: true,
    orden: 20,
  },
  {
    id: "fallback-accesorio",
    codigo: "accesorio",
    nombre: "Accesorio",
    descripcion: "Accesorios generales de entrenamiento.",
    activo: true,
    orden: 50,
  },
];

const fallbackUbicacionesEquipamiento: CatalogoParametrizableItem[] = [
  {
    id: "fallback-sala-musculacion",
    codigo: "sala_musculacion",
    nombre: "Sala de musculación",
    descripcion: "Área principal de musculación.",
    activo: true,
    orden: 50,
  },
];

const emptyEquipamientoFormValues: EquipamientoFormValues = {
  nombre: "",
  tipo: "",
  id_tipo_equipamiento: "",
  marca: "",
  modelo: "",
  estado: "operativo",
  ubicacion: "",
  id_ubicacion_equipamiento: "",
  proxima_revision: "",
  observaciones: "",
};

function toDateInputValue(value?: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

function mapEquipoToFormValues(equipo?: Equipamento): EquipamientoFormValues {
  if (!equipo) return emptyEquipamientoFormValues;

  return {
    nombre: equipo.nombre ?? "",
    tipo: String(equipo.tipo ?? ""),
    id_tipo_equipamiento: equipo.id_tipo_equipamiento ?? "",
    marca: equipo.marca ?? "",
    modelo: equipo.modelo ?? "",
    estado: (equipo.estado ?? "operativo") as EquipamientoFormValues["estado"],
    ubicacion: equipo.ubicacion ?? "",
    id_ubicacion_equipamiento: equipo.id_ubicacion_equipamiento ?? "",
    proxima_revision: toDateInputValue(equipo.proxima_revision),
    observaciones: equipo.observaciones ?? "",
  };
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
  const [values, setValues] = useState<EquipamientoFormValues>(() =>
    mapEquipoToFormValues(initialValues)
  );

  useEffect(() => {
    setValues(mapEquipoToFormValues(initialValues));
  }, [initialValues]);
  const [submitting, setSubmitting] = useState(false);
  const { items: tiposEquipamiento } = useCatalogoParametrizable(
    "tipo_equipamiento",
    fallbackTiposEquipamiento
  );
  const { items: ubicacionesEquipamiento } = useCatalogoParametrizable(
    "ubicacion_equipamiento",
    fallbackUbicacionesEquipamiento
  );

  const handleChange = (field: keyof EquipamientoFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTipoChange = (value: string) => {
    const selected = tiposEquipamiento.find((item) => item.id === value);
    setValues((prev) => ({
      ...prev,
      id_tipo_equipamiento: selected?.id?.startsWith("fallback-") ? "" : selected?.id ?? "",
      tipo: selected?.nombre ?? value,
    }));
  };

  const handleUbicacionChange = (value: string) => {
    const selected = ubicacionesEquipamiento.find((item) => item.id === value);
    setValues((prev) => ({
      ...prev,
      id_ubicacion_equipamiento: selected?.id?.startsWith("fallback-") ? "" : selected?.id ?? "",
      ubicacion: selected?.nombre ?? value,
    }));
  };

  const selectedTipoValue =
    values.id_tipo_equipamiento ||
    tiposEquipamiento.find((item) => item.nombre === values.tipo || item.codigo === values.tipo)
      ?.id ||
    "";

  const selectedUbicacionValue =
    values.id_ubicacion_equipamiento ||
    ubicacionesEquipamiento.find(
      (item) => item.nombre === values.ubicacion || item.codigo === values.ubicacion
    )?.id ||
    "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (isEdit && initialValues) {
      const updateData: UpdateEquipamentoDTO = {
        nombre: values.nombre,
        tipo: values.tipo as any,
        id_tipo_equipamiento: values.id_tipo_equipamiento || null,
        marca: values.marca,
        modelo: values.modelo,
        estado: values.estado,
        ubicacion: values.ubicacion,
        id_ubicacion_equipamiento: values.id_ubicacion_equipamiento || null,
        proxima_revision: values.proxima_revision,
        observaciones: values.observaciones,
      };
      const updated = await updateEquipamiento(initialValues.id, updateData);
      onSubmit(updated);
    } else {
      const createData: CreateEquipamentoDTO = {
        nombre: values.nombre,
        tipo: values.tipo as any,
        id_tipo_equipamiento: values.id_tipo_equipamiento || null,
        marca: values.marca,
        modelo: values.modelo,
        ubicacion: values.ubicacion,
        id_ubicacion_equipamiento: values.id_ubicacion_equipamiento || null,
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
      <QaFileNameBadge file="src/components/forms/EquipamientoForm.tsx" />
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
        <select
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
          value={selectedTipoValue}
          onChange={(e) => handleTipoChange(e.target.value)}
          required
        >
          <option value="">Tipo de equipo</option>
          {tiposEquipamiento.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </select>
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
        <select
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
          value={selectedUbicacionValue}
          onChange={(e) => handleUbicacionChange(e.target.value)}
          required
        >
          <option value="">Ubicación</option>
          {ubicacionesEquipamiento.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {ubicacion.nombre}
            </option>
          ))}
        </select>
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
