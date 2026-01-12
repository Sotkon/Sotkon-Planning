import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM tblPlanningCountry ORDER BY id ASC');
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}