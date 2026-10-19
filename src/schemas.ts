import { z } from '@hono/zod-openapi'

/** Shared error shape for auth and business errors */
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: 'Invalid credentials' }),
    message: z.string().optional().openapi({ example: 'Additional detail when provided' }),
  })
  .openapi('ErrorResponse')

/** Validation errors from OpenAPIHono defaultHook */
export const ValidationErrorResponseSchema = z
  .object({
    error: z.literal('Validation failed'),
    details: z.array(
      z.object({
        field: z.string().openapi({ example: 'title' }),
        message: z.string().openapi({ example: 'String must contain at least 1 character(s)' }),
      })
    ),
  })
  .openapi('ValidationErrorResponse')

export const MethodEchoSchema = z
  .object({
    method: z.string().openapi({ example: 'GET' }),
    url: z.string().openapi({ example: 'http://localhost:8787/get?foo=bar' }),
    query: z.record(z.string()).openapi({ example: { foo: 'bar' } }),
    headers: z.record(z.string()).openapi({ example: { 'user-agent': 'curl/8.0' } }),
    body: z.unknown().nullable().openapi({ example: null }),
  })
  .openapi('MethodEcho')

export const MethodNotAllowedSchema = z
  .object({
    error: z.literal('Method Not Allowed'),
    message: z.string().openapi({ example: 'POST is not allowed on /get' }),
  })
  .openapi('MethodNotAllowed')

export const StatusCodeParamSchema = z
  .enum(['200', '201', '204', '301', '400', '401', '403', '404', '500', '503'])
  .openapi({
    param: { name: 'code', in: 'path' },
    example: '200',
    description: 'HTTP status code to return from this practice endpoint',
  })

export const StatusMessageSchema = z
  .object({
    status: z.number().int(),
    message: z.string(),
  })
  .openapi('StatusMessage')

export const ForbiddenStatusSchema = z
  .object({
    error: z.literal('Forbidden'),
    message: z.string().openapi({
      example: 'You do not have permission to access this resource',
    }),
  })
  .openapi('ForbiddenStatus')

export const DelayParamSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(5)
  .openapi({
    param: { name: 'seconds', in: 'path' },
    example: 2,
    description: 'Seconds to wait before responding (0–5)',
  })

export const DelayResponseSchema = z
  .object({
    delayed: z.number().int().openapi({ example: 2 }),
    message: z.string().openapi({ example: 'Response after delay' }),
  })
  .openapi('DelayResponse')

export const HealthResponseSchema = z
  .object({
    status: z.literal('ok'),
  })
  .openapi('HealthResponse')

const optionalStringToEmpty = z.preprocess(
  (value) => (value === undefined || value === null ? '' : value),
  z.string()
)

export const LoginRequestSchema = z
  .object({
    username: optionalStringToEmpty.openapi({ example: 'admin', description: 'Practice username' }),
    password: optionalStringToEmpty.openapi({ example: '1234', description: 'Practice password' }),
  })
  .openapi('LoginRequest')

export const LoginResponseSchema = z
  .object({
    token: z.string().openapi({ example: 'admin-token' }),
    role: z.enum(['admin', 'guest']).openapi({ example: 'admin' }),
  })
  .openapi('LoginResponse')

export const LoginRequiredErrorSchema = z
  .object({
    error: z.literal('Username and password are required'),
  })
  .openapi('LoginRequiredError')

export const AdminWelcomeSchema = z
  .object({
    message: z.string().openapi({ example: 'Welcome, admin' }),
  })
  .openapi('AdminWelcome')

export const TodoSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    title: z.string().min(1).openapi({ example: 'Learn API testing' }),
    completed: z.boolean().openapi({ example: false }),
  })
  .openapi('Todo')

export const CreateTodoSchema = z
  .object({
    title: z.string().min(1).openapi({ example: 'Practice POST requests' }),
    completed: z.boolean().optional().openapi({ example: false }),
  })
  .openapi('CreateTodo')

export const TodoListSchema = z.array(TodoSchema).openapi('TodoList')

export const TodoIdParamSchema = z.coerce
  .number()
  .int()
  .positive()
  .openapi({
    param: { name: 'id', in: 'path' },
    example: 1,
  })

export const NotFoundSchema = z
  .object({
    error: z.literal('Not Found'),
    message: z.string().openapi({ example: 'Todo not found' }),
  })
  .openapi('NotFound')

export const UnauthorizedSchema = z
  .object({
    error: z.string().openapi({ example: 'Unauthorized' }),
    message: z.string().optional().openapi({ example: 'Missing or invalid authorization' }),
  })
  .openapi('Unauthorized')

/** Aliases used in route handlers and documentation */
export const ErrorResponse = ErrorResponseSchema
export const LoginRequest = LoginRequestSchema
export const LoginResponse = LoginResponseSchema
export const Todo = TodoSchema
export const CreateTodo = CreateTodoSchema
