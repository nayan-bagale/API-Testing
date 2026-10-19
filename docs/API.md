# API reference (practice Worker)

Base URL (local): `http://localhost:8787`

OpenAPI machine-readable spec: `GET /openapi.json`  
Interactive docs: `GET /docs`

---

## Methods

Echo endpoints return what the server received: method, full URL, query object, headers object, and parsed JSON body (when applicable).

### GET /get

**Description:** Practice GET with query parameters and headers.

**Request**

```bash
curl -s "http://localhost:8787/get?search=api"
```

**Response (200)**

```json
{
  "method": "GET",
  "url": "http://localhost:8787/get?search=api",
  "query": { "search": "api" },
  "headers": { "host": "localhost:8787", "user-agent": "curl/8.0" },
  "body": null
}
```

**Status codes:** 200, 405 (wrong HTTP method; includes `Allow` header)

### POST /post

**Request**

```bash
curl -s -X POST http://localhost:8787/post \
  -H "Content-Type: application/json" \
  -d '{"sample":"hello"}'
```

**Response (200):** Same echo shape with `method`: `"POST"` and `body` set to your JSON.

**Status codes:** 200, 400 (invalid JSON when Content-Type is JSON), 405

### PUT /put

Same as POST; use `-X PUT`.

**Status codes:** 200, 405

### PATCH /patch

Same as POST; use `-X PATCH`.

**Status codes:** 200, 405

### DELETE /delete

**Request**

```bash
curl -s -X DELETE http://localhost:8787/delete
```

**Status codes:** 200, 405

---

## Status Codes

### GET /status/{code}

**Description:** Returns a response with the HTTP status you request. Useful for testing client handling of success, redirect, empty body, and errors.

**Allowed `code` values:** `200`, `201`, `204`, `301`, `400`, `401`, `403`, `404`, `500`, `503`

**Examples**

```bash
curl -s http://localhost:8787/status/200
# {"status":200,"message":"OK"}

curl -i http://localhost:8787/status/301
# Location: /docs

curl -i http://localhost:8787/status/204
# empty body

curl -s http://localhost:8787/status/403
# {"error":"Forbidden","message":"You do not have permission to access this resource"}
```

**Status codes:** 200, 201, 204, 301, 400 (invalid code), 401, 403, 404, 500, 503

---

## Utility

### GET /health

**Description:** Simple liveness probe.

**Response (200)**

```json
{ "status": "ok" }
```

### GET /delay/{seconds}

**Description:** Waits `seconds` (integer 0–5), then responds.

**Request**

```bash
curl -s http://localhost:8787/delay/2
```

**Response (200)**

```json
{ "delayed": 2, "message": "Response after delay" }
```

**Status codes:** 200, 400 (seconds outside 0–5)

---

## Auth

### POST /login

**Description:** Demo login with fixed users. Returns a Bearer token string for use on protected routes.

| Username | Password | Result |
|----------|----------|--------|
| admin | 1234 | 200 + `admin-token` |
| guest | guest | 200 + `guest-token` |
| blocked | 1234 | 403 blocked message |
| (other) | (other) | 401 invalid credentials |
| empty / missing | — | 400 username and password required |

**Request (200 admin)**

```bash
curl -s -X POST http://localhost:8787/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

**Response (200)**

```json
{ "token": "admin-token", "role": "admin" }
```

**Response (400)**

```json
{ "error": "Username and password are required" }
```

**Response (401)**

```json
{ "error": "Invalid credentials" }
```

**Response (403)**

```json
{
  "error": "Forbidden",
  "message": "Your account has been blocked. Contact support."
}
```

**Status codes:** 200, 400, 401, 403

---

## Admin

Protected routes expect:

```http
Authorization: Bearer <token>
```

Valid tokens: `admin-token`, `guest-token` (from `/login`).

### GET /admin

**Description:** Admin-only success message. Uses `requireRole('admin')` middleware.

**401 — no header**

```bash
curl -s -i http://localhost:8787/admin
```

**403 — guest token**

```bash
curl -s -i -H "Authorization: Bearer guest-token" http://localhost:8787/admin
```

**200 — admin token**

```bash
curl -s -H "Authorization: Bearer admin-token" http://localhost:8787/admin
```

```json
{ "message": "Welcome, admin" }
```

**Status codes:** 200, 401, 403

### GET /forbidden

**Description:** Always returns 403 for practicing forbidden responses.

**Response (403)**

```json
{
  "error": "Forbidden",
  "message": "This endpoint is always forbidden for practice"
}
```

### 401 vs 403

- **401 Unauthorized:** The client did not authenticate correctly (missing `Authorization`, malformed header, or unknown token).
- **403 Forbidden:** The client authenticated (valid token) but is not allowed to perform the action (for example, `guest-token` on `/admin`, or any user on `/forbidden`).

---

## Todos

In-memory list; data is lost when the Worker restarts.

### GET /todos

**Response (200)**

```json
[
  { "id": 1, "title": "Learn API testing", "completed": false }
]
```

### POST /todos

**Body**

```json
{ "title": "Practice POST requests", "completed": false }
```

**Response (201)**

```json
{ "id": 1, "title": "Practice POST requests", "completed": false }
```

**Status codes:** 201, 400

### GET /todos/{id}

**Status codes:** 200, 400, 404

### PUT /todos/{id}

**Body:** Same as create (`title` required, `completed` optional).

**Status codes:** 200, 400, 404

### DELETE /todos/{id}

**Description:** Requires `admin-token`. Guests receive 403; missing auth receives 401.

**Status codes:** 204, 401, 403, 404

---

## Practice exercises

1. **Methods:** Send the wrong verb to `/get` and assert status 405 and the `Allow` header.
2. **Status codes:** Call `/status/204` and verify an empty body; call `/status/301` and read the `Location` header.
3. **Validation:** POST `/todos` with `{ "title": "" }` and inspect the 400 validation JSON shape.
4. **Auth flow:** Log in as guest, call `GET /admin`, and confirm 403 (not 401).
5. **CRUD:** Create two todos, update one with PUT, delete one with admin token, list remaining items.
6. **Delay:** Time a request to `/delay/3` and compare with `/delay/0`.
7. **OpenAPI:** Download `/openapi.json` and confirm every route you used appears with the correct status codes.
8. **Swagger:** Authorize with `admin-token` in `/docs` and execute `DELETE /todos/{id}` from the UI.
9. **CORS:** From a browser devtools fetch on another origin, confirm preflight OPTIONS succeeds with `Authorization` allowed.
10. **Errors:** Hit an unknown path and read the JSON 404 from `app.notFound`.
