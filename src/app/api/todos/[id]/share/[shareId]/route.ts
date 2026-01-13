import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  params: Promise<{ id: string; shareId: string }>
}

/**
 * @swagger
 * /api/todos/{id}/share/{shareId}:
 *   delete:
 *     summary: Remove um compartilhamento
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do to-do
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do compartilhamento
 *     responses:
 *       200:
 *         description: Compartilhamento removido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Compartilhamento não encontrado
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id, shareId } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é dono do to-do
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .select('user_id')
      .eq('id', id)
      .single()

    if (todoError || !todo) {
      return NextResponse.json(
        { error: 'To-do não encontrado' },
        { status: 404 }
      )
    }

    // Buscar compartilhamento
    const { data: share, error: shareError } = await supabase
      .from('todo_shares')
      .select('*')
      .eq('id', shareId)
      .eq('todo_id', id)
      .single()

    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Compartilhamento não encontrado' },
        { status: 404 }
      )
    }

    // Pode remover se for dono OU se for a pessoa com quem foi compartilhado
    if (todo.user_id !== user.id && share.shared_with_id !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para remover este compartilhamento' },
        { status: 403 }
      )
    }

    // Remover compartilhamento
    const { error } = await supabase
      .from('todo_shares')
      .delete()
      .eq('id', shareId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Compartilhamento removido com sucesso' })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/todos/{id}/share/{shareId}:
 *   patch:
 *     summary: Atualiza permissão de um compartilhamento
 *     tags: [Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do to-do
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do compartilhamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [view, edit]
 *     responses:
 *       200:
 *         description: Permissão atualizada
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Compartilhamento não encontrado
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, shareId } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { permission } = body

    if (!permission || !['view', 'edit'].includes(permission)) {
      return NextResponse.json(
        { error: 'Permissão inválida. Use "view" ou "edit"' },
        { status: 400 }
      )
    }

    // Verificar se é dono do to-do
    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .select('user_id')
      .eq('id', id)
      .single()

    if (todoError || !todo) {
      return NextResponse.json(
        { error: 'To-do não encontrado' },
        { status: 404 }
      )
    }

    if (todo.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o dono pode alterar permissões' },
        { status: 403 }
      )
    }

    // Atualizar permissão
    const { data: share, error } = await supabase
      .from('todo_shares')
      .update({ permission })
      .eq('id', shareId)
      .eq('todo_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!share) {
      return NextResponse.json(
        { error: 'Compartilhamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: share })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
