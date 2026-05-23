import { NextRequest, NextResponse } from "next/server";
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
  editable: boolean;
  extraFields?: string[];
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
    editable: true,
  },
  {
    key: "medio_pago",
    table: "medio_pago",
    title: "Medios de pago",
    description:
      "Medios disponibles para cuotas, ventas, transferencias, Stripe y futuros recibos verificables.",
    status: "Disponible",
    priority: "Alta",
    editable: true,
    extraFields: ["requiere_comprobante", "es_online"],
  },
  {
    key: "tipo_gasto",
    table: "tipo_gasto",
    title: "Tipos de gasto",
    description:
      "Clasificación de egresos operativos: sueldos, mantenimiento, servicios, insumos e impuestos.",
    status: "Disponible",
    priority: "Alta",
    editable: true,
  },
  {
    key: "tipo_ingreso",
    table: "tipo_ingreso",
    title: "Tipos de ingreso",
    description:
      "Clasificación de ingresos por cuotas, ventas, servicios, clases especiales y promociones.",
    status: "Disponible",
    priority: "Alta",
    editable: true,
  },
  {
    key: "categoria_producto",
    table: "categoria_producto",
    title: "Categorías de producto",
    description:
      "Categorías para ordenar productos, ventas adicionales, stock y reportes comerciales.",
    status: "Disponible",
    priority: "Media",
    editable: true,
  },
  {
    key: "tipo_equipamiento",
    table: "tipo_equipamiento",
    title: "Tipos de equipamiento",
    description: "Catálogo base para clasificar máquinas y equipamiento del gimnasio.",
    status: "Disponible",
    priority: "Alta",
    editable: true,
  },
  {
    key: "ubicacion_equipamiento",
    table: "ubicacion_equipamiento",
    title: "Ubicaciones de equipamiento",
    description:
      "Sectores físicos donde se ubican máquinas, accesorios y espacios operativos del gimnasio.",
    status: "Disponible",
    priority: "Alta",
    editable: true,
  },
  {
    key: "tipo_mantenimiento",
    table: "tipo_mantenimiento",
    title: "Tipos de mantenimiento",
    description:
      "Verificaciones configurables por frecuencia, alerta anticipada e impacto operativo.",
    status: "Disponible",
    priority: "Alta",
    editable: true,
    extraFields: ["frecuencia_dias", "alerta_dias_anticipacion"],
  },
];

function getCatalogDefinition(key: unknown) {
  return catalogDefinitions.find((definition) => definition.key === key);
}

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

function sanitizeCodigo(codigo: string) {
  return codigo
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function parseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNullableString(value: unknown) {
  const text = parseString(value);
  return text.length ? text : null;
}

function parseNullablePositiveInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function parseNonNegativeInteger(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}

function buildCatalogPayload(
  definition: CatalogDefinition,
  body: Record<string, unknown>,
  mode: "create" | "update"
) {
  const payload: Record<string, unknown> = {};

  const nombre = parseString(body.nombre);
  if (mode === "create" && !nombre) {
    throw new Error("El nombre es obligatorio");
  }
  if (nombre || mode === "create") {
    payload.nombre = nombre;
  }

  const rawCodigo = parseString(body.codigo);
  if (mode === "create" && !rawCodigo) {
    throw new Error("El código es obligatorio");
  }
  if (rawCodigo || mode === "create") {
    const codigo = sanitizeCodigo(rawCodigo);
    if (!codigo) {
      throw new Error("El código no tiene un formato válido");
    }
    payload.codigo = codigo;
  }

  if ("descripcion" in body || mode === "create") {
    payload.descripcion = parseNullableString(body.descripcion);
  }

  if ("activo" in body || mode === "create") {
    payload.activo = body.activo !== false;
  }

  if ("orden" in body || mode === "create") {
    payload.orden = parseNonNegativeInteger(body.orden, 0);
  }

  if (definition.extraFields?.includes("requiere_comprobante") && "requiere_comprobante" in body) {
    payload.requiere_comprobante = body.requiere_comprobante === true;
  }

  if (definition.extraFields?.includes("es_online") && "es_online" in body) {
    payload.es_online = body.es_online === true;
  }

  if (definition.extraFields?.includes("frecuencia_dias") && "frecuencia_dias" in body) {
    payload.frecuencia_dias = parseNullablePositiveInteger(body.frecuencia_dias);
  }

  if (
    definition.extraFields?.includes("alerta_dias_anticipacion") &&
    "alerta_dias_anticipacion" in body
  ) {
    payload.alerta_dias_anticipacion = parseNonNegativeInteger(
      body.alerta_dias_anticipacion,
      0
    );
  }

  payload.actualizado_en = new Date().toISOString();

  return payload;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const definition = getCatalogDefinition(body.catalogo);

    if (!definition || !definition.editable) {
      return NextResponse.json({ error: "Catálogo no editable o inexistente" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const payload = buildCatalogPayload(definition, body, "create");

    const { data, error } = await supabase
      .from(definition.table)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      {
        item: normalizeCatalogRow(data as Record<string, unknown>),
        message: "Registro creado correctamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear catálogo de parametrización:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear registro" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const definition = getCatalogDefinition(body.catalogo);
    const id = parseString(body.id);

    if (!definition || !definition.editable) {
      return NextResponse.json({ error: "Catálogo no editable o inexistente" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "El id es obligatorio" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const payload = buildCatalogPayload(definition, body, "update");

    const { data, error } = await supabase
      .from(definition.table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({
      item: normalizeCatalogRow(data as Record<string, unknown>),
      message: "Registro actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar catálogo de parametrización:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar registro" },
      { status: 500 }
    );
  }
}
