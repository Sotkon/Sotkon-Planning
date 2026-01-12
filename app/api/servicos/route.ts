import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'pt';

    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM tblPlanningServicosTipos ORDER BY id ASC');
    
    const servicos = result.recordset;

    // Tipagem explícita
    type Servico = {
      id: number;
      descPT: string | null;
      descEN: string | null;
      descFR: string | null;
      descES: string | null;
    };

    const items = servicos.map((servico: Servico) => ({
      value: servico.id,
      text: language === 'pt' ? servico.descPT :
            language === 'en' ? servico.descEN :
            language === 'fr' ? servico.descFR :
            language === 'es' ? servico.descES :
            servico.descPT
    }));

    return NextResponse.json(items);

  } catch (error) {
    console.error('Error fetching servicos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servicos' },
      { status: 500 }
    );
  }
}