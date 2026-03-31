import { insertUsageLog } from "@/lib/db/queries";

export async function logUsage(params: {
  apiKeyId: string;
  endpoint: string;
  query?: string | null;
  statusCode: number;
  cached: boolean;
}): Promise<void> {
  await insertUsageLog({
    api_key_id: params.apiKeyId,
    endpoint: params.endpoint,
    query: params.query ?? null,
    status_code: params.statusCode,
    cached: params.cached,
  });
}

export const trackUsage = logUsage;
