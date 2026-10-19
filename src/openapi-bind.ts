import type { RouteConfig } from '@hono/zod-openapi'
import type { Handler } from 'hono'
import type { App, AppEnv } from './app-env'

/**
 * Registers an OpenAPI route when the handler's return type is narrower than
 * every declared response (for example 200-only handlers that also document 405).
 */
export function bindRoute<R extends RouteConfig>(
  app: App,
  route: R,
  handler: Handler<AppEnv, string>
): void {
  app.openapi(route, handler as Parameters<App['openapi']>[1])
}
