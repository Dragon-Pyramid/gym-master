export interface Dieta{
    id: string;
    socio_id: string;
    nombre_plan : string;
    objetivo: string;
    observaciones: string;
    fecha_inicio: string;
    fecha_fin: string;
    creado_por: string;
}

export interface CreateDietaDto{
    socio_id: string;
    nombre_plan : string;
    objetivo: string;
    observaciones: string;
    fecha_inicio: string;
    fecha_fin: string;
}