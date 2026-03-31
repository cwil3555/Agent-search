import { NextRequest } from "next/server";
import { z } from "zod";
import { buildSearchCacheKey } from "@/lib/cache/keys";
import { getCache, setCache } from "@/lib/cache/search-cache";
import { braveSearch } from "@/lib/brave/search";
import { requireApiKey } from "@/lib/auth/require-api-key";
import { buildOptionsResponse, corsHeaders } from "@/lib/http/cors";
import { jsonError, jsonSuccess } from "@/lib/http/responses";
import { AppError } from "@/lib/http/errors";
import { trackUsage } from "@/lib/usage/tracking";

const bodySchema = z.object({
  query: z.string().trim().min(1),
  num_results: z.number().int().min(1).max(10).optional().default(5),
});

export async function OPTIONS(): Promise<Response> {
  return buildOptionsResponse();
}

export async function POST(request: NextRequest): Promise<Response> {
  const endpoint = "/api/v1/search";
  let trackedQuery: string | null = null;
  let auth: Awaited<ReturnType<typeof requireApiKey>> | null = null;

  try {
    auth = await requireApiKey(request);
    const payload = bodySchema.parse(await request.json());
    trackedQuery = payload.query;

    const cacheKey = buildSearchCacheKey(payload.query, payload.num_results);
    const cached = await getCache<{
      results: Array<{
        title: string;
        snippet: string;
        url: string;
        published_date: string | null;
      }>;
      query: string;
      cached: boolean;
    }>(
      "search",
      cacheKey,
    );
    if (cached) {
      await trackUsage({
        apiKeyId: auth.apiKeyId,
        endpoint,
        query: trackedQuery,
        statusCode: 200,
        cached: true,
      });
      return jsonSuccess(
        {
          results: cached.results ?? [],
          cached: true,
          query: payload.query,
        },
        200,
        {
          ...corsHeaders(),
          "x-requests-remaining": String(auth.requestsRemaining),
        },
      );
    }

    const braveResults = await braveSearch(payload.query, payload.num_results);
    const responsePayload = {
      results: braveResults,
      cached: false,
      query: payload.query,
    };

    await setCache("search", cacheKey, responsePayload);
    await trackUsage({
      apiKeyId: auth.apiKeyId,
      endpoint,
      query: trackedQuery,
      statusCode: 200,
      cached: false,
    });
    return jsonSuccess(responsePayload, 200, {
      ...corsHeaders(),
      "x-requests-remaining": String(auth.requestsRemaining),
    });
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : error instanceof z.ZodError
          ? new AppError("Invalid request payload.", 400, "BAD_REQUEST")
          : new AppError("Unexpected server error.", 500, "INTERNAL_ERROR");

    if (auth?.apiKeyId) {
      await trackUsage({
        apiKeyId: auth.apiKeyId,
        endpoint,
        query: trackedQuery,
        statusCode: appError.status,
        cached: false,
      });
    }

    return jsonError(appError, "Unexpected server error.", {
      ...corsHeaders(),
      ...(auth ? { "x-requests-remaining": String(auth.requestsRemaining) } : {}),
    });
  }
}
