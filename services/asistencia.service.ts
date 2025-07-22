/**
 * Servicio de gestión de asistencia - Integración Backend de Datos
 * Gym Master - Dragon Pyramid
 */

import { supabase } from '../lib/supabase'
import { RegistroAsistencia } from '../types'

export class AsistenciaService {
  /**
   * Registrar entrada del socio al gimnasio
   */
  static async registrarEntrada(socioId: string, notas?: string): Promise<RegistroAsistencia> {
    try {
      const ahora = new Date()
      const fecha = ahora.toISOString().split('T')[0]
      const hora = ahora.toTimeString().split(' ')[0]

      const { data, error } = await supabase
        .from('registros_asistencia')
        .insert([{
          socio_id: socioId,
          fecha,
          hora_entrada: hora,
          notas
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al registrar entrada:', error)
      throw error
    }
  }

  /**
   * Registrar salida del socio del gimnasio
   */
  static async registrarSalida(registroId: string, rutinaRealizada?: string): Promise<RegistroAsistencia> {
    try {
      const ahora = new Date()
      const hora = ahora.toTimeString().split(' ')[0]

      const { data, error } = await supabase
        .from('registros_asistencia')
        .update({
          hora_salida: hora,
          rutina_realizada: rutinaRealizada
        })
        .eq('id', registroId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al registrar salida:', error)
      throw error
    }
  }

  /**
   * Obtener asistencia de un socio por período
   */
  static async obtenerAsistenciaSocio(
    socioId: string, 
    fechaInicio: string, 
    fechaFin: string
  ): Promise<RegistroAsistencia[]> {
    try {
      const { data, error } = await supabase
        .from('registros_asistencia')
        .select('*')
        .eq('socio_id', socioId)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener asistencia del socio:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de asistencia
   */
  static async obtenerEstadisticasAsistencia(fechaInicio: string, fechaFin: string) {
    try {
      const { data, error } = await supabase
        .from('registros_asistencia')
        .select('fecha, socio_id')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)

      if (error) throw error

      // Procesar estadísticas
      const registros = data || []
      const totalVisitas = registros.length
      const sociosUnicos = new Set(registros.map(r => r.socio_id)).size
      const promedioVisitasPorDia = this.calcularPromedioVisitasPorDia(registros, fechaInicio, fechaFin)

      return {
        total_visitas: totalVisitas,
        socios_unicos: sociosUnicos,
        promedio_visitas_por_dia: promedioVisitasPorDia
      }
    } catch (error) {
      console.error('Error al obtener estadísticas de asistencia:', error)
      throw error
    }
  }

  /**
   * Obtener socios actualmente en el gimnasio
   */
  static async obtenerSociosPresentes(): Promise<RegistroAsistencia[]> {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('registros_asistencia')
        .select(`
          *,
          socios (
            nombre,
            apellido,
            numero_socio
          )
        `)
        .eq('fecha', fechaHoy)
        .is('hora_salida', null)
        .order('hora_entrada', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener socios presentes:', error)
      throw error
    }
  }

  // Método auxiliar privado
  private static calcularPromedioVisitasPorDia(
    registros: any[], 
    fechaInicio: string, 
    fechaFin: string
  ): number {
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const diasTotal = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return diasTotal > 0 ? Math.round((registros.length / diasTotal) * 100) / 100 : 0
  }
}