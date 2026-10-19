# API Testing Practice Worker

A small [Cloudflare Worker](https://developers.cloudflare.com/workers/) built with **Hono**, **Zod**, and **@hono/zod-openapi** so beginners can practice HTTP clients, status codes, auth headers, and CRUD flows. Every route is defined with `createRoute`, which generates an **OpenAPI 3.0** spec at `/openapi.json` and interactive **Swagger UI** at `/docs`.

**Who it is for:** Anyone learning API testing (curl, Postman, REST Client, automated tests) who wants predictable endpoints and documented responses without setting up a database.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm (comes with Node.js)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) only when you deploy (local dev does not require login)

## Install and run locally

```bash
npm install
npx wrangler dev
```

The dev server defaults to **http://localhost:8787**.

## Deploy

```bash
npx wrangler deploy
```

Wrangler prints the public `*.workers.dev` URL after deploy. Use that host instead of `localhost` in the examples below.

## Swagger UI and Authorize

1. Open **http://localhost:8787/docs** (or visit `/` — it redirects to `/docs`).
2. Browse routes by tag (Methods, Status Codes, Auth, Admin, Todos, Utility).
3. Click **Authorize**, enter `admin-token` or `guest-token` (from `POST /login`), and confirm.
4. Try **GET /admin** or **DELETE /todos/{id}** — the `Authorization: Bearer …` header is sent automatically.

Tokens are fake practice values, not JWTs.

## Route reference

| Method | Path | Description | Status codes |
|--------|------|-------------|--------------|
| GET | `/` | Redirect to Swagger UI | 302 |
| GET | `/docs` | Swagger UI | 200 |
| GET | `/openapi.json` | OpenAPI 3.0 spec | 200 |
| GET | `/get` | Echo GET request | 200, 405 |
| POST | `/post` | Echo POST request | 200, 400, 405 |
| PUT | `/put` | Echo PUT request | 200, 405 |
| PATCH | `/patch` | Echo PATCH request | 200, 405 |
| DELETE | `/delete` | Echo DELETE request | 200, 405 |
| GET | `/status/{code}` | Return a specific HTTP status | 200, 201, 204, 301, 400, 401, 403, 404, 500, 503 |
| GET | `/delay/{seconds}` | Wait 0–5 seconds, then respond | 200, 400 |
| GET | `/health` | Health check | 200 |
| POST | `/login` | Demo login | 200, 400, 401, 403 |
| GET | `/admin` | Admin-only (Bearer token) | 200, 401, 403 |
| GET | `/forbidden` | Always forbidden | 403 |
| GET | `/todos` | List todos | 200 |
| POST | `/todos` | Create todo | 201, 400 |
| GET | `/todos/{id}` | Get one todo | 200, 400, 404 |
| PUT | `/todos/{id}` | Update todo | 200, 400, 404 |
| DELETE | `/todos/{id}` | Delete todo (admin token) | 204, 401, 403, 404 |

Todos live in memory and reset when the Worker restarts.

## curl examples

Set the base URL once:

```bash
BASE=http://localhost:8787
```

### Methods

```bash
curl -s "$BASE/get?foo=bar"
curl -s -X POST "$BASE/post" -H "Content-Type: application/json" -d '{"sample":"hello"}'
curl -s -X PUT "$BASE/put" -H "Content-Type: application/json" -d '{"sample":"hello"}'
curl -s -X PATCH "$BASE/patch" -H "Content-Type: application/json" -d '{"sample":"hello"}'
curl -s -X DELETE "$BASE/delete"
curl -s -X POST "$BASE/get"   # 405 with Allow: GET
```

### Status codes

```bash
curl -s "$BASE/status/200"
curl -s -i "$BASE/status/301"
curl -s "$BASE/status/403"
curl -s -i "$BASE/status/204"
curl -s "$BASE/status/999"    # 400 validation error
```

### Utility

```bash
curl -s "$BASE/health"
curl -s "$BASE/delay/2"
curl -s "$BASE/delay/10"      # 400 — max 5 seconds
```

### Login (all cases)

```bash
# 200 admin
curl -s -X POST "$BASE/login" -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'

# 200 guest
curl -s -X POST "$BASE/login" -H "Content-Type: application/json" \
  -d '{"username":"guest","password":"guest"}'

# 400 missing credentials
curl -s -X POST "$BASE/login" -H "Content-Type: application/json" \
  -d '{"username":"","password":"1234"}'

# 401 invalid credentials
curl -s -X POST "$BASE/login" -H "Content-Type: application/json" \
  -d '{"username":"nobody","password":"wrong"}'

# 403 blocked account
curl -s -X POST "$BASE/login" -H "Content-Type: application/json" \
  -d '{"username":"blocked","password":"1234"}'
```

### Admin — 401 vs 403

```bash
# 401 — no Authorization header
curl -s -i "$BASE/admin"

# 403 — guest token (authenticated but not allowed)
curl -s -i -H "Authorization: Bearer guest-token" "$BASE/admin"

# 200 — admin token
curl -s -H "Authorization: Bearer admin-token" "$BASE/admin"

curl -s "$BASE/forbidden"
```

### Todos

```bash
curl -s "$BASE/todos"
curl -s -X POST "$BASE/todos" -H "Content-Type: application/json" \
  -d '{"title":"Learn curl","completed":false}'
curl -s "$BASE/todos/1"
curl -s -X PUT "$BASE/todos/1" -H "Content-Type: application/json" \
  -d '{"title":"Learn curl","completed":true}'
curl -s -i -X DELETE "$BASE/todos/1" -H "Authorization: Bearer admin-token"
curl -s -i -X DELETE "$BASE/todos/1" -H "Authorization: Bearer guest-token"
```

### OpenAPI and docs

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/openapi.json"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/docs"
curl -s -o /dev/null -w "%{http_code}\n" -L "$BASE/"
```

## How Zod schemas become OpenAPI

1. Schemas live in `src/schemas.ts` and use `.openapi()` for descriptions and examples.
2. Each route uses `createRoute()` from `@hono/zod-openapi` and references those schemas for params, bodies, and responses.
3. `OpenAPIHono` collects every `createRoute` registration and exposes the merged document at `/openapi.json` via `app.doc()`.
4. Swagger UI at `/docs` loads that JSON so you can try requests in the browser.

Validation runs through the same Zod schemas; failures are formatted by `defaultHook` in `src/index.ts` as `{ "error": "Validation failed", "details": [...] }`.

## Project layout

- `src/index.ts` — app setup, CORS, logging, OpenAPI doc, Swagger UI
- `src/schemas.ts` — shared Zod/OpenAPI schemas
- `src/routes/*.ts` — route groups by tag
- `src/middleware/auth.ts` — Bearer token and `requireRole` middleware

## Assumptions (simple defaults)

- Local dev uses Wrangler’s default port **8787** if you do not pass `--port`.
- Login accepts JSON bodies only; empty strings are treated as missing credentials (400).
- `GET /status/{code}` returns JSON for every code except **204** (no body).

See [docs/API.md](docs/API.md) for per-route examples and practice exercises.
