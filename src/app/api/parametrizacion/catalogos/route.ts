import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/services/supabaseServerClient";
import {
  CatalogoParametrizableKey,
  CatalogoParametrizablePrioridad,
  CatalogoParametrizableStatus,
} from "@/interfaces/parametrizacion.interface";

export const dynamic = "force-dynamic";

type CatalogDefinition = {
  key: CatalogoParametrizableKey;
  table: string;
  title: string;
  description: string;
  status: CatalogoParametrizableStatus;
  priority: CatalogoParametrizablePrioridad;
};

const catalogDefinitions: CatalogDefinition[] = [
  {
    key: "tipo_empleado",
    table: "tipo_empleado",
    title: "Tipos de empleado",
    description:
      "Base para evolucionar entrenadores hacia empleados, sueldos, recibos y reportes por rol.",
    status: "Disponible",
    priority: "Alta",
  },
  {
    key: "medio_pago",
    table: "medio_pago",
    title: "Medios de pago",
    description:
      "Medios disponibles para cuotas, ventas, transferencias, Stripe y futuros recibos verificables.",
    status: "Disponible",
    priority: "Alta",
  },
  {
    key: "tipo_gasto",
    table: "tipo_gasto",
    title: "Tipos de gasto",
    description:
      "Clasificación de egresos operativos: sueldos, mantenimiento, servicios, insumos e impuestos.",
    status: "Disponible",
    priority: "Alta",
  },
  {
    key: "tipo_ingreso",
    table: "tipo_ingreso",
    title: "Tipos de ingreso",
    description:
      "Clasificación de ingresos por cuotas, ventas, servicios, clases especiales y promociones.",
    status: "Disponible",
    priority: "Alta",
  },
  {
    key: "categoria_producto",
    table: "categoria_producto",
    title: "Categorías de producto",
    description:
      "Categorías para ordenar productos, ventas adicionales, stock y reportes comerciales.",
    status: "Disponible",
    priority: "Media",
  },
  {
    key: "tipo_equipamiento",
    table: "tipo_equipamiento",
    title: "Tipos de equipamiento",
    description:
      "Catálogo base para clasificar máquinas y equipamiento del gimnasio.",
    status: "Disponible",
    priority: "Alta",
  },
  {
    key: "ubicacion_equipamiento",
    table: "ubicacion_equipamiento",
    title: "Ubicaciones de equipamiento",
    description:
      "Sectores físicos donde se ubican máquinas, accesorios y espacios operativos del gimnasio.",
    status: "Disponible",
    priority: "Alta",
  },
  {
    key: "tipo_mantenimiento",
    table: "tipo_mantenimiento",
    title: "Tipos de mantenimiento",
    description:
      "Verificaciones configurables por frecuencia, alerta anticipada e impacto operativo.",
    status: "Disponible",
    priority: "Alta",
  },
];

function normalizeCatalogRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    codigo: String(row.codigo ?? ""),
    nombre: String(row.nombre ?? ""),
    descripcion: row.descripcion ? String(row.descripcion) : null,
    activo: row.activo !== false,
    orden: Number(row.orden ?? 0),
    creado_en: row.creado_en ? String(row.creado_en) : null,
    actualizado_en: row.actualizado_en ? String(row.actualizado_en) : null,
    requiere_comprobante:
      typeof row.requiere_comprobante === "boolean" ? row.requiere_comprobante : null,
    es_online: typeof row.es_online === "boolean" ? row.es_online : null,
    frecuencia_dias:
      row.frecuencia_dias === null || row.frecuencia_dias === undefined
        ? null
        : Number(row.frecuencia_dias),
    alerta_dias_anticipacion:
      row.alerta_dias_anticipacion === null || row.alerta_dias_anticipacion === undefined
        ? null
        : Number(row.alerta_dias_anticipacion),
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const catalogos = await Promise.all(
      catalogDefinitions.map(async (definition) => {
        const { data, error, count } = await supabase
          .from(definition.table)
          .select("*", { count: "exact" })
          .order("orden", { ascending: true })
          .order("nombre", { ascending: true });

        if (error) {
          throw new Error(`${definition.table}: ${error.message}`);
        }

        const items = ((data ?? []) as Record<string, unknown>[]).map(normalizeCatalogRow);
        const activos = items.filter((item) => item.activo).length;

        return {
          ...definition,
          total: count ?? items.length,
          activos,
          inactivos: items.length - activos,
          items,
          examples: items.slice(0, 5).map((item) => item.nombre),
        };
      })
    );

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      catalogos,
    });
  } catch (error) {
    console.error("Error al obtener catálogos de parametrización:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener catálogos" },
      { status: 500 }
    );
  }
}
