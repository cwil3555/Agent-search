import { NextRequest } from "next/server";
import { z } from "zod";
import { buildFetchCacheKey, buildResearchCacheKey } from "@/lib/cache/keys";
import { getCache, setCache } from "@/lib/cache/search-cache";
import { braveSearch } from "@/lib/brave/search";
import { fetchHtml } from "@/lib/content/fetch-html";
import { htmlToMarkdown } from "@/lib/content/markdown";
import { extractReadableContent } from "@/lib/content/readability";
import { truncateForAgentContext } from "@/lib/content/truncate";
import { requireApiKey } from "@/lib/auth/require-api-key";
import { buildOptionsResponse, corsHeaders } from "@/lib/http/cors";
import { AppError } from "@/lib/http/errors";
import { jsonError, jsonSuccess } from "@/lib/http/responses";
import { trackUsage } from "@/lib/usage/tracking";
import { DEFAULT_RESEARCH_DEPTH, MAX_RESEARCH_DEPTH } from "@/lib/utils/constants";
import { countWords } from "@/lib/utils/word-count";
import type { ResearchResponse } from "@/types/api";

const bodySchema = z.object({
  query: z.string().trim().min(1, "query is required"),
  depth: z.number().int().min(1).max(MAX_RESEARCH_DEPTH).default(DEFAULT_RESEARCH_DEPTH),
});

export async function OPTIONS(): Promise<Response> {
  return buildOptionsResponse();
}

export async function POST(request: NextRequest): Promise<Response> {
  const endpoint = "/api/v1/research";
  let auth: Awaited<ReturnType<typeof requireApiKey>> | null = null;
  let trackedQuery: string | null = null;

  try {
    auth = await requireApiKey(request);
    const requestBody = bodySchema.parse(await request.json());
    trackedQuery = requestBody.query;

    const researchKey = buildResearchCacheKey(requestBody.query, requestBody.depth);
    const cachedResearch = await getCache<ResearchResponse>("research", researchKey);

    if (cachedResearch) {
      await trackUsage({
        apiKeyId: auth.apiKeyId,
        endpoint,
        query: trackedQuery,
        statusCode: 200,
        cached: true,
      });
      return jsonSuccess(
        { ...cachedResearch, cached: true },
        200,
        {
          ...corsHeaders(),
          "x-requests-remaining": String(auth.requestsRemaining),
        },
      );
    }

    const searchResults = await braveSearch(requestBody.query, requestBody.depth);

    const enriched = await Promise.all(
      searchResults.slice(0, requestBody.depth).map(async (item) => {
        const fetchKey = buildFetchCacheKey(item.url);
        const cachedFetch = await getCache<{
          url: string;
          title: string;
          content: string;
          word_count: number;
          cached: boolean;
        }>("fetch", fetchKey);

        if (cachedFetch) {
          return {
            title: cachedFetch.title || item.title,
            url: item.url,
            snippet: item.snippet,
            content: cachedFetch.content,
            word_count: cachedFetch.word_count,
          };
        }

        try {
          const html = await fetchHtml(item.url);
          const readable = extractReadableContent(item.url, html.html);
          const markdown = truncateForAgentContext(htmlToMarkdown(readable.content));
          const contentPayload = {
            url: item.url,
            title: readable.title || item.title,
            content: markdown,
            word_count: countWords(markdown),
            cached: false,
          };

          await setCache("fetch", fetchKey, contentPayload);
          return {
            title: item.title,
            url: item.url,
            snippet: item.snippet,
            content: markdown,
            word_count: contentPayload.word_count,
          };
        } catch {
          return {
            title: item.title,
            url: item.url,
            snippet: item.snippet,
            content: "Content unavailable for this URL.",
            word_count: 0,
          };
        }
      }),
    );

    const responsePayload: ResearchResponse = {
      query: requestBody.query,
      cached: false,
      results: enriched,
    };

    await setCache("research", researchKey, responsePayload);
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
