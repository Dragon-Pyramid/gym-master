/**
 * Tipos TypeScript para la integración del backend de datos
 * Gym Master - Dragon Pyramid
 */

// Tipos para usuarios y socios
export interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono?: string
  fecha_nacimiento?: string
  genero?: 'masculino' | 'femenino' | 'otro'
  created_at: string
  updated_at: string
}

export interface Socio extends Usuario {
  numero_socio: string
  estado: 'activo' | 'inactivo' | 'suspendido'
  fecha_alta: string
  ultima_cuota_pagada?: string
  imc?: number
  nivel_experiencia: 'principiante' | 'intermedio' | 'avanzado'
  objetivos: string[]
  condiciones_medicas?: string[]
}

// Tipos para rutinas y dietas (módulo IA)
export interface RutinaPersonalizada {
  id: string
  socio_id: string
  titulo: string
  descripcion: string
  ejercicios: Ejercicio[]
  duracion_semanas: number
  dias_por_semana: number
  nivel_dificultad: 'bajo' | 'medio' | 'alto'
  created_at: string
  generada_por_ia: boolean
}

export interface Ejercicio {
  id: string
  nombre: string
  descripcion: string
  grupo_muscular: string
  repeticiones?: number
  series?: number
  tiempo_descanso?: number
  peso_recomendado?: number
}

export interface DietaPersonalizada {
  id: string
  socio_id: string
  titulo: string
  descripcion: string
  calorias_objetivo: number
  macronutrientes: {
    proteinas: number
    carbohidratos: number
    grasas: number
  }
  comidas: Comida[]
  duracion_dias: number
  created_at: string
  generada_por_ia: boolean
}

export interface Comida {
  id: string
  nombre: string
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'snack'
  ingredientes: Ingrediente[]
  calorias_total: number
  instrucciones?: string
}

export interface Ingrediente {
  nombre: string
  cantidad: number
  unidad: string
  calorias: number
}

// Tipos para asistencia y datos de entrenamiento
export interface RegistroAsistencia {
  id: string
  socio_id: string
  fecha: string
  hora_entrada: string
  hora_salida?: string
  rutina_realizada?: string
  notas?: string
}

// Tipos para configuración del módulo IA
export interface ConfiguracionIA {
  id: string
  parametros_rutina: {
    factores_personalizacion: string[]
    algoritmo_utilizado: string
  }
  parametros_dieta: {
    factores_nutricionales: string[]
    restricciones_alimentarias: string[]
  }
  actualizacion_modelo: string
}