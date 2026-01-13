/**
 * Tipos relacionados à autenticação
 */

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface SignUpRequest {
  email: string
  password: string
  name?: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User | null
  error?: string
}

export interface SessionResponse {
  user: User | null
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  } | null
}
