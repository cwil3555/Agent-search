import { MAX_CONTENT_CHARS } from "@/lib/utils/constants";

export function truncateForAgentContext(content: string): string {
  if (content.length <= MAX_CONTENT_CHARS) {
    return content;
  }

  return `${content.slice(0, MAX_CONTENT_CHARS)}\n\n...[truncated]`;
}
