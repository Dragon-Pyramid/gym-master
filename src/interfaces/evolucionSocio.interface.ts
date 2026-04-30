export interface EvolucionSocio {
    socio_id: string;
    fecha: Date;
    peso: number;
    cintura: number;
    bicep: number;
    tricep: number;
    pierna: number;
    gluteos: number;
    pantorrilla: number;
    altura: number;
    imc: number;
    observaciones: string;
}

export interface CreateEvolucionSocioDto{
    socio_id:string;
    peso: number;
    cintura: number;
    bicep: number;
    tricep: number;
    pierna: number;
    gluteos: number;
    pantorrilla: number;
    altura: number;
    imc: number;
    observaciones: string;
}
