import { createRoute } from '@hono/zod-openapi'
import type { App } from '../app-env'
import { z } from '@hono/zod-openapi'
import {
  DelayParamSchema,
  DelayResponseSchema,
  HealthResponseSchema,
  ValidationErrorResponseSchema,
} from '../schemas'

// GET /health — quick check that the Worker is running
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Utility'],
  summary: 'Health check',
  description: 'Returns a simple ok status for uptime and smoke tests.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
          example: { status: 'ok' },
        },
      },
      description: 'Service is healthy',
    },
  },
})

// GET /delay/:seconds — practice timeouts and slow responses (0–5 seconds)
const delayRoute = createRoute({
  method: 'get',
  path: '/delay/{seconds}',
  tags: ['Utility'],
  summary: 'Delayed response',
  description: 'Waits for the given number of seconds (0–5) before responding.',
  request: {
    params: z.object({
      seconds: DelayParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DelayResponseSchema,
          example: { delayed: 2, message: 'Response after delay' },
        },
      },
      description: 'Response after waiting',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
          example: {
            error: 'Validation failed',
            details: [{ field: 'seconds', message: 'Number must be less than or equal to 5' }],
          },
        },
      },
      description: 'Seconds out of allowed range',
    },
  },
})

export function registerUtilityRoutes(app: App) {
  app.openapi(healthRoute, (c) => c.json({ status: 'ok' }, 200))

  app.openapi(delayRoute, async (c) => {
    const { seconds } = c.req.valid('param')
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
    return c.json(
      {
        delayed: seconds,
        message: 'Response after delay',
      },
      200
    )
  })
}
