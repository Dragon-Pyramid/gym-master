"use client";

import { useState, useEffect } from "react";
import { Socio } from "@/interfaces/socio.interface";
import { Dieta } from "@/interfaces/dieta.interface";
import { Skeleton } from "@/components/ui/skeleton";
import SocioDietaCard from "./SocioDietaCard";
import { getDietasPorSocio } from "@/services/apiClient";

interface SociosDietasGridProps {
  socios: Socio[];
  loading: boolean;
}

interface SocioConDieta extends Socio {
  ultimaDieta?: Dieta | null;
  loadingDieta?: boolean;
}

export default function SociosDietasGrid({
  socios,
  loading,
}: SociosDietasGridProps) {
  const [sociosConDietas, setSociosConDietas] = useState<SocioConDieta[]>([]);

  const obtenerUltimaDieta = async (socioId: string): Promise<Dieta | null> => {
    try {
      const response = await getDietasPorSocio(socioId);

      if (!response.ok) {
        console.error(
          `Error al obtener dietas del socio ${socioId}:`,
          response
        );
        return null;
      }

      const dietas: Dieta[] = Array.isArray(response.data) ? response.data : [];
      if (dietas.length === 0) return null;

      return dietas[0];
    } catch (error) {
      console.error(`Error al obtener dieta del socio ${socioId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const cargarDietas = async () => {
      if (!socios.length) {
        setSociosConDietas([]);
        return;
      }

      const sociosIniciales: SocioConDieta[] = socios.map((socio) => ({
        ...socio,
        ultimaDieta: null,
        loadingDieta: true,
      }));
      setSociosConDietas(sociosIniciales);

      for (const socio of socios) {
        const dieta = await obtenerUltimaDieta(socio.id_socio);
        setSociosConDietas((prev) =>
          prev.map((s) =>
            s.id_socio === socio.id_socio
              ? { ...s, ultimaDieta: dieta, loadingDieta: false }
              : s
          )
        );
      }
    };

    cargarDietas();
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

  if (sociosConDietas.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No hay socios registrados aún.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sociosConDietas.map((socio) => (
        <SocioDietaCard
          key={socio.id_socio}
          socio={socio}
          dieta={socio.ultimaDieta}
          loadingDieta={socio.loadingDieta}
        />
      ))}
    </div>
  );
}
