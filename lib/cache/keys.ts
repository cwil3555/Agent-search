import { sha256Hex } from "@/lib/utils/hash";
import { normalizeQuery, normalizeUrl } from "@/lib/utils/normalize";

export function buildSearchCacheKey(query: string, numResults: number): string {
  const normalized = normalizeQuery(query);
  return sha256Hex(`search|${normalized}|${numResults}`);
}

export function buildFetchCacheKey(url: string): string {
  const normalized = normalizeUrl(url);
  return sha256Hex(`fetch|${normalized}`);
}

export function buildResearchCacheKey(query: string, depth: number): string {
  const normalized = normalizeQuery(query);
  return sha256Hex(`research|${normalized}|${depth}`);
}
