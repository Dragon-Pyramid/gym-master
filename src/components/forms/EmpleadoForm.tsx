"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { Empleado } from "@/interfaces/empleado.interface";
import { actualizarEmpleado, crearEmpleado } from "@/services/apiClient";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export interface EmpleadoFormProps {
  empleado?: Empleado | null;
  onCreated: () => void;
}

const fallbackTiposEmpleado: CatalogoParametrizableItem[] = [
  {
    id: "fallback-administrativo",
    codigo: "administrativo",
    nombre: "Administrativo",
    descripcion: "Empleado administrativo del gimnasio.",
    activo: true,
    orden: 10,
  },
  {
    id: "fallback-entrenador",
    codigo: "entrenador",
    nombre: "Entrenador",
    descripcion: "Empleado responsable de entrenamiento.",
    activo: true,
    orden: 20,
  },
  {
    id: "fallback-mantenimiento",
    codigo: "mantenimiento",
    nombre: "Mantenimiento",
    descripcion: "Empleado responsable de mantenimiento.",
    activo: true,
    orden: 30,
  },
  {
    id: "fallback-limpieza",
    codigo: "limpieza",
    nombre: "Limpieza",
    descripcion: "Empleado responsable de limpieza.",
    activo: true,
    orden: 40,
  },
  {
    id: "fallback-bar-snack",
    codigo: "bar_snack",
    nombre: "Bar / Snack",
    descripcion: "Empleado de bar, snack o atención auxiliar.",
    activo: true,
    orden: 50,
  },
];

type SelectOption = {
  value: string;
  label: string;
};

const puestoResponsabilidadOptions: SelectOption[] = [
  { value: "Recepción y atención al socio", label: "Recepción y atención al socio" },
  { value: "Administración y caja", label: "Administración y caja" },
  { value: "Entrenamiento de sala", label: "Entrenamiento de sala" },
  { value: "Personal trainer / clases", label: "Personal trainer / clases" },
  { value: "Mantenimiento operativo", label: "Mantenimiento operativo" },
  { value: "Otras responsabilidades", label: "Otras responsabilidades" },
];

const areaOptions: SelectOption[] = [
  { value: "Administración", label: "Administración" },
  { value: "Recepción", label: "Recepción" },
  { value: "Sala de musculación", label: "Sala de musculación" },
  { value: "Actividades / clases", label: "Actividades / clases" },
  { value: "Mantenimiento y limpieza", label: "Mantenimiento y limpieza" },
  { value: "Otras áreas", label: "Otras áreas" },
];

const turnoOptions: SelectOption[] = [
  { value: "Mañana", label: "Mañana" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noche", label: "Noche" },
  { value: "Rotativo", label: "Rotativo" },
  { value: "Fin de semana", label: "Fin de semana" },
  { value: "Personalizado", label: "Personalizado" },
];

const optionsWithCurrentValue = (options: SelectOption[], currentValue: string): SelectOption[] => {
  const value = currentValue.trim();

  if (!value || options.some((option) => option.value === value)) {
    return options;
  }

  return [{ value, label: `Actual: ${value}` }, ...options];
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";

  const trimmed = String(value).trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const ddMmYyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyyMatch) {
    return `${ddMmYyyyMatch[3]}-${ddMmYyyyMatch[2]}-${ddMmYyyyMatch[1]}`;
  }

  return "";
};

const emptyForm = {
  nombre_completo: "",
  dni: "",
  email: "",
  telefono: "",
  direccion: "",
  fecha_nacimiento: "",
  fecha_alta: new Date().toISOString().slice(0, 10),
  id_tipo_empleado: "",
  puesto: "",
  area: "",
  tipo_contratacion: "mensual",
  turno: "",
  sueldo_base: "0",
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: "",
  horarios_texto: "",
  observaciones: "",
  activo: true,
};

export default function EmpleadoForm({ empleado, onCreated }: EmpleadoFormProps) {
  const [form, setForm] = useState(() =>
    empleado
      ? {
          nombre_completo: empleado.nombre_completo ?? "",
          dni: empleado.dni ?? "",
          email: empleado.email ?? "",
          telefono: empleado.telefono ?? "",
          direccion: empleado.direccion ?? "",
          fecha_nacimiento: toDateInputValue(empleado.fecha_nacimiento),
          fecha_alta: toDateInputValue(empleado.fecha_alta) || new Date().toISOString().slice(0, 10),
          id_tipo_empleado: empleado.id_tipo_empleado ?? "",
          puesto: empleado.puesto ?? "",
          area: empleado.area ?? "",
          tipo_contratacion: empleado.tipo_contratacion ?? "mensual",
          turno: empleado.turno ?? "",
          sueldo_base: String(empleado.sueldo_base ?? 0),
          fecha_inicio: toDateInputValue(empleado.fecha_inicio ?? empleado.fecha_alta) || new Date().toISOString().slice(0, 10),
          fecha_fin: toDateInputValue(empleado.fecha_fin),
          horarios_texto: empleado.horarios_texto ?? "",
          observaciones: empleado.observaciones ?? "",
          activo: empleado.activo !== false,
        }
      : emptyForm
  );
  const [loading, setLoading] = useState(false);
  const { items: tiposEmpleado } = useCatalogoParametrizable("tipo_empleado", fallbackTiposEmpleado);

  const tipoSeleccionado = useMemo(() => {
    return tiposEmpleado.find((tipo) => tipo.id === form.id_tipo_empleado);
  }, [form.id_tipo_empleado, tiposEmpleado]);

  const esAdministrativo = tipoSeleccionado?.codigo === "administrativo";

  const puestoOptions = useMemo(() => optionsWithCurrentValue(puestoResponsabilidadOptions, form.puesto), [form.puesto]);
  const areaSelectOptions = useMemo(() => optionsWithCurrentValue(areaOptions, form.area), [form.area]);
  const turnoSelectOptions = useMemo(() => optionsWithCurrentValue(turnoOptions, form.turno), [form.turno]);

  const updateField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre_completo.trim() || !form.dni.trim()) {
      toast.error("Nombre completo y DNI son obligatorios");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        sueldo_base: Number(form.sueldo_base || 0),
        id_tipo_empleado: form.id_tipo_empleado || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        fecha_fin: form.fecha_fin || null,
        fecha_inicio: form.fecha_inicio || null,
      };

      const response = empleado?.id
        ? await actualizarEmpleado(empleado.id, payload)
        : await crearEmpleado(payload);

      if (!response.ok) {
        throw new Error(response.error || "No se pudo guardar el empleado");
      }

      toast.success(empleado?.id ? "Empleado actualizado correctamente" : "Empleado creado correctamente");
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <QaFileNameBadge file="src/components/forms/EmpleadoForm.tsx" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="nombre_completo" className="block text-sm font-medium">Nombre completo *</label>
          <Input id="nombre_completo" value={form.nombre_completo} onChange={(e) => updateField("nombre_completo", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="dni" className="block text-sm font-medium">DNI *</label>
          <Input id="dni" value={form.dni} onChange={(e) => updateField("dni", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="telefono" className="block text-sm font-medium">Teléfono</label>
          <Input id="telefono" value={form.telefono} onChange={(e) => updateField("telefono", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="direccion" className="block text-sm font-medium">Dirección</label>
          <Input id="direccion" value={form.direccion} onChange={(e) => updateField("direccion", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="fecha_nacimiento" className="block text-sm font-medium">Fecha de nacimiento</label>
          <Input id="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => updateField("fecha_nacimiento", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="fecha_alta" className="block text-sm font-medium">Fecha de alta</label>
          <Input id="fecha_alta" type="date" value={form.fecha_alta} onChange={(e) => updateField("fecha_alta", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="id_tipo_empleado" className="block text-sm font-medium">Tipo de empleado</label>
          <select
            id="id_tipo_empleado"
            value={form.id_tipo_empleado}
            onChange={(e) => updateField("id_tipo_empleado", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar tipo</option>
            {tiposEmpleado.map((tipo) => (
              <option key={tipo.id} value={tipo.id.startsWith("fallback-") ? "" : tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="puesto" className="block text-sm font-medium">Puesto / responsabilidad</label>
          <select
            id="puesto"
            value={form.puesto}
            onChange={(e) => updateField("puesto", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar responsabilidad</option>
            {puestoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="area" className="block text-sm font-medium">Área</label>
          <select
            id="area"
            value={form.area}
            onChange={(e) => updateField("area", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar área</option>
            {areaSelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="tipo_contratacion" className="block text-sm font-medium">Tipo de contratación</label>
          <select
            id="tipo_contratacion"
            value={form.tipo_contratacion}
            onChange={(e) => updateField("tipo_contratacion", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="mensual">Mensual</option>
            <option value="jornal">Jornal</option>
            <option value="por_hora">Por hora</option>
            <option value="monotributo">Monotributo / proveedor</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="turno" className="block text-sm font-medium">Turno</label>
          <select
            id="turno"
            value={form.turno}
            onChange={(e) => updateField("turno", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar turno</option>
            {turnoSelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="sueldo_base" className="block text-sm font-medium">Sueldo base de referencia</label>
          <Input id="sueldo_base" type="number" min="0" step="1" value={form.sueldo_base} onChange={(e) => updateField("sueldo_base", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="fecha_inicio" className="block text-sm font-medium">Fecha de inicio laboral</label>
          <Input id="fecha_inicio" type="date" value={form.fecha_inicio} onChange={(e) => updateField("fecha_inicio", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="fecha_fin" className="block text-sm font-medium">Fecha de baja laboral</label>
          <Input id="fecha_fin" type="date" value={form.fecha_fin} onChange={(e) => updateField("fecha_fin", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="horarios_texto" className="block text-sm font-medium">Horarios / disponibilidad</label>
          <textarea id="horarios_texto" value={form.horarios_texto} onChange={(e) => updateField("horarios_texto", e.target.value)} placeholder="Lunes a viernes de 08:00 a 16:00" className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="observaciones" className="block text-sm font-medium">Observaciones internas</label>
          <textarea id="observaciones" value={form.observaciones} onChange={(e) => updateField("observaciones", e.target.value)} className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={form.activo} onChange={(e) => updateField("activo", e.target.checked)} />
          Empleado activo
        </label>
      </div>

      <div className="rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
        Puesto, área y turno se cargan desde combos base para mantener datos homogéneos. Más adelante estos valores podrán moverse a catálogos parametrizables administrados por cada gimnasio.
      </div>

      {esAdministrativo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Este empleado es administrativo. En una próxima feature se desplegarán aquí los permisos de menú/RBAC para definir qué módulos puede ver y utilizar.
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading} className="bg-[#02a8e1] hover:bg-[#0288b1]">
          {loading ? "Guardando..." : empleado ? "Actualizar empleado" : "Crear empleado"}
        </Button>
      </div>
    </form>
  );
}
