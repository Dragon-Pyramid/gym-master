import { authMiddleware } from "@/middlewares/auth.middleware";
import { createEvolucionSocio } from "@/services/evolucionSocioService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const { user } = await authMiddleware(req);

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		if (
			!body.peso ||
			!body.cintura ||
			!body.bicep ||
			!body.tricep ||
			!body.pierna ||
			!body.gluteos ||
			!body.pantorrilla ||
			!body.altura ||
			!body.observaciones
		) {
			return NextResponse.json(
				{ error: "Debe cargar todos los campos" },
				{ status: 400 }
			);
		}

		if (!user.id_socio) {
			return NextResponse.json(
				{ error: "El usuario no tiene un socio asociado" },
				{ status: 400 }
			);
		}

		const evolucion = await createEvolucionSocio(
			{ ...body, socio_id: user.id_socio },
			user
		);

		return NextResponse.json({ data: evolucion }, { status: 201 });
	} catch (error: any) {
		console.log(error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}