import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renova o token de acesso
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Token de refresh obtido no login
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       400:
 *         description: Token inválido
 *       401:
 *         description: Refresh token expirado ou inválido
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Renovar sessão
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Não foi possível renovar a sessão' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Token renovado com sucesso',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
