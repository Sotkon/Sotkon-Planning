import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sql from 'mssql';

// GET - Buscar carga por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNumber = parseInt(id);
    const pool = await getDb();

    const cargaResult = await pool.request()
      .input('id', sql.Int, idNumber)
      .query('SELECT * FROM tblPlanningCargas WHERE id = @id');

    if (cargaResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Carga não encontrada' },
        { status: 404 }
      );
    }

    const carga = cargaResult.recordset[0];

    // Buscar serviços da carga
    const servicosResult = await pool.request()
      .input('planningCargaId', sql.Int, idNumber)
      .query('SELECT servicoId FROM tblPlanningCargaServicos WHERE planningCargaId = @planningCargaId');

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
      dataPrevistaDeCarga: carga.dataPrevistaDeCarga ? new Date(carga.dataPrevistaDeCarga).toISOString().split('T')[0] : '',
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
      servicosARealizar: servicosResult.recordset.map((s: any) => s.servicoId).filter((id: number | null): id is number => id !== null)
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
    const pool = await getDb();

    // Construir datetime
    let dataPrevistaDeCarga: Date | null = null;
    if (body.dataPrevistaDeCarga && body.horaPrevistaDeCarga) {
      const [year, month, day] = body.dataPrevistaDeCarga.split('-').map(Number);
      const [hour, minute] = body.horaPrevistaDeCarga.split(':').map(Number);
      dataPrevistaDeCarga = new Date(year, month - 1, day, hour, minute);
    }

    // Atualizar carga
    await pool.request()
      .input('id', sql.Int, idNumber)
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
      .query(`
        UPDATE tblPlanningCargas SET
          cliente = @cliente,
          countryId = @countryId,
          encomendaDoCliente = @encomendaDoCliente,
          encomendaPrimavera = @encomendaPrimavera,
          projecto = @projecto,
          estadoId = @estadoId,
          dataPrevistaDeCarga = @dataPrevistaDeCarga,
          prazoDeEntregaPrevisto = @prazoDeEntregaPrevisto,
          contactosParaEntrega = @contactosParaEntrega,
          mercadoria = @mercadoria,
          condicoesDePagamento = @condicoesDePagamento,
          mercadoriaQueFaltaEntregar = @mercadoriaQueFaltaEntregar,
          localizacao = @localizacao,
          transportador = @transportador,
          custos_de_transporte = @custos_de_transporte
        WHERE id = @id
      `);

    // Atualizar serviços
    if (body.servicosARealizar) {
      // Apagar serviços existentes
      await pool.request()
        .input('planningCargaId', sql.Int, idNumber)
        .query('DELETE FROM tblPlanningCargaServicos WHERE planningCargaId = @planningCargaId');

      // Inserir novos serviços
      const servicosIds = Array.isArray(body.servicosARealizar)
        ? body.servicosARealizar
        : body.servicosARealizar.split(',').map((s: string) => parseInt(s));

      for (const servicoId of servicosIds) {
        if (servicoId > 0) {
          await pool.request()
            .input('planningCargaId', sql.Int, idNumber)
            .input('servicoId', sql.Int, servicoId)
            .query('INSERT INTO tblPlanningCargaServicos (planningCargaId, servicoId) VALUES (@planningCargaId, @servicoId)');
        }
      }
    }

    return NextResponse.json({ success: true, id: idNumber });

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
    const pool = await getDb();

    // Apagar serviços primeiro
    await pool.request()
      .input('planningCargaId', sql.Int, idNumber)
      .query('DELETE FROM tblPlanningCargaServicos WHERE planningCargaId = @planningCargaId');

    // Apagar carga
    await pool.request()
      .input('id', sql.Int, idNumber)
      .query('DELETE FROM tblPlanningCargas WHERE id = @id');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting carga:', error);
    return NextResponse.json(
      { error: 'Failed to delete carga' },
      { status: 500 }
    );
  }
}