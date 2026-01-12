import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sql from 'mssql';

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

    const pool = await getDb();

    // Construir condições WHERE
    let whereConditions = ['dataPrevistaDeCarga IS NOT NULL', 'dataPrevistaDeCarga >= @dataInicio'];
    
    // Filtro estado
    if (estadoId === 0) {
      whereConditions.push('estadoId <> 4');
    } else if (estadoId > 0) {
      whereConditions.push('estadoId = @estadoId');
    }

    // Filtro país
    if (countryId > 0) {
      whereConditions.push('countryId = @countryId');
    }

    // Filtro texto
    if (textToSearch) {
      whereConditions.push(`(
        cliente LIKE @textToSearch OR 
        encomendaDoCliente LIKE @textToSearch OR 
        projecto LIKE @textToSearch OR 
        localizacao LIKE @textToSearch
      )`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal COM PARÂMETROS
    const offset = pageIndex * pageSize;
    const queryText = `
      SELECT * FROM tblPlanningCargas
      WHERE ${whereClause}
      ORDER BY dataPrevistaDeCarga ASC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM tblPlanningCargas
      WHERE ${whereClause}
    `;

    // CRIAR REQUEST PARA CADA QUERY
    const dataRequest = pool.request();
    dataRequest.input('dataInicio', sql.DateTime, dataInicioDate);
    dataRequest.input('offset', sql.Int, offset);
    dataRequest.input('pageSize', sql.Int, pageSize);
    if (estadoId > 0) dataRequest.input('estadoId', sql.Int, estadoId);
    if (countryId > 0) dataRequest.input('countryId', sql.Int, countryId);
    if (textToSearch) dataRequest.input('textToSearch', sql.NVarChar, `%${textToSearch}%`);

    const countRequest = pool.request();
    countRequest.input('dataInicio', sql.DateTime, dataInicioDate);
    if (estadoId > 0) countRequest.input('estadoId', sql.Int, estadoId);
    if (countryId > 0) countRequest.input('countryId', sql.Int, countryId);
    if (textToSearch) countRequest.input('textToSearch', sql.NVarChar, `%${textToSearch}%`);

    // Executar queries
    const [cargasResult, countResult] = await Promise.all([
      dataRequest.query(queryText),
      countRequest.query(countQuery)
    ]);

    const cargas = cargasResult.recordset;
    const totalCount = countResult.recordset[0].total;

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
    const items = cargas.map((carga: any) => ({
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

    const pool = await getDb();
    
    // Criar carga
    const result = await pool.request()
      .input('cliente', sql.NVarChar, body.cliente)
      .input('countryId', sql.Int, body.paisId)
      .input('encomendaDoCliente', sql.NVarChar, body.encomendaDoCliente)
      .input('encomendaPrimavera', sql.NVarChar, body.encomendaPrimavera)
      .input('projecto', sql.NVarChar, body.projecto)
      .input('estadoId', sql.Int, body.estadoId)
      .input('dataPrevistaDeCarga', sql.DateTime, dataPrevistaDeCarga)
      .input('prazoDeEntregaPrevisto', sql.NVarChar, body.prazoDeEntregaPrevisto)
      .input('contactosParaEntrega', sql.NVarChar, body.contactosParaEntrega)
      .input('mercadoria', sql.NVarChar, body.mercadoria)
      .input('condicoesDePagamento', sql.NVarChar, body.condicoesDePagamento)
      .input('mercadoriaQueFaltaEntregar', sql.NVarChar, body.mercadoriaQueFaltaEntregar)
      .input('localizacao', sql.NVarChar, body.localizacao)
      .input('transportador', sql.NVarChar, body.transportador)
      .input('custos_de_transporte', sql.Decimal(18, 2), body.custos_de_transporte ? parseFloat(body.custos_de_transporte) : null)
      .input('dateCreated', sql.DateTime, new Date())
      .query(`
        INSERT INTO tblPlanningCargas (
          cliente, countryId, encomendaDoCliente, encomendaPrimavera, projecto,
          estadoId, dataPrevistaDeCarga, prazoDeEntregaPrevisto, contactosParaEntrega,
          mercadoria, condicoesDePagamento, mercadoriaQueFaltaEntregar, localizacao,
          transportador, custos_de_transporte, dateCreated
        )
        OUTPUT INSERTED.id
        VALUES (
          @cliente, @countryId, @encomendaDoCliente, @encomendaPrimavera, @projecto,
          @estadoId, @dataPrevistaDeCarga, @prazoDeEntregaPrevisto, @contactosParaEntrega,
          @mercadoria, @condicoesDePagamento, @mercadoriaQueFaltaEntregar, @localizacao,
          @transportador, @custos_de_transporte, @dateCreated
        )
      `);

    const cargaId = result.recordset[0].id;

    // Inserir serviços
    if (body.servicosARealizar) {
      const servicosIds = Array.isArray(body.servicosARealizar)
        ? body.servicosARealizar
        : body.servicosARealizar.split(',').map((s: string) => parseInt(s));

      for (const servicoId of servicosIds) {
        if (servicoId > 0) {
          await pool.request()
            .input('planningCargaId', sql.Int, cargaId)
            .input('servicoId', sql.Int, servicoId)
            .query(`
              INSERT INTO tblPlanningCargaServicos (planningCargaId, servicoId)
              VALUES (@planningCargaId, @servicoId)
            `);
        }
      }
    }

    return NextResponse.json({ success: true, id: cargaId }, { status: 201 });

  } catch (error) {
    console.error('Error creating carga:', error);
    return NextResponse.json(
      { error: 'Failed to create carga' },
      { status: 500 }
    );
  }
}