import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export function htmlToMarkdown(html: string): string {
  const markdown = turndown.turndown(html);
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}
