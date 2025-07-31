export interface Rutina {
    id_rutina: string;
    id_socio: string;
    rutina_desc: any; // Puede ser un objeto con detalles de la rutina
    contenido: any;
    semana: number;
    nombre: string;
    creado_en?: string;
    actualizado_en?: string;
}

export interface GeneracionRutina {
    nivel: number;
    objetivo: number;
    dias: number;
}