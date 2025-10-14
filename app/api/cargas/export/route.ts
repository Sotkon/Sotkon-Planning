import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros (mesmos da listagem)
    const dataInicio = searchParams.get('dataInicio') || new Date().toISOString().split('T')[0];
    const language = searchParams.get('language') || 'pt';
    const estadoId = parseInt(searchParams.get('estadoId') || '0');
    const countryId = parseInt(searchParams.get('countryId') || '0');
    const textToSearch = searchParams.get('textToSearch') || '';

    // Parse data início
    const [year, month, day] = dataInicio.split('-').map(Number);
    const dataInicioDate = new Date(year, month - 1, day);

    // Query base (mesma da listagem)
    let whereClause: any = {
      dataPrevistaDeCarga: {
        not: null,
        gte: dataInicioDate
      }
    };

    // Filtro estado
    if (estadoId === 0) {
      whereClause.estadoId = { not: 4 };
    } else if (estadoId > 0) {
      whereClause.estadoId = estadoId;
    }

    // Filtro país
    if (countryId > 0) {
      whereClause.countryId = countryId;
    }

    // Filtro texto
    if (textToSearch) {
      whereClause.OR = [
        { cliente: { contains: textToSearch } },
        { encomendaDoCliente: { contains: textToSearch } },
        { projecto: { contains: textToSearch } },
        { localizacao: { contains: textToSearch } }
      ];
    }

    // Buscar TODAS as cargas (sem paginação)
    const cargas = await prisma.tblPlanningCargas.findMany({
      where: whereClause,
      orderBy: { dataPrevistaDeCarga: 'asc' }
    });

    // Mapear estados
    const estadosMap: Record<number, string> = {
      1: 'NOVA',
      2: 'A DEFINIR',
      3: 'AGENDADA',
      4: 'REALIZADA'
    };

    // Mapear países
    const paisesMap: Record<number, string> = {
      1: 'PT',
      2: 'SP',
      3: 'FR',
      4: 'INT'
    };

    // Criar workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cargas');

    // Definir colunas
    worksheet.columns = [
      { header: 'CLIENTE', key: 'cliente', width: 40 },
      { header: 'PAIS', key: 'pais', width: 10 },
      { header: 'ENCOMENDA CLIENTE', key: 'encomendaCliente', width: 20 },
      { header: 'ENCOMENDA PRIMAVERA', key: 'encomendaPrimavera', width: 20 },
      { header: 'PROJETO', key: 'projeto', width: 20 },
      { header: 'ESTADO', key: 'estado', width: 15 },
      { header: 'LOCALIZACAO', key: 'localizacao', width: 50 },
      { header: 'DATA PREVISTA DE CARGA', key: 'dataCarga', width: 25 },
      { header: 'PRAZO DE ENTREGA PREVISTO', key: 'prazoEntrega', width: 25 },
      { header: 'CONTACTOS PARA ENTREGA', key: 'contactos', width: 40 },
      { header: 'MERCADORIA', key: 'mercadoria', width: 50 },
      { header: 'CONDICOES DE PAGAMENTO', key: 'condicoes', width: 30 },
      { header: 'MERCADORIA QUE FALTA ENTREGAR', key: 'mercadoriaFalta', width: 40 },
      { header: 'SERVICOS', key: 'servicos', width: 40 }
    ];

    // Estilizar header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Buscar serviços para cada carga e adicionar linhas
    for (const carga of cargas) {
  // Buscar serviços da carga
  const servicosDaCarga = await prisma.tblPlanningCargaServicos.findMany({
    where: { planningCargaId: carga.id }
  });

  // Buscar descrições dos serviços
  let servicosStr = '';
  if (servicosDaCarga.length > 0) {
    // ✅ CORRIGIDO - Filtrar nulls
    const servicosIds = servicosDaCarga
      .map(s => s.servicoId)
      .filter((id): id is number => id !== null);
    
    if (servicosIds.length > 0) {
      const servicos = await prisma.tblPlanningServicosTipos.findMany({
        where: { id: { in: servicosIds } }
      });
      
      servicosStr = servicos
        .map(s => language === 'pt' ? s.descPT : 
                  language === 'en' ? s.descEN : 
                  language === 'fr' ? s.descFR : 
                  language === 'es' ? s.descES : s.descPT)
        .filter(Boolean)
        .join(', ');
    }
  }

      // Formatar data
      const dataFormatada = carga.dataPrevistaDeCarga
        ? new Date(carga.dataPrevistaDeCarga).toLocaleString('pt-PT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '';

      // Adicionar linha
      worksheet.addRow({
        cliente: carga.cliente || '',
        pais: paisesMap[carga.countryId || 0] || '',
        encomendaCliente: carga.encomendaDoCliente || '',
        encomendaPrimavera: carga.encomendaPrimavera || '',
        projeto: carga.projecto || '',
        estado: estadosMap[carga.estadoId || 0] || '',
        localizacao: carga.localizacao || '',
        dataCarga: dataFormatada,
        prazoEntrega: carga.prazoDeEntregaPrevisto || '',
        contactos: carga.contactosParaEntrega || '',
        mercadoria: carga.mercadoria || '',
        condicoes: carga.condicoesDePagamento || '',
        mercadoriaFalta: carga.mercadoriaQueFaltaEntregar || '',
        servicos: servicosStr
      });
    }

    // Aplicar bordas a todas as células
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Gerar nome do ficheiro
    const now = new Date();
    const fileName = `Cargas_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.xlsx`;

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Retornar como download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return NextResponse.json(
      { error: 'Failed to export to Excel' },
      { status: 500 }
    );
  }
}