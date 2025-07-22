/**
 * Configuración del cliente Supabase para la integración del backend de datos
 * Gym Master - Dragon Pyramid
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase no configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Cliente Supabase configurado para la aplicación Gym Master
 * Maneja la conexión con la base de datos PostgreSQL
 */
export default supabase