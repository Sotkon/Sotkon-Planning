import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'pt';

  const estadosMap: Record<string, Array<{ value: number; text: string }>> = {
    pt: [
      { value: -1, text: 'TODOS' },
      { value: 0, text: 'Nova, Agendada, A Definir' },
      { value: 1, text: 'NOVA' },
      { value: 2, text: 'A DEFINIR' },
      { value: 3, text: 'AGENDADA' },
      { value: 4, text: 'REALIZADA' }
    ],
    en: [
      { value: -1, text: 'ALL' },
      { value: 0, text: 'New, Scheduled, To Define' },
      { value: 1, text: 'NEW' },
      { value: 2, text: 'TO DEFINE' },
      { value: 3, text: 'SCHEDULED' },
      { value: 4, text: 'COMPLETED' }
    ],
    fr: [
      { value: -1, text: 'TOUS' },
      { value: 0, text: 'Nouveau, Planifié, À Définir' },
      { value: 1, text: 'NOUVEAU' },
      { value: 2, text: 'À DÉFINIR' },
      { value: 3, text: 'PLANIFIÉ' },
      { value: 4, text: 'RÉALISÉ' }
    ],
    es: [
      { value: -1, text: 'TODOS' },
      { value: 0, text: 'Nueva, Programada, A Definir' },
      { value: 1, text: 'NUEVA' },
      { value: 2, text: 'A DEFINIR' },
      { value: 3, text: 'PROGRAMADA' },
      { value: 4, text: 'REALIZADA' }
    ]
  };

  return NextResponse.json(estadosMap[language] || estadosMap.pt);
}