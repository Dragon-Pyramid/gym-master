"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CreateDietaDto } from "@/interfaces/dieta.interface";
import {
  crearDieta,
  getObjetivos,
  getSocioByUsuarioId,
} from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";

import type { Objetivo } from "@/interfaces/objetivo.interface";

export default function DietaForm() {
  const [objetivo, setObjetivo] = useState<CreateDietaDto["objetivo"]>("");
  const [fechaInicio, setFechaInicio] =
    useState<CreateDietaDto["fecha_inicio"]>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fechaFin, setFechaFin] = useState<CreateDietaDto["fecha_fin"]>("");
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    getObjetivos().then((res) => {
      if (res.ok && Array.isArray(res.data)) setObjetivos(res.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!user?.id) {
      setLoading(false);
      return;
    }

    const socio = await getSocioByUsuarioId(user.id.toString());
    if (!socio) {
      setLoading(false);
      return;
    }

    const body = {
      socio_id: socio.id_socio.toString(),
      objetivo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };
    const res = await crearDieta(body);
    setResult(res);
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
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
        {loading ? "Generando..." : "Generar dieta"}
      </Button>
      {result && (
        <div className="mt-6 col-span-full">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Respuesta</span>
          </div>
          <pre className="p-4 overflow-x-auto text-xs rounded bg-muted max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </form>
  );
}
