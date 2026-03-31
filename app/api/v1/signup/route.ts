import { NextRequest } from "next/server";
import { z } from "zod";
import { insertSignup } from "@/lib/db/queries";
import { buildOptionsResponse, corsHeaders } from "@/lib/http/cors";
import { AppError, toAppError } from "@/lib/http/errors";
import { jsonError, jsonSuccess } from "@/lib/http/responses";

const bodySchema = z.object({
  email: z.string().email(),
});

export function OPTIONS() {
  return buildOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new AppError("Invalid payload. Expected { email }.", 400, "BAD_REQUEST");
    }

    const created = await insertSignup(parsed.data.email);
    return jsonSuccess({ ok: true, created }, created ? 201 : 200, corsHeaders());
  } catch (error) {
    return jsonError(toAppError(error), "Unexpected server error.", corsHeaders());
  }
}

