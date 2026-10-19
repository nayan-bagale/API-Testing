import { createRoute } from '@hono/zod-openapi'
import type { App } from '../app-env'
import {
  ErrorResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  LoginRequiredErrorSchema,
  ValidationErrorResponseSchema,
} from '../schemas'

// POST /login — practice authentication flows with fixed demo credentials
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'Demo login',
  description:
    'Authenticates against hard-coded practice users. Use admin/1234 or guest/guest for success tokens.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
          example: { username: 'admin', password: '1234' },
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LoginResponseSchema,
          examples: {
            admin: { value: { token: 'admin-token', role: 'admin' } },
            guest: { value: { token: 'guest-token', role: 'guest' } },
          },
        },
      },
      description: 'Login successful',
    },
    400: {
      content: {
        'application/json': {
          schema: LoginRequiredErrorSchema,
          example: { error: 'Username and password are required' },
        },
      },
      description: 'Missing or empty username/password',
    },
    401: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: { error: 'Invalid credentials' },
        },
      },
      description: 'Unknown username/password combination',
    },
    403: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
          example: {
            error: 'Forbidden',
            message: 'Your account has been blocked. Contact support.',
          },
        },
      },
      description: 'Blocked account',
    },
  },
})

export function registerAuthRoutes(app: App) {
  app.openapi(loginRoute, async (c) => {
    const body = c.req.valid('json')
    const username = body.username.trim()
    const password = body.password.trim()

    if (!username || !password) {
      return c.json(
        { error: 'Username and password are required' as const },
        400
      )
    }

    if (username === 'blocked' && password === '1234') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Your account has been blocked. Contact support.',
        },
        403
      )
    }

    if (username === 'admin' && password === '1234') {
      return c.json({ token: 'admin-token', role: 'admin' as const }, 200)
    }

    if (username === 'guest' && password === 'guest') {
      return c.json({ token: 'guest-token', role: 'guest' as const }, 200)
    }

    return c.json({ error: 'Invalid credentials' }, 401)
  })
}
