import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { AppError } from "@/lib/http/errors";

export type ReadabilityArticle = {
  title: string;
  content: string;
  textContent: string;
};

export function extractReadableContent(url: string, html: string): ReadabilityArticle {
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  if (!article?.content) {
    throw new AppError("Unable to extract readable article content.", 422, "CONTENT_UNAVAILABLE");
  }

  return {
    title: article.title || url,
    content: article.content,
    textContent: article.textContent || "",
  };
}
