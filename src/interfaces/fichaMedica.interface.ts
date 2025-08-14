/*
• p_id_socio → UUID 
• p_altura → NUMERIC (cm) 
• p_peso → NUMERIC (kg) 
• p_grupo_sanguineo → VARCHAR (A+, O-, etc.) 
• p_presion_arterial → VARCHAR (ej. "120/80") 
• p_frecuencia_cardiaca → INTEGER (bpm) 
• p_problemas_cardiacos → BOOLEAN 
• p_problemas_respiratorios → BOOLEAN 
• p_aprobacion_medica → BOOLEAN 


Opcionales (pueden ir como NULL): 
• p_alergias → TEXT 
• p_medicacion → TEXT 
• p_lesiones_previas → TEXT 
• p_enfermedades_cronicas → TEXT 
• p_cirugias_previas → TEXT 
• p_archivo_aprobacion → TEXT (URL Cloudinary) 
• p_fecha_ultimo_control → DATE 
• p_observaciones_entrenador → TEXT 
• p_observaciones_medico → TEXT 
• p_archivos_adjuntos → TEXT[] (array de URLs) 
• p_proxima_revision → DATE
*/

export interface FichaMedica {
    id: string;
    id_socio: string;
    altura: number; // cm
    peso: number; // kg
    imc: number; // índice de masa corporal
    grupo_sanguineo: string; // A+, O-, etc.
    presion_arterial: string; // ej. "120/80"
    frecuencia_cardiaca: number; // bpm
    problemas_cardiacos: boolean;
    problemas_respiratorios: boolean;
    aprobacion_medica: boolean;

    alergias?: string | null;
    medicacion?: string | null;
    lesiones_previas?: string | null;
    enfermedades_cronicas?: string | null;
    cirugias_previas?: string | null;
    archivo_aprobacion?: string | null; // URL Cloudinary
    fecha_ultimo_control?: Date | null;
    observaciones_entrenador?: string | null;
    observaciones_medico?: string | null;
    archivos_adjuntos?: string[] | null; // array de URLs
    proxima_revision?: Date | null;
}


export interface CreateFichaMedicaDto {
    altura: number; // cm
    peso: number; // kg
    grupo_sanguineo: string; // A+, O-, etc.
    presion_arterial: string; // ej. "120/80"
    frecuencia_cardiaca: number; // bpm
    problemas_cardiacos: boolean;
    problemas_respiratorios: boolean;
    aprobacion_medica: boolean;

    alergias?: string | null;
    medicacion?: string | null;
    lesiones_previas?: string | null;
    enfermedades_cronicas?: string | null;
    cirugias_previas?: string | null;
    archivo_aprobacion?: string | null; // URL Cloudinary
    fecha_ultimo_control?: Date | null;
    observaciones_entrenador?: string | null;
    observaciones_medico?: string | null;
    archivos_adjuntos?: string[] | null; // array de URLs
    proxima_revision?: Date | null;
}