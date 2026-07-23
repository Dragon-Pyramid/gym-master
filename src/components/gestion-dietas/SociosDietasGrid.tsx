"use client";

import { useState, useEffect } from "react";
import { Socio } from "@/interfaces/socio.interface";
import { Dieta } from "@/interfaces/dieta.interface";
import { Skeleton } from "@/components/ui/skeleton";
import SocioDietaCard from "./SocioDietaCard";
import { getDietasPorSocio } from "@/services/apiClient";
import { useI18n } from '@/i18n/I18nProvider';

interface SociosDietasGridProps { socios: Socio[]; loading: boolean; }
interface SocioConDieta extends Socio { ultimaDieta?: Dieta | null; loadingDieta?: boolean; }

export default function SociosDietasGrid({ socios, loading }: SociosDietasGridProps) {
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === 'en' ? en : es);
  const [sociosConDietas, setSociosConDietas] = useState<SocioConDieta[]>([]);

  const obtenerUltimaDieta = async (socioId: string): Promise<Dieta | null> => {
    try {
      const response = await getDietasPorSocio(socioId);
      if (!response.ok) {
        console.error(`Error loading diets for member ${socioId}:`, response);
        return null;
      }
      const dietas: Dieta[] = Array.isArray(response.data) ? response.data : [];
      return dietas[0] ?? null;
    } catch (error) {
      console.error(`Error loading diet for member ${socioId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const cargarDietas = async () => {
      if (!socios.length) {
        setSociosConDietas([]);
        return;
      }
      setSociosConDietas(socios.map((socio) => ({ ...socio, ultimaDieta: null, loadingDieta: true })));
      for (const socio of socios) {
        const dieta = await obtenerUltimaDieta(socio.id_socio);
        setSociosConDietas((prev) => prev.map((s) => s.id_socio === socio.id_socio ? { ...s, ultimaDieta: dieta, loadingDieta: false } : s));
      }
    };
    cargarDietas();
  }, [socios]);

  if (loading) {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="w-full h-48 rounded-lg" />)}</div>;
  }

  if (sociosConDietas.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">{tx('No hay socios registrados aún.', 'No members have been registered yet.')}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sociosConDietas.map((socio) => <SocioDietaCard key={socio.id_socio} socio={socio} dieta={socio.ultimaDieta} loadingDieta={socio.loadingDieta} />)}
    </div>
  );
}
