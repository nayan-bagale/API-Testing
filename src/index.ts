import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AppEnv } from './app-env'
import { registerAdminRoutes } from './routes/admin'
import { registerAuthRoutes } from './routes/auth'
import { registerMethodRoutes } from './routes/methods'
import { registerStatusRoutes } from './routes/status'
import { registerTodoRoutes } from './routes/todos'
import { registerUtilityRoutes } from './routes/utility'

const app = new OpenAPIHono<AppEnv>({
  defaultHook: (result, c) => {
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : 'request',
        message: issue.message,
      }))
      return c.json({ error: 'Validation failed', details }, 400)
    }
  },
})

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  })
)

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Use admin-token or guest-token from POST /login',
})

registerMethodRoutes(app)
registerStatusRoutes(app)
registerUtilityRoutes(app)
registerAuthRoutes(app)
registerAdminRoutes(app)
registerTodoRoutes(app)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'API Testing Practice Worker',
    version: '1.0.0',
    description:
      'Practice HTTP methods, status codes, auth, and CRUD with an auto-generated OpenAPI 3.0 spec.',
  },
  servers: [{ url: '/' }],
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

app.get('/', (c) => c.redirect('/docs', 302))

app.notFound((c) =>
  c.json({ error: 'Not Found', message: `No route for ${c.req.path}` }, 404)
)

app.onError((err, c) => {
  console.error(err)
  return c.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    500
  )
})

export default app
