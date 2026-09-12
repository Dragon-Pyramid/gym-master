import { NextResponse } from 'next/server';
import {
  createUsuarioServer,
  deactivateUsuarioServer,
  fetchUsuariosServer,
  updateUsuarioServer,
} from '@/services/server/usuarioServerService';
import {
  authorizeDashboardRequest,
  authorizationErrorResponse,
} from '@/lib/auth/serverAuthorization';

export const dynamic = 'force-dynamic';

type UsuarioOperation = 'obtener' | 'crear' | 'actualizar' | 'desactivar';

const USUARIO_VALIDATION_MESSAGES = new Set<string>([
  'Rol inválido',
  'Nombre y email son obligatorios',
  'El DNI es obligatorio para generar la contraseña inicial y vincular el perfil operativo',
  'La contraseña es obligatoria para crear un usuario',
  'ID de usuario requerido',
  'El DNI es obligatorio para crear o vincular el perfil de socio.',
  'El DNI es obligatorio para crear o vincular el perfil de empleado.',
]);

const USUARIO_CONFLICT_MESSAGES = new Set<string>([
  'Ya existe un socio con el mismo DNI o email vinculado a otro usuario. Revisá Socios antes de continuar.',
  'Hay más de un socio sin usuario asociado que coincide con el DNI/email. Unificá esos registros antes de continuar.',
  'Ya existe un empleado con el mismo DNI o email vinculado a otro usuario. Revisá Empleados antes de continuar.',
  'Hay más de un empleado sin usuario asociado que coincide con el DNI/email. Unificá esos registros antes de continuar.',
]);

function usuarioOperationErrorResponse(error: unknown, operation: UsuarioOperation) {
  const message = error instanceof Error ? error.message : '';

  // Compatibilidad con el guard heredado del service.
  // No clasificar errores técnicos mediante búsquedas de texto.
  if (message === 'No autorizado para administrar usuarios') {
    return NextResponse.json(
      { error: 'No autorizado para administrar usuarios' },
      { status: 403 }
    );
  }

  // El alta puede envolver un error de vinculación. Sólo se permite
  // devolver el sufijo si coincide exactamente con un mensaje conocido.
  const prefix =
    'Usuario creado, pero no se pudo crear o vincular el perfil operativo: ';
  const controlledMessage = message.startsWith(prefix)
    ? message.slice(prefix.length)
    : message;

  if (USUARIO_VALIDATION_MESSAGES.has(controlledMessage)) {
    return NextResponse.json(
      { error: controlledMessage },
      { status: 400 }
    );
  }

  if (USUARIO_CONFLICT_MESSAGES.has(controlledMessage)) {
    return NextResponse.json(
      { error: controlledMessage },
      { status: 409 }
    );
  }

  console.error(`Error al ${operation} usuario:`, error);

  const safeMessages: Record<UsuarioOperation, string> = {
    obtener: 'Error al obtener usuarios',
    crear: 'Error al crear usuario',
    actualizar: 'Error al actualizar usuario',
    desactivar: 'Error al desactivar usuario',
  };

  return NextResponse.json(
    { error: safeMessages[operation] },
    { status: 500 }
  );
}


export async function GET(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/usuarios', ['admin']);
    const usuarios = await fetchUsuariosServer(user);
    return NextResponse.json({ data: usuarios }, { status: 200 });
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return usuarioOperationErrorResponse(error, 'obtener');
  }
}

export async function POST(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/usuarios', ['admin']);
    const body = await req.json();
    const {
      nombre,
      email,
      password,
      rol,
      dni,
      foto,
      permisos_menu,
      use_initial_password,
      telefono,
      direccion,
      sexo,
      fecnac,
      ciudad,
      provincia,
      pais,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      fecha_alta,
      puesto,
      area,
      tipo_contratacion,
      turno,
      sueldo_base,
      fecha_inicio,
      fecha_fin,
      horarios_texto,
      observaciones,
    } = body;

    const creado = await createUsuarioServer(user, {
      nombre,
      email,
      password,
      rol,
      dni,
      foto,
      permisos_menu,
      use_initial_password,
      telefono,
      direccion,
      sexo,
      fecnac,
      ciudad,
      provincia,
      pais,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      fecha_alta,
      puesto,
      area,
      tipo_contratacion,
      turno,
      sueldo_base,
      fecha_inicio,
      fecha_fin,
      horarios_texto,
      observaciones,
    });

    return NextResponse.json(
      {
        message: 'Usuario creado con éxito',
        data: creado,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return usuarioOperationErrorResponse(error, 'crear');
  }
}

export async function PUT(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/usuarios', ['admin']);
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
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return usuarioOperationErrorResponse(error, 'actualizar');
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await authorizeDashboardRequest(req, '/dashboard/usuarios', ['admin']);
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
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return usuarioOperationErrorResponse(error, 'desactivar');
  }
}
