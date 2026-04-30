import { authMiddleware } from "@/middlewares/auth.middleware";
import {  historialRutinaSocioLogueado } from "@/services/rutinaService";
import { NextResponse } from "next/server";

export async function GET(req:Request){
const {user} = await authMiddleware(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
const historialRutina =  await historialRutinaSocioLogueado(user);
    return NextResponse.json(historialRutina, { status: 200 });

}