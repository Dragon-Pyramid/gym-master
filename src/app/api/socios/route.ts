import { supabase } from '@/services/supabaseClient' // asegurate de tener esta importación
import { NextResponse } from 'next/server'
import {
  fetchSocios,
  createSocio,
  updateSocio,
  deleteSocio
} from '@/services/socioService'
import { authMiddleware } from '@/middlewares/auth.middleware'

export async function GET(req: Request) {
  try {
    const {user} = await authMiddleware(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const socios = await fetchSocios(user)
    return NextResponse.json(socios, { status: 200 })
  } catch (error: any) {
    console.error('ERROR al obtener socios:', error.message || error)
    return NextResponse.json({ error: 'Error al obtener socios' }, { status: 500 })
  }
}


export async function POST(req: Request) {

  try {
    const { user } = await authMiddleware(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // 🔍 Log para verificar el contenido recibido desde Postman
    console.log('📝 Datos recibidos para crear socio:', body)

    if (!body.nombre_completo || !body.dni) {
      return NextResponse.json({ error: 'Nombre completo y DNI son obligatorios' }, { status: 400 })
    }

    
    // ✅ Validar si usuario_id existe (si se envía)
    if (body.usuario_id) {
      const { data, error } = await supabase
        .from('usuario')
        .select('id')
        .eq('id', body.usuario_id)

      if (error || !data || data.length === 0) {
        return NextResponse.json({ error: 'usuario_id no existe en la base de datos' }, { status: 400 })
      }
    }

    const creado = await createSocio(body,user)

    return NextResponse.json({
      message: 'Socio creado con éxito',
      data: creado
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ ERROR al crear socio:', error.message || error)
    return NextResponse.json({ error: 'Error al crear socio' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...updateData } = await req.json()
    const { user } = await authMiddleware(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 })
    }

    const actualizado = await updateSocio(id, updateData,user)
    return NextResponse.json({
      message: 'Socio actualizado con éxito',
      data: actualizado
    }, { status: 200 })
  } catch (error: any) {
    const msg = error.message || 'Error al actualizar socio'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const { user } = await authMiddleware(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 })
    }

    await deleteSocio(id,user)
    return NextResponse.json({ message: 'Socio desactivado con éxito' }, { status: 200 })
  } catch (error: any) {
    const msg = error.message || 'Error al desactivar socio'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
