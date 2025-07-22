/**
 * Servicio de gestión de socios - Integración Backend de Datos
 * Gym Master - Dragon Pyramid
 */

import { supabase } from '../lib/supabase'
import { Socio, Usuario } from '../types'

export class SociosService {
  /**
   * Obtener todos los socios activos
   */
  static async obtenerSociosActivos(): Promise<Socio[]> {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('estado', 'activo')
        .order('fecha_alta', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener socios activos:', error)
      throw error
    }
  }

  /**
   * Obtener socio por ID
   */
  static async obtenerSocioPorId(id: string): Promise<Socio | null> {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al obtener socio:', error)
      throw error
    }
  }

  /**
   * Crear nuevo socio
   */
  static async crearSocio(socioData: Omit<Socio, 'id' | 'created_at' | 'updated_at'>): Promise<Socio> {
    try {
      const { data, error } = await supabase
        .from('socios')
        .insert([socioData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al crear socio:', error)
      throw error
    }
  }

  /**
   * Actualizar datos del socio
   */
  static async actualizarSocio(id: string, actualizaciones: Partial<Socio>): Promise<Socio> {
    try {
      const { data, error } = await supabase
        .from('socios')
        .update({ ...actualizaciones, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al actualizar socio:', error)
      throw error
    }
  }

  /**
   * Obtener socios que requieren renovación de cuota
   */
  static async obtenerSociosConCuotaVencida(): Promise<Socio[]> {
    try {
      const fechaActual = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('estado', 'activo')
        .lt('ultima_cuota_pagada', fechaActual)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error al obtener socios con cuota vencida:', error)
      throw error
    }
  }
}