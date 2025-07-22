/**
 * Servicio de Inteligencia Artificial - Integración Backend de Datos
 * Gym Master - Dragon Pyramid
 * Conecta con el módulo de Python para generar rutinas y dietas personalizadas
 */

import { supabase } from '../lib/supabase'
import { RutinaPersonalizada, DietaPersonalizada, Socio } from '../types'

export class IAService {
  /**
   * Generar rutina personalizada usando IA
   */
  static async generarRutinaPersonalizada(socioId: string): Promise<RutinaPersonalizada> {
    try {
      // Obtener datos del socio para personalización
      const socio = await this.obtenerDatosSocio(socioId)
      
      if (!socio) {
        throw new Error('Socio no encontrado')
      }

      // Preparar parámetros para el modelo de IA
      const parametrosIA = {
        edad: this.calcularEdad(socio.fecha_nacimiento),
        genero: socio.genero,
        imc: socio.imc,
        nivel_experiencia: socio.nivel_experiencia,
        objetivos: socio.objetivos,
        condiciones_medicas: socio.condiciones_medicas
      }

      // TODO: Integrar con módulo Python de IA
      // Por ahora, generar rutina básica
      const rutinaGenerada = await this.procesarRutinaConIA(parametrosIA)

      // Guardar rutina en la base de datos
      const { data, error } = await supabase
        .from('rutinas_personalizadas')
        .insert([{
          socio_id: socioId,
          titulo: rutinaGenerada.titulo,
          descripcion: rutinaGenerada.descripcion,
          ejercicios: rutinaGenerada.ejercicios,
          duracion_semanas: rutinaGenerada.duracion_semanas,
          dias_por_semana: rutinaGenerada.dias_por_semana,
          nivel_dificultad: rutinaGenerada.nivel_dificultad,
          generada_por_ia: true
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al generar rutina personalizada:', error)
      throw error
    }
  }

  /**
   * Generar dieta personalizada usando IA
   */
  static async generarDietaPersonalizada(socioId: string): Promise<DietaPersonalizada> {
    try {
      const socio = await this.obtenerDatosSocio(socioId)
      
      if (!socio) {
        throw new Error('Socio no encontrado')
      }

      const parametrosIA = {
        edad: this.calcularEdad(socio.fecha_nacimiento),
        genero: socio.genero,
        imc: socio.imc,
        objetivos: socio.objetivos,
        condiciones_medicas: socio.condiciones_medicas
      }

      // TODO: Integrar con módulo Python de IA
      const dietaGenerada = await this.procesarDietaConIA(parametrosIA)

      // Guardar dieta en la base de datos
      const { data, error } = await supabase
        .from('dietas_personalizadas')
        .insert([{
          socio_id: socioId,
          titulo: dietaGenerada.titulo,
          descripcion: dietaGenerada.descripcion,
          calorias_objetivo: dietaGenerada.calorias_objetivo,
          macronutrientes: dietaGenerada.macronutrientes,
          comidas: dietaGenerada.comidas,
          duracion_dias: dietaGenerada.duracion_dias,
          generada_por_ia: true
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al generar dieta personalizada:', error)
      throw error
    }
  }

  /**
   * Obtener rutinas del socio
   */
  static async obtenerRutinasSocio(socioId: string): Promise<RutinaPersonalizada[]> {
    try {
      const { data, error } = await supabase
        .from('rutinas_personalizadas')
        .select('*')
        .eq('socio_id', socioId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener rutinas del socio:', error)
      throw error
    }
  }

  /**
   * Obtener dietas del socio
   */
  static async obtenerDietasSocio(socioId: string): Promise<DietaPersonalizada[]> {
    try {
      const { data, error } = await supabase
        .from('dietas_personalizadas')
        .select('*')
        .eq('socio_id', socioId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener dietas del socio:', error)
      throw error
    }
  }

  // Métodos auxiliares privados
  private static async obtenerDatosSocio(socioId: string): Promise<Socio | null> {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('id', socioId)
      .single()

    if (error) return null
    return data
  }

  private static calcularEdad(fechaNacimiento?: string): number {
    if (!fechaNacimiento) return 30 // Valor por defecto
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    
    return edad
  }

  // TODO: Implementar integración real con módulo Python
  private static async procesarRutinaConIA(parametros: any): Promise<any> {
    // Simulación de respuesta del módulo de IA
    return {
      titulo: `Rutina Personalizada - ${parametros.nivel_experiencia}`,
      descripcion: 'Rutina generada por IA basada en tus objetivos y características',
      ejercicios: [
        {
          id: '1',
          nombre: 'Sentadillas',
          descripcion: 'Ejercicio básico para piernas',
          grupo_muscular: 'piernas',
          repeticiones: 12,
          series: 3,
          tiempo_descanso: 60
        }
      ],
      duracion_semanas: 4,
      dias_por_semana: 3,
      nivel_dificultad: parametros.nivel_experiencia === 'principiante' ? 'bajo' : 'medio'
    }
  }

  private static async procesarDietaConIA(parametros: any): Promise<any> {
    // Simulación de respuesta del módulo de IA
    const caloriasBase = parametros.genero === 'masculino' ? 2200 : 1800
    
    return {
      titulo: 'Dieta Personalizada IA',
      descripcion: 'Plan nutricional adaptado a tus necesidades',
      calorias_objetivo: caloriasBase,
      macronutrientes: {
        proteinas: 120,
        carbohidratos: 200,
        grasas: 70
      },
      comidas: [
        {
          id: '1',
          nombre: 'Desayuno Proteico',
          tipo: 'desayuno',
          ingredientes: [
            { nombre: 'Avena', cantidad: 50, unidad: 'g', calorias: 190 },
            { nombre: 'Proteína en polvo', cantidad: 30, unidad: 'g', calorias: 120 }
          ],
          calorias_total: 310
        }
      ],
      duracion_dias: 30
    }
  }
}