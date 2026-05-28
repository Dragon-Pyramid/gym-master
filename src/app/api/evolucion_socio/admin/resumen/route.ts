import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { conexionBD } from "@/middlewares/conexionBd.middleware";
import type { TipoCorporal, SexoReferencia } from "@/interfaces/evolucionSocio.interface";

export const dynamic = "force-dynamic";

interface SocioResumenRow {
  id_socio: string;
  nombre_completo: string | null;
  dni: string | null;
  email: string | null;
  foto: string | null;
  activo: boolean | null;
}

interface EvolucionResumenRow {
  socio_id: string;
  fecha: string | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  cintura: number | null;
  porcentaje_grasa: number | null;
  masa_muscular: number | null;
  tipo_corporal: TipoCorporal | null;
  sexo_referencia: SexoReferencia | null;
}

interface EvolucionAccumulator {
  total: number;
  latest: EvolucionResumenRow | null;
}

const isAdminRole = (rol?: string | null) => {
  const normalized = rol?.trim().toLowerCase();
  return normalized === "admin" || normalized === "administrador";
};

const getStatusFromError = (message?: string) => {
  if (!message) return 500;
  if (message.includes("Token") || message.includes("Unauthorized")) return 401;
  if (message.includes("No autorizado")) return 403;
  return 500;
};

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);

    if (!isAdminRole(user.rol)) {
      return NextResponse.json(
        { error: "No autorizado para consultar el resumen administrativo de evolución física" },
        { status: 403 }
      );
    }

    const supabase = conexionBD();

    const { data: socios, error: sociosError } = await supabase
      .from("socio")
      .select("id_socio,nombre_completo,dni,email,foto,activo")
      .order("nombre_completo", { ascending: true });

    if (sociosError) {
      throw new Error(`Error al obtener socios: ${sociosError.message}`);
    }

    const socioRows = (socios || []) as SocioResumenRow[];
    const socioIds = socioRows.map((socio) => socio.id_socio).filter(Boolean);

    const resumenBySocio = new Map<string, EvolucionAccumulator>();

    if (socioIds.length > 0) {
      const { data: evoluciones, error: evolucionesError } = await supabase
        .from("evolucion_socio")
        .select(
          "socio_id,fecha,peso,altura,imc,cintura,porcentaje_grasa,masa_muscular,tipo_corporal,sexo_referencia"
        )
        .in("socio_id", socioIds)
        .order("fecha", { ascending: false });

      if (evolucionesError) {
        throw new Error(
          `Error al obtener evoluciones: ${evolucionesError.message}`
        );
      }

      ((evoluciones || []) as EvolucionResumenRow[]).forEach((evolucion) => {
        if (!evolucion.socio_id) return;

        const current = resumenBySocio.get(evolucion.socio_id) || {
          total: 0,
          latest: null,
        };

        current.total += 1;

        if (!current.latest) {
          current.latest = evolucion;
        }

        resumenBySocio.set(evolucion.socio_id, current);
      });
    }

    const rows = socioRows.map((socio) => {
      const resumen = resumenBySocio.get(socio.id_socio);
      const latest = resumen?.latest || null;

      return {
        id_socio: socio.id_socio,
        nombre_completo: socio.nombre_completo || "Socio sin nombre",
        dni: socio.dni || "-",
        email: socio.email,
        foto: socio.foto,
        activo: Boolean(socio.activo),
        total_registros: resumen?.total || 0,
        tiene_evolucion: Boolean(resumen?.total),
        ultima_fecha: latest?.fecha || null,
        ultimo_peso: latest?.peso ?? null,
        ultima_altura: latest?.altura ?? null,
        ultimo_imc: latest?.imc ?? null,
        ultima_cintura: latest?.cintura ?? null,
        ultimo_porcentaje_grasa: latest?.porcentaje_grasa ?? null,
        ultima_masa_muscular: latest?.masa_muscular ?? null,
        ultimo_tipo_corporal: latest?.tipo_corporal ?? null,
        ultimo_sexo_referencia: latest?.sexo_referencia ?? null,
      };
    });

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al obtener resumen administrativo de evolución física";

    console.error("ERROR evolucion_socio/admin/resumen:", message);

    return NextResponse.json(
      { error: message },
      { status: getStatusFromError(message) }
    );
  }
}
