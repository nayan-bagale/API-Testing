import type { OpenAPIHono } from '@hono/zod-openapi'
import type { UserRole } from './middleware/auth'

export type AppEnv = {
  Variables: {
    userRole?: UserRole
  }
}

export type App = OpenAPIHono<AppEnv>
