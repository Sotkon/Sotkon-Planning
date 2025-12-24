// app/api/cargas/[id]/gantt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adjust this import to match your database setup

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    const body = await request.json();
    
    const { dataPrevistaDeCarga } = body;

    // Validate input
    if (!dataPrevistaDeCarga) {
      return NextResponse.json(
        { error: 'Missing dataPrevistaDeCarga field' },
        { status: 400 }
      );
    }

    // Update the order with the load date using Prisma
    const result = await prisma.cargas.update({
      where: { id: orderId },
      data: {
        dataPrevistaDeCarga: new Date(dataPrevistaDeCarga)
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error updating gantt data:', error);
    
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    const result = await prisma.cargas.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        dataPrevistaDeCarga: true
      }
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error fetching gantt data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
