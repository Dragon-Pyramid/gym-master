import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/swagger/openApiSpec";

export const dynamic = "force-dynamic";

// AUTH POLICY: ENV_GATED_DOCUMENTATION

export async function GET() {
  const isProduction = process.env.NODE_ENV === "production";
  const explicitlyExposed =
    process.env.EXPOSE_SWAGGER_DOCUMENTATION === "true";

  if (isProduction && !explicitlyExposed) {
    return NextResponse.json(
      { error: "Not found" },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
