/**
 * Ejemplo de uso de la Integración del Backend de Datos
 * Gym Master - Dragon Pyramid
 * 
 * Este archivo demuestra cómo utilizar los servicios implementados
 */

import { SociosService, IAService, AsistenciaService } from '../services'
import { Socio } from '../types'

/**
 * Ejemplo 1: Gestión de Socios
 */
export async function ejemploGestionSocios() {
  try {
    console.log('=== Ejemplo: Gestión de Socios ===')
    
    // 1. Crear un nuevo socio
    const nuevoSocio: Omit<Socio, 'id' | 'created_at' | 'updated_at'> = {
      email: 'juan.perez@email.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '+54 11 1234-5678',
      fecha_nacimiento: '1990-05-15',
      genero: 'masculino',
      numero_socio: 'GYM001',
      estado: 'activo',
      fecha_alta: '2024-01-15',
      imc: 25.5,
      nivel_experiencia: 'intermedio',
      objetivos: ['bajar_peso', 'tonificar_musculos'],
      condiciones_medicas: []
    }
    
    const socioCreado = await SociosService.crearSocio(nuevoSocio)
    console.log('✅ Socio creado:', socioCreado.numero_socio)
    
    // 2. Obtener socios activos
    const sociosActivos = await SociosService.obtenerSociosActivos()
    console.log(`📊 Socios activos: ${sociosActivos.length}`)
    
    // 3. Obtener socios con cuota vencida
    const sociosVencidos = await SociosService.obtenerSociosConCuotaVencida()
    console.log(`⚠️ Socios con cuota vencida: ${sociosVencidos.length}`)
    
    return socioCreado
  } catch (error) {
    console.error('❌ Error en gestión de socios:', error)
    throw error
  }
}

/**
 * Ejemplo 2: Generación de Rutinas y Dietas con IA
 */
export async function ejemploGeneracionIA(socioId: string) {
  try {
    console.log('=== Ejemplo: Generación con IA ===')
    
    // 1. Generar rutina personalizada
    const rutina = await IAService.generarRutinaPersonalizada(socioId)
    console.log('🏋️ Rutina generada:', rutina.titulo)
    console.log(`   - Duración: ${rutina.duracion_semanas} semanas`)
    console.log(`   - Frecuencia: ${rutina.dias_por_semana} días por semana`)
    console.log(`   - Ejercicios: ${rutina.ejercicios.length}`)
    
    // 2. Generar dieta personalizada
    const dieta = await IAService.generarDietaPersonalizada(socioId)
    console.log('🥗 Dieta generada:', dieta.titulo)
    console.log(`   - Calorías objetivo: ${dieta.calorias_objetivo}`)
    console.log(`   - Duración: ${dieta.duracion_dias} días`)
    console.log(`   - Comidas: ${dieta.comidas.length}`)
    
    // 3. Obtener historial de rutinas
    const rutinasDelSocio = await IAService.obtenerRutinasSocio(socioId)
    console.log(`📋 Total de rutinas del socio: ${rutinasDelSocio.length}`)
    
    return { rutina, dieta }
  } catch (error) {
    console.error('❌ Error en generación con IA:', error)
    throw error
  }
}

/**
 * Ejemplo 3: Control de Asistencia
 */
export async function ejemploControlAsistencia(socioId: string) {
  try {
    console.log('=== Ejemplo: Control de Asistencia ===')
    
    // 1. Registrar entrada
    const entrada = await AsistenciaService.registrarEntrada(socioId, 'Entrenamiento de fuerza')
    console.log('🚪 Entrada registrada:', entrada.hora_entrada)
    
    // Simular tiempo en el gimnasio
    console.log('⏱️ Simulando entrenamiento...')
    
    // 2. Registrar salida
    const salida = await AsistenciaService.registrarSalida(entrada.id, 'Rutina de fuerza completada')
    console.log('🚪 Salida registrada:', salida.hora_salida)
    
    // 3. Obtener asistencia del mes actual
    const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const fechaFin = new Date().toISOString().split('T')[0]
    
    const asistenciaDelMes = await AsistenciaService.obtenerAsistenciaSocio(socioId, fechaInicio, fechaFin)
    console.log(`📅 Asistencias del mes: ${asistenciaDelMes.length}`)
    
    // 4. Obtener estadísticas generales
    const estadisticas = await AsistenciaService.obtenerEstadisticasAsistencia(fechaInicio, fechaFin)
    console.log('📊 Estadísticas del mes:')
    console.log(`   - Total visitas: ${estadisticas.total_visitas}`)
    console.log(`   - Socios únicos: ${estadisticas.socios_unicos}`)
    console.log(`   - Promedio visitas/día: ${estadisticas.promedio_visitas_por_dia}`)
    
    // 5. Ver quién está actualmente en el gimnasio
    const sociosPresentes = await AsistenciaService.obtenerSociosPresentes()
    console.log(`👥 Socios actualmente en el gimnasio: ${sociosPresentes.length}`)
    
    return { entrada, salida, estadisticas }
  } catch (error) {
    console.error('❌ Error en control de asistencia:', error)
    throw error
  }
}

/**
 * Ejemplo completo: Flujo típico del sistema
 */
export async function ejemploFlujoCompleto() {
  try {
    console.log('🚀 Iniciando ejemplo completo de integración...\n')
    
    // 1. Gestión de socios
    const socio = await ejemploGestionSocios()
    console.log('')
    
    // 2. Generación de rutinas y dietas
    const { rutina, dieta } = await ejemploGeneracionIA(socio.id)
    console.log('')
    
    // 3. Control de asistencia
    const { estadisticas } = await ejemploControlAsistencia(socio.id)
    console.log('')
    
    console.log('✅ Ejemplo completo finalizado exitosamente!')
    console.log('📋 Resumen:')
    console.log(`   - Socio creado: ${socio.nombre} ${socio.apellido}`)
    console.log(`   - Rutina generada: ${rutina.titulo}`)
    console.log(`   - Dieta generada: ${dieta.titulo}`)
    console.log(`   - Asistencias registradas: 1`)
    
    return {
      socio,
      rutina,
      dieta,
      estadisticas
    }
  } catch (error) {
    console.error('❌ Error en ejemplo completo:', error)
    throw error
  }
}

/**
 * Función principal para ejecutar los ejemplos
 */
export async function ejecutarEjemplos() {
  console.log('🏋️‍♂️ Gym Master - Ejemplos de Integración del Backend de Datos')
  console.log('=' .repeat(60))
  
  try {
    await ejemploFlujoCompleto()
  } catch (error) {
    console.error('💥 Error al ejecutar ejemplos:', error)
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  ejecutarEjemplos()
}