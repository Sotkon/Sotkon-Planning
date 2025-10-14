import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Buscar carga por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNumber = parseInt(id);

    const carga = await prisma.tblPlanningCargas.findUnique({
      where: { id: idNumber }
    });

    if (!carga) {
      return NextResponse.json(
        { error: 'Carga não encontrada' },
        { status: 404 }
      );
    }

    // Buscar serviços da carga
    const servicos = await prisma.tblPlanningCargaServicos.findMany({
      where: { planningCargaId: idNumber }
    });

    // Mapear países
    const paisesMap: Record<number, string> = {
      1: 'PT', 2: 'SP', 3: 'FR', 4: 'INT'
    };

    return NextResponse.json({
      id: carga.id,
      cliente: carga.cliente || '',
      paisId: carga.countryId || 0,
      paisStr: paisesMap[carga.countryId || 0] || '',
      encomendaDoCliente: carga.encomendaDoCliente || '',
      encomendaPrimavera: carga.encomendaPrimavera || '',
      projecto: carga.projecto || '',
      estadoId: carga.estadoId || 0,
      dataPrevistaDeCarga: carga.dataPrevistaDeCarga?.toISOString().split('T')[0] || '',
      horaPrevistaDeCarga: carga.dataPrevistaDeCarga 
        ? new Date(carga.dataPrevistaDeCarga).toTimeString().substring(0, 5)
        : '',
      prazoDeEntregaPrevisto: carga.prazoDeEntregaPrevisto || '',
      contactosParaEntrega: carga.contactosParaEntrega || '',
      mercadoria: carga.mercadoria || '',
      condicoesDePagamento: carga.condicoesDePagamento || '',
      mercadoriaQueFaltaEntregar: carga.mercadoriaQueFaltaEntregar || '',
      localizacao: carga.localizacao || '',
      transportador: carga.transportador || '',
      custos_de_transporte: carga.custos_de_transporte?.toString() || '',
      servicosARealizar: servicos.map(s => s.servicoId).filter((id): id is number => id !== null)
    });

  } catch (error) {
    console.error('Error fetching carga:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carga' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar carga
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNumber = parseInt(id);
    const body = await request.json();

    // Construir datetime
    let dataPrevistaDeCarga: Date | null = null;
    if (body.dataPrevistaDeCarga && body.horaPrevistaDeCarga) {
      const [year, month, day] = body.dataPrevistaDeCarga.split('-').map(Number);
      const [hour, minute] = body.horaPrevistaDeCarga.split(':').map(Number);
      dataPrevistaDeCarga = new Date(year, month - 1, day, hour, minute);
    }

    // Atualizar carga
    const carga = await prisma.tblPlanningCargas.update({
      where: { id: idNumber },
      data: {
        cliente: body.cliente,
        countryId: body.paisId,
        encomendaDoCliente: body.encomendaDoCliente,
        encomendaPrimavera: body.encomendaPrimavera,
        projecto: body.projecto,
        estadoId: body.estadoId,
        dataPrevistaDeCarga: dataPrevistaDeCarga,
        prazoDeEntregaPrevisto: body.prazoDeEntregaPrevisto,
        contactosParaEntrega: body.contactosParaEntrega,
        mercadoria: body.mercadoria,
        condicoesDePagamento: body.condicoesDePagamento,
        mercadoriaQueFaltaEntregar: body.mercadoriaQueFaltaEntregar,
        localizacao: body.localizacao,
        transportador: body.transportador,
        custos_de_transporte: body.custos_de_transporte ? parseFloat(body.custos_de_transporte) : null
      }
    });

    // Atualizar serviços
    if (body.servicosARealizar) {
      // Apagar serviços existentes
      await prisma.tblPlanningCargaServicos.deleteMany({
        where: { planningCargaId: idNumber }
      });

      // Inserir novos serviços
      const servicosIds = Array.isArray(body.servicosARealizar) 
        ? body.servicosARealizar 
        : body.servicosARealizar.split(',').map((s: string) => parseInt(s));

      for (const servicoId of servicosIds) {
        if (servicoId > 0) {
          await prisma.tblPlanningCargaServicos.create({
            data: {
              planningCargaId: idNumber,
              servicoId: servicoId
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, id: carga.id });

  } catch (error) {
    console.error('Error updating carga:', error);
    return NextResponse.json(
      { error: 'Failed to update carga' },
      { status: 500 }
    );
  }
}

// DELETE - Apagar carga
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNumber = parseInt(id);

    // Apagar serviços primeiro
    await prisma.tblPlanningCargaServicos.deleteMany({
      where: { planningCargaId: idNumber }
    });

    // Apagar carga
    await prisma.tblPlanningCargas.delete({
      where: { id: idNumber }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting carga:', error);
    return NextResponse.json(
      { error: 'Failed to delete carga' },
      { status: 500 }
    );
  }
}