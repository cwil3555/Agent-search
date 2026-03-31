import { NextRequest } from "next/server";
import { consumeApiKeyRequest } from "@/lib/db/queries";
import { AppError } from "@/lib/http/errors";

export type AuthContext = {
  apiKeyId: string;
  requestsRemaining: number;
};

export async function requireApiKey(request: NextRequest): Promise<AuthContext> {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    throw new AppError("Missing x-api-key header.", 401, "UNAUTHORIZED");
  }

  let result: Awaited<ReturnType<typeof consumeApiKeyRequest>>;
  try {
    result = await consumeApiKeyRequest(apiKey.trim());
  } catch (error) {
    const details =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    throw new AppError(
      `Supabase auth check failed: ${details}`,
      500,
      "SUPABASE_AUTH_CHECK_FAILED",
    );
  }

  if (!result.is_valid || !result.api_key_id) {
    throw new AppError("Invalid API key.", 401, "UNAUTHORIZED");
  }

  if (result.is_over_limit) {
    throw new AppError("Request limit exceeded.", 429, "RATE_LIMIT_EXCEEDED");
  }

  return {
    apiKeyId: result.api_key_id,
    requestsRemaining: result.requests_remaining,
  };
}
