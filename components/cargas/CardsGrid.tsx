'use client';

interface Carga {
  id: number;
  cliente: string;
  paisStr: string;
  projecto: string;
  encomendaDoCliente: string;
  localizacao: string;
  mercadoria: string;
  estadoId: number;
  dataPrevistaDeCarga: Date | null;
}

interface CardsGridProps {
  cargas: Carga[];
  language: string;
}

import CargaCard from './CargaCard';

export default function CardsGrid({ cargas, language }: CardsGridProps) {
  if (cargas.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        {language === 'pt' && 'Não foram encontrados registos.'}
        {language === 'en' && 'No records found.'}
        {language === 'fr' && 'Aucun enregistrement trouvé.'}
        {language === 'es' && 'No se encontraron registros.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {cargas.map((carga) => (
        <CargaCard key={carga.id} carga={carga} language={language} />
      ))}
    </div>
  );
}