import { authMiddleware } from '@/middlewares/auth.middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionPago } from '@/services/stripeService';

export async function POST(req: NextRequest) {
try{
    //SACO USUARIO DE LA SESION
    const{user} = await authMiddleware(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    //INGRESO A LA CREACION DE LA SESION DE PAGO
    const session = await createSessionPago(user);
    
  return NextResponse.json({ url: session.url });
  }catch (error: any) {
    console.error('Error al crear la sesión de pago:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

}
