export type CatalogoParametrizableKey =
  | "tipo_empleado"
  | "medio_pago"
  | "tipo_gasto"
  | "tipo_ingreso"
  | "categoria_producto"
  | "tipo_equipamiento"
  | "ubicacion_equipamiento"
  | "tipo_mantenimiento";

export type CatalogoParametrizableStatus = "Disponible" | "Planificado" | "Base existente";
export type CatalogoParametrizablePrioridad = "Alta" | "Media" | "Futura";

export interface CatalogoParametrizableItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  creado_en?: string | null;
  actualizado_en?: string | null;
  requiere_comprobante?: boolean | null;
  es_online?: boolean | null;
  frecuencia_dias?: number | null;
  alerta_dias_anticipacion?: number | null;
}

export interface CatalogoParametrizableSummary {
  key: CatalogoParametrizableKey;
  table: string;
  title: string;
  description: string;
  status: CatalogoParametrizableStatus;
  priority: CatalogoParametrizablePrioridad;
  total: number;
  activos: number;
  inactivos: number;
  items: CatalogoParametrizableItem[];
  examples: string[];
}

export interface ParametrizacionCatalogosResponse {
  generated_at: string;
  catalogos: CatalogoParametrizableSummary[];
}
