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

  const result = await consumeApiKeyRequest(apiKey.trim());

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
