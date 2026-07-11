"use client";

import { useState, useEffect, useCallback } from "react";
import { Socio } from "@/interfaces/socio.interface";
import { Rutina } from "@/interfaces/rutina.interface";
import { Objetivo } from "@/interfaces/objetivo.interface";
import { Nivel } from "@/interfaces/niveles.interface";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import SocioRutinaCard from "./SocioRutinaCard";
import { getHistorialRutinas, getRutinasPorSocio } from "@/services/apiClient";

interface SociosRutinasGridProps {
  socios: Socio[];
  loading: boolean;
  objetivos: Objetivo[];
  niveles: Nivel[];
}

interface SocioConRutina extends Socio {
  ultimaRutina?: Rutina | null;
  loadingRutina?: boolean;
}

const getSocioIdFromRutina = (rutina: Rutina): string | null => {
  return rutina.id_socio ?? rutina.socio?.id_socio ?? null;
};

const buildUltimaRutinaBySocio = (rutinas: Rutina[]): Map<string, Rutina> => {
  const latestBySocio = new Map<string, Rutina>();

  rutinas.forEach((rutina) => {
    const socioId = getSocioIdFromRutina(rutina);

    if (!socioId || latestBySocio.has(socioId)) {
      return;
    }

    latestBySocio.set(socioId, rutina);
  });

  return latestBySocio;
};

export default function SociosRutinasGrid({
  socios,
  loading,
  objetivos,
  niveles,
}: SociosRutinasGridProps) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [sociosConRutinas, setSociosConRutinas] = useState<SocioConRutina[]>(
    []
  );

  const obtenerUltimaRutina = async (
    socioId: string
  ): Promise<Rutina | null> => {
    try {
      const response = await getRutinasPorSocio(socioId);

      if (!response.ok) {
        console.error(
          `Error al obtener rutinas del socio ${socioId}:`,
          response
        );
        return null;
      }

      const rutinas: Rutina[] = Array.isArray(response.data)
        ? response.data
        : [];
      if (rutinas.length === 0) return null;

      return rutinas[0];
    } catch (error) {
      console.error(`Error al obtener rutina del socio ${socioId}:`, error);
      return null;
    }
  };

  const refrescarRutinaSocio = useCallback(async (socioId: string) => {
    setSociosConRutinas((prev) =>
      prev.map((socio) =>
        socio.id_socio === socioId ? { ...socio, loadingRutina: true } : socio
      )
    );

    const rutina = await obtenerUltimaRutina(socioId);

    setSociosConRutinas((prev) =>
      prev.map((socio) =>
        socio.id_socio === socioId
          ? { ...socio, ultimaRutina: rutina, loadingRutina: false }
          : socio
      )
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

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

      try {
        const response = await getHistorialRutinas();

        const rutinas: Rutina[] =
          response.ok && Array.isArray(response.data) ? response.data : [];

        const latestBySocio = buildUltimaRutinaBySocio(rutinas);

        if (!isMounted) {
          return;
        }

        setSociosConRutinas(
          socios.map((socio) => ({
            ...socio,
            ultimaRutina: latestBySocio.get(socio.id_socio) ?? null,
            loadingRutina: false,
          }))
        );
      } catch (error) {
        console.error("Error al cargar rutinas de socios:", error);

        if (!isMounted) {
          return;
        }

        setSociosConRutinas(
          socios.map((socio) => ({
            ...socio,
            ultimaRutina: null,
            loadingRutina: false,
          }))
        );
      }
    };

    cargarRutinas();

    return () => {
      isMounted = false;
    };
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
        {tx("No hay socios registrados aún.", "No members have been registered yet.")}
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
          objetivos={objetivos}
          niveles={niveles}
          onRutinaCreated={refrescarRutinaSocio}
        />
      ))}
    </div>
  );
}
