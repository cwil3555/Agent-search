import { BRAVE_API_BASE_URL } from "@/lib/utils/constants";
import { AppError } from "@/lib/http/errors";

type BraveWebResult = {
  title?: string;
  url?: string;
  description?: string;
  page_age?: string;
};

type BraveSearchResponse = {
  web?: {
    results?: BraveWebResult[];
  };
};

export type CleanSearchResult = {
  title: string;
  snippet: string;
  url: string;
  published_date: string | null;
};

export async function braveSearch(query: string, numResults: number): Promise<CleanSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new AppError("Missing BRAVE_API_KEY environment variable.", 500, "CONFIG_ERROR");
  }

  const url = new URL(BRAVE_API_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(numResults));

  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    throw new AppError(
      `Brave API request failed with status ${resp.status}.`,
      502,
      "UPSTREAM_ERROR"
    );
  }

  const data = (await resp.json()) as BraveSearchResponse;
  const results = data.web?.results ?? [];

  return results
    .filter((item) => typeof item.url === "string" && item.url.length > 0)
    .map((item) => ({
      title: item.title?.trim() ?? "",
      snippet: item.description?.trim() ?? "",
      url: item.url as string,
      published_date: item.page_age ?? null,
    }));
}

export const searchBrave = braveSearch;
