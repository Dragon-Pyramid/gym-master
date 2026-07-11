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
import { useI18n } from "@/i18n/I18nProvider";

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


function catalogLabel(item: CatalogoParametrizableItem, isEnglish: boolean) {
  if (!isEnglish) return item.nombre;

  const normalized = String(item.codigo || item.nombre || "").toLowerCase();
  const labels: Record<string, string> = {
    cardio: "Cardio",
    fuerza: "Strength",
    accesorio: "Accessory",
    sala_musculacion: "Weight room",
    sala_de_musculacion: "Weight room",
    sala_cardio: "Cardio room",
    sala_de_cardio: "Cardio room",
    zona_a: "Zone A",
    zona_b: "Zone B",
    zona_c: "Zone C",
    zona_d: "Zone D",
  };

  return labels[normalized] ?? item.nombre;
}

function statusLabel(value: EquipamientoFormValues["estado"], isEnglish: boolean) {
  if (!isEnglish) {
    switch (value) {
      case "operativo":
        return "Operativo";
      case "en mantenimiento":
        return "En mantenimiento";
      case "fuera de servicio":
        return "Fuera de servicio";
      default:
        return value;
    }
  }

  switch (value) {
    case "operativo":
      return "Operational";
    case "en mantenimiento":
      return "Under maintenance";
    case "fuera de servicio":
      return "Out of service";
    default:
      return value;
  }
}

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
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
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
        <label htmlFor="equipamiento-nombre" className="text-sm font-medium text-foreground">
          {tx("Nombre", "Name")}
        </label>
        <Input
          id="equipamiento-nombre"
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          placeholder={tx("Nombre del equipo", "Equipment name")}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="equipamiento-tipo" className="text-sm font-medium text-foreground">
          {tx("Tipo", "Type")}
        </label>
        <select
          id="equipamiento-tipo"
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background text-foreground"
          value={selectedTipoValue}
          onChange={(e) => handleTipoChange(e.target.value)}
          required
        >
          <option value="">{tx("Tipo de equipo", "Equipment type")}</option>
          {tiposEquipamiento.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {catalogLabel(tipo, isEnglish)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="equipamiento-marca" className="text-sm font-medium text-foreground">
          {tx("Marca", "Brand")}
        </label>
        <Input
          id="equipamiento-marca"
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.marca}
          onChange={(e) => handleChange("marca", e.target.value)}
          placeholder={tx("Marca", "Brand")}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="equipamiento-modelo" className="text-sm font-medium text-foreground">
          {tx("Modelo", "Model")}
        </label>
        <Input
          id="equipamiento-modelo"
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.modelo}
          onChange={(e) => handleChange("modelo", e.target.value)}
          placeholder={tx("Modelo", "Model")}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="equipamiento-estado" className="text-sm font-medium text-foreground">
          {tx("Estado", "Status")}
        </label>
        <select
          id="equipamiento-estado"
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background text-foreground"
          value={values.estado}
          onChange={(e) => handleChange("estado", e.target.value)}
          required
        >
          <option value="operativo">{statusLabel("operativo", isEnglish)}</option>
          <option value="en mantenimiento">{statusLabel("en mantenimiento", isEnglish)}</option>
          <option value="fuera de servicio">{statusLabel("fuera de servicio", isEnglish)}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="equipamiento-ubicacion" className="text-sm font-medium text-foreground">
          {tx("Ubicación", "Location")}
        </label>
        <select
          id="equipamiento-ubicacion"
          className="w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background text-foreground"
          value={selectedUbicacionValue}
          onChange={(e) => handleUbicacionChange(e.target.value)}
          required
        >
          <option value="">{tx("Ubicación", "Location")}</option>
          {ubicacionesEquipamiento.map((ubicacion) => (
            <option key={ubicacion.id} value={ubicacion.id}>
              {catalogLabel(ubicacion, isEnglish)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="equipamiento-proxima-revision" className="text-sm font-medium text-foreground">
          {tx("Próxima revisión", "Next review")}
        </label>
        <Input
          id="equipamiento-proxima-revision"
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          type="date"
          value={values.proxima_revision}
          onChange={(e) => handleChange("proxima_revision", e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label htmlFor="equipamiento-observaciones" className="text-sm font-medium text-foreground">
          {tx("Observaciones", "Notes")}
        </label>
        <Input
          id="equipamiento-observaciones"
          className="bg-background text-foreground border-border placeholder:text-muted-foreground"
          value={values.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          placeholder={tx("Observaciones", "Notes")}
        />
      </div>

      <div className="flex justify-end gap-2 col-span-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading || submitting}
        >
          {tx("Cancelar", "Cancel")}
        </Button>
        <Button type="submit" className="" disabled={loading || submitting}>
          {isEdit ? tx("Actualizar equipo", "Update equipment") : tx("Guardar equipo", "Save equipment")}
        </Button>
      </div>
    </form>
  );
}
