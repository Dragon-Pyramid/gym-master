"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Asistencia,
  CreateAsistenciaDto,
  UpdateAsistenciaDto,
} from "@/interfaces/asistencia.interface";
import {
  createAsistencia,
  updateAsistencia,
} from "@/services/asistenciaService";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

export interface AsistenciaFormProps {
  asistencia?: Asistencia | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  id_socio: "",
  fecha: "",
  hora_ingreso: "",
  hora_egreso: "",
};

export default function AsistenciaForm({
  asistencia,
  onCreated,
  onCancel,
}: AsistenciaFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const attendanceText = (es: string, en: string) => (isEnglish ? en : es);

  useEffect(() => {
    if (asistencia) {
      setForm({
        id_socio: asistencia.socio_id ?? "",
        fecha: asistencia.fecha ?? "",
        hora_ingreso: asistencia.hora_ingreso ?? "",
        hora_egreso: asistencia.hora_egreso ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [asistencia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (asistencia && asistencia.id) {
        const updateData: UpdateAsistenciaDto = {
          socio_id: form.id_socio,
          fecha: form.fecha,
          hora_ingreso: form.hora_ingreso,
          hora_egreso: form.hora_egreso || null,
        };
        await updateAsistencia(undefined as any, asistencia.id, updateData);
        toast.success(attendanceText("Asistencia actualizada", "Attendance updated"));
      } else {
        const createData: CreateAsistenciaDto = {
          socio_id: form.id_socio,
          fecha: form.fecha,
          hora_ingreso: form.hora_ingreso,
          hora_egreso: form.hora_egreso || null,
        };
        await createAsistencia(undefined as any, createData);
        toast.success(attendanceText("Asistencia creada", "Attendance created"));
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: unknown) {
      let msg =
        (error as Error).message ||
        attendanceText("Error al guardar asistencia", "Error saving attendance");
      if (msg.includes("value too long")) {
        msg = attendanceText(
          "Uno de los campos excede la cantidad máxima de caracteres permitidos.",
          "One of the fields exceeds the maximum allowed number of characters.",
        );
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/AsistenciaForm.tsx" />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="id_socio">{attendanceText("ID Socio", "Member ID")}</Label>
        <Input
          id="id_socio"
          name="id_socio"
          placeholder={attendanceText("Ingrese ID del socio", "Enter member ID")}
          value={form.id_socio}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha">{attendanceText("Fecha", "Date")}</Label>
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
        <Label htmlFor="hora_ingreso">{attendanceText("Hora Ingreso", "Check-in time")}</Label>
        <Input
          id="hora_ingreso"
          name="hora_ingreso"
          type="time"
          placeholder="HH:MM"
          value={form.hora_ingreso}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hora_egreso">{attendanceText("Hora Egreso", "Check-out time")}</Label>
        <Input
          id="hora_egreso"
          name="hora_egreso"
          type="time"
          placeholder={attendanceText("HH:MM (Opcional)", "HH:MM (Optional)")}
          value={form.hora_egreso}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading
          ? attendanceText("Guardando...", "Saving...")
          : asistencia
            ? attendanceText("Actualizar Asistencia", "Update attendance")
            : attendanceText("Registrar Asistencia", "Register attendance")}
      </Button>

      <Button
        type="button"
        onClick={onCancel}
        className="text-gray-800 bg-gray-200 col-span-full justify-self-end hover:bg-gray-300"
        disabled={loading}
      >
        {attendanceText("Cancelar", "Cancel")}
      </Button>
    </form>
  );
}
