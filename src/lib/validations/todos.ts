import { z } from 'zod'

/**
 * Schema de validação para criação de to-do
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().datetime().optional(),
})

/**
 * Schema de validação para atualização de to-do
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres')
    .optional(),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .nullable()
    .optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().nullable().optional(),
})

/**
 * Schema de validação para compartilhamento de to-do
 */
export const shareTodoSchema = z.object({
  email: z.string().email('Email inválido'),
  permission: z.enum(['view', 'edit']).default('view'),
})

/**
 * Schema para query params de listagem
 */
export const listTodosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  completed: z.enum(['true', 'false']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

// Tipos inferidos dos schemas
export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
export type ShareTodoInput = z.infer<typeof shareTodoSchema>
export type ListTodosQuery = z.infer<typeof listTodosQuerySchema>
