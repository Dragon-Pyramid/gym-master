import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const isAllowedImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
    return NextResponse.json(
      { message: "URL de imagen inválida" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(imageUrl, {
      cache: "force-cache",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "GymMaster-PDF-Image-Proxy/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "No se pudo obtener la imagen" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/png";

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { message: "El recurso no es una imagen" },
        { status: 415 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error en image-proxy:", error);
    return NextResponse.json(
      { message: "Error al obtener la imagen" },
      { status: 500 }
    );
  }
}
