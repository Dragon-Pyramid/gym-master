import { signIn } from "@/services/loginService";
import { NextResponse } from "next/server";

export async function POST(req : Request){
try{
    const body = await req.json();
    const { email, password,rol,dbName } = body;
    if (!email || !password || !rol || !dbName) {
        return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }
    const loginSignin = await signIn({email, password,rol,dbName});
    return NextResponse.json({
        message: "Logueado con exito", token : loginSignin},{status: 200});
    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        return NextResponse.json({ message: "Error al iniciar sesión" }, { status: 500 });
    }
    }