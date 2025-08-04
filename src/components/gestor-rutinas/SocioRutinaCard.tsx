"use client";

import { useState } from "react";
import { Socio } from "@/interfaces/socio.interface";
import { Rutina } from "@/interfaces/rutina.interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, User, Calendar, Dumbbell } from "lucide-react";
import RutinaModalView from "@/components/modal/RutinaModalView";

interface SocioRutinaCardProps {
  socio: Socio;
  rutina?: Rutina | null;
  loadingRutina?: boolean;
}

export default function SocioRutinaCard({
  socio,
  rutina,
  loadingRutina,
}: SocioRutinaCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "No disponible";
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const obtenerNombreRutina = (rutina?: Rutina | null) => {
    if (!rutina) return "Sin rutina asignada";
    return rutina.nombre || "Rutina sin nombre";
  };

  const contarEjercicios = (rutina?: Rutina | null) => {
    if (!rutina || !rutina.rutina_desc) return 0;

    try {
      const desc =
        typeof rutina.rutina_desc === "string"
          ? JSON.parse(rutina.rutina_desc)
          : rutina.rutina_desc;

      if (desc?.semana) {
        return Object.values(desc.semana).reduce(
          (total: number, dia: unknown) => {
            return total + (Array.isArray(dia) ? dia.length : 0);
          },
          0
        );
      }
    } catch (error) {
      console.error("Error al parsear rutina:", error);
    }

    return 0;
  };

  const contarDias = (rutina?: Rutina | null) => {
    if (!rutina || !rutina.rutina_desc) return 0;

    try {
      const desc =
        typeof rutina.rutina_desc === "string"
          ? JSON.parse(rutina.rutina_desc)
          : rutina.rutina_desc;

      if (desc?.semana) {
        return Object.keys(desc.semana).length;
      }
    } catch (error) {
      console.error("Error al parsear rutina:", error);
    }

    return 0;
  };

  return (
    <Card className="h-full transition-shadow duration-200 cursor-pointer hover:shadow-lg border-border hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1 min-w-0 gap-2">
            <User className="flex-shrink-0 w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold truncate">
              {socio.nombre_completo}
            </CardTitle>
          </div>
          <span
            className={`ml-2 flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
              socio.activo
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {socio.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">DNI: {socio.dni}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Última Rutina</span>
          </div>

          {loadingRutina ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {obtenerNombreRutina(rutina)}
              </p>

              {rutina ? (
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{contarDias(rutina)} días</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    <span>{contarEjercicios(rutina)} ejercicios</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Este socio no tiene rutinas asignadas
                </p>
              )}

              {rutina?.creado_en && (
                <p className="text-xs text-muted-foreground">
                  Creada: {formatearFecha(rutina.creado_en)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!rutina || loadingRutina}
            onClick={() => setModalOpen(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Rutina
          </Button>
          <Button variant="default" size="sm" className="w-full">
            Nueva Rutina
          </Button>
        </div>
      </CardContent>
      <RutinaModalView
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        rutina={rutina}
      />
    </Card>
  );
}
