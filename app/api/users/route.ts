import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export interface UserResponse {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: string | null;
  lastLogin: string | null;
  avatar?: string;
}

// GET /api/users - Listar todos os utilizadores
export async function GET() {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT id, username, name, email, role, active, createdAt, lastLogin
      FROM [dbo].[users]
      ORDER BY createdAt DESC
    `);

    const users: UserResponse[] = result.recordset.map((row: Record<string, unknown>) => ({
      id: row.id as number,
      username: row.username as string,
      name: row.name as string,
      email: row.email as string | null,
      role: ((row.role as string) || 'USER').toUpperCase(),
      active: row.active as boolean,
      createdAt: row.createdAt ? (row.createdAt as Date).toISOString() : null,
      lastLogin: row.lastLogin ? (row.lastLogin as Date).toISOString() : null,
      avatar: (row.name as string).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar utilizadores' },
      { status: 500 }
    );
  }
}

// POST /api/users - Criar novo utilizador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name, email, role, active } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password e name são obrigatórios' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Verificar se username já existe
    const existsResult = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT id FROM [dbo].[users] WHERE username = @username');

    if (existsResult.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Username já existe' },
        { status: 409 }
      );
    }

    // Hash da password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .input('name', sql.NVarChar(100), name)
      .input('email', sql.NVarChar(100), email || null)
      .input('role', sql.NVarChar(20), (role || 'USER').toLowerCase())
      .input('active', sql.Bit, active !== false ? 1 : 0)
      .query(`
        INSERT INTO [dbo].[users] (username, passwordHash, name, email, role, active)
        VALUES (@username, @passwordHash, @name, @email, @role, @active);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const newId = result.recordset[0].id;

    return NextResponse.json({ id: newId, message: 'Utilizador criado com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Erro ao criar utilizador' },
      { status: 500 }
    );
  }
}
