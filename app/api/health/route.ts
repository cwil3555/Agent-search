import { NextResponse } from "next/server";
import { withCorsHeaders } from "@/lib/http/cors";

export async function GET(): Promise<Response> {
  const response = NextResponse.json({ ok: true });
  return withCorsHeaders(response);
}

export async function OPTIONS(): Promise<Response> {
  return withCorsHeaders(new NextResponse(null, { status: 204 }));
}

