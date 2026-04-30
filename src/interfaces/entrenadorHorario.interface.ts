export interface EntrenadorHorario {
id: string;
entrenador_id: string;
dia_semana: string;
hora_desde: string;
hora_hasta: string;
}

export interface CreateEntrenadorHorarioDTO {
    dia_semana: string;
    bloques: [
        {
            hora_desde: string,
            hora_hasta: string
        }
    ];
}