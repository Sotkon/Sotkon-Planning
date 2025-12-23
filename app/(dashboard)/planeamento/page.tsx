'use client'

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Filter, X } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Estado do Calendário (Começa vazio para planeamento manual)
  const [calendar, setCalendar] = useState({}); 
  const [draggedOrder, setDraggedOrder] = useState(null);
  
  // --- NOVOS ESTADOS PARA PESQUISA E FILTRO ---
  const [searchText, setSearchText] = useState('');
  // Por defeito, mostramos os 3 estados: 1 (Nova), 2 (A Definir), 3 (Agendada)
  const [activeFilters, setActiveFilters] = useState([1, 2, 3]);

  const queryClient = useQueryClient();

  // 1. Fetch dos dados
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['all-orders', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: new Date().getFullYear() + '-01-01',
        language: language,
        // Garantimos que pedimos todos os estados relevantes
        estadoId: '1,2,3,4,5,6,7,8', 
        countryId: '0',
        pageIndex: '0',
        pageSize: '1000', // Aumentei para garantir que apanha tudo
        textToSearch: ''
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    staleTime: 30000
  });

  // Configuração dos Filtros (Cores e Labels)
  const filterOptions = [
    { id: 1, label: 'Nova', color: 'bg-yellow-400', text: 'text-yellow-950' },
    { id: 2, label: 'A Definir', color: 'bg-amber-700', text: 'text-white' },
    { id: 3, label: 'Agendada', color: 'bg-blue-500', text: 'text-white' },
  ];

  // Alternar filtro de estado
  const toggleFilter = (id) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 2. Lógica Combinada de Filtragem (Painel Esquerdo)
  const ordersLeftPanel = useMemo(() => {
    if (!ordersData?.items) return [];

    // IDs que já estão no calendário visual (para não duplicar)
    const scheduledIds = Object.values(calendar).flat().map((o: any) => o.id);

    return ordersData.items.filter(order => {
      // A. Filtro de "Já está no calendário?"
      if (scheduledIds.includes(order.id)) return false;

      // B. Filtro de Estado (Checkbox/Botões)
      // Só mostra se o estado da encomenda estiver na lista de filtros ativos
      if (!activeFilters.includes(order.estadoId)) return false;

      // C. Filtro de Texto (Pesquisa)
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchCliente = order.cliente?.toLowerCase().includes(searchLower);
        const matchEnc = order.encomendaPrimavera?.toLowerCase().includes(searchLower);
        const matchProj = order.projecto?.toLowerCase().includes(searchLower);
        const matchMerc = order.mercadoria?.toLowerCase().includes(searchLower);
        
        if (!matchCliente && !matchEnc && !matchProj && !matchMerc) return false;
      }

      return true;
    });
  }, [ordersData, calendar, activeFilters, searchText]);


  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getOrderColor = (estadoId) => {
    const colors = {
      1: 'bg-yellow-400',    // NOVA
      2: 'bg-amber-700',     // A DEFINIR
      3: 'bg-blue-500',      // AGENDADA
      4: 'bg-green-500',     // REALIZADA
      5: 'bg-purple-500',
      6: 'bg-orange-500',
      7: 'bg-red-500',
      8: 'bg-pink-500'
    };
    return colors[estadoId] || 'bg-gray-500';
  };

  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!draggedOrder) return;

    const dateKey = `${year}-${month + 1}-${day}`;
    const scheduledDate = new Date(year, month, day, 12, 0, 0);

    const existingOrders = calendar[dateKey] || [];
    if (existingOrders.some(o => o.id === draggedOrder.id)) {
      setDraggedOrder(null);
      return; 
    }

    setCalendar(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { ...draggedOrder, dataPrevistaDeCarga: scheduledDate.toISOString() }]
    }));

    setDraggedOrder(null);

    try {
      await fetch(`/api/cargas/${draggedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: scheduledDate.toISOString() })
      });
    } catch (error) {
      console.error('Failed to update order:', error);
      alert("Erro ao guardar. A reverter...");
      setCalendar(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].filter(o => o.id !== draggedOrder.id)
      }));
    }
  };

  const handleRemoveFromCalendar = async (dateKey, order) => {
    setCalendar(prev => {
      const newDayList = prev[dateKey].filter(o => o.id !== order.id);
      return { ...prev, [dateKey]: newDayList };
    });

    try {
      await fetch(`/api/cargas/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: null })
      });
    } catch (error) {
      console.error('Failed to remove order schedule:', error);
      setCalendar(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), order]
      }));
    }
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - startingDayOfWeek + 1;
      const isValidDay = day > 0 && day <= daysInMonth;
      const dateKey = `${year}-${month + 1}-${day}`;
      const ordersForDay = calendar[dateKey] || [];

      days.push(
        <div
          key={i}
          onDragOver={handleDragOver}
          onDrop={isValidDay ? (e) => handleDrop(e, day) : null}
          className={`min-h-32 border border-gray-700 p-2 transition-colors ${
            isValidDay
              ? 'bg-neutral-800 hover:bg-neutral-700'
              : 'bg-neutral-900'
          }`}
        >
          {isValidDay && (
            <>
              <div className="text-sm text-gray-300 mb-2 font-bold">{day}</div>
              <div className="space-y-1">
                {ordersForDay.map(order => (
                  <div
                    key={order.id}
                    className={`${getOrderColor(order.estadoId)} text-white text-xs p-2 rounded cursor-pointer hover:brightness-110 transition-all shadow-sm group relative`}
                    onClick={() => handleRemoveFromCalendar(dateKey, order)}
                  >
                    <div className="font-bold flex justify-between">
                      <span>{order.encomendaPrimavera || 'S/ Ref'}</span>
                    </div>
                    <div className="text-[10px] truncate">{order.cliente}</div>
                     <div className="hidden group-hover:block absolute z-50 bottom-full left-0 bg-black text-white p-2 text-xs rounded w-max shadow-xl border border-gray-600">
                      Clique para devolver à lista
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-white">A carregar plano de montagem...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-900 text-white p-4 gap-4">
      {/* Painel Esquerdo - A Planear */}
      <div className="w-80 flex flex-col bg-neutral-800 rounded-lg border border-gray-700">
        
        {/* Header do Painel com Pesquisa e Filtros */}
        <div className="p-3 border-b border-gray-700 bg-neutral-800 rounded-t-lg z-10 shadow-md space-y-3">
          <div className="flex items-center justify-between">
             <h2 className="text-base font-bold text-white">
              A Planear <span className="text-xs font-normal text-gray-400">({ordersLeftPanel.length})</span>
            </h2>
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Pesquisar cliente, obra..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-600 rounded p-1.5 pl-8 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-2 top-2 text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros de Estado */}
          <div className="flex gap-2 justify-between">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleFilter(opt.id)}
                className={`flex-1 text-[10px] py-1 px-1 rounded font-bold border transition-all ${
                  activeFilters.includes(opt.id)
                    ? `${opt.color} ${opt.text} border-transparent shadow-sm opacity-100`
                    : 'bg-transparent border-gray-600 text-gray-500 opacity-50 hover:opacity-75'
                }`}
                title={`Mostrar/Ocultar ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Lista de Encomendas */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {ordersLeftPanel.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={(e) => handleDragStart(e, order)}
              className={`${getOrderColor(order.estadoId)} p-2.5 rounded cursor-move hover:brightness-110 transition-all shadow-md border border-white/10 active:scale-95 group`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs shadow-black/10 drop-shadow-md">{order.encomendaPrimavera || 'S/ Ref'}</span>
                {/* Badge pequena do estado */}
                <div className="w-2 h-2 rounded-full bg-white/40 shadow-sm" title={order.estadoDesc} />
              </div>
              
              <div className="text-xs font-medium mb-1 truncate drop-shadow-sm">
                {order.cliente}
              </div>
              
              {order.projecto && (
                <div className="text-[10px] opacity-90 truncate mb-1">
                 File: {order.projecto}
                </div>
              )}

              {order.mercadoria && (
                <div className="text-[10px] opacity-80 line-clamp-2 italic bg-black/10 p-1 rounded mt-1">
                  {order.mercadoria}
                </div>
              )}

              {/* Se tiver data prevista na BD mas não no calendário visual */}
              {order.dataPrevistaDeCarga && (
                <div className="mt-2 text-[9px] flex items-center justify-between opacity-80 border-t border-black/10 pt-1">
                   <span>📅 {new Date(order.dataPrevistaDeCarga).toLocaleDateString()}</span>
                   <span className="italic text-[8px]">(Data BD)</span>
                </div>
              )}
            </div>
          ))}

          {ordersLeftPanel.length === 0 && (
            <div className="text-gray-500 text-center py-10 px-4">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma encomenda encontrada.</p>
              <p className="text-xs mt-1">Verifique os filtros de estado ou a pesquisa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel Direito - Calendário (Inalterado na lógica, apenas ajustes visuais) */}
      <div className="flex-1 bg-neutral-800 rounded-lg p-4 border border-gray-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors border border-gray-600"
          >
            ← Anterior
          </button>
          <div className="text-center">
             <h2 className="text-xl font-bold capitalize">
            {monthNames[month]} <span className="text-gray-400">{year}</span>
            </h2>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors border border-gray-600"
          >
            Próximo →
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1 mb-1 sticky top-0 bg-neutral-800 py-2 z-10 shadow-sm">
            {dayNames.map(day => (
                <div key={day} className="text-center font-bold text-gray-500 text-xs uppercase tracking-wider">
                {day}
                </div>
            ))}
            </div>
            <div className="grid grid-cols-7 gap-1 pb-4">
            {renderCalendarDays()}
            </div>
        </div>
      </div>
    </div>
  );
}
