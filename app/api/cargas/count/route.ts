import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';

// GET /api/cargas/count - Retorna apenas a contagem de cargas (para Dashboard)
export async function GET(request: NextRequest) {
  try {
    const pool = await getConnection();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    // Build WHERE clause for year filter (based on dataPrevistaDeCarga)
    // Include records where dataPrevistaDeCarga is NULL (pending scheduling) or matches the year
    let whereClause = '';
    const countRequest = pool.request();

    if (year) {
      whereClause = `WHERE (YEAR(c.dataPrevistaDeCarga) = @year OR c.dataPrevistaDeCarga IS NULL)`;
      countRequest.input('year', sql.Int, parseInt(year, 10));
    }

    // Count total
    const totalResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM [dbo].[tblPlanningCargas] c ${whereClause}
    `);
    const total = totalResult.recordset[0].total;

    // Count by state
    const stateCountRequest = pool.request();
    if (year) {
      stateCountRequest.input('year', sql.Int, parseInt(year, 10));
    }

    const stateCountResult = await stateCountRequest.query(`
      SELECT
        c.estadoId,
        COUNT(*) as count
      FROM [dbo].[tblPlanningCargas] c
      ${whereClause}
      GROUP BY c.estadoId
    `);

    // Map estadoId to state names
    const stateCounts: Record<string, number> = {
      'NOVA': 0,
      'A DEFINIR': 0,
      'AGENDADA': 0,
      'REALIZADA': 0
    };

    const estadoIdMap: Record<number, string> = {
      1: 'NOVA',
      2: 'A DEFINIR',
      3: 'AGENDADA',
      4: 'REALIZADA'
    };

    stateCountResult.recordset.forEach((row: { estadoId: number; count: number }) => {
      const stateName = estadoIdMap[row.estadoId];
      if (stateName) {
        stateCounts[stateName] = row.count;
      }
    });

    // Calculate active (not REALIZADA)
    const activeCount = total - (stateCounts['REALIZADA'] || 0);

    return NextResponse.json({
      total,
      active: activeCount,
      byState: stateCounts,
      year: year ? parseInt(year, 10) : null
    });

  } catch (error) {
    console.error('Error counting cargas:', error);
    return NextResponse.json(
      { error: 'Erro ao contar cargas' },
      { status: 500 }
    );
  }
}
