import { NextResponse } from 'next/server';
import {
  fetchUsuarios,
  createUsuarios,
  updateUsuarios,
  deleteUsuarios
} from '@/services/usuarioService';
import { authMiddleware } from '@/middlewares/auth.middleware';

export async function GET(req : Request) {

  try {
    //MIDDLEWARE PARA VERIFICAR QUE VENGA EL TOKEN Y ESTE FIRMADO CON LA CLAVESECRETA
  const {user} = await authMiddleware(req);
  console.log(user);
  
  //PASO EL PAYLOAD DEL USUARIO LOGUEADO AL SERVICIO  
    const usuarios = await fetchUsuarios(user);
    return NextResponse.json({data:usuarios}, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}


//TODO: Implementar dto para que al enviar el response, no se envie el password_hash
export async function POST(req: Request) {
  try {
    const { nombre, email, password } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const creado = await createUsuarios({nombre: nombre.trim(), email: email.trim(), password: password.trim()});
    return NextResponse.json({
      message: 'Usuario creado con éxito',
      data: creado
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...updateData } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID inválido para actualizar' }, { status: 400 });
    }

    const actualizado = await updateUsuarios(id, updateData);
    return NextResponse.json({
      message: 'Usuario actualizado con éxito',
      data: actualizado
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 });
    }

    await deleteUsuarios(id);
    return NextResponse.json({ message: 'Usuario desactivado con éxito' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Error al desactivar usuario' }, { status: 500 });
  }
}
