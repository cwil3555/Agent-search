-- AgentSearch indexes and helper functions
-- Run after 20260331_001_init_schema.sql

create index if not exists idx_api_keys_email
  on public.api_keys (email);

create index if not exists idx_api_keys_is_active
  on public.api_keys (is_active);

create index if not exists idx_usage_logs_api_key_created_at
  on public.usage_logs (api_key_id, created_at desc);

create index if not exists idx_usage_logs_endpoint_created_at
  on public.usage_logs (endpoint, created_at desc);

create index if not exists idx_search_cache_expires_at
  on public.search_cache (expires_at);

create index if not exists idx_search_cache_endpoint_query_hash
  on public.search_cache (endpoint, query_hash);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.api_keys
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_api_keys_touch_updated_at on public.api_keys;
create trigger trg_api_keys_touch_updated_at
before update on public.api_keys
for each row
execute function public.touch_updated_at();

create or replace function public.consume_api_key_request(raw_key text)
returns table (
  api_key_id uuid,
  is_valid boolean,
  is_over_limit boolean,
  requests_used integer,
  requests_limit integer,
  requests_remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  matched public.api_keys%rowtype;
begin
  select *
  into matched
  from public.api_keys
  where key = raw_key
    and is_active = true
  for update;

  if not found then
    return query
    select
      null::uuid,
      false,
      false,
      0,
      0,
      0;
    return;
  end if;

  if matched.requests_used >= matched.requests_limit then
    return query
    select
      matched.id,
      true,
      true,
      matched.requests_used,
      matched.requests_limit,
      greatest(matched.requests_limit - matched.requests_used, 0);
    return;
  end if;

  update public.api_keys
  set requests_used = requests_used + 1,
      last_used_at = now()
  where id = matched.id
  returning requests_used, requests_limit
  into matched.requests_used, matched.requests_limit;

  return query
  select
    matched.id,
    true,
    false,
    matched.requests_used,
    matched.requests_limit,
    greatest(matched.requests_limit - matched.requests_used, 0);
end;
$$;
