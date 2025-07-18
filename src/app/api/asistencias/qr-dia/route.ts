import { NextResponse } from 'next/server'
import { createQRDiario } from '@/services/asistenciaService'

export async function GET() {
  try {
    //GENERO EL QR DIARIO
    //esto genera un token que se usa para registrar la asistencia del socio
    const { qrCode, url, token } = await createQRDiario();
    return NextResponse.json({ qrCode, url, token })
  } catch (err) {
    console.error('Error al generar el QR:', err)
    return NextResponse.json({ error: 'Error al generar el QR' }, { status: 500 })
  }
}
