import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export interface Country {
  id: number;
  country: string;
}

export interface Estado {
  id: number;
  descPT: string;
  descEN: string | null;
  descFR: string | null;
  descES: string | null;
}

export interface ServicoTipo {
  id: number;
  descPT: string;
  descEN: string | null;
  descFR: string | null;
  descES: string | null;
}

export interface LookupData {
  countries: Country[];
  estados: Estado[];
  servicos: ServicoTipo[];
}

// GET /api/lookup - Obter todas as tabelas de lookup
export async function GET() {
  try {
    const pool = await getConnection();

    const [countriesResult, estadosResult, servicosResult] = await Promise.all([
      pool.request().query('SELECT id, country FROM [dbo].[tblPlanningCountry] ORDER BY id'),
      pool.request().query('SELECT id, descPT, descEN, descFR, descES FROM [dbo].[tblPlanningEstado] ORDER BY id'),
      pool.request().query('SELECT id, descPT, descEN, descFR, descES FROM [dbo].[tblPlanningServicosTipos] ORDER BY id')
    ]);

    const lookupData: LookupData = {
      countries: countriesResult.recordset,
      estados: estadosResult.recordset,
      servicos: servicosResult.recordset
    };

    return NextResponse.json(lookupData);
  } catch (error) {
    console.error('Error fetching lookup data:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de lookup' },
      { status: 500 }
    );
  }
}
