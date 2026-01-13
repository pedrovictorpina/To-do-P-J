/**
 * Tipos relacionados aos To-Dos
 */

export type Priority = 'low' | 'medium' | 'high'
export type Permission = 'view' | 'edit'

export interface Todo {
  id: string
  user_id: string
  title: string
  description?: string
  completed: boolean
  priority: Priority
  due_date?: string
  created_at: string
  updated_at: string
}

export interface CreateTodoRequest {
  title: string
  description?: string
  priority?: Priority
  due_date?: string
}

export interface UpdateTodoRequest {
  title?: string
  description?: string
  completed?: boolean
  priority?: Priority
  due_date?: string
}

export interface TodoShare {
  id: string
  todo_id: string
  owner_id: string
  shared_with_id: string
  permission: Permission
  created_at: string
}

export interface ShareTodoRequest {
  email: string // Email do usuário para compartilhar
  permission?: Permission
}

export interface TodoWithOwner extends Todo {
  owner?: {
    id: string
    email: string
    name?: string
  }
  permission?: Permission
}
