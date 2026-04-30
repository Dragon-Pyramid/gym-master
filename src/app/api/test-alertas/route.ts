import { desactivarSociosPorDeuda, obtenerSociosDeudores } from "@/services/brevoService";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const deudores = await obtenerSociosDeudores();
    const deudoresDesactivados= await desactivarSociosPorDeuda();
   return NextResponse.json({message:"Obteniendo socios con la cuota vencida", data:deudores, message2: "Deudores desactivados", data2: deudoresDesactivados},{status:200});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
