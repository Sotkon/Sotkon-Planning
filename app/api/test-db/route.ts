import { NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT @@VERSION as version');

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      data: result.recordset,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
