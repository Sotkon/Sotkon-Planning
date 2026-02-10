import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Obter utilizador específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query(`
        SELECT id, username, name, email, role, active, createdAt, lastLogin
        FROM [dbo].[users]
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const row = result.recordset[0];
    const user = {
      id: row.id,
      username: row.username,
      name: row.name,
      email: row.email,
      role: (row.role || 'USER').toUpperCase(),
      active: row.active,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      lastLogin: row.lastLogin ? row.lastLogin.toISOString() : null,
      avatar: row.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar utilizador' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Atualizar utilizador
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const pool = await getConnection();

    // Verificar se utilizador existe
    const existsResult = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT id FROM [dbo].[users] WHERE id = @id');

    if (existsResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Construir query de update dinamicamente
    const updateFields: string[] = [];
    const request2 = pool.request().input('id', sql.Int, userId);

    if (body.name !== undefined) {
      updateFields.push('name = @name');
      request2.input('name', sql.NVarChar(100), body.name);
    }
    if (body.email !== undefined) {
      updateFields.push('email = @email');
      request2.input('email', sql.NVarChar(100), body.email);
    }
    if (body.role !== undefined) {
      updateFields.push('role = @role');
      request2.input('role', sql.NVarChar(20), body.role.toLowerCase());
    }
    if (body.active !== undefined) {
      updateFields.push('active = @active');
      request2.input('active', sql.Bit, body.active ? 1 : 0);
    }
    if (body.password !== undefined && body.password.length > 0) {
      updateFields.push('passwordHash = @passwordHash');
      const passwordHash = await bcrypt.hash(body.password, 10);
      request2.input('passwordHash', sql.VarChar(255), passwordHash);
    }

    if (updateFields.length > 0) {
      await request2.query(`
        UPDATE [dbo].[users]
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
    }

    return NextResponse.json({ message: 'Utilizador atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar utilizador' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar utilizador
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verificar se utilizador existe
    const existsResult = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT id FROM [dbo].[users] WHERE id = @id');

    if (existsResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Eliminar utilizador
    await pool.request()
      .input('id', sql.Int, userId)
      .query('DELETE FROM [dbo].[users] WHERE id = @id');

    return NextResponse.json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Erro ao eliminar utilizador' },
      { status: 500 }
    );
  }
}
