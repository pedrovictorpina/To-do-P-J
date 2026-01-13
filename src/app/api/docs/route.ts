import { NextResponse, NextRequest } from 'next/server'
import swagger from '@/../swagger.json'

/**
 * Endpoint para servir o OpenAPI spec
 * Atualiza a URL do servidor dinamicamente baseado no host da requisição
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  
  // Clona o swagger e atualiza a URL do servidor dinamicamente
  const dynamicSwagger = {
    ...swagger,
    servers: [
      {
        url: `${protocol}://${host}`,
        description: host.includes('localhost') 
          ? 'Servidor de desenvolvimento' 
          : 'Servidor de produção'
      }
    ]
  }
  
  return NextResponse.json(dynamicSwagger)
}
