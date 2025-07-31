import { authMiddleware } from "@/middlewares/auth.middleware";
import { getSocioById } from "@/services/socioService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {user}= await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = params.id;
    const socio = await getSocioById(id,user);
    return NextResponse.json({ data: socio }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
