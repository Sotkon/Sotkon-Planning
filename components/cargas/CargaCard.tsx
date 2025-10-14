'use client';

import { MapPin, Package } from 'lucide-react';
import Link from 'next/link';

interface CargaCardProps {
  carga: {
    id: number;
    cliente: string;
    paisStr: string;
    projecto: string;
    encomendaDoCliente: string;
    localizacao: string;
    mercadoria: string;
    estadoId: number;
    dataPrevistaDeCarga: Date | null;
  };
  language: string;
}

export default function CargaCard({ carga, language }: CargaCardProps) {
  // Mapear classes CSS por estado
  const estadoClasses: Record<number, string> = {
    1: 'bg-yellow-400',      // NOVA
    2: 'bg-amber-700',        // A DEFINIR
    3: 'bg-blue-500',         // AGENDADA
    4: 'bg-green-500'         // REALIZADA
  };

  // Dias da semana
  const diasSemana: Record<string, Record<number, string>> = {
    pt: { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' },
    en: { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' },
    fr: { 0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' },
    es: { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' }
  };

  // Meses
  const meses: Record<string, Record<number, string>> = {
    pt: { 0: 'JAN', 1: 'FEV', 2: 'MAR', 3: 'ABR', 4: 'MAI', 5: 'JUN', 6: 'JUL', 7: 'AGO', 8: 'SET', 9: 'OUT', 10: 'NOV', 11: 'DEZ' },
    en: { 0: 'JAN', 1: 'FEB', 2: 'MAR', 3: 'APR', 4: 'MAY', 5: 'JUN', 6: 'JUL', 7: 'AUG', 8: 'SEP', 9: 'OCT', 10: 'NOV', 11: 'DEC' },
    fr: { 0: 'JAN', 1: 'FÉV', 2: 'MAR', 3: 'AVR', 4: 'MAI', 5: 'JUN', 6: 'JUL', 7: 'AOÛ', 8: 'SEP', 9: 'OCT', 10: 'NOV', 11: 'DÉC' },
    es: { 0: 'ENE', 1: 'FEB', 2: 'MAR', 3: 'ABR', 4: 'MAY', 5: 'JUN', 6: 'JUL', 7: 'AGO', 8: 'SEP', 9: 'OCT', 10: 'NOV', 11: 'DIC' }
  };

  const data = carga.dataPrevistaDeCarga ? new Date(carga.dataPrevistaDeCarga) : null;
  const diaSemana = data ? diasSemana[language]?.[data.getDay()] || diasSemana.pt[data.getDay()] : '';
  const dia = data ? String(data.getDate()).padStart(2, '0') : '';
  const mes = data ? meses[language]?.[data.getMonth()] || meses.pt[data.getMonth()] : '';

  const headerClass = estadoClasses[carga.estadoId] || 'bg-gray-400';
  
  // Truncar textos
  const clienteTruncado = carga.cliente?.length > 20 
    ? carga.cliente.substring(0, 19) + '...' 
    : carga.cliente;
    
  const localizacaoTruncada = carga.localizacao?.length > 50
    ? carga.localizacao.substring(0, 48) + '...'
    : carga.localizacao;
    
  const mercadoriaTruncada = carga.mercadoria?.length > 50
    ? carga.mercadoria.substring(0, 48) + '...'
    : carga.mercadoria;

  return (
    <Link 
      href={`/cargas/novo?id=${carga.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      {/* Header colorido */}
      <div className={`${headerClass} text-white p-3`}>
        <div className="flex items-start justify-between">
          <div className="text-center">
            <div className="text-xs font-normal">{diaSemana}</div>
            <div className="text-2xl font-bold leading-none">{dia}</div>
          </div>
          <div className="text-right flex-1 ml-2">
            <div className="font-bold text-sm">{mes}</div>
            <div className="text-xs mt-1 truncate">{carga.projecto}</div>
            <div className="text-xs truncate">{carga.encomendaDoCliente}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-white">
        <h3 className="text-center font-bold text-base mb-3 truncate  text-black"  >
          {clienteTruncado}
        </h3>
        
        <div className="space-y-2">
          {/* Localização */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-700 line-clamp-2">
              {localizacaoTruncada}
            </span>
          </div>
          
          {/* Mercadoria */}
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-700 line-clamp-2">
              {mercadoriaTruncada}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}