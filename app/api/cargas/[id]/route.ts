import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import {
  Carga,
  CargaInput,
  COUNTRY_ID_MAP,
  ESTADO_ID_MAP,
  SERVICE_TO_ID,
  Services
} from '@/lib/types';

// GET /api/cargas/[id] - Obter carga específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cargaId = parseInt(id, 10);

    if (isNaN(cargaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pool = await getConnection();

    const cargaResult = await pool.request()
      .input('id', sql.Int, cargaId)
      .query(`
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
        WHERE c.id = @id
      `);

    if (cargaResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Carga não encontrada' }, { status: 404 });
    }

    const row = cargaResult.recordset[0];

    // Buscar serviços da carga
    const servicosResult = await pool.request()
      .input('planningCargaId', sql.Int, cargaId)
      .query(`
        SELECT servicoId
        FROM [dbo].[tblPlanningCargaServicos]
        WHERE planningCargaId = @planningCargaId
      `);

    const servicoIds = servicosResult.recordset.map((r: { servicoId: number }) => r.servicoId);
    const services: Services = {
      transporte: servicoIds.includes(2),
      instalacao: servicoIds.includes(3),
      obraCivil: servicoIds.includes(4),
      sotkisAccess: servicoIds.includes(5),
      sotkisLevel: servicoIds.includes(6),
      sotcare: servicoIds.includes(7)
    };

    const carga: Carga = {
      id: row.id,
      cliente: row.cliente,
      countryId: row.countryId,
      market: row.countryId ? COUNTRY_ID_MAP[row.countryId] || null : null,
      encomendaDoCliente: row.encomendaDoCliente,
      encomendaPrimavera: row.encomendaPrimavera,
      projecto: row.projecto,
      estadoId: row.estadoId,
      estado: row.estadoId ? ESTADO_ID_MAP[row.estadoId] || null : null,
      dataPrevistaDeCarga: row.dataPrevistaDeCarga ? row.dataPrevistaDeCarga.toISOString() : null,
      contactosParaEntrega: row.contactosParaEntrega,
      mercadoria: row.mercadoria,
      condicoesDePagamento: row.condicoesDePagamento,
      mercadoriaQueFaltaEntregar: row.mercadoriaQueFaltaEntregar,
      dateCreated: row.dateCreated ? row.dateCreated.toISOString() : null,
      localizacao: row.localizacao,
      idPrimavera: row.idPrimavera,
      transportador: row.transportador,
      custosDeTransporte: row.custosDeTransporte,
      prazoDeEntregaPrevisto: row.prazoDeEntregaPrevisto,
      dataInicio: row.dataInicio ? row.dataInicio.toISOString().split('T')[0] : null,
      dataFim: row.dataFim ? row.dataFim.toISOString().split('T')[0] : null,
      duracao: row.duracao,
      services
    };

    return NextResponse.json(carga);
  } catch (error) {
    console.error('Error fetching carga:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carga' },
      { status: 500 }
    );
  }
}

// PUT /api/cargas/[id] - Atualizar carga
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cargaId = parseInt(id, 10);

    if (isNaN(cargaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body: CargaInput = await request.json();
    const pool = await getConnection();

    // Verificar se carga existe
    const existsResult = await pool.request()
      .input('id', sql.Int, cargaId)
      .query('SELECT id FROM [dbo].[tblPlanningCargas] WHERE id = @id');

    if (existsResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Carga não encontrada' }, { status: 404 });
    }

    // Construir query de update dinamicamente
    const updateFields: string[] = [];
    const request2 = pool.request().input('id', sql.Int, cargaId);

    if (body.cliente !== undefined) {
      updateFields.push('cliente = @cliente');
      request2.input('cliente', sql.NVarChar(255), body.cliente);
    }
    if (body.countryId !== undefined) {
      updateFields.push('countryId = @countryId');
      request2.input('countryId', sql.Int, body.countryId);
    }
    if (body.encomendaDoCliente !== undefined) {
      updateFields.push('encomendaDoCliente = @encomendaDoCliente');
      request2.input('encomendaDoCliente', sql.NVarChar(255), body.encomendaDoCliente);
    }
    if (body.encomendaPrimavera !== undefined) {
      updateFields.push('encomendaPrimavera = @encomendaPrimavera');
      request2.input('encomendaPrimavera', sql.NVarChar(255), body.encomendaPrimavera);
    }
    if (body.projecto !== undefined) {
      updateFields.push('projecto = @projecto');
      request2.input('projecto', sql.NVarChar(255), body.projecto);
    }
    if (body.estadoId !== undefined) {
      updateFields.push('estadoId = @estadoId');
      request2.input('estadoId', sql.Int, body.estadoId);
    }
    if (body.dataPrevistaDeCarga !== undefined) {
      updateFields.push('dataPrevistaDeCarga = @dataPrevistaDeCarga');
      request2.input('dataPrevistaDeCarga', sql.DateTime, body.dataPrevistaDeCarga ? new Date(body.dataPrevistaDeCarga) : null);
    }
    if (body.contactosParaEntrega !== undefined) {
      updateFields.push('contactosParaEntrega = @contactosParaEntrega');
      request2.input('contactosParaEntrega', sql.NVarChar(sql.MAX), body.contactosParaEntrega);
    }
    if (body.mercadoria !== undefined) {
      updateFields.push('mercadoria = @mercadoria');
      request2.input('mercadoria', sql.NVarChar(sql.MAX), body.mercadoria);
    }
    if (body.condicoesDePagamento !== undefined) {
      updateFields.push('condicoesDePagamento = @condicoesDePagamento');
      request2.input('condicoesDePagamento', sql.NVarChar(255), body.condicoesDePagamento);
    }
    if (body.mercadoriaQueFaltaEntregar !== undefined) {
      updateFields.push('mercadoriaQueFaltaEntregar = @mercadoriaQueFaltaEntregar');
      request2.input('mercadoriaQueFaltaEntregar', sql.NVarChar(sql.MAX), body.mercadoriaQueFaltaEntregar);
    }
    if (body.localizacao !== undefined) {
      updateFields.push('localizacao = @localizacao');
      request2.input('localizacao', sql.NVarChar(sql.MAX), body.localizacao);
    }
    if (body.idPrimavera !== undefined) {
      updateFields.push('id_primavera = @idPrimavera');
      request2.input('idPrimavera', sql.NVarChar(255), body.idPrimavera);
    }
    if (body.transportador !== undefined) {
      updateFields.push('transportador = @transportador');
      request2.input('transportador', sql.NVarChar(255), body.transportador);
    }
    if (body.custosDeTransporte !== undefined) {
      updateFields.push('custos_de_transporte = @custosDeTransporte');
      request2.input('custosDeTransporte', sql.Decimal(18, 2), body.custosDeTransporte);
    }
    if (body.prazoDeEntregaPrevisto !== undefined) {
      updateFields.push('prazoDeEntregaPrevisto = @prazoDeEntregaPrevisto');
      request2.input('prazoDeEntregaPrevisto', sql.NVarChar(50), body.prazoDeEntregaPrevisto);
    }
    if (body.dataInicio !== undefined) {
      updateFields.push('dataInicio = @dataInicio');
      request2.input('dataInicio', sql.Date, body.dataInicio ? new Date(body.dataInicio) : null);
    }
    if (body.dataFim !== undefined) {
      updateFields.push('dataFim = @dataFim');
      request2.input('dataFim', sql.Date, body.dataFim ? new Date(body.dataFim) : null);
    }

    if (updateFields.length > 0) {
      await request2.query(`
        UPDATE [dbo].[tblPlanningCargas]
        SET ${updateFields.join(', ')}
        WHERE id = @id
      `);
    }

    // Atualizar serviços se fornecidos
    if (body.services !== undefined) {
      // Remover serviços existentes
      await pool.request()
        .input('planningCargaId', sql.Int, cargaId)
        .query('DELETE FROM [dbo].[tblPlanningCargaServicos] WHERE planningCargaId = @planningCargaId');

      // Inserir novos serviços
      for (const serviceName of body.services) {
        const servicoId = SERVICE_TO_ID[serviceName];
        if (servicoId) {
          await pool.request()
            .input('planningCargaId', sql.Int, cargaId)
            .input('servicoId', sql.Int, servicoId)
            .query(`
              INSERT INTO [dbo].[tblPlanningCargaServicos] (planningCargaId, servicoId)
              VALUES (@planningCargaId, @servicoId)
            `);
        }
      }
    }

    return NextResponse.json({ message: 'Carga atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating carga:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar carga' },
      { status: 500 }
    );
  }
}

// DELETE /api/cargas/[id] - Eliminar carga
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cargaId = parseInt(id, 10);

    if (isNaN(cargaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verificar se carga existe
    const existsResult = await pool.request()
      .input('id', sql.Int, cargaId)
      .query('SELECT id FROM [dbo].[tblPlanningCargas] WHERE id = @id');

    if (existsResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Carga não encontrada' }, { status: 404 });
    }

    // Eliminar serviços associados primeiro
    await pool.request()
      .input('planningCargaId', sql.Int, cargaId)
      .query('DELETE FROM [dbo].[tblPlanningCargaServicos] WHERE planningCargaId = @planningCargaId');

    // Eliminar carga
    await pool.request()
      .input('id', sql.Int, cargaId)
      .query('DELETE FROM [dbo].[tblPlanningCargas] WHERE id = @id');

    return NextResponse.json({ message: 'Carga eliminada com sucesso' });
  } catch (error) {
    console.error('Error deleting carga:', error);
    return NextResponse.json(
      { error: 'Erro ao eliminar carga' },
      { status: 500 }
    );
  }
}
