import { createRoute } from '@hono/zod-openapi'
import type { App } from '../app-env'
import { bindRoute } from '../openapi-bind'
import type { Context } from 'hono'
import { z } from '@hono/zod-openapi'
import {
  MethodEchoSchema,
  MethodNotAllowedSchema,
  ValidationErrorResponseSchema,
} from '../schemas'

async function echoRequest(c: Context) {
  let body: unknown = null
  const contentType = c.req.header('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      body = await c.req.json()
    } catch {
      body = null
    }
  } else if (c.req.method !== 'GET' && c.req.method !== 'DELETE') {
    try {
      body = await c.req.text()
    } catch {
      body = null
    }
  }

  const headers: Record<string, string> = {}
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value
  })

  const url = new URL(c.req.url)
  const query: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    query[key] = value
  })

  return c.json(
    {
      method: c.req.method,
      url: c.req.url,
      query,
      headers,
      body,
    },
    200
  )
}

const echoResponses = {
  200: {
    content: { 'application/json': { schema: MethodEchoSchema } },
    description: 'Echo of the incoming request',
  },
  405: {
    content: { 'application/json': { schema: MethodNotAllowedSchema } },
    description: 'HTTP method not allowed for this path',
  },
}

const optionalJsonBody = z
  .object({
    sample: z.string().optional(),
  })
  .optional()
  .openapi({ example: { sample: 'hello' } })

// GET /get — practice reading query strings and headers on a GET request
const getRoute = createRoute({
  method: 'get',
  path: '/get',
  tags: ['Methods'],
  summary: 'GET echo',
  description: 'Returns method, URL, query, headers, and body for GET requests.',
  responses: echoResponses,
})

// POST /post — practice sending JSON bodies with POST
const postRoute = createRoute({
  method: 'post',
  path: '/post',
  tags: ['Methods'],
  summary: 'POST echo',
  description: 'Echoes a POST request including JSON body when provided.',
  request: {
    body: {
      content: { 'application/json': { schema: optionalJsonBody } },
      required: false,
    },
  },
  responses: {
    ...echoResponses,
    400: {
      content: { 'application/json': { schema: ValidationErrorResponseSchema } },
      description: 'Invalid JSON body',
    },
  },
})

// PUT /put — practice full resource updates with PUT
const putRoute = createRoute({
  method: 'put',
  path: '/put',
  tags: ['Methods'],
  summary: 'PUT echo',
  description: 'Echoes a PUT request and any JSON body.',
  request: {
    body: {
      content: { 'application/json': { schema: optionalJsonBody } },
      required: false,
    },
  },
  responses: echoResponses,
})

// PATCH /patch — practice partial updates with PATCH
const patchRoute = createRoute({
  method: 'patch',
  path: '/patch',
  tags: ['Methods'],
  summary: 'PATCH echo',
  description: 'Echoes a PATCH request and any JSON body.',
  request: {
    body: {
      content: { 'application/json': { schema: optionalJsonBody } },
      required: false,
    },
  },
  responses: echoResponses,
})

// DELETE /delete — practice DELETE without a response body requirement
const deleteRoute = createRoute({
  method: 'delete',
  path: '/delete',
  tags: ['Methods'],
  summary: 'DELETE echo',
  description: 'Echoes a DELETE request metadata.',
  responses: echoResponses,
})

const METHOD_PATHS: { path: string; allow: string }[] = [
  { path: '/get', allow: 'GET' },
  { path: '/post', allow: 'POST' },
  { path: '/put', allow: 'PUT' },
  { path: '/patch', allow: 'PATCH' },
  { path: '/delete', allow: 'DELETE' },
]

const DISALLOWED = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

export function registerMethodRoutes(app: App) {
  bindRoute(app, getRoute, echoRequest)
  bindRoute(app, postRoute, echoRequest)
  bindRoute(app, putRoute, echoRequest)
  bindRoute(app, patchRoute, echoRequest)
  bindRoute(app, deleteRoute, echoRequest)

  for (const { path, allow } of METHOD_PATHS) {
    const wrongMethods = DISALLOWED.filter((m) => m !== allow)
    for (const method of wrongMethods) {
      app.on([method], path, (c) =>
        c.json(
          {
            error: 'Method Not Allowed',
            message: `${method} is not allowed on ${path}`,
          },
          405,
          { Allow: allow }
        )
      )
    }
  }
}
