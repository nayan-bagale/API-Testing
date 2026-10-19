import { createMiddleware } from 'hono/factory'
import type { Context, MiddlewareHandler } from 'hono'
import type { AppEnv } from '../app-env'

export type UserRole = 'admin' | 'guest'

const TOKEN_ROLES: Record<string, UserRole> = {
  'admin-token': 'admin',
  'guest-token': 'guest',
}

export function parseBearerToken(authorization: string | undefined): UserRole | null {
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }
  const token = authorization.slice('Bearer '.length).trim()
  return TOKEN_ROLES[token] ?? null
}

/** Shared token and role check; returns an error response or null when the request may proceed. */
export function roleGuard(c: Context<AppEnv>, role: UserRole): Response | null {
  const authorization = c.req.header('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return c.json(
      { error: 'Unauthorized', message: 'Missing or invalid authorization' },
      401
    )
  }

  const userRole = parseBearerToken(authorization)
  if (!userRole) {
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401)
  }

  if (role === 'admin' && userRole !== 'admin') {
    return c.json(
      {
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      },
      403
    )
  }

  c.set('userRole', userRole)
  return null
}

/** Requires a valid Bearer token with the given role (admin-only routes reject guests with 403). */
export function requireRole(role: UserRole): MiddlewareHandler<AppEnv> {
  return createMiddleware<AppEnv>(async (c, next) => {
    const blocked = roleGuard(c, role)
    if (blocked) {
      return blocked
    }
    await next()
  })
}
