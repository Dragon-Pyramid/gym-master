import { EstadoEquipamiento } from "@/enums/estadoEquipamiento.enum";

export interface Equipamento{
    id: string; // UUID
    nombre: string;
    tipo: string; // ej: "Cardio", "Fuerza", "Accesorio"
    marca: string;
    modelo: string;
    ubicacion: string;
    estado: EstadoEquipamiento;
    fecha_adquisicion: string;
    ultima_revision: string;
    proxima_revision: string;
    observaciones: string;
    activo: boolean;
}

export interface CreateEquipamentoDTO {
    nombre: string;
    tipo: string; // ej: "Cardio", "Fuerza", "Accesorio"
    marca: string;
    modelo: string;
    ubicacion: string;
    proxima_revision?: string;  // si no existe, se calcula automáticamente
//    fecha_adquisicion: string;  hoy
//    ultima_revision: string;   hoy
    observaciones?: string;  // por defecto Sin observaciones
}

export interface UpdateEquipamentoDTO {
    nombre?: string;
    tipo?: string; // ej: "Cardio", "Fuerza", "Accesorio"
    marca?: string;
    modelo?: string;
    ubicacion?: string;
    estado?: EstadoEquipamiento;
    fecha_adquisicion?: string; // si no se proporciona, se mantiene el valor actual
    ultima_revision?: string; // si no se proporciona, se mantiene el valor actual
    proxima_revision?: string; // si no se proporciona, se calcula automáticamente
    observaciones?: string; // si no se proporciona, se mantiene el valor actual
    activo?: boolean;
}