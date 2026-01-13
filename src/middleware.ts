import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware principal da aplicação.
 * Atualiza a sessão do Supabase em cada request.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api-docs (swagger documentation)
     */
    '/((?!_next/static|_next/image|favicon.ico|api-docs).*)',
  ],
}
