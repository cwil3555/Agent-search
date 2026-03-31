import { NextResponse } from "next/server";
import { AppError } from "@/lib/http/errors";

type HeaderMap = Record<string, string>;

export function jsonSuccess<T>(data: T, status = 200, headers?: HeaderMap): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers,
  });
}

export function jsonError(
  error: unknown,
  fallbackMessage = "Unexpected server error.",
  headers?: HeaderMap,
): NextResponse<{ error: { code: string; message: string } }> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.status,
        headers,
      },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: fallbackMessage,
      },
    },
    {
      status: 500,
      headers,
    },
  );
}
