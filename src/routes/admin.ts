import { createRoute } from '@hono/zod-openapi'
import type { App } from '../app-env'
import { bindRoute } from '../openapi-bind'
import { requireRole } from '../middleware/auth'
import {
  AdminWelcomeSchema,
  ErrorResponseSchema,
  ForbiddenStatusSchema,
  UnauthorizedSchema,
} from '../schemas'

// GET /admin — practice Bearer tokens and role-based access (admin only)
const adminRoute = createRoute({
  method: 'get',
  path: '/admin',
  tags: ['Admin'],
  summary: 'Admin-only area',
  description: 'Requires Authorization: Bearer admin-token. Guests receive 403; missing auth receives 401.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AdminWelcomeSchema,
          example: { message: 'Welcome, admin' },
        },
      },
      description: 'Admin access granted',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedSchema,
          example: { error: 'Unauthorized', message: 'Missing or invalid authorization' },
        },
      },
      description: 'Missing or invalid Bearer token',
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
      description: 'Authenticated but not allowed (e.g. guest token)',
    },
  },
})

// GET /forbidden — always returns 403 for practicing forbidden responses
const forbiddenRoute = createRoute({
  method: 'get',
  path: '/forbidden',
  tags: ['Admin'],
  summary: 'Always forbidden',
  description: 'Unconditionally returns HTTP 403 with a JSON error body.',
  responses: {
    403: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: {
            error: 'Forbidden',
            message: 'This endpoint is always forbidden for practice',
          },
        },
      },
      description: 'Forbidden',
    },
  },
})

export function registerAdminRoutes(app: App) {
  app.use('/admin', requireRole('admin'))
  bindRoute(app, adminRoute, (c) => c.json({ message: 'Welcome, admin' }, 200))

  app.openapi(forbiddenRoute, (c) =>
    c.json(
      {
        error: 'Forbidden',
        message: 'This endpoint is always forbidden for practice',
      },
      403
    )
  )
}
