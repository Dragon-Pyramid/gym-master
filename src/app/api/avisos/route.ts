import { NextRequest, NextResponse } from "next/server";
import { getAllAvisos, createAviso } from "@/services/avisoService";

export async function GET() {
  try {
    const avisos = await getAllAvisos();
    return NextResponse.json(avisos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aviso = await createAviso(body);
    return NextResponse.json(aviso, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
