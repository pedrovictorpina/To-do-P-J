import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTodoSchema } from '@/lib/validations/todos'

type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: Busca um to-do específico
 *     tags: [Todos]
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
 *         description: Dados do to-do
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
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

    // Buscar to-do (RLS garante acesso apenas aos próprios ou compartilhados)
    const { data: todo, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !todo) {
      return NextResponse.json(
        { error: 'To-do não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é dono ou se foi compartilhado com ele
    if (todo.user_id !== user.id) {
      const { data: share } = await supabase
        .from('todo_shares')
        .select('*')
        .eq('todo_id', id)
        .eq('shared_with_id', user.id)
        .single()

      if (!share) {
        return NextResponse.json(
          { error: 'Sem permissão para acessar este to-do' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ data: todo })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Atualiza um to-do
 *     tags: [Todos]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               completed:
 *                 type: boolean
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: To-do atualizado
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: To-do não encontrado
 */
export async function PUT(request: Request, { params }: RouteParams) {
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

    // Validação com Zod
    const validation = updateTodoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Verificar se to-do existe e usuário tem acesso
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTodo) {
      return NextResponse.json(
        { error: 'To-do não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão de edição
    if (existingTodo.user_id !== user.id) {
      const { data: share } = await supabase
        .from('todo_shares')
        .select('*')
        .eq('todo_id', id)
        .eq('shared_with_id', user.id)
        .eq('permission', 'edit')
        .single()

      if (!share) {
        return NextResponse.json(
          { error: 'Sem permissão para editar este to-do' },
          { status: 403 }
        )
      }
    }

    // Atualizar to-do
    const { data: todo, error } = await supabase
      .from('todos')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: todo })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Deleta um to-do
 *     tags: [Todos]
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
 *         description: To-do deletado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas o dono pode deletar)
 *       404:
 *         description: To-do não encontrado
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Verificar se é o dono (apenas dono pode deletar)
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingTodo) {
      return NextResponse.json(
        { error: 'To-do não encontrado' },
        { status: 404 }
      )
    }

    if (existingTodo.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o dono pode deletar este to-do' },
        { status: 403 }
      )
    }

    // Deletar to-do (shares serão deletados automaticamente via CASCADE)
    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'To-do deletado com sucesso' })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
