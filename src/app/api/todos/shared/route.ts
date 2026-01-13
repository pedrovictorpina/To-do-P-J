import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/todos/shared:
 *   get:
 *     summary: Lista to-dos compartilhados comigo
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de to-dos compartilhados
 *       401:
 *         description: Não autenticado
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Buscar compartilhamentos
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: shares, error, count } = await supabase
      .from('todo_shares')
      .select(
        `
        id,
        permission,
        created_at,
        todo:todos (
          id,
          title,
          description,
          completed,
          priority,
          due_date,
          created_at,
          updated_at
        ),
        owner:profiles!todo_shares_owner_id_fkey (
          id,
          email,
          name
        )
      `,
        { count: 'exact' }
      )
      .eq('shared_with_id', user.id)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transformar dados para formato mais amigável
    const todos = shares?.map((share) => ({
      ...share.todo,
      owner: share.owner,
      permission: share.permission,
      share_id: share.id,
      shared_at: share.created_at,
    }))

    return NextResponse.json({
      data: todos,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
