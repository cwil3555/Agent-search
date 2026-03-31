-- AgentSearch initial schema
-- Run this migration first.

create extension if not exists pgcrypto;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  email text not null,
  created_at timestamptz not null default now(),
  requests_used integer not null default 0,
  requests_limit integer not null default 1000,
  is_active boolean not null default true,
  last_used_at timestamptz null,
  constraint api_keys_requests_used_non_negative check (requests_used >= 0),
  constraint api_keys_requests_limit_positive check (requests_limit > 0)
);

create table if not exists public.usage_logs (
  id bigserial primary key,
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  endpoint text not null,
  query text null,
  created_at timestamptz not null default now(),
  status_code integer not null default 200,
  cached boolean not null default false
);

create table if not exists public.search_cache (
  id uuid primary key default gen_random_uuid(),
  query_hash text not null,
  endpoint text not null,
  response_data jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  hit_count integer not null default 0,
  constraint search_cache_expiry_valid check (expires_at > created_at),
  constraint search_cache_endpoint_query_hash_unique unique (endpoint, query_hash)
);

create table if not exists public.api_key_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  source text not null default 'landing_page',
  notes text null
);
