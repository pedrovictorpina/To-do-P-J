import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTodoSchema, listTodosQuerySchema } from '@/lib/validations/todos'

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Lista todos os to-dos do usuário
 *     tags: [Todos]
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
 *         description: Itens por página (max 100)
 *       - in: query
 *         name: completed
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filtrar por prioridade
 *     responses:
 *       200:
 *         description: Lista de to-dos com paginação
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
    const queryValidation = listTodosQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      completed: searchParams.get('completed') || undefined,
      priority: searchParams.get('priority') || undefined,
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: queryValidation.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit, completed, priority } = queryValidation.data

    // Montar query
    let query = supabase
      .from('todos')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (completed !== undefined) {
      query = query.eq('completed', completed === 'true')
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: todos, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

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

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Cria um novo to-do
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Estudar Next.js"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Criar API REST com documentação"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               due_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: To-do criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
export async function POST(request: Request) {
  try {
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
    const validation = createTodoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, priority, due_date } = validation.data

    // Criar to-do
    const { data: todo, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        title,
        description,
        priority,
        due_date,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: todo }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
