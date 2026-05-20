import { NextResponse } from 'next/server';
import {
  createUsuarioServer,
  deactivateUsuarioServer,
  fetchUsuariosServer,
  updateUsuarioServer,
} from '@/services/server/usuarioServerService';
import { authMiddleware } from '@/middlewares/auth.middleware';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const usuarios = await fetchUsuariosServer(user);
    return NextResponse.json({ data: usuarios }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { nombre, email, password, rol, dni, foto } = await req.json();

    const creado = await createUsuarioServer(user, {
      nombre,
      email,
      password,
      rol,
      dni,
      foto,
    });

    return NextResponse.json(
      {
        message: 'Usuario creado con éxito',
        data: creado,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { id, updateData } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID inválido para actualizar' },
        { status: 400 }
      );
    }

    const actualizado = await updateUsuarioServer(user, id, updateData);
    return NextResponse.json(
      {
        message: 'Usuario actualizado con éxito',
        data: actualizado,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID requerido para eliminar' },
        { status: 400 }
      );
    }

    const desactivado = await deactivateUsuarioServer(user, id);
    return NextResponse.json(
      { message: 'Usuario desactivado con éxito', data: desactivado },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al desactivar usuario' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    );
  }
}
