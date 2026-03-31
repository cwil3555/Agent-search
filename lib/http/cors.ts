import { NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Expose-Headers": "x-requests-remaining",
};

export function corsHeaders(): Record<string, string> {
  return { ...CORS_HEADERS };
}

export function withCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function buildOptionsResponse(): NextResponse {
  return withCorsHeaders(new NextResponse(null, { status: 204 }));
}

