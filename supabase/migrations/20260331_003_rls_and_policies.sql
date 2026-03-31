-- AgentSearch RLS and policies
-- Run after 20260331_002_indexes_and_functions.sql

alter table public.api_keys enable row level security;
alter table public.usage_logs enable row level security;
alter table public.search_cache enable row level security;
alter table public.api_key_signups enable row level security;

-- All API access uses SUPABASE_SERVICE_KEY from server-side routes.
-- Keep tables locked down for anon/authenticated roles.
revoke all on table public.api_keys from anon, authenticated;
revoke all on table public.usage_logs from anon, authenticated;
revoke all on table public.search_cache from anon, authenticated;
revoke all on table public.api_key_signups from anon, authenticated;

revoke all on function public.consume_api_key_request(text) from anon, authenticated;

-- Optional permissive policy for service_role compatibility in hosted Supabase.
-- service_role bypasses RLS in practice, but policy remains explicit.
drop policy if exists service_role_all_api_keys on public.api_keys;
create policy service_role_all_api_keys
on public.api_keys
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_usage_logs on public.usage_logs;
create policy service_role_all_usage_logs
on public.usage_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_search_cache on public.search_cache;
create policy service_role_all_search_cache
on public.search_cache
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_api_key_signups on public.api_key_signups;
create policy service_role_all_api_key_signups
on public.api_key_signups
for all
to service_role
using (true)
with check (true);
