// app/api/cargas/[id]/gantt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    
    const { dataPrevistaDeCarga } = body;

    // Validate input
    if (!dataPrevistaDeCarga) {
      return NextResponse.json(
        { error: 'Missing dataPrevistaDeCarga field' },
        { status: 400 }
      );
    }

    // Update the order with the load date
    const result = await sql`
      UPDATE cargas 
      SET 
        data_prevista_de_carga = ${dataPrevistaDeCarga}
      WHERE id = ${orderId}
      RETURNING *
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating gantt data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const result = await sql`
      SELECT 
        id,
        data_prevista_de_carga
      FROM cargas
      WHERE id = ${orderId}
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching gantt data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
