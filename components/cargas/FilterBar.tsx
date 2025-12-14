'use client';

import { useState, useEffect } from 'react';

interface FilterBarProps {
  language: string;
  onFilterChange: (filters: FilterValues) => void;
  countries: Array<{ id: number; country: string }>;
  estados: Array<{ value: number; text: string }>;
}

export interface FilterValues {
  dataInicio: string;
  countryId: number;
  estadoId: number;
  textToSearch: string;
}

export default function FilterBar({ 
  language, 
  onFilterChange, 
  countries,
  estados 
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterValues>({
    dataInicio: new Date().getFullYear() + '-01-01',
    countryId: 0,
    estadoId: 0,
    textToSearch: ''
  });

  const translations: Record<string, any> = {
    pt: {
      inicio: 'Início',
      pais: 'Mercado',
      estado: 'Estado da Encomenda de Cliente',
      atualizar: 'Atualizar',
      pesquisa: 'Pesquisar por cliente, encomenda, projeto ou localização...',
      pesquisar: 'Pesquisar',
      todos: 'Todos'
    },
    en: {
      inicio: 'Start',
      pais: 'Country',
      estado: 'Status',
      atualizar: 'Update',
      pesquisa: 'Search by client, order, project or location...',
      pesquisar: 'Search',
      todos: 'ALL'
    },
    fr: {
      inicio: 'Début',
      pais: 'Pays',
      estado: 'État',
      atualizar: 'Actualiser',
      pesquisa: 'Rechercher par client, commande, projet ou emplacement...',
      pesquisar: 'Rechercher',
      todos: 'TOUS'
    },
    es: {
      inicio: 'Inicio',
      pais: 'País',
      estado: 'Estado',
      atualizar: 'Actualizar',
      pesquisa: 'Buscar por cliente, pedido, proyecto o ubicación...',
      pesquisar: 'Buscar',
      todos: 'TODOS'
    }
  };

  const t = translations[language] || translations.pt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleInputChange = (field: keyof FilterValues, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Enter key na pesquisa
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFilterChange(filters);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h6 className="text-lg font-semibold text-gray-800 mb-4">
        {language === 'pt' && 'Filtro de Encomendas de Cliente'}
        {language === 'en' && 'General Dashboard Filter'}
        {language === 'fr' && 'Filtre Général du Tableau de Bord'}
        {language === 'es' && 'Filtro General del Panel'}
      </h6>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-end gap-4">
          {/* Data Início */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.inicio}
            </label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => handleInputChange('dataInicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* País */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.pais}
            </label>
            <select
              value={filters.countryId}
              onChange={(e) => handleInputChange('countryId', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">{t.todos}</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.country}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.estado}
            </label>
            <select
              value={filters.estadoId}
              onChange={(e) => handleInputChange('estadoId', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.text}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Atualizar */}
          <div>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
            >
              {t.atualizar}
            </button>
          </div>
        </div>

        {/* Barra de pesquisa texto */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={filters.textToSearch}
            onChange={(e) => handleInputChange('textToSearch', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.pesquisa}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => onFilterChange(filters)}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
          >
            {t.pesquisar}
          </button>
        </div>
      </form>
    </div>
  );
}
