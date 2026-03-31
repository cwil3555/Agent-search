import { AGENT_SEARCH_USER_AGENT, FETCH_TIMEOUT_MS } from "@/lib/utils/constants";
import { AppError } from "@/lib/http/errors";

export type FetchHtmlResult = {
  html: string;
  title: string | null;
};

export async function fetchHtml(url: string): Promise<FetchHtmlResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": AGENT_SEARCH_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (response.status === 403) {
      throw new AppError("Target page denied access (403).", 403, "FORBIDDEN");
    }
    if (response.status === 404) {
      throw new AppError("Target page was not found (404).", 404, "NOT_FOUND");
    }
    if (!response.ok) {
      throw new AppError(`Failed to fetch page (${response.status}).`, 502, "UPSTREAM_ERROR");
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new AppError("URL did not return HTML content.", 422, "UNSUPPORTED_CONTENT");
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || null;
    return { html, title };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("Fetching URL timed out after 10 seconds.", 504, "FETCH_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
