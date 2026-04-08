import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { AppError } from "@/lib/http/errors";

export type ReadabilityArticle = {
  title: string;
  content: string;
  textContent: string;
};

export function extractReadableContent(url: string, html: string): ReadabilityArticle {
  const { document } = parseHTML(html);
  const head = document.head ?? document.documentElement;
  const base = document.createElement("base");
  base.setAttribute("href", url);
  head?.prepend(base);

  const article = new Readability(document).parse();

  if (!article?.content) {
    throw new AppError("Unable to extract readable article content.", 422, "CONTENT_UNAVAILABLE");
  }

  return {
    title: article.title || url,
    content: article.content,
    textContent: article.textContent || "",
  };
}
