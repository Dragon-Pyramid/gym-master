import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/swagger/openApiSpec";

export const dynamic = "force-static";

// AUTH POLICY: PUBLIC_DOCUMENTATION

export async function GET() {
  return NextResponse.json(openApiSpec);
}
