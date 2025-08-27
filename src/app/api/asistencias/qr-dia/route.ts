import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { createQRDiario } from '@/services/asistenciaService';

export async function GET(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    //GENERO EL QR DIARIO
    //esto genera un token que se usa para registrar la asistencia del socio
    const { qrCode, url, token } = await createQRDiario();
    return NextResponse.json({ qrCode, url, token });
  } catch (err) {
    console.error('Error al generar el QR:', err);
    return NextResponse.json(
      { error: 'Error al generar el QR' },
      { status: 500 }
    );
  }
}
