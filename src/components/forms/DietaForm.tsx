"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CreateDietaDto, Dieta } from "@/interfaces/dieta.interface";
import {
  crearDieta,
  getObjetivos,
  getSocioByUsuarioId,
} from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";

import type { Objetivo } from "@/interfaces/objetivo.interface";

interface DietaFormProps {
  initialSocioId?: string;
  socioNombre?: string;
  onSuccess?: (dieta: Dieta) => void;
  submitLabel?: string;
}

export default function DietaForm({
  initialSocioId,
  socioNombre,
  onSuccess,
  submitLabel = "Generar dieta",
}: DietaFormProps) {
  const [objetivo, setObjetivo] = useState<CreateDietaDto["objetivo"]>("");
  const [fechaInicio, setFechaInicio] =
    useState<CreateDietaDto["fecha_inicio"]>("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fechaFin, setFechaFin] = useState<CreateDietaDto["fecha_fin"]>("");
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    getObjetivos().then((res) => {
      if (res.ok && Array.isArray(res.data)) setObjetivos(res.data);
    });
  }, []);

  const resolveSocioId = async () => {
    if (initialSocioId) return initialSocioId;

    if (!user?.id) return null;

    const socio = await getSocioByUsuarioId(user.id.toString());
    return socio?.id_socio?.toString() ?? null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const socioId = await resolveSocioId();
      if (!socioId) {
        setErrorMessage("No se pudo identificar el socio para generar la dieta.");
        return;
      }

      const body = {
        socio_id: socioId,
        objetivo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      const res = await crearDieta(body);
      if (!res.ok) {
        setErrorMessage(
          res.data?.error || res.data?.message || "No se pudo generar la dieta."
        );
        return;
      }

      setMessage("Dieta generada correctamente.");
      if (res.data && onSuccess) {
        onSuccess(res.data as Dieta);
      }
    } catch (error) {
      console.error("Error al generar dieta:", error);
      setErrorMessage("Ocurrió un error al generar la dieta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {socioNombre && (
        <div className="p-3 border rounded-md col-span-full bg-muted/40">
          <p className="text-xs text-muted-foreground">Socio seleccionado</p>
          <p className="text-sm font-semibold">{socioNombre}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="objetivo">Objetivo nutricional</Label>
        <select
          id="objetivo"
          name="objetivo"
          className="h-10 px-3 py-2 text-sm border rounded-md"
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          required
        >
          <option value="">Seleccione objetivo</option>
          {objetivos.map((opt) => (
            <option key={opt.id_objetivo} value={opt.id_objetivo}>
              {opt.nombre_objetivo}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_inicio">Fecha inicio</Label>
        <Input
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_fin">Fecha fin</Label>
        <Input
          id="fecha_fin"
          name="fecha_fin"
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading ? "Generando..." : submitLabel}
      </Button>

      {message && (
        <div className="p-3 text-sm text-green-700 border border-green-200 rounded-md col-span-full bg-green-50">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-sm text-red-700 border border-red-200 rounded-md col-span-full bg-red-50">
          {errorMessage}
        </div>
      )}
    </form>
  );
}
