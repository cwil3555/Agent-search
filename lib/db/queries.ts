import { getSupabaseAdmin } from "@/lib/db/supabase-admin";
import type {
  ApiKeyRecord,
  ApiKeyRequestConsumption,
  Json,
  SearchCacheRecord,
  UsageLogInsert,
} from "@/lib/db/types";

export async function consumeApiKeyRequest(rawKey: string): Promise<ApiKeyRequestConsumption> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc("consume_api_key_request", {
    raw_key: rawKey,
  });

  if (error) {
    throw error;
  }

  const row = data?.[0] as
    | {
        api_key_id: string | null;
        is_valid: boolean;
        is_over_limit: boolean;
        requests_used: number;
        requests_limit: number;
        requests_remaining: number;
      }
    | undefined;

  if (!row) {
    return {
      api_key_id: null,
      is_valid: false,
      is_over_limit: false,
      requests_used: 0,
      requests_limit: 0,
      requests_remaining: 0,
    };
  }

  return {
    api_key_id: row.api_key_id,
    is_valid: row.is_valid,
    is_over_limit: row.is_over_limit,
    requests_used: row.requests_used,
    requests_limit: row.requests_limit,
    requests_remaining: row.requests_remaining,
  };
}

export async function getApiKeyByValue(rawKey: string): Promise<ApiKeyRecord | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("key", rawKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ApiKeyRecord | null;
}

export async function insertUsageLog(row: UsageLogInsert) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("usage_logs").insert(row);
  if (error) {
    throw error;
  }
}

export async function getCacheRecord(
  endpoint: string,
  queryHash: string
): Promise<SearchCacheRecord | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("search_cache")
    .select("*")
    .eq("endpoint", endpoint)
    .eq("query_hash", queryHash)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as SearchCacheRecord | null;
}

export async function upsertCacheRecord(
  endpoint: string,
  queryHash: string,
  responseData: Json,
  ttlHours: number
) {
  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  const { error } = await supabaseAdmin.from("search_cache").upsert(
    {
      endpoint,
      query_hash: queryHash,
      response_data: responseData,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    },
    { onConflict: "endpoint,query_hash" }
  );

  if (error) {
    throw error;
  }
}

export async function updateCacheHitCount(id: string, hitCount: number): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("search_cache")
    .update({ hit_count: hitCount })
    .eq("id", id);
  if (error) throw error;
}

export async function insertSignup(email: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("api_key_signups").insert({
    email: email.toLowerCase().trim(),
  });
  if (error) {
    if ("code" in error && error.code === "23505") {
      return false;
    }
    throw error;
  }
  return true;
}
