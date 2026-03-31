const searchCurl = `curl -X POST https://your-domain.com/api/v1/search \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"query":"latest ai safety papers","num_results":5}'`;

const fetchCurl = `curl -X POST https://your-domain.com/api/v1/fetch \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"url":"https://example.com/article"}'`;

const researchCurl = `curl -X POST https://your-domain.com/api/v1/research \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"query":"open source llm benchmarks","depth":3}'`;

const pythonExample = `import requests

BASE_URL = "https://your-domain.com/api/v1"
HEADERS = {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json",
}

resp = requests.post(
    f"{BASE_URL}/research",
    headers=HEADERS,
    json={"query": "agentic retrieval systems", "depth": 3},
    timeout=20,
)
print(resp.status_code)
print("remaining:", resp.headers.get("x-requests-remaining"))
print(resp.json())
`;

export default function HomePage() {
  return (
    <main className="container">
      <h1>AgentSearch</h1>
      <p>
        AgentSearch is a web search and content retrieval API built for AI
        agents. It combines Brave Search, content extraction, markdown cleanup,
        and 24-hour smart caching into one token-efficient workflow.
      </p>

      <section>
        <h2>Endpoints</h2>
        <ul>
          <li>
            <code>POST /api/v1/search</code> - Brave search with cleaned results
            and 24-hour cache.
          </li>
          <li>
            <code>POST /api/v1/fetch</code> - fetch URL, extract main content,
            convert to markdown, truncate for context windows.
          </li>
          <li>
            <code>POST /api/v1/research</code> - search + auto-fetch top pages
            in one call.
          </li>
        </ul>
        <p>
          All endpoints require <code>x-api-key</code> and return{" "}
          <code>x-requests-remaining</code>.
        </p>
      </section>

      <section>
        <h2>cURL Examples</h2>
        <h3>/api/v1/search</h3>
        <pre>{searchCurl}</pre>
        <h3>/api/v1/fetch</h3>
        <pre>{fetchCurl}</pre>
        <h3>/api/v1/research</h3>
        <pre>{researchCurl}</pre>
      </section>

      <section>
        <h2>Python Example</h2>
        <pre>{pythonExample}</pre>
      </section>

      <section>
        <h2>Get API Key</h2>
        <p>
          Submit your email for API key access. For MVP, keys are generated
          manually after signup.
        </p>
        <p className="muted">
          Send a POST request to <code>/api/v1/signup</code> with{" "}
          <code>{`{"email":"you@example.com"}`}</code>.
        </p>
      </section>
    </main>
  );
}
