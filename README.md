# AgentSearch

AgentSearch is a Next.js 14 API for AI-agent-friendly web search and content retrieval.

## Environment

Copy `.env.example` to `.env.local` and fill values:

```bash
BRAVE_API_KEY=your_brave_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Migrations

Run these SQL files in order in Supabase SQL editor:

1. `supabase/migrations/20260331_001_init_schema.sql`
2. `supabase/migrations/20260331_002_indexes_and_functions.sql`
3. `supabase/migrations/20260331_003_rls_and_policies.sql`

## Local dev

```bash
npm install
npm run dev
```

## API Endpoints

All `/api/v1/*` endpoints:
- require `x-api-key`
- support CORS (`*`)
- return `x-requests-remaining` header

### `POST /api/v1/search`

Request:
```json
{
  "query": "string",
  "num_results": 5
}
```

Response:
```json
{
  "results": [
    {
      "title": "...",
      "snippet": "...",
      "url": "...",
      "published_date": "..."
    }
  ],
  "cached": false,
  "query": "string"
}
```

### `POST /api/v1/fetch`

Request:
```json
{
  "url": "https://example.com/article"
}
```

Response:
```json
{
  "url": "...",
  "title": "...",
  "content": "markdown string",
  "word_count": 1234,
  "cached": false
}
```

### `POST /api/v1/research`

Request:
```json
{
  "query": "string",
  "depth": 3
}
```

Response:
```json
{
  "query": "...",
  "results": [
    {
      "title": "...",
      "url": "...",
      "snippet": "...",
      "content": "markdown content",
      "word_count": 1234
    }
  ],
  "cached": false
}
```

### `POST /api/v1/signup`

Request:
```json
{
  "email": "you@example.com"
}
```

Response:
```json
{
  "ok": true,
  "created": true
}
```
