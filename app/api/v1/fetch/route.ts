import { NextRequest } from "next/server";
import { z } from "zod";
import { buildFetchCacheKey } from "@/lib/cache/keys";
import { getCache, setCache } from "@/lib/cache/search-cache";
import { fetchHtml } from "@/lib/content/fetch-html";
import { htmlToMarkdown } from "@/lib/content/markdown";
import { extractReadableContent } from "@/lib/content/readability";
import { truncateForAgentContext } from "@/lib/content/truncate";
import { requireApiKey } from "@/lib/auth/require-api-key";
import { buildOptionsResponse, corsHeaders } from "@/lib/http/cors";
import { AppError, toAppError } from "@/lib/http/errors";
import { jsonError, jsonSuccess } from "@/lib/http/responses";
import { normalizeUrl } from "@/lib/utils/normalize";
import { countWords } from "@/lib/utils/word-count";
import { logUsage } from "@/lib/usage/tracking";
import { FETCH_CACHE_ENDPOINT } from "@/lib/utils/constants";

const bodySchema = z.object({
  url: z.string().url(),
});

type FetchResponse = {
  url: string;
  title: string;
  content: string;
  word_count: number;
  cached: boolean;
};

export async function OPTIONS() {
  return buildOptionsResponse();
}

export async function POST(request: NextRequest) {
  let auth: Awaited<ReturnType<typeof requireApiKey>> | null = null;
  let trackedUrl: string | null = null;

  try {
    auth = await requireApiKey(request);
    const payload = bodySchema.parse(await request.json());
    trackedUrl = normalizeUrl(payload.url);
    const cacheKey = buildFetchCacheKey(trackedUrl);

    const cached = await getCache<FetchResponse>(FETCH_CACHE_ENDPOINT, cacheKey);
    if (cached) {
      await logUsage({
        apiKeyId: auth.apiKeyId,
        endpoint: "/api/v1/fetch",
        query: trackedUrl,
        statusCode: 200,
        cached: true,
      });
      return jsonSuccess(
        { ...cached, cached: true },
        200,
        {
          ...corsHeaders(),
          "x-requests-remaining": String(auth.requestsRemaining),
        },
      );
    }

    const html = await fetchHtml(trackedUrl);
    const article = extractReadableContent(trackedUrl, html.html);
    const markdown = htmlToMarkdown(article.content);
    const content = truncateForAgentContext(markdown);
    const responsePayload: FetchResponse = {
      url: trackedUrl,
      title: article.title || html.title || trackedUrl,
      content,
      word_count: countWords(content),
      cached: false,
    };

    await setCache(FETCH_CACHE_ENDPOINT, cacheKey, responsePayload);
    await logUsage({
      apiKeyId: auth.apiKeyId,
      endpoint: "/api/v1/fetch",
      query: trackedUrl,
      statusCode: 200,
      cached: false,
    });

    return jsonSuccess(responsePayload, 200, {
      ...corsHeaders(),
      "x-requests-remaining": String(auth.requestsRemaining),
    });
  } catch (error) {
    const appError =
      error instanceof z.ZodError
        ? new AppError("Invalid request payload. Expected { url: string }.", 400, "BAD_REQUEST")
        : toAppError(error);

    if (auth?.apiKeyId) {
      await logUsage({
        apiKeyId: auth.apiKeyId,
        endpoint: "/api/v1/fetch",
        query: trackedUrl,
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
