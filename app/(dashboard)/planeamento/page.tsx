'use client'

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, X, Calendar as CalendarIcon, Filter } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Estado do Calendário (Começa vazio conforme solicitado para planeamento manual)
  const [calendar, setCalendar] = useState({}); 
  const [draggedOrder, setDraggedOrder] = useState(null);
  
  // Estados para Pesquisa e Filtros
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState([1, 2, 3]); // Nova, A Definir, Agendada

  const queryClient = useQueryClient();

  // 1. Fetch dos dados da API
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['all-orders', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: new Date().getFullYear() + '-01-01',
        language: language,
        estadoId: '1,2,3', // Focamos nos estados que interessam ao planeamento
        countryId: '0',
        pageIndex: '0',
        pageSize: '1000', 
        textToSearch: ''
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    staleTime: 30000
  });

  // Configuração visual dos Filtros
  const filterOptions = [
    { id: 1, label: 'Nova', color: 'bg-yellow-400', text: 'text-yellow-950' },
    { id: 2, label: 'A Definir', color: 'bg-amber-700', text: 'text-white' },
    { id: 3, label: 'Agendada', color: 'bg-blue-500', text: 'text-white' },
  ];

  const toggleFilter = (id) => {
    setActiveFilters(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 2. Lógica de Filtragem com REFORÇO de Tipagem
  const ordersLeftPanel = useMemo(() => {
    if (!ordersData?.items) return [];

    // IDs que já estão no calendário visual nesta sessão
    const scheduledIds = Object.values(calendar).flat().map((o: any) => o.id);

    return ordersData.items.filter(order => {
      // Normalização: Converter estado para Número para garantir comparação correta
      const currentEstadoId = Number(order.estadoId);

      // A. Filtro: Se já foi arrastada para o calendário, retira da esquerda
      if (scheduledIds.includes(order.id)) return false;

      // B. Filtro de Estado: Só mostra se o ID estiver nos filtros ativos
      if (!activeFilters.includes(currentEstadoId)) return false;

      // C. Filtro de Pesquisa (Reforçado)
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase();
        const matchCliente = order.cliente?.toLowerCase().includes(searchLower);
        const matchEnc = order.encomendaPrimavera?.toLowerCase().includes(searchLower);
        const matchObra = order.obra?.toLowerCase().includes(searchLower);
        
        if (!matchCliente && !matchEnc && !matchObra) return false;
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
    const id = Number(estadoId);
    if (id === 1) return 'bg-yellow-400 text-yellow-950';
    if (id === 2) return 'bg-amber-700 text-white';
    if (id === 3) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
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

    // Atualização UI
    setCalendar(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { ...draggedOrder, dataPrevistaDeCarga: scheduledDate.toISOString() }]
    }));

    setDraggedOrder(null);

    // Update na Base de Dados
    try {
      await fetch(`/api/cargas/${draggedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: scheduledDate.toISOString() })
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert("Erro ao comunicar com o servidor.");
      setCalendar(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].filter(o => o.id !== draggedOrder.id)
      }));
    }
  };

  const handleRemoveFromCalendar = async (dateKey, order) => {
    setCalendar(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(o => o.id !== order.id)
    }));

    try {
      await fetch(`/api/cargas/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: null })
      });
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="flex h-screen bg-neutral-950 text-white p-4 gap-4 overflow-hidden">
      
      {/* PAINEL ESQUERDO */}
      <div className="w-80 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl">
        <div className="p-4 border-b border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> A Planear
            </h2>
            <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs text-neutral-400">
              {ordersLeftPanel.length}
            </span>
          </div>

          {/* Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Pesquisar encomenda..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-10 pr-8 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-2 top-2.5 text-neutral-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Botões de Filtro */}
          <div className="flex gap-1.5">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleFilter(opt.id)}
                className={`flex-1 text-[10px] py-2 rounded-md font-bold border transition-all ${
                  activeFilters.includes(opt.id)
                    ? `${opt.color} ${opt.text} border-transparent shadow-lg`
                    : 'bg-neutral-800 border-neutral-700 text-neutral-500 opacity-40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {ordersLeftPanel.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={(e) => handleDragStart(e, order)}
              className={`${getOrderColor(order.estadoId)} p-3 rounded-lg cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform shadow-md border border-white/5 relative group`}
            >
              <div className="text-[10px] font-black uppercase opacity-60 mb-1 leading-none">
                {order.encomendaPrimavera || 'Sem Ref.'}
              </div>
              <div className="text-sm font-bold leading-tight line-clamp-2">
                {order.cliente}
              </div>
              {order.obra && (
                <div className="text-[11px] mt-1 opacity-80 italic truncate">
                  Obra: {order.obra}
                </div>
              )}
            </div>
          ))}
          {ordersLeftPanel.length === 0 && !isLoading && (
            <div className="text-center py-20 text-neutral-600 px-4">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm italic">Nenhuma encomenda disponível com os filtros atuais.</p>
            </div>
          )}
          {isLoading && (
             <div className="flex justify-center py-10">
               <Loader2 className="animate-spin text-blue-500" />
             </div>
          )}
        </div>
      </div>

      {/* PAINEL DIREITO - CALENDÁRIO */}
      <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Header Calendário */}
        <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-black flex items-center gap-3">
              <CalendarIcon className="text-blue-500" />
              <span className="capitalize">{monthNames[month]}</span>
              <span className="text-neutral-600">{year}</span>
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors">←</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-xs font-bold hover:bg-neutral-800 rounded-lg border border-neutral-700 uppercase tracking-widest">Hoje</button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors">→</button>
          </div>
        </div>

        {/* Grid Calendário */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[10px] font-black text-neutral-600 uppercase tracking-tighter py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7 }).map((_, i) => {
              const day = i - startingDayOfWeek + 1;
              const isValidDay = day > 0 && day <= daysInMonth;
              const dateKey = `${year}-${month + 1}-${day}`;
              const dayOrders = calendar[dateKey] || [];

              return (
                <div
                  key={i}
                  onDragOver={handleDragOver}
                  onDrop={isValidDay ? (e) => handleDrop(e, day) : null}
                  className={`min-h-[140px] rounded-xl border transition-all duration-300 ${
                    isValidDay 
                      ? 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-600' 
                      : 'bg-transparent border-transparent opacity-0'
                  }`}
                >
                  {isValidDay && (
                    <div className="p-2 flex flex-col h-full">
                      <span className="text-xs font-bold text-neutral-500 mb-2">{day}</span>
                      <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar-mini">
                        {dayOrders.map(order => (
                          <div
                            key={order.id}
                            onClick={() => handleRemoveFromCalendar(dateKey, order)}
                            className={`${getOrderColor(order.estadoId)} text-[10px] p-2 rounded-md font-bold cursor-pointer hover:brightness-125 shadow-sm transition-all animate-in zoom-in-95`}
                          >
                            <div className="truncate">{order.encomendaPrimavera}</div>
                            <div className="truncate opacity-80 font-normal">{order.cliente}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar-mini::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar-mini::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
