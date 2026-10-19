import { createRoute } from '@hono/zod-openapi'
import type { App } from '../app-env'
import { z } from '@hono/zod-openapi'
import {
  ForbiddenStatusSchema,
  StatusCodeParamSchema,
  StatusMessageSchema,
  ValidationErrorResponseSchema,
} from '../schemas'

// GET /status/:code — practice reading different HTTP status codes from responses
const statusRoute = createRoute({
  method: 'get',
  path: '/status/{code}',
  tags: ['Status Codes'],
  summary: 'Return a specific HTTP status',
  description:
    'Responds with the requested status code. Useful for testing clients against common success, redirect, and error codes.',
  request: {
    params: z.object({
      code: StatusCodeParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 200, message: 'OK' },
        },
      },
      description: 'Success response',
    },
    201: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 201, message: 'Created' },
        },
      },
      description: 'Resource created',
    },
    204: {
      description: 'No content',
    },
    301: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 301, message: 'Moved Permanently' },
        },
      },
      description: 'Redirect with Location header',
      headers: {
        Location: {
          schema: { type: 'string' },
          description: 'Redirect target',
        },
      },
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
          example: {
            error: 'Validation failed',
            details: [{ field: 'code', message: 'Invalid enum value' }],
          },
        },
      },
      description: 'Invalid status code parameter',
    },
    401: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 401, message: 'Unauthorized' },
        },
      },
      description: 'Unauthorized example',
    },
    403: {
      content: {
        'application/json': {
          schema: ForbiddenStatusSchema,
          example: {
            error: 'Forbidden',
            message: 'You do not have permission to access this resource',
          },
        },
      },
      description: 'Forbidden example',
    },
    404: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 404, message: 'Not Found' },
        },
      },
      description: 'Not found example',
    },
    500: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 500, message: 'Internal Server Error' },
        },
      },
      description: 'Server error example',
    },
    503: {
      content: {
        'application/json': {
          schema: StatusMessageSchema,
          example: { status: 503, message: 'Service Unavailable' },
        },
      },
      description: 'Service unavailable example',
    },
  },
})

const STATUS_MESSAGES: Record<string, { body?: { status: number; message: string }; location?: string }> =
  {
    '200': { body: { status: 200, message: 'OK' } },
    '201': { body: { status: 201, message: 'Created' } },
    '204': {},
    '301': { body: { status: 301, message: 'Moved Permanently' }, location: '/docs' },
    '400': { body: { status: 400, message: 'Bad Request' } },
    '401': { body: { status: 401, message: 'Unauthorized' } },
    '403': {
      body: undefined,
    },
    '404': { body: { status: 404, message: 'Not Found' } },
    '500': { body: { status: 500, message: 'Internal Server Error' } },
    '503': { body: { status: 503, message: 'Service Unavailable' } },
  }

export function registerStatusRoutes(app: App) {
  app.openapi(statusRoute, (c) => {
    const { code } = c.req.valid('param')
    const numeric = Number(code)

    if (code === '403') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        },
        403
      )
    }

    if (code === '204') {
      return c.body(null, 204)
    }

    const entry = STATUS_MESSAGES[code]
    const body = entry?.body ?? { status: numeric, message: 'Response' }

    if (code === '301' && entry?.location) {
      return c.json(body, 301, { Location: entry.location })
    }

    return c.json(body, numeric as 200)
  })
}
