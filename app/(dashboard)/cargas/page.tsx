'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import FilterBar, { FilterValues } from '@/components/cargas/FilterBar';
import CardsGrid from '@/components/cargas/CardsGrid';
import Pagination from '@/components/cargas/Pagination';
import LegendaEstados from '@/components/cargas/LegendaEstados';

export default function CargasPage() {
  // Idioma fixo por enquanto (depois podemos adicionar selector)
  const language = 'pt';

  // Estado dos filtros
  const [filters, setFilters] = useState<FilterValues>({
    dataInicio: new Date().getFullYear() + '-01-01',
    countryId: 0,
    estadoId: 0,
    textToSearch: ''
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [primaveraAlert, setPrimaveraAlert] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Traduções
  const translations: Record<string, any> = {
    pt: {
      title: 'Lista de Encomendas de Cliente',
      loading: 'A carregar...',
      importando: 'Importando cargas do Primavera...',
      novasCargas: 'Foram adicionadas',
      novasCargasFim: 'novas cargas provenientes do Primavera.',
      exportar: 'Exportar para Excel',
      exportando: 'A exportar...',
      erroExportar: 'Erro ao exportar para Excel!'
    }
  };

  const t = translations[language];

  // Fetch países
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch('/api/countries');
      if (!res.ok) throw new Error('Failed to fetch countries');
      return res.json();
    }
  });

  // Fetch estados
  const { data: estados = [] } = useQuery({
    queryKey: ['estados', language],
    queryFn: async () => {
      const res = await fetch(`/api/estados?language=${language}`);
      if (!res.ok) throw new Error('Failed to fetch estados');
      return res.json();
    }
  });

  // Fetch cargas
  const { 
    data: cargasData, 
    isLoading: isLoadingCargas, 
    refetch: refetchCargas 
  } = useQuery({
    queryKey: ['cargas', filters, pageIndex, language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: filters.dataInicio,
        language: language,
        estadoId: filters.estadoId.toString(),
        countryId: filters.countryId.toString(),
        pageIndex: pageIndex.toString(),
        pageSize: '48',
        textToSearch: filters.textToSearch
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Failed to fetch cargas');
      return res.json();
    },
    staleTime: 30000
  });

  // Importar do Primavera ao carregar a página
  useEffect(() => {
    const importarPrimavera = async () => {
      try {
        console.log('🔄 Iniciando importação do Primavera...');
        
        const res = await fetch('/api/cargas/primavera', {
          method: 'POST'
        });
        
        console.log('📥 Resposta Primavera:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Erro Primavera:', errorText);
          return;
        }
        
        const data = await res.json();
        console.log('✅ Dados Primavera:', data);
        
        if (data.linhasInseridas > 0) {
          setPrimaveraAlert(
            `${t.novasCargas} ${data.linhasInseridas} ${t.novasCargasFim}`
          );
          
          refetchCargas();
          
          setTimeout(() => {
            setPrimaveraAlert(null);
          }, 10000);
        }
      } catch (error) {
        console.error('❌ Erro ao importar do Primavera:', error);
      }
    };

    importarPrimavera();
  }, []);

  // Handler para mudança de filtros
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPageIndex(0);
  };

  // Handler para mudança de página
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler para exportar Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Construir URL com os mesmos filtros
      const params = new URLSearchParams({
        dataInicio: filters.dataInicio,
        language: language,
        estadoId: filters.estadoId.toString(),
        countryId: filters.countryId.toString(),
        textToSearch: filters.textToSearch
      });

      // Fazer download
      const response = await fetch(`/api/cargas/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export');
      }

      // Criar blob e download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cargas_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting:', error);
      alert(t.erroExportar);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 p-6">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Alerta Primavera */}
        {primaveraAlert && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {primaveraAlert}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-neutral-800 shadow rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-100">{t.title}</h1>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t.exportar}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">{t.exportando}</span>
                </>
              ) : (
                <FileSpreadsheet className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <FilterBar
          language={language}
          onFilterChange={handleFilterChange}
          countries={countries}
          estados={estados}
        />

        {/* Loading */}
        {isLoadingCargas && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">{t.loading}</span>
          </div>
        )}

        {/* Grid de Cards */}
        {!isLoadingCargas && cargasData && (
          <>
            <CardsGrid 
              cargas={cargasData.items} 
              language={language}
            />

            {/* Paginação */}
            <Pagination
              currentPage={pageIndex}
              totalPages={cargasData.pagesCount}
              onPageChange={handlePageChange}
              language={language}
            />

            {/* Legenda */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <LegendaEstados language={language} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
