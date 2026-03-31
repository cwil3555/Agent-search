import { CACHE_TTL_HOURS } from "@/lib/utils/constants";
import { getCacheRecord, updateCacheHitCount, upsertCacheRecord } from "@/lib/db/queries";
import type { Json } from "@/lib/db/types";

export async function getCache<T>(
  endpoint: "search" | "fetch" | "research",
  queryHash: string,
): Promise<T | null> {
  const record = await getCacheRecord(endpoint, queryHash);
  if (!record) {
    return null;
  }

  // Cache analytics should not fail request execution.
  updateCacheHitCount(record.id, (record.hit_count ?? 0) + 1).catch(() => undefined);

  return record.response_data as T;
}

export async function setCache<T>(
  endpoint: "search" | "fetch" | "research",
  queryHash: string,
  responseData: T,
): Promise<void> {
  await upsertCacheRecord(endpoint, queryHash, responseData as Json, CACHE_TTL_HOURS);
}
