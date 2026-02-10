import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log(`[AUTH] Attempting login for: ${username}`);

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username e password são obrigatórios.' },
        { status: 400 }
      );
    }

    console.log('[AUTH] Connecting to database...');
    const pool = await getConnection();
    console.log('[AUTH] Connected to database');

    // Buscar o utilizador pelo username
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query(`
        SELECT id, username, name, email, role, active, passwordHash
        FROM [dbo].[users]
        WHERE username = @username AND active = 1
      `);

    console.log(`[AUTH] Query result: ${result.recordset.length} users found`);

    if (result.recordset.length === 0) {
      console.warn(`[AUTH] User not found or inactive: ${username}`);
      return NextResponse.json(
        { error: 'Credenciais inválidas ou conta inativa.' },
        { status: 401 }
      );
    }

    const user = result.recordset[0];
    console.log(`[AUTH] User found: ${user.username}, checking password...`);

    // Verificar a password com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      console.warn(`[AUTH] Invalid password for user: ${username}`);
      return NextResponse.json(
        { error: 'Credenciais inválidas ou conta inativa.' },
        { status: 401 }
      );
    }

    // Atualizar lastLogin (opcional)
    try {
      await pool.request()
        .input('userId', sql.Int, user.id)
        .query(`
          UPDATE [dbo].[users]
          SET lastLogin = GETDATE()
          WHERE id = @userId
        `);
    } catch (updateError) {
      console.error('[AUTH] Failed to update lastLogin:', updateError);
      // Continue mesmo se falhar o update
    }

    console.log(`[AUTH] Login success: ${username}`);

    // Construir resposta com campos corretos
    const userResponse = {
      id: String(user.id),
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: (user.role || 'USER').toUpperCase(),
      active: user.active,
      avatar: user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    };

    // Gerar token JWT
    const token = await signToken({
      id: userResponse.id,
      username: userResponse.username,
      role: userResponse.role,
      name: userResponse.name // Adicionar nome para facilitar recuperação rápida no middleware se necessário
    });

    // Criar resposta
    const response = NextResponse.json(userResponse);

    // Definir cookie seguro
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 horas em segundos
    });

    console.log(`[AUTH] Login success: ${username}. Token generated.`);
    return response;

  } catch (error) {
    console.error('[AUTH ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Falha na autenticação: ${errorMessage}` },
      { status: 500 }
    );
  }
}