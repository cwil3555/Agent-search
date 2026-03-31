export type { Database, Json } from "@/lib/db/supabase-types";
import type { Database } from "@/lib/db/supabase-types";

export type ApiKeyRecord = Database["public"]["Tables"]["api_keys"]["Row"];
export type SearchCacheRecord = Database["public"]["Tables"]["search_cache"]["Row"];
export type UsageLogInsert = Database["public"]["Tables"]["usage_logs"]["Insert"];
export type ApiKeyRequestConsumption =
  Database["public"]["Functions"]["consume_api_key_request"]["Returns"][number];

