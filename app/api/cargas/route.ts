import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros
    const dataInicio = searchParams.get('dataInicio') || new Date().toISOString().split('T')[0];
    const language = searchParams.get('language') || 'pt';
    const estadoId = parseInt(searchParams.get('estadoId') || '0');
    const countryId = parseInt(searchParams.get('countryId') || '0');
    const pageIndex = parseInt(searchParams.get('pageIndex') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '48');
    const textToSearch = searchParams.get('textToSearch') || '';

    // Parse data início
    const [year, month, day] = dataInicio.split('-').map(Number);
    const dataInicioDate = new Date(year, month - 1, day);

    // Query base
    let whereClause: any = {
      dataPrevistaDeCarga: {
        not: null,
        gte: dataInicioDate
      }
    };

    // Filtro estado (0 = todos exceto 4)
    if (estadoId === 0) {
      whereClause.estadoId = { not: 4 };
    } else if (estadoId > 0) {
      whereClause.estadoId = estadoId;
    }

    // Filtro país
    if (countryId > 0) {
      whereClause.countryId = countryId;
    }

    // Filtro texto (SQL Server = case-insensitive por padrão!)
    if (textToSearch) {
      whereClause.OR = [
        { cliente: { contains: textToSearch } },
        { encomendaDoCliente: { contains: textToSearch } },
        { projecto: { contains: textToSearch } },
        { localizacao: { contains: textToSearch } }
      ];
    }

    // Buscar dados
    const [cargas, totalCount] = await Promise.all([
      prisma.tblPlanningCargas.findMany({
        where: whereClause,
        orderBy: { dataPrevistaDeCarga: 'asc' },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      prisma.tblPlanningCargas.count({ where: whereClause })
    ]);

    // Mapear estados
    const estadosMap: Record<number, Record<string, string>> = {
      1: { pt: 'NOVA', en: 'NEW', fr: 'NOUVEAU', es: 'NUEVA' },
      2: { pt: 'A DEFINIR', en: 'TO DEFINE', fr: 'À DÉFINIR', es: 'A DEFINIR' },
      3: { pt: 'AGENDADA', en: 'SCHEDULED', fr: 'PLANIFIÉ', es: 'PROGRAMADA' },
      4: { pt: 'REALIZADA', en: 'COMPLETED', fr: 'RÉALISÉ', es: 'REALIZADA' }
    };

    // Mapear países
    const paisesMap: Record<number, string> = {
      1: 'PT', 2: 'SP', 3: 'FR', 4: 'INT'
    };

    // Formatar dados
    const items = cargas.map(carga => ({
      id: carga.id,
      cliente: carga.cliente || '',
      paisId: carga.countryId,
      paisStr: paisesMap[carga.countryId || 0] || '',
      encomendaDoCliente: carga.encomendaDoCliente || '',
      encomendaPrimavera: carga.encomendaPrimavera || '',
      projecto: carga.projecto || '',
      localizacao: carga.localizacao || '',
      estadoId: carga.estadoId || 0,
      estadoStr: estadosMap[carga.estadoId || 0]?.[language] || '',
      dataPrevistaDeCarga: carga.dataPrevistaDeCarga,
      dataPrevistaDeCargaStr: carga.dataPrevistaDeCarga 
        ? new Date(carga.dataPrevistaDeCarga).toLocaleDateString('pt-PT')
        : '',
      horaPrevistaDeCargaStr: carga.dataPrevistaDeCarga
        ? new Date(carga.dataPrevistaDeCarga).toLocaleTimeString('pt-PT', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '',
      prazoDeEntregaPrevistoStr: carga.prazoDeEntregaPrevisto || '',
      contactosParaEntrega: carga.contactosParaEntrega || '',
      mercadoria: carga.mercadoria || '',
      condicoesDePagamento: carga.condicoesDePagamento || '',
      mercadoriaQueFaltaEntregar: carga.mercadoriaQueFaltaEntregar || '',
      dataCriacao: carga.dateCreated,
      transportador: carga.transportador || '',
      custos_de_transporte: carga.custos_de_transporte || ''
    }));

    const pagesCount = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      items,
      pagesCount,
      pageIndex,
      language,
      totalCount
    });

  } catch (error) {
    console.error('Error fetching cargas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cargas' },
      { status: 500 }
    );
  }
}

// ... (mantém o GET existente)

// POST - Criar nova carga
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Construir datetime
    let dataPrevistaDeCarga: Date | null = null;
    if (body.dataPrevistaDeCarga && body.horaPrevistaDeCarga) {
      const [year, month, day] = body.dataPrevistaDeCarga.split('-').map(Number);
      const [hour, minute] = body.horaPrevistaDeCarga.split(':').map(Number);
      dataPrevistaDeCarga = new Date(year, month - 1, day, hour, minute);
    }

    // Criar carga
    const carga = await prisma.tblPlanningCargas.create({
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
        custos_de_transporte: body.custos_de_transporte ? parseFloat(body.custos_de_transporte) : null,
        dateCreated: new Date()
      }
    });

    // Inserir serviços
    if (body.servicosARealizar) {
      const servicosIds = Array.isArray(body.servicosARealizar) 
        ? body.servicosARealizar 
        : body.servicosARealizar.split(',').map((s: string) => parseInt(s));

      for (const servicoId of servicosIds) {
        if (servicoId > 0) {
          await prisma.tblPlanningCargaServicos.create({
            data: {
              planningCargaId: carga.id,
              servicoId: servicoId
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, id: carga.id }, { status: 201 });

  } catch (error) {
    console.error('Error creating carga:', error);
    return NextResponse.json(
      { error: 'Failed to create carga' },
      { status: 500 }
    );
  }
}