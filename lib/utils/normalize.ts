export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeUrl(inputUrl: string): string {
  try {
    const url = new URL(inputUrl.trim());
    url.hash = "";
    return url.toString();
  } catch {
    return inputUrl.trim();
  }
}
