"use client";

import { useState, useEffect } from "react";
import { Socio } from "@/interfaces/socio.interface";
import { Rutina } from "@/interfaces/rutina.interface";
import { Skeleton } from "@/components/ui/skeleton";
import SocioRutinaCard from "./SocioRutinaCard";
import { getRutinasPorSocio } from "@/services/apiClient";

interface SociosRutinasGridProps {
  socios: Socio[];
  loading: boolean;
}

interface SocioConRutina extends Socio {
  ultimaRutina?: Rutina | null;
  loadingRutina?: boolean;
}

export default function SociosRutinasGrid({
  socios,
  loading,
}: SociosRutinasGridProps) {
  const [sociosConRutinas, setSociosConRutinas] = useState<SocioConRutina[]>(
    []
  );

  const obtenerUltimaRutina = async (
    socioId: string
  ): Promise<Rutina | null> => {
    try {
      const response = await getRutinasPorSocio(socioId);

      if (!response.ok) {
        throw new Error("Error al obtener rutinas");
      }

      const rutinas: Rutina[] = response.data;
      return rutinas.length > 0 ? rutinas[0] : null;
    } catch (error) {
      console.error(`Error al obtener rutina del socio ${socioId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const cargarRutinas = async () => {
      if (!socios.length) {
        setSociosConRutinas([]);
        return;
      }

      const sociosIniciales: SocioConRutina[] = socios.map((socio) => ({
        ...socio,
        ultimaRutina: null,
        loadingRutina: true,
      }));
      setSociosConRutinas(sociosIniciales);

      for (const socio of socios) {
        const rutina = await obtenerUltimaRutina(socio.id_socio);
        setSociosConRutinas((prev) =>
          prev.map((s) =>
            s.id_socio === socio.id_socio
              ? { ...s, ultimaRutina: rutina, loadingRutina: false }
              : s
          )
        );
      }
    };

    cargarRutinas();
  }, [socios]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="w-full h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (sociosConRutinas.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No hay socios registrados aún.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sociosConRutinas.map((socio) => (
        <SocioRutinaCard
          key={socio.id_socio}
          socio={socio}
          rutina={socio.ultimaRutina}
          loadingRutina={socio.loadingRutina}
        />
      ))}
    </div>
  );
}
