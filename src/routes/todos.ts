import { createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import type { App } from '../app-env'
import { roleGuard } from '../middleware/auth'
import {
  CreateTodoSchema,
  ForbiddenStatusSchema,
  NotFoundSchema,
  TodoListSchema,
  TodoSchema,
  UnauthorizedSchema,
  ValidationErrorResponseSchema,
} from '../schemas'

export type Todo = z.infer<typeof TodoSchema>

const todos: Todo[] = []
let nextId = 1

function findTodo(id: number): Todo | undefined {
  return todos.find((todo) => todo.id === id)
}

// GET /todos — list all in-memory todos
const listTodosRoute = createRoute({
  method: 'get',
  path: '/todos',
  tags: ['Todos'],
  summary: 'List todos',
  description: 'Returns every todo stored in memory (resets when the Worker restarts).',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoListSchema,
          example: [{ id: 1, title: 'Learn API testing', completed: false }],
        },
      },
      description: 'Array of todos',
    },
  },
})

// POST /todos — create a todo
const createTodoRoute = createRoute({
  method: 'post',
  path: '/todos',
  tags: ['Todos'],
  summary: 'Create todo',
  description: 'Adds a new todo with a generated id.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTodoSchema,
          example: { title: 'Practice POST requests', completed: false },
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: TodoSchema,
          example: { id: 1, title: 'Practice POST requests', completed: false },
        },
      },
      description: 'Todo created',
    },
    400: {
      content: {
        'application/json': {
          schema: ValidationErrorResponseSchema,
          example: {
            error: 'Validation failed',
            details: [{ field: 'title', message: 'String must contain at least 1 character(s)' }],
          },
        },
      },
      description: 'Validation error',
    },
  },
})

// GET /todos/:id — fetch one todo by id
const getTodoRoute = createRoute({
  method: 'get',
  path: '/todos/{id}',
  tags: ['Todos'],
  summary: 'Get todo by id',
  description: 'Returns a single todo or 404 if the id does not exist.',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({
        param: { name: 'id', in: 'path' },
        example: 1,
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoSchema,
          example: { id: 1, title: 'Learn API testing', completed: false },
        },
      },
      description: 'Todo found',
    },
    400: {
      content: { 'application/json': { schema: ValidationErrorResponseSchema } },
      description: 'Invalid id',
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundSchema,
          example: { error: 'Not Found', message: 'Todo not found' },
        },
      },
      description: 'Todo not found',
    },
  },
})

// PUT /todos/:id — replace todo fields
const updateTodoRoute = createRoute({
  method: 'put',
  path: '/todos/{id}',
  tags: ['Todos'],
  summary: 'Update todo',
  description: 'Updates title and completed flag for an existing todo.',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({
        param: { name: 'id', in: 'path' },
        example: 1,
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: CreateTodoSchema,
          example: { title: 'Updated title', completed: true },
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TodoSchema,
          example: { id: 1, title: 'Updated title', completed: true },
        },
      },
      description: 'Todo updated',
    },
    400: {
      content: { 'application/json': { schema: ValidationErrorResponseSchema } },
      description: 'Validation error',
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundSchema,
          example: { error: 'Not Found', message: 'Todo not found' },
        },
      },
      description: 'Todo not found',
    },
  },
})

// DELETE /todos/:id — remove a todo (admin token required)
const deleteTodoRoute = createRoute({
  method: 'delete',
  path: '/todos/{id}',
  tags: ['Todos'],
  summary: 'Delete todo',
  description: 'Deletes a todo. Requires admin Bearer token.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({
        param: { name: 'id', in: 'path' },
        example: 1,
      }),
    }),
  },
  responses: {
    204: {
      description: 'Todo deleted',
    },
    401: {
      content: {
        'application/json': {
          schema: UnauthorizedSchema,
          example: { error: 'Unauthorized', message: 'Missing or invalid authorization' },
        },
      },
      description: 'Missing or invalid token',
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
      description: 'Guest token not allowed to delete',
    },
    404: {
      content: {
        'application/json': {
          schema: NotFoundSchema,
          example: { error: 'Not Found', message: 'Todo not found' },
        },
      },
      description: 'Todo not found',
    },
  },
})

export function registerTodoRoutes(app: App) {
  app.openapi(listTodosRoute, (c) => c.json(todos, 200))

  app.openapi(createTodoRoute, (c) => {
    const input = c.req.valid('json')
    const todo: Todo = {
      id: nextId++,
      title: input.title,
      completed: input.completed ?? false,
    }
    todos.push(todo)
    return c.json(todo, 201)
  })

  app.openapi(getTodoRoute, (c) => {
    const { id } = c.req.valid('param')
    const todo = findTodo(id)
    if (!todo) {
      return c.json({ error: 'Not Found', message: 'Todo not found' }, 404)
    }
    return c.json(todo, 200)
  })

  app.openapi(updateTodoRoute, (c) => {
    const { id } = c.req.valid('param')
    const todo = findTodo(id)
    if (!todo) {
      return c.json({ error: 'Not Found', message: 'Todo not found' }, 404)
    }
    const input = c.req.valid('json')
    todo.title = input.title
    todo.completed = input.completed ?? todo.completed
    return c.json(todo, 200)
  })

  app.openapi(deleteTodoRoute, (c) => {
    const blocked = roleGuard(c, 'admin')
    if (blocked) {
      return blocked
    }
    const { id } = c.req.valid('param')
    const index = todos.findIndex((todo) => todo.id === id)
    if (index === -1) {
      return c.json({ error: 'Not Found', message: 'Todo not found' }, 404)
    }
    todos.splice(index, 1)
    return c.body(null, 204)
  })
}
