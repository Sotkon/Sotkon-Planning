import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: payload.id,
    username: payload.username,
    name: payload.name,
    role: payload.role,
    // Add other non-sensitive user data if needed
  });
}
