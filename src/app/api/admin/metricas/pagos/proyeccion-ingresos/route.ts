import { authMiddleware } from "@/middlewares/auth.middleware";
import { rolAdminMiddleware } from "@/middlewares/rolAdmin.middleware";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { user } = await authMiddleware(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    //TODO VALIDAR QUE TENGA ROL ADMIN
     const rolAdmin = rolAdminMiddleware(user);
        if (!rolAdmin) {
            return NextResponse.json({ error: "Unauthorized: User no tiene rol de admin" }, { status: 403 });
        }        

    //TODO IMPLEMENTAR LÓGICA DE PROYECCIÓN DE INGRESOS

    return NextResponse.json({ error: "Endpoint no implementado" }, { status: 501 });
}
