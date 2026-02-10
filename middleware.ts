import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Ignorar rotas de auth (login, logout, me) e rotas públicas
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Verificar token em todas as outras rotas /api
  if (request.nextUrl.pathname.startsWith('/api')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Token válido, permitir requisição
    // Opcional: Injetar user info nos headers para uso nas rotas
    const response = NextResponse.next();
    response.headers.set('x-user-id', String(payload.id));
    response.headers.set('x-user-role', String(payload.role));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
