import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { shareTodoSchema } from '@/lib/validations/todos'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/todos/{id}/share:
 *   get:
 *     summary: Lista usuários com quem o to-do foi compartilhado
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
 *     responses:
 *       200:
 *         description: Lista de compartilhamentos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas o dono pode ver)
 *       404:
 *         description: To-do não encontrado
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
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

    if (todo.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o dono pode ver os compartilhamentos' },
        { status: 403 }
      )
    }

    // Buscar compartilhamentos com dados do usuário
    const { data: shares, error } = await supabase
      .from('todo_shares')
      .select(
        `
        id,
        permission,
        created_at,
        shared_with:profiles!todo_shares_shared_with_id_fkey (
          id,
          email,
          name
        )
      `
      )
      .eq('todo_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: shares })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/todos/{id}/share:
 *   post:
 *     summary: Compartilha um to-do com outro usuário
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário para compartilhar
 *                 example: amigo@exemplo.com
 *               permission:
 *                 type: string
 *                 enum: [view, edit]
 *                 default: view
 *                 description: Permissão do usuário
 *     responses:
 *       201:
 *         description: Compartilhamento criado
 *       400:
 *         description: Dados inválidos ou já compartilhado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas o dono pode compartilhar)
 *       404:
 *         description: To-do ou usuário não encontrado
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()

    // Validação
    const validation = shareTodoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, permission } = validation.data

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
        { error: 'Apenas o dono pode compartilhar este to-do' },
        { status: 403 }
      )
    }

    // Buscar usuário pelo email
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Não pode compartilhar consigo mesmo
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'Você não pode compartilhar consigo mesmo' },
        { status: 400 }
      )
    }

    // Criar compartilhamento
    const { data: share, error } = await supabase
      .from('todo_shares')
      .insert({
        todo_id: id,
        owner_id: user.id,
        shared_with_id: targetUser.id,
        permission,
      })
      .select(
        `
        id,
        permission,
        created_at,
        shared_with:profiles!todo_shares_shared_with_id_fkey (
          id,
          email,
          name
        )
      `
      )
      .single()

    if (error) {
      // Já compartilhado
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'To-do já foi compartilhado com este usuário' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'To-do compartilhado com sucesso', data: share },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
