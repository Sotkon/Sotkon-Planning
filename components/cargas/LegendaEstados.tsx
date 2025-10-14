'use client';

interface LegendaEstadosProps {
  language: string;
}

export default function LegendaEstados({ language }: LegendaEstadosProps) {
  const estados: Record<string, Array<{ color: string; label: string }>> = {
    pt: [
      { color: 'bg-yellow-400', label: 'NOVA' },
      { color: 'bg-blue-500', label: 'AGENDADA' },
      { color: 'bg-amber-700', label: 'A DEFINIR' },
      { color: 'bg-green-500', label: 'REALIZADA' }
    ],
    en: [
      { color: 'bg-yellow-400', label: 'NEW' },
      { color: 'bg-blue-500', label: 'SCHEDULED' },
      { color: 'bg-amber-700', label: 'TO DEFINE' },
      { color: 'bg-green-500', label: 'COMPLETED' }
    ],
    fr: [
      { color: 'bg-yellow-400', label: 'NOUVEAU' },
      { color: 'bg-blue-500', label: 'PLANIFIÉ' },
      { color: 'bg-amber-700', label: 'À DÉFINIR' },
      { color: 'bg-green-500', label: 'RÉALISÉ' }
    ],
    es: [
      { color: 'bg-yellow-400', label: 'NUEVA' },
      { color: 'bg-blue-500', label: 'PROGRAMADA' },
      { color: 'bg-amber-700', label: 'A DEFINIR' },
      { color: 'bg-green-500', label: 'REALIZADA' }
    ]
  };

  const items = estados[language] || estados.pt;

  return (
    <div className="flex flex-wrap gap-6 mt-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
          <span className="text-sm text-gray-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
}