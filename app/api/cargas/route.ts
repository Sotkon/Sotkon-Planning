import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import {
  Carga,
  CargaInput,
  COUNTRY_ID_MAP,
  ESTADO_ID_MAP,
  SERVICO_ID_MAP,
  SERVICE_TO_ID,
  Services
} from '@/lib/types';

// GET /api/cargas - Listar todas as cargas
export async function GET(request: NextRequest) {
  try {
    const pool = await getConnection();

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const year = searchParams.get('year'); // Filter by year (e.g., "2025")
    const dateStart = searchParams.get('dateStart'); // Filter by date range start (e.g., "2025-01-01")
    const dateEnd = searchParams.get('dateEnd'); // Filter by date range end (e.g., "2025-12-31")
    const offset = (page - 1) * limit;

    // Build WHERE clause for filtering (based on dataPrevistaDeCarga)
    // Priority: date range > year filter
    const whereConditions: string[] = [];

    if (dateStart || dateEnd) {
      // Date range filter - takes priority over year filter
      if (dateStart && dateEnd) {
        whereConditions.push(`(c.dataPrevistaDeCarga >= @dateStart AND c.dataPrevistaDeCarga <= @dateEnd)`);
      } else if (dateStart) {
        whereConditions.push(`(c.dataPrevistaDeCarga >= @dateStart)`);
      } else if (dateEnd) {
        whereConditions.push(`(c.dataPrevistaDeCarga <= @dateEnd)`);
      }
    } else if (year) {
      // Year filter - only if no date range specified
      // Include records where dataPrevistaDeCarga is NULL (pending scheduling) or matches the year
      whereConditions.push(`(YEAR(c.dataPrevistaDeCarga) = @year OR c.dataPrevistaDeCarga IS NULL)`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count for pagination info
    const countRequest = pool.request();
    if (dateStart) countRequest.input('dateStart', sql.Date, dateStart);
    if (dateEnd) countRequest.input('dateEnd', sql.Date, dateEnd);
    if (year && !dateStart && !dateEnd) countRequest.input('year', sql.Int, parseInt(year, 10));

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM [dbo].[tblPlanningCargas] c ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Buscar cargas with pagination
    const cargasRequest = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit);

    if (dateStart) cargasRequest.input('dateStart', sql.Date, dateStart);
    if (dateEnd) cargasRequest.input('dateEnd', sql.Date, dateEnd);
    if (year && !dateStart && !dateEnd) cargasRequest.input('year', sql.Int, parseInt(year, 10));

    const cargasResult = await cargasRequest.query(`
      SELECT
        c.id,
        c.cliente,
        c.countryId,
        c.encomendaDoCliente,
        c.encomendaPrimavera,
        c.projecto,
        c.estadoId,
        c.dataPrevistaDeCarga,
        c.contactosParaEntrega,
        c.mercadoria,
        c.condicoesDePagamento,
        c.mercadoriaQueFaltaEntregar,
        c.dateCreated,
        c.localizacao,
        c.id_primavera as idPrimavera,
        c.transportador,
        c.custos_de_transporte as custosDeTransporte,
        c.prazoDeEntregaPrevisto,
        c.dataInicio,
        c.dataFim,
        c.duracao
      FROM [dbo].[tblPlanningCargas] c
      ${whereClause}
      ORDER BY c.dataPrevistaDeCarga DESC, c.id DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    // Buscar serviços de todas as cargas
    const servicosResult = await pool.request().query(`
      SELECT planningCargaId, servicoId
      FROM [dbo].[tblPlanningCargaServicos]
    `);

    // Criar mapa de serviços por carga
    const servicosByCarga: Record<number, number[]> = {};
    for (const row of servicosResult.recordset) {
      if (!servicosByCarga[row.planningCargaId]) {
        servicosByCarga[row.planningCargaId] = [];
      }
      servicosByCarga[row.planningCargaId].push(row.servicoId);
    }

    // Mapear resultados para o tipo Carga
    const cargas: Carga[] = cargasResult.recordset.map((row: Record<string, unknown>) => {
      const servicoIds = servicosByCarga[row.id as number] || [];
      const services: Services = {
        transporte: servicoIds.includes(2),
        instalacao: servicoIds.includes(3),
        obraCivil: servicoIds.includes(4),
        sotkisAccess: servicoIds.includes(5),
        sotkisLevel: servicoIds.includes(6),
        sotcare: servicoIds.includes(7)
      };

      return {
        id: row.id as number,
        cliente: row.cliente as string | null,
        countryId: row.countryId as number | null,
        market: row.countryId ? COUNTRY_ID_MAP[row.countryId as number] || null : null,
        encomendaDoCliente: row.encomendaDoCliente as string | null,
        encomendaPrimavera: row.encomendaPrimavera as string | null,
        projecto: row.projecto as string | null,
        estadoId: row.estadoId as number | null,
        estado: row.estadoId ? ESTADO_ID_MAP[row.estadoId as number] || null : null,
        dataPrevistaDeCarga: row.dataPrevistaDeCarga ? (row.dataPrevistaDeCarga as Date).toISOString() : null,
        contactosParaEntrega: row.contactosParaEntrega as string | null,
        mercadoria: row.mercadoria as string | null,
        condicoesDePagamento: row.condicoesDePagamento as string | null,
        mercadoriaQueFaltaEntregar: row.mercadoriaQueFaltaEntregar as string | null,
        dateCreated: row.dateCreated ? (row.dateCreated as Date).toISOString() : null,
        localizacao: row.localizacao as string | null,
        idPrimavera: row.idPrimavera as string | null,
        transportador: row.transportador as string | null,
        custosDeTransporte: row.custosDeTransporte as number | null,
        prazoDeEntregaPrevisto: row.prazoDeEntregaPrevisto as string | null,
        dataInicio: row.dataInicio ? (row.dataInicio as Date).toISOString().split('T')[0] : null,
        dataFim: row.dataFim ? (row.dataFim as Date).toISOString().split('T')[0] : null,
        duracao: row.duracao as number | null,
        services
      };
    });

    // Return with pagination metadata
    return NextResponse.json({
      data: cargas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cargas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cargas' },
      { status: 500 }
    );
  }
}

// POST /api/cargas - Criar nova carga
export async function POST(request: NextRequest) {
  try {
    const body: CargaInput = await request.json();
    const pool = await getConnection();

    // Inserir carga
    const result = await pool.request()
      .input('cliente', sql.NVarChar(255), body.cliente || null)
      .input('countryId', sql.Int, body.countryId || null)
      .input('encomendaDoCliente', sql.NVarChar(255), body.encomendaDoCliente || null)
      .input('encomendaPrimavera', sql.NVarChar(255), body.encomendaPrimavera || null)
      .input('projecto', sql.NVarChar(255), body.projecto || null)
      .input('estadoId', sql.Int, body.estadoId || 1) // Default: Nova
      .input('dataPrevistaDeCarga', sql.DateTime, body.dataPrevistaDeCarga ? new Date(body.dataPrevistaDeCarga) : null)
      .input('contactosParaEntrega', sql.NVarChar(sql.MAX), body.contactosParaEntrega || null)
      .input('mercadoria', sql.NVarChar(sql.MAX), body.mercadoria || null)
      .input('condicoesDePagamento', sql.NVarChar(255), body.condicoesDePagamento || null)
      .input('mercadoriaQueFaltaEntregar', sql.NVarChar(sql.MAX), body.mercadoriaQueFaltaEntregar || null)
      .input('localizacao', sql.NVarChar(sql.MAX), body.localizacao || null)
      .input('idPrimavera', sql.NVarChar(255), body.idPrimavera || null)
      .input('transportador', sql.NVarChar(255), body.transportador || null)
      .input('custosDeTransporte', sql.Decimal(18, 2), body.custosDeTransporte || null)
      .input('prazoDeEntregaPrevisto', sql.NVarChar(50), body.prazoDeEntregaPrevisto || null)
      .input('dataInicio', sql.Date, body.dataInicio ? new Date(body.dataInicio) : null)
      .input('dataFim', sql.Date, body.dataFim ? new Date(body.dataFim) : null)
      .input('dateCreated', sql.DateTime, new Date())
      .query(`
        INSERT INTO [dbo].[tblPlanningCargas] (
          cliente, countryId, encomendaDoCliente, encomendaPrimavera, projecto,
          estadoId, dataPrevistaDeCarga, contactosParaEntrega, mercadoria,
          condicoesDePagamento, mercadoriaQueFaltaEntregar, localizacao,
          id_primavera, transportador, custos_de_transporte, prazoDeEntregaPrevisto,
          dataInicio, dataFim, dateCreated
        ) VALUES (
          @cliente, @countryId, @encomendaDoCliente, @encomendaPrimavera, @projecto,
          @estadoId, @dataPrevistaDeCarga, @contactosParaEntrega, @mercadoria,
          @condicoesDePagamento, @mercadoriaQueFaltaEntregar, @localizacao,
          @idPrimavera, @transportador, @custosDeTransporte, @prazoDeEntregaPrevisto,
          @dataInicio, @dataFim, @dateCreated
        );
        SELECT SCOPE_IDENTITY() as id;
      `);

    const newId = result.recordset[0].id;

    // Inserir serviços se fornecidos
    if (body.services && body.services.length > 0) {
      for (const serviceName of body.services) {
        const servicoId = SERVICE_TO_ID[serviceName];
        if (servicoId) {
          await pool.request()
            .input('planningCargaId', sql.Int, newId)
            .input('servicoId', sql.Int, servicoId)
            .query(`
              INSERT INTO [dbo].[tblPlanningCargaServicos] (planningCargaId, servicoId)
              VALUES (@planningCargaId, @servicoId)
            `);
        }
      }
    }

    return NextResponse.json({ id: newId, message: 'Carga criada com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Error creating carga:', error);
    return NextResponse.json(
      { error: 'Erro ao criar carga' },
      { status: 500 }
    );
  }
}
