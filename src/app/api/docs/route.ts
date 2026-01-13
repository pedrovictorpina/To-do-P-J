import { NextResponse } from 'next/server'
import swagger from '@/../swagger.json'

/**
 * Endpoint para servir o OpenAPI spec
 */
export async function GET() {
  return NextResponse.json(swagger)
}
